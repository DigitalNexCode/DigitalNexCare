/**
 * DigitalNexCare Live Practitioner Discovery & Streaming Engine
 * Chunk 3B - Non-blocking streaming search, unknown area discovery, request coalescing, and caching.
 *
 * Core Constitutional Requirements:
 * 1. Never tell user "Area does not exist".
 * 2. Return immediate state (< 50ms).
 * 3. Database-first: check Supabase/index before invoking external discovery.
 * 4. Stream as discovered: do NOT wait for all results before rendering.
 * 5. Normalize, dedupe, compress, upsert to Supabase before emitting.
 * 6. Apply subscription masking: locked external results arrive with identities redacted.
 * 7. Request coalescing: identical concurrent searches share the same discovery job.
 * 8. Track first-result performance metrics.
 */

import { SouthAfricanProvince } from '../../types';
import {
  LiveSearchEvent,
  LiveSearchStatus,
  LivePractitionerSearchRecord,
} from '../location/types';
import { AreaNormalizer } from '../location/area-normalizer';
import { LocationService } from '../location/location-service';
import { GoogleMapsDiscoveryWorker } from '../external-discovery/providers/google-maps-discovery-worker';
import { HpcsaRegistryProvider } from '../external-discovery/providers/hpcsa-registry-provider';
import { RegionalPracticeProvider } from '../external-discovery/providers/regional-practice-provider';
import { SubscriptionService } from '../subscription/subscription-service';
import { normalizeRawPractitioner } from '../external-discovery/normalizer';
import { evaluateDeduplicationConfidence } from '../external-discovery/fingerprint';
import { processSourceCompression } from '../external-discovery/compression';
import { projectPractitionerForClient } from '../supabase/projection';
import { supabase } from '../supabase/client';
import { MOCK_PRACTITIONERS } from '../../data/mockDatabase';

export interface LiveStreamSearchParams {
  query?: string;
  specialty?: string;
  category?: string;
  province?: SouthAfricanProvince | string;
  city?: string;
  suburb?: string;
  userCoordinates?: { latitude: number; longitude: number } | null;
  radiusKm?: number;
  userId?: string;
  unlockedIds?: string[];
  forceExternalRefresh?: boolean;
}

interface ActiveSearchJob {
  searchId: string;
  key: string;
  params: LiveStreamSearchParams;
  record: LivePractitionerSearchRecord;
  listeners: Set<(event: LiveSearchEvent) => void>;
  streamedPractitioners: any[];
  isCancelled: boolean;
  startTime: number;
}

class LiveSearchStreamerService {
  private activeJobs = new Map<string, ActiveSearchJob>(); // keyed by normalized search key
  private searchHistory = new Map<string, LivePractitionerSearchRecord>();
  private googleWorker = new GoogleMapsDiscoveryWorker();
  private hpcsaWorker = new HpcsaRegistryProvider();
  private regionalWorker = new RegionalPracticeProvider();

  /**
   * Generates a deterministic key for request coalescing
   */
  private generateSearchKey(params: LiveStreamSearchParams): string {
    const area = AreaNormalizer.toNormalizedKey(
      params.suburb || params.city || params.province || 'za'
    );
    const spec = (params.specialty || params.category || 'all').toLowerCase().trim();
    const query = (params.query || '').toLowerCase().trim();
    return `${area}__${spec}__${query}`;
  }

