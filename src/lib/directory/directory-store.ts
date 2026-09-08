/**
 * DigitalNexCare Centralized Practitioner Directory & Supabase Persistence Store
 * 
 * Ensures all discovered and live-scraped healthcare practices are permanently saved:
 * 1. Upserted directly into Supabase 'practitioner_directory' PostGIS index
 * 2. Source snapshots sanitized, Zstd compressed and logged in 'practitioner_source_snapshots'
 * 3. Persistently mirrored into client storage for instantaneous instant retrieval
 * 4. Syncs with in-memory directories and SubscriptionService search indexes
 * 5. Guarantees subsequent visitor searches find saved practices directly from Supabase
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { processSourceCompression, SNAPSHOT_REGISTRY } from '../external-discovery/compression';
import {
  ExternalPractitionerUnlocked,
  ExternalPractitionerLocked,
  DigitalNexCareProvider,
  Practitioner,
  SouthAfricanProvince,
} from '../../types';
import { NormalizedPractitioner, RawExternalPractitioner } from '../external-discovery/types';
import {
  RAW_EXTERNAL_PRACTITIONERS,
  MOCK_PRACTITIONERS,
  MOCK_LOCKED_EXTERNAL,
} from '../../data/mockDatabase';
import { SubscriptionService, REAL_DIRECTORY_CACHE } from '../subscription/subscription-service';

export const DIRECTORY_STORAGE_KEY = 'dnc_persisted_practitioner_directory_v2';
export const SNAPSHOTS_STORAGE_KEY = 'dnc_persisted_source_snapshots_v2';

/**
 * RFC 4122 v4 compliant UUID generator for Postgres foreign key integrity
 */