  /**
   * Initiates a live streaming search with event listener.
   * Returns searchId and a cancellation function.
   */
  startSearch(
    params: LiveStreamSearchParams,
    onEvent: (event: LiveSearchEvent) => void
  ): { searchId: string; cancel: () => void } {
    const searchKey = this.generateSearchKey(params);
    const existingJob = this.activeJobs.get(searchKey);

    // Request Coalescing: Attach to active in-flight search ONLY if currently running
    const isInFlight =
      existingJob &&
      !existingJob.isCancelled &&
      !['COMPLETED', 'NO_RESULTS', 'PARTIAL', 'ERROR'].includes(existingJob.record.status);

    if (isInFlight && existingJob) {
      existingJob.listeners.add(onEvent);

      // Replay current state immediately
      onEvent({
        type: 'STATUS_CHANGE',
        searchId: existingJob.searchId,
        status: existingJob.record.status,
        statusMessage: existingJob.record.statusMessage,
        practitioners: [...existingJob.streamedPractitioners],
        totalCount: existingJob.streamedPractitioners.length,
        timestamp: new Date().toISOString(),
      });

      return {
        searchId: existingJob.searchId,
        cancel: () => {
          existingJob.listeners.delete(onEvent);
        },
      };
    }

    // Create a new Search Session
    const searchId = `srch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const startTime = Date.now();
    const parsedArea = AreaNormalizer.parseArea(
      params.suburb || params.city || params.query || 'South Africa',
      params.province as SouthAfricanProvince
    );

    const initialRecord: LivePractitionerSearchRecord = {
      id: searchId,
      userId: params.userId || null,
      query: params.query || params.specialty || 'Healthcare Search',
      areaId: null,
      areaName: parsedArea.canonicalAreaName,
      categoryId: params.specialty || params.category || 'Primary Care',
      status: 'SEARCHING_DATABASE',
      statusMessage: `Checking DigitalNexCare National Index for ${parsedArea.canonicalAreaName}...`,
      cachedResultsCount: 0,
      externalResultsCount: 0,
      totalResultsCount: 0,
      startedAt: new Date(startTime).toISOString(),
      firstResultAt: null,
      completedAt: null,
      errorCode: null,
      createdAt: new Date(startTime).toISOString(),
      metrics: {
        timeToFirstDbResultMs: null,
        timeToFirstExternalResultMs: null,
        externalSearchTotalMs: null,
        numberStreamed: 0,
        numberSaved: 0,
        numberUpdated: 0,
      },
    };

    const job: ActiveSearchJob = {
      searchId,
      key: searchKey,
      params,
      record: initialRecord,
      listeners: new Set([onEvent]),
      streamedPractitioners: [],
      isCancelled: false,
      startTime,
    };

    this.activeJobs.set(searchKey, job);
    this.searchHistory.set(searchId, initialRecord);

    // Broadcast Initial State (< 50ms)
    this.emitEvent(job, {
      type: 'STATUS_CHANGE',
      searchId,
      status: 'SEARCHING_DATABASE',
      statusMessage: initialRecord.statusMessage,
      totalCount: 0,
      timestamp: new Date().toISOString(),
    });

    // Execute Asynchronous Pipeline
    this.executeSearchPipeline(job).catch((err) => {
      console.debug('Search pipeline unhandled error:', err);
      job.record.status = 'PARTIAL';
      job.record.statusMessage = 'Search completed with partial results.';
      this.emitEvent(job, {
        type: 'PARTIAL',
        searchId: job.searchId,
        status: 'PARTIAL',
        statusMessage: job.record.statusMessage,
        practitioners: [...job.streamedPractitioners],
        totalCount: job.streamedPractitioners.length,
        timestamp: new Date().toISOString(),
      });
      this.cleanupJob(job);
    });

    return {
      searchId,
      cancel: () => {
        job.listeners.delete(onEvent);
        if (job.listeners.size === 0) {
          job.isCancelled = true;
          this.cleanupJob(job);
        }
      },
    };
  }

  /**
   * Main Search & Discovery Pipeline
   */
  private async executeSearchPipeline(job: ActiveSearchJob): Promise<void> {
    const { params } = job;
    const searchArea = params.suburb || params.city || params.query || '';
    const parsedArea = AreaNormalizer.parseArea(searchArea, params.province as SouthAfricanProvince);

    // -------------------------------------------------------------
    // PHASE 1: SUPABASE & DIRECTORY DATABASE LOOKUP (Database-First)
    // -------------------------------------------------------------
    // Detect if query includes both a practitioner name and a specialty
    let detectedPractitionerName = params.query || '';
    let effectiveSpecialty = params.specialty;

    if (params.query && /dr\b/i.test(params.query)) {
      if (!effectiveSpecialty) {
        if (/dent/i.test(params.query)) effectiveSpecialty = 'Dentist';
        else if (/psych/i.test(params.query)) effectiveSpecialty = 'Clinical Psychologist';
        else if (/audio/i.test(params.query)) effectiveSpecialty = 'Audiologist';
        else if (/physio/i.test(params.query)) effectiveSpecialty = 'Physiotherapist';
      }
    }

    const dbSearchResults = SubscriptionService.searchDirectory({
      query: params.query,
      specialty: effectiveSpecialty,
      province: params.province,
      city: params.city || (parsedArea.cityOrTown || undefined),
      suburb: params.suburb || (parsedArea.suburbOrTownship || undefined),
      userLocation: params.userCoordinates
        ? { lat: params.userCoordinates.latitude, lng: params.userCoordinates.longitude }
        : null,
      radiusKm: params.radiusKm,
      unlockedIds: params.unlockedIds || [],
    });

    const initialCombined = [
      ...dbSearchResults.verifiedProviders,
      ...dbSearchResults.unlockedExternal,
      ...dbSearchResults.lockedExternal,
    ];

    const timeToDb = Date.now() - job.startTime;
    job.record.metrics.timeToFirstDbResultMs = timeToDb;
    job.record.cachedResultsCount = initialCombined.length;
    job.record.totalResultsCount = initialCombined.length;
    job.streamedPractitioners = [...initialCombined];

    // Emit Database Ready Event immediately
    this.emitEvent(job, {
      type: 'DATABASE_READY',
      searchId: job.searchId,
      status: 'DATABASE_RESULTS_READY',
      statusMessage:
        initialCombined.length > 0
          ? `Found ${initialCombined.length} practitioner${initialCombined.length === 1 ? '' : 's'} in DigitalNexCare National Index.`
          : `Checking external sources for ${parsedArea.canonicalAreaName}...`,
      practitioners: [...initialCombined],
      totalCount: initialCombined.length,
      timestamp: new Date().toISOString(),
    });

    // Check Coverage via LocationService
    const coverageCheck = LocationService.hasSufficientCoverage(
      searchArea,
      effectiveSpecialty || params.category
    );

    // If we searched for a specific practitioner name and found that practitioner in Supabase:
    // COMPLETE IMMEDIATELY (Section 1: "If practitioner already exists in Supabase, return immediately")
    const isSpecificNameSearch = params.query && /dr\b/i.test(params.query);
    const foundSpecificPractitionerInDb = isSpecificNameSearch && initialCombined.length > 0;

    // If we have sufficient fresh records or already found the specific practitioner in DB without force refresh:
    if ((foundSpecificPractitionerInDb || (initialCombined.length >= 4 && coverageCheck.hasCoverage)) && !params.forceExternalRefresh) {
      job.record.status = 'COMPLETED';
      job.record.statusMessage = `Displaying ${initialCombined.length} practitioner${initialCombined.length === 1 ? '' : 's'} from DigitalNexCare Index.`;
      job.record.completedAt = new Date().toISOString();

      this.emitEvent(job, {
        type: 'COMPLETED',
        searchId: job.searchId,
        status: 'COMPLETED',
        statusMessage: job.record.statusMessage,
        practitioners: [...job.streamedPractitioners],
        totalCount: job.streamedPractitioners.length,
        metrics: job.record.metrics,
        timestamp: new Date().toISOString(),
      });

      this.cleanupJob(job);
      return;
    }

    if (job.isCancelled) {
      this.cleanupJob(job);
      return;
    }

    // -------------------------------------------------------------
    // PHASE 2: PROVISIONAL AREA CREATION & EXTERNAL DISCOVERY
    // (Never tell the user the area does not exist)
    // -------------------------------------------------------------
    const areaRecord = LocationService.findOrCreateProvisionalArea(
      searchArea || 'South Africa',
      params.userCoordinates ? { latitude: params.userCoordinates.latitude, longitude: params.userCoordinates.longitude } : undefined
    );
    job.record.areaId = areaRecord.id;
    job.record.areaName = areaRecord.areaName;

    job.record.status = 'EXTERNAL_DISCOVERY_STARTED';
    job.record.statusMessage = `Searching for ${effectiveSpecialty || params.query || 'practitioners'} in ${areaRecord.areaName}…`;

    this.emitEvent(job, {
      type: 'DISCOVERY_STARTED',
      searchId: job.searchId,
      status: 'EXTERNAL_DISCOVERY_STARTED',
      statusMessage: job.record.statusMessage,
      practitioners: [...job.streamedPractitioners],
      totalCount: job.streamedPractitioners.length,
      timestamp: new Date().toISOString(),
    });

    // -------------------------------------------------------------
    // PHASE 3: RUN DISCOVERY & STREAM AS DISCOVERED
    // -------------------------------------------------------------
    const discoveryStartTime = Date.now();
    let externalDiscoveredCount = 0;
    const existingFingerprints = new Set(
      job.streamedPractitioners.map((p) => (p.slug || p.id || p.fullName || '').toLowerCase())
    );

    try {
      // Execute discovery with GoogleMapsDiscoveryWorker
      const mapsPromise = this.googleWorker.searchByCategory(
        effectiveSpecialty || params.category || 'General Practitioner',
        {
          province: areaRecord.province,
          city: areaRecord.cityTown || areaRecord.areaName,
          suburb: areaRecord.suburb || areaRecord.areaName,
          coordinates: params.userCoordinates ? { latitude: params.userCoordinates.latitude, longitude: params.userCoordinates.longitude } : undefined,
        }
      );

      // Execute discovery with Regional Practices Provider
      const regionalPromise = this.regionalWorker.searchByCategory(
        effectiveSpecialty || params.category || 'General Practitioner',
        {
          province: areaRecord.province,
          city: areaRecord.cityTown || areaRecord.areaName,
          suburb: areaRecord.suburb || areaRecord.areaName,
        }
      );

      // If user typed a specific practitioner name: also query by name with extracted specialty
      let namePromise: Promise<any> = Promise.resolve(null);
      if (params.query && params.query.length >= 3) {
        namePromise = this.googleWorker.searchByName(
          params.query,
          {
            province: areaRecord.province,
            city: areaRecord.cityTown || areaRecord.areaName,
            suburb: areaRecord.suburb || areaRecord.areaName,
          },
          effectiveSpecialty
        );
      }

      // Process results as they resolve
      const workers = [namePromise, mapsPromise, regionalPromise];

      for (const workerPromise of workers) {
        if (job.isCancelled) break;

        const result = await workerPromise;
        const rawItems = result?.results || result?.rawPractitioners || [];
        if (!result || rawItems.length === 0) continue;

        for (const rawItem of rawItems) {
          if (job.isCancelled) break;

          // 1. Normalization
          const normalized = normalizeRawPractitioner(rawItem);

          // 2. Compression & Snapshot Processing (Chunk 3A requirement)
          const compressionResult = processSourceCompression(rawItem);

          // 3. Deduplication Check with existing directory (Section 9: Update vs Insert)
          let matchedExisting: any = null;
          for (const existing of MOCK_PRACTITIONERS) {
            const conf = evaluateDeduplicationConfidence(normalized, existing);
            if (conf.confidence === 'EXACT_MATCH' || conf.confidence === 'HIGH_CONFIDENCE_MATCH') {
              matchedExisting = existing;
              break;
            }
          }

          // If practitioner already exists: UPDATE the existing record. Do NOT insert another copy.
          if (matchedExisting) {
            matchedExisting.last_seen = new Date().toISOString();
            if (normalized.rating && normalized.rating !== matchedExisting.rating) {
              matchedExisting.rating = normalized.rating;
            }
            if (normalized.reviewCount && normalized.reviewCount > (matchedExisting.review_count || 0)) {
              matchedExisting.review_count = normalized.reviewCount;
            }
            if (normalized.latitude && normalized.longitude) {
              matchedExisting.latitude = normalized.latitude;
              matchedExisting.longitude = normalized.longitude;
            }
            job.record.metrics.numberUpdated++;
            continue;
          }

          if (existingFingerprints.has(normalized.fingerprint.toLowerCase())) {
            continue;
          }

          existingFingerprints.add(normalized.fingerprint.toLowerCase());
          externalDiscoveredCount++;

          // 4. Save to In-Memory & Supabase practitioner directory (Section 9: INSERT)
          const internalEntity = {
            id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            display_name: normalized.displayName,
            full_name: normalized.displayName,
            title: normalized.title,
            practice_name: normalized.practiceName,
            specialty: normalized.specialty,
            category: normalized.category,
            services: normalized.services,
            province: normalized.province,
            city: normalized.city,
            suburb: normalized.suburb,
            address_line: normalized.address,
            latitude: normalized.latitude,
            longitude: normalized.longitude,
            public_phone: normalized.phone,
            public_email: normalized.email,
            website: normalized.website,
            practitioner_type: 'EXTERNAL_PRACTITIONER' as const,
            is_joined: false,
            is_bookable: false,
            rating: normalized.rating,
            review_count: normalized.reviewCount,
            offers_virtual: false,
            offers_in_person: true,
            accepted_medical_aids: normalized.acceptedMedicalAids,
            source_attribution: normalized.sourceAttribution,
            claim_status: 'UNCLAIMED',
            verification_status: 'UNVERIFIED',
            fingerprint: normalized.fingerprint,
          };

          // Register into in-memory directory so subsequent searches hit the database immediately
          MOCK_PRACTITIONERS.push(internalEntity as any);

          // Try async write to Supabase
          this.persistPractitionerToSupabase(internalEntity, compressionResult).catch(() => {});

          // 5. Subscription Protection Projection (Redact locked identities)
          const isUnlocked =
            params.unlockedIds?.includes(internalEntity.id) ||
            params.unlockedIds?.includes('*') ||
            false;
          const projectedCard = projectPractitionerForClient(
            internalEntity as any,
            isUnlocked
          );

          // Track first result latency
          if (!job.record.firstResultAt) {
            job.record.firstResultAt = new Date().toISOString();
            job.record.metrics.timeToFirstExternalResultMs = Date.now() - job.startTime;
          }

          job.streamedPractitioners.push(projectedCard);
          job.record.metrics.numberStreamed++;
          job.record.metrics.numberSaved++;
          job.record.externalResultsCount = externalDiscoveredCount;
          job.record.totalResultsCount = job.streamedPractitioners.length;

          // 6. STREAM IMMEDIATELY TO UI (Do not wait for full discovery to complete!)
          this.emitEvent(job, {
            type: 'PRACTITIONER_STREAMED',
            searchId: job.searchId,
            status: 'STREAMING_RESULTS',
            statusMessage: `${externalDiscoveredCount} new practitioner${externalDiscoveredCount === 1 ? '' : 's'} discovered in ${areaRecord.areaName}...`,
            practitioner: projectedCard,
            practitioners: [...job.streamedPractitioners],
            totalCount: job.streamedPractitioners.length,
            timestamp: new Date().toISOString(),
          });

          // Small stagger for smooth visual ingress
          await new Promise((r) => setTimeout(r, 60));
        }
      }
    } catch (discoveryErr: any) {
      console.debug('Discovery worker partial exception:', discoveryErr);
      // Section 16: Failure handling - do not crash. Display any practitioners already stored.
      job.record.status = job.streamedPractitioners.length > 0 ? 'PARTIAL' : 'FAILED';
      job.record.statusMessage = 'Finding additional practitioners is temporarily unavailable.';
      this.emitEvent(job, {
        type: 'ERROR',
        searchId: job.searchId,
        status: job.record.status,
        statusMessage: job.record.statusMessage,
        practitioners: [...job.streamedPractitioners],
        totalCount: job.streamedPractitioners.length,
        timestamp: new Date().toISOString(),
      });
      this.cleanupJob(job);
      return;
    }

    job.record.metrics.externalSearchTotalMs = Date.now() - discoveryStartTime;

    // -------------------------------------------------------------
    // PHASE 4: UPDATE AREA AND COVERAGE RECORDS
    // -------------------------------------------------------------
    LocationService.updateAreaDiscovery(
      areaRecord.id,
      externalDiscoveredCount,
      params.userCoordinates ? { latitude: params.userCoordinates.latitude, longitude: params.userCoordinates.longitude } : undefined
    );

    LocationService.updateCategoryCoverage(
      areaRecord.id,
      params.category || 'General Practice',
      params.specialty || null,
      externalDiscoveredCount
    );

    // -------------------------------------------------------------
    // PHASE 5: FINAL COMPLETION
    // -------------------------------------------------------------
    job.record.completedAt = new Date().toISOString();
    job.record.status = externalDiscoveredCount > 0 || job.streamedPractitioners.length > 0 ? 'COMPLETED' : 'NO_RESULTS';
    job.record.statusMessage =
      job.streamedPractitioners.length > 0
        ? `Found ${job.streamedPractitioners.length} practitioners in and around ${areaRecord.areaName}.`
        : `We couldn't find practitioners for this search yet.`;

    this.emitEvent(job, {
      type: 'COMPLETED',
      searchId: job.searchId,
      status: job.record.status,
      statusMessage: job.record.statusMessage,
      practitioners: [...job.streamedPractitioners],
      totalCount: job.streamedPractitioners.length,
      metrics: job.record.metrics,
      timestamp: new Date().toISOString(),
    });

    // Record session to Supabase if available
    this.persistSearchSessionToSupabase(job.record).catch(() => {});

    this.cleanupJob(job);
  }

  private emitEvent(job: ActiveSearchJob, event: LiveSearchEvent) {
    job.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.debug('Error in search listener:', err);
      }
    });
  }

  private cleanupJob(job: ActiveSearchJob) {
    this.activeJobs.delete(job.key);
  }

  private async persistPractitionerToSupabase(practitioner: any, compressionResult: any) {
    try {
      await supabase.from('practitioner_directory').upsert(
        {
          id: practitioner.id,
          display_name: practitioner.display_name,
          title: practitioner.title,
          practice_name: practitioner.practice_name,
          specialty: practitioner.specialty,
          services: practitioner.services,
          province: practitioner.province,
          city: practitioner.city,
          suburb: practitioner.suburb,
          address_line: practitioner.address_line,
          latitude: practitioner.latitude,
          longitude: practitioner.longitude,
          public_phone: practitioner.public_phone,
          public_email: practitioner.public_email,
          website: practitioner.website,
          practitioner_type: practitioner.practitioner_type,
          is_joined: practitioner.is_joined,
          is_bookable: practitioner.is_bookable,
          rating: practitioner.rating,
          review_count: practitioner.review_count,
          offers_virtual: practitioner.offers_virtual,
          offers_in_person: practitioner.offers_in_person,
          accepted_medical_aids: practitioner.accepted_medical_aids,
          source_attribution: practitioner.source_attribution,
          claim_status: practitioner.claim_status,
          verification_status: practitioner.verification_status,
        },
        { onConflict: 'id' }
      );

      // Store snapshot record
      await supabase.from('practitioner_source_snapshots').insert({
        practitioner_id: practitioner.id,
        raw_size_bytes: compressionResult.rawSizeBytes,
        compressed_size_bytes: compressionResult.compressedSizeBytes,
        compression_method: compressionResult.compressionMethod,
        content_hash: compressionResult.contentHash,
        captured_at: new Date().toISOString(),
      });
    } catch {
      // Ignored for environments without tables
    }
  }

  private async persistSearchSessionToSupabase(rec: LivePractitionerSearchRecord) {
    try {
      await supabase.from('live_practitioner_searches' as any).upsert({
        id: rec.id,
        user_id: rec.userId,
        query: rec.query,
        area_id: rec.areaId,
        area_name: rec.areaName,
        category_id: rec.categoryId,
        status: rec.status,
        status_message: rec.statusMessage,
        cached_results_count: rec.cachedResultsCount,
        external_results_count: rec.externalResultsCount,
        total_results_count: rec.totalResultsCount,
        time_to_first_db_result_ms: rec.metrics.timeToFirstDbResultMs,
        time_to_first_external_result_ms: rec.metrics.timeToFirstExternalResultMs,
        external_search_total_ms: rec.metrics.externalSearchTotalMs,
        number_streamed: rec.metrics.numberStreamed,
        number_saved: rec.metrics.numberSaved,
        number_updated: rec.metrics.numberUpdated,
        started_at: rec.startedAt,
        first_result_at: rec.firstResultAt,
        completed_at: rec.completedAt,
        error_code: rec.errorCode,
      });
    } catch {
      // Fallback in memory
    }
  }

  /**
   * Returns all recorded live search sessions for Admin view
   */
  getSearchHistory(): LivePractitionerSearchRecord[] {
    return Array.from(this.searchHistory.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  /**
   * Returns active live search count
   */
  getActiveJobCount(): number {
    return this.activeJobs.size;
  }
}

export const LiveSearchStreamer = new LiveSearchStreamerService();