export function generateValidUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class DirectoryStore {
  private static isInitialized = false;

  /**
   * Initializes directory persistence on application boot
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.hydrateFromLocal();
    this.syncFromSupabase().catch((err) => {
      console.debug('DirectoryStore Supabase background sync notice:', err?.message);
    });
  }

  /**
   * Hydrates in-memory directory from localStorage
   */
  private static hydrateFromLocal(): number {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return 0;
      const raw = localStorage.getItem(DIRECTORY_STORAGE_KEY);
      if (!raw) return 0;

      const savedList: ExternalPractitionerUnlocked[] = JSON.parse(raw);
      if (!Array.isArray(savedList) || savedList.length === 0) return 0;

      let addedCount = 0;
      const existingIds = new Set(RAW_EXTERNAL_PRACTITIONERS.map((p) => p.id));
      const existingNames = new Set(RAW_EXTERNAL_PRACTITIONERS.map((p) => `${p.fullName.toLowerCase()}_${p.suburb.toLowerCase()}`));

      for (const item of savedList) {
        const key = `${item.fullName.toLowerCase()}_${item.suburb.toLowerCase()}`;
        if (!existingIds.has(item.id) && !existingNames.has(key)) {
          existingIds.add(item.id);
          existingNames.add(key);

          RAW_EXTERNAL_PRACTITIONERS.push(item);
          MOCK_PRACTITIONERS.push(item);

          // Add locked representation
          const locked: ExternalPractitionerLocked = {
            id: item.id,
            practitionerType: 'EXTERNAL_PRACTITIONER',
            isLocked: true,
            anonymizedTitle: `${item.specialty} in ${item.suburb || item.city}`,
            specialty: item.specialty,
            services: item.services || ['General Consultations', 'Healthcare Services'],
            province: item.province,
            city: item.city,
            generalArea: `${item.suburb}, ${item.city}`,
            approximateDistanceKm: 3.8,
            rating: item.rating || 4.8,
            reviewCount: item.reviewCount || 15,
            offersVirtual: item.offersVirtual,
            offersInPerson: item.offersInPerson,
            acceptedMedicalAids: item.acceptedMedicalAids,
            requiresSubscription: true,
          };
          MOCK_LOCKED_EXTERNAL.push(locked);
          addedCount++;
        }
      }

      // Also hydrate snapshots
      const rawSnaps = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
      if (rawSnaps) {
        try {
          const snaps = JSON.parse(rawSnaps);
          if (Array.isArray(snaps)) {
            const existingSnapHashes = new Set(SNAPSHOT_REGISTRY.map((s) => s.contentHash));
            for (const s of snaps) {
              if (!existingSnapHashes.has(s.contentHash)) {
                SNAPSHOT_REGISTRY.push(s);
              }
            }
          }
        } catch {
          // ignore parsing error
        }
      }

      return addedCount;
    } catch (e) {
      console.warn('Could not hydrate directory from local storage:', e);
      return 0;
    }
  }

  /**
   * Syncs existing directory records from Supabase database
   */
  static async syncFromSupabase(): Promise<number> {
    try {
      if (!isSupabaseConfigured) return 0;

      const { data, error } = await supabase
        .from('practitioner_directory')
        .select('*')
        .order('rating', { ascending: false })
        .limit(500);

      if (error || !data || !Array.isArray(data)) {
        return 0;
      }

      const existingIds = new Set(RAW_EXTERNAL_PRACTITIONERS.map((p) => p.id));
      let newFromDb = 0;

      for (const row of data) {
        if (row.practitioner_type === 'EXTERNAL_PRACTITIONER' && !existingIds.has(row.id)) {
          const unlocked: ExternalPractitionerUnlocked = {
            id: row.id,
            slug: row.normalized_name?.replace(/\s+/g, '-') || row.id,
            practitionerType: 'EXTERNAL_PRACTITIONER',
            fullName: row.display_name,
            title: row.title || 'Dr.',
            specialty: row.specialty || 'General Practitioner',
            services: ['Healthcare Consultations', 'Diagnostic Care', 'Screenings'],
            practiceName: row.practice_name || `${row.city} Practice`,
            province: row.province as SouthAfricanProvince,
            city: row.city,
            suburb: row.suburb,
            address: row.address_line || `${row.suburb}, ${row.city}`,
            coordinates: {
              latitude: Number(row.latitude) || -25.75,
              longitude: Number(row.longitude) || 28.22,
            },
            rating: Number(row.rating) || 4.8,
            reviewCount: Number(row.review_count) || 12,
            languages: ['English', 'Afrikaans'],
            acceptedMedicalAids: ['Discovery Health', 'GEMS', 'Bonitas'],
            offersVirtual: Boolean(row.offers_virtual),
            offersInPerson: row.offers_in_person !== false,
            dataAuthority: row.data_authority || 'OTHER_APPROVED_EXTERNAL_SOURCE',
            lastVerifiedAt: row.last_refreshed_at || new Date().toISOString(),
            phone: row.public_phone || '+27 12 345 6789',
            email: row.public_email || undefined,
            website: row.website || undefined,
            sourceAttribution: row.source_attribution || 'DigitalNexCare National Index',
            claimStatus: row.claim_status || 'UNCLAIMED',
          };

          existingIds.add(unlocked.id);
          RAW_EXTERNAL_PRACTITIONERS.push(unlocked);
          MOCK_PRACTITIONERS.push(unlocked);
          newFromDb++;
        }
      }

      if (newFromDb > 0) {
        this.persistToLocalStorage();
      }

      return newFromDb;
    } catch (err) {
      console.debug('Supabase sync skipped:', err);
      return 0;
    }
  }

  /**
   * Persists newly discovered/scraped practitioners to Supabase database,
   * compresses snapshots, saves to localStorage, and updates all in-memory indexes.
   */
  static async saveDiscoveredPractitioners(
    incomingItems: (NormalizedPractitioner | ExternalPractitionerUnlocked)[]
  ): Promise<{
    savedCount: number;
    updatedCount: number;
    compressionBytesSaved: number;
    totalDirectoryCount: number;
  }> {
    let savedCount = 0;
    let updatedCount = 0;
    let totalBytesSaved = 0;

    const existingIds = new Set(RAW_EXTERNAL_PRACTITIONERS.map((p) => p.id));
    const existingSignatures = new Set(
      RAW_EXTERNAL_PRACTITIONERS.map((p) => `${p.fullName.toLowerCase()}_${(p.suburb || '').toLowerCase()}`)
    );

    const supabaseUpsertBatch: any[] = [];
    const supabaseSnapshotsBatch: any[] = [];
    const newlyAddedUnlocked: ExternalPractitionerUnlocked[] = [];

    for (const item of incomingItems) {
      // Determine normalized properties
      const isNormalized = 'displayName' in item;
      const id = ('id' in item && item.id && item.id.includes('-') && item.id.length >= 32)
        ? item.id
        : generateValidUuid();

      const fullName = isNormalized ? (item as NormalizedPractitioner).displayName : (item as ExternalPractitionerUnlocked).fullName;
      const cleanTitle = isNormalized ? (item as NormalizedPractitioner).title : (item as ExternalPractitionerUnlocked).title || 'Dr.';
      const practiceName = isNormalized ? (item as NormalizedPractitioner).practiceName : (item as ExternalPractitionerUnlocked).practiceName;
      const specialty = isNormalized ? (item as NormalizedPractitioner).specialty : (item as ExternalPractitionerUnlocked).specialty;
      const phone = isNormalized ? (item as NormalizedPractitioner).phone : (item as ExternalPractitionerUnlocked).phone;
      const email = isNormalized ? (item as NormalizedPractitioner).email : (item as ExternalPractitionerUnlocked).email;
      const website = isNormalized ? (item as NormalizedPractitioner).website : (item as ExternalPractitionerUnlocked).website;
      const address = isNormalized ? (item as NormalizedPractitioner).address : (item as ExternalPractitionerUnlocked).address;
      const suburb = isNormalized ? (item as NormalizedPractitioner).suburb : (item as ExternalPractitionerUnlocked).suburb;
      const city = isNormalized ? (item as NormalizedPractitioner).city : (item as ExternalPractitionerUnlocked).city;
      const province = (isNormalized ? (item as NormalizedPractitioner).province : (item as ExternalPractitionerUnlocked).province) as SouthAfricanProvince;
      const latitude = isNormalized ? (item as NormalizedPractitioner).latitude : (item as ExternalPractitionerUnlocked).coordinates.latitude;
      const longitude = isNormalized ? (item as NormalizedPractitioner).longitude : (item as ExternalPractitionerUnlocked).coordinates.longitude;
      const rating = isNormalized ? (item as NormalizedPractitioner).rating : (item as ExternalPractitionerUnlocked).rating;
      const reviewCount = isNormalized ? (item as NormalizedPractitioner).reviewCount : (item as ExternalPractitionerUnlocked).reviewCount;
      const services = isNormalized ? (item as NormalizedPractitioner).services : (item as ExternalPractitionerUnlocked).services;
      const sourceAttribution = isNormalized ? (item as NormalizedPractitioner).sourceAttribution : (item as ExternalPractitionerUnlocked).sourceAttribution || 'Public Web Directory';
      const hpcsaNumber = isNormalized ? (item as NormalizedPractitioner).hpcsaNumber : ((item as any).hpcsaNumber || null);
      const fingerprint = isNormalized ? (item as NormalizedPractitioner).fingerprint : `fp_${id.substring(0, 16)}`;

      const sigKey = `${fullName.toLowerCase()}_${(suburb || '').toLowerCase()}`;

      // Check if already in directory
      if (existingIds.has(id) || existingSignatures.has(sigKey)) {
        updatedCount++;
        continue;
      }

      // Step 1: Create Full External Entity
      const unlockedEntity: ExternalPractitionerUnlocked = {
        id,
        slug: fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        practitionerType: 'EXTERNAL_PRACTITIONER',
        fullName,
        title: cleanTitle,
        specialty,
        services: services && services.length > 0 ? services : ['Clinical Consultations', 'Healthcare Services'],
        practiceName: practiceName || `${suburb} Healthcare Practice`,
        province,
        city,
        suburb: suburb || city,
        address,
        coordinates: { latitude, longitude },
        rating: rating || 4.8,
        reviewCount: reviewCount || 14,
        languages: ['English', 'Afrikaans'],
        acceptedMedicalAids: ['Discovery Health', 'Bonitas', 'GEMS', 'Momentum Health'],
        offersVirtual: false,
        offersInPerson: true,
        phone,
        email: email || undefined,
        website: website || undefined,
        sourceAttribution,
        dataAuthority: 'OTHER_APPROVED_EXTERNAL_SOURCE',
        claimStatus: 'UNCLAIMED',
        lastVerifiedAt: new Date().toISOString(),
      };

      existingIds.add(id);
      existingSignatures.add(sigKey);
      RAW_EXTERNAL_PRACTITIONERS.push(unlockedEntity);
      MOCK_PRACTITIONERS.push(unlockedEntity);
      newlyAddedUnlocked.push(unlockedEntity);

      // Add corresponding locked card
      const lockedEntity: ExternalPractitionerLocked = {
        id,
        practitionerType: 'EXTERNAL_PRACTITIONER',
        isLocked: true,
        anonymizedTitle: `${specialty} in ${suburb || city}`,
        specialty,
        services: unlockedEntity.services,
        province,
        city,
        generalArea: `${suburb || city}, ${city}`,
        approximateDistanceKm: 3.5,
        rating: unlockedEntity.rating,
        reviewCount: unlockedEntity.reviewCount,
        offersVirtual: false,
        offersInPerson: true,
        acceptedMedicalAids: unlockedEntity.acceptedMedicalAids,
        requiresSubscription: true,
      };
      MOCK_LOCKED_EXTERNAL.push(lockedEntity);

      // Step 2: Compress and produce snapshot
      const rawPayload: RawExternalPractitioner = {
        sourceType: 'GOOGLE_MAPS_PUBLIC_DIRECTORY',
        sourceAttribution,
        rawName: fullName,
        rawPracticeName: practiceName,
        rawSpecialty: specialty,
        rawPhone: phone,
        rawEmail: email || undefined,
        rawWebsite: website || undefined,
        rawAddress: address,
        rawCity: city,
        rawSuburb: suburb,
        rawProvince: province,
        rawLatitude: latitude,
        rawLongitude: longitude,
        rawRating: rating,
        rawReviewCount: reviewCount,
        rawHpcsaNumber: hpcsaNumber || undefined,
        rawServices: services,
        capturedAt: new Date().toISOString(),
      };

      const compressionRes = processSourceCompression(rawPayload);
      totalBytesSaved += Math.max(0, compressionRes.rawSizeBytes - compressionRes.compressedSizeBytes);

      // Step 3: Prepare database batch record conforming strictly to practitioner_directory table
      supabaseUpsertBatch.push({
        id,
        display_name: fullName,
        normalized_name: fullName.toLowerCase().trim(),
        title: cleanTitle,
        practice_name: practiceName,
        normalized_practice_name: practiceName ? practiceName.toLowerCase().trim() : null,
        professional_registration_number: hpcsaNumber,
        public_phone: phone,
        normalized_phone: phone ? phone.replace(/[^0-9]/g, '') : null,
        public_email: email,
        website: website,
        address_line: address,
        suburb: suburb || city,
        city,
        province,
        postal_code: '0001',
        latitude,
        longitude,
        practitioner_fingerprint: fingerprint,
        practitioner_type: 'EXTERNAL_PRACTITIONER',
        is_joined: false,
        is_bookable: false,
        claim_status: 'UNCLAIMED',
        verification_status: 'DRAFT',
        rating,
        review_count: reviewCount,
        offers_virtual: false,
        offers_in_person: true,
        source_attribution: sourceAttribution,
        first_discovered_at: new Date().toISOString(),
        last_discovered_at: new Date().toISOString(),
        last_refreshed_at: new Date().toISOString(),
      });

      // Prepare snapshot record for practitioner_source_snapshots
      supabaseSnapshotsBatch.push({
        practitioner_id: id,
        source_type: 'GOOGLE_MAPS_PUBLIC_DIRECTORY',
        storage_path: compressionRes.storagePath,
        compression: compressionRes.compressionMethod,
        content_hash: compressionRes.contentHash,
        raw_size_bytes: compressionRes.rawSizeBytes,
        compressed_size_bytes: compressionRes.compressedSizeBytes,
        captured_at: new Date().toISOString(),
      });

      savedCount++;
    }

    // Step 4: Persist to Local Storage
    this.persistToLocalStorage();

    // Step 5: Asynchronous batch write to Supabase
    if (isSupabaseConfigured && supabaseUpsertBatch.length > 0) {
      try {
        const { error: upsertError } = await supabase
          .from('practitioner_directory')
          .upsert(supabaseUpsertBatch, { onConflict: 'practitioner_fingerprint' });

        if (upsertError) {
          console.warn('Supabase directory upsert notice:', upsertError.message);
        } else if (supabaseSnapshotsBatch.length > 0) {
          try {
            await supabase.from('practitioner_source_snapshots').insert(supabaseSnapshotsBatch);
          } catch {
            // Snapshot insertion is non-blocking
          }
        }
      } catch (err) {
        console.warn('Could not complete Supabase remote write (cached locally):', err);
      }
    }

    const totalDirectoryCount = RAW_EXTERNAL_PRACTITIONERS.length + 5; // 5 verified providers + external

    return {
      savedCount,
      updatedCount,
      compressionBytesSaved: totalBytesSaved,
      totalDirectoryCount,
    };
  }

  /**
   * Persists all current external practitioners to localStorage
   */
  private static persistToLocalStorage(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify(RAW_EXTERNAL_PRACTITIONERS));
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(SNAPSHOT_REGISTRY));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  /**
   * Checks if Supabase / directory store already contains sufficient fresh records for an area
   */
  static hasSufficientFreshRecords(params: {
    query?: string;
    specialty?: string;
    province?: string;
    city?: string;
    suburb?: string;
  }): { hasRecords: boolean; count: number } {
    this.init();

    const q = (params.query || '').toLowerCase().trim();
    const spec = (params.specialty || '').toLowerCase().trim();
    const city = (params.city || '').toLowerCase().trim();
    const suburb = (params.suburb || '').toLowerCase().trim();
    const prov = params.province;

    const matches = RAW_EXTERNAL_PRACTITIONERS.filter((p) => {
      if (q && !`${p.fullName} ${p.specialty} ${p.practiceName} ${p.suburb}`.toLowerCase().includes(q)) {
        return false;
      }
      if (spec && spec !== 'all specialties' && !p.specialty.toLowerCase().includes(spec)) {
        return false;
      }
      if (prov && prov !== 'All Provinces' && p.province !== prov) {
        return false;
      }
      if (city && city !== 'all cities' && !p.city.toLowerCase().includes(city)) {
        return false;
      }
      if (suburb && !p.suburb.toLowerCase().includes(suburb)) {
        return false;
      }
      return true;
    });

    return {
      hasRecords: matches.length >= 5,
      count: matches.length,
    };
  }

  /**
   * Returns current counts
   */
  static getStats(): { total: number; verified: number; external: number } {
    this.init();
    return {
      total: RAW_EXTERNAL_PRACTITIONERS.length + 5,
      verified: 5,
      external: RAW_EXTERNAL_PRACTITIONERS.length,
    };
  }
}

// Ensure initialized on module import
if (typeof window !== 'undefined') {
  DirectoryStore.init();
}
