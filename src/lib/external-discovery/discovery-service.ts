/**
 * DigitalNexCare Database-First Practitioner Discovery Service
 * Enforces the strict Constitution rule: Always query Supabase / Primary Practitioner Search Index first.
 * Invokes external discovery ONLY on database miss, insufficient density (< 3), or stale results.
 */

import { SearchPractitionersParams, SupabaseDbService } from '../supabase/db-service';
import { SearchCache } from './search-cache';
import { ExternalSearchWorker } from './search-worker';
import { Practitioner } from '../../types';

export interface DiscoverySearchResult {
  practitioners: Practitioner[];
  source: 'SUPABASE_CACHE' | 'SUPABASE_PRIMARY_INDEX' | 'EXTERNAL_DISCOVERY_PIPELINE' | 'FALLBACK_LOCAL_DIRECTORY';
  externalDiscoveredCount: number;
  durationMs: number;
  isExternalSourceBlocked?: boolean;
}

export class PractitionerDiscoveryService {
  /**
   * Main Search Entrypoint.
   * Supabase-First -> Operational Cache -> External Discovery Worker fallback.
   */
  static async search(params: SearchPractitionersParams): Promise<DiscoverySearchResult> {
    const startTime = Date.now();

    // 1. Check Operational Search Cache
    const cached = SearchCache.get(params);
    if (cached && cached.length > 0) {
      return {
        practitioners: cached,
        source: 'SUPABASE_CACHE',
        externalDiscoveredCount: 0,
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Query Supabase Primary Practitioner Index FIRST
    const initialDbResults = await SupabaseDbService.searchPractitioners(params);

    // 3. Evaluate if Supabase results are sufficient and fresh
    const hasAdequateResults = initialDbResults.length >= 3;
    const isSpecificPractitionerFound = !params.query || initialDbResults.some((p) => {
      const name = 'fullName' in p ? p.fullName.toLowerCase() : '';
      return name.includes(params.query!.toLowerCase());
    });

    if (hasAdequateResults && isSpecificPractitionerFound) {
      SearchCache.set(params, initialDbResults, 3600000); // 1 hr cache
      return {
        practitioners: initialDbResults,
        source: 'SUPABASE_PRIMARY_INDEX',
        externalDiscoveredCount: 0,
        durationMs: Date.now() - startTime,
      };
    }

    // 4. Database Miss or Insufficient Results -> Trigger Modular External Discovery Worker
    let externalDiscoveredCount = 0;
    let isExternalSourceBlocked = false;

    try {
      const discoveryResult = await ExternalSearchWorker.executeDiscovery({
        query: params.query,
        practitionerName: params.query,
        specialty: params.specialty,
        province: params.province,
        city: params.city,
        suburb: params.suburb,
        latitude: params.userCoordinates?.latitude,
        longitude: params.userCoordinates?.longitude,
        radiusKm: params.maxDistanceKm,
      });

      if (discoveryResult.status === 'SOURCE_BLOCKED') {
        isExternalSourceBlocked = true;
      } else {
        externalDiscoveredCount = discoveryResult.results.length;
      }
    } catch (err) {
      console.warn('External discovery worker encountered error; safely continuing with Supabase data', err);
    }

    // 5. Re-query Supabase / Directory to project the freshly upserted normalized records
    const finalResults = await SupabaseDbService.searchPractitioners(params);

    // 6. Cache the final result
    SearchCache.set(params, finalResults, 3600000);

    return {
      practitioners: finalResults.length > 0 ? finalResults : initialDbResults,
      source: externalDiscoveredCount > 0 ? 'EXTERNAL_DISCOVERY_PIPELINE' : 'SUPABASE_PRIMARY_INDEX',
      externalDiscoveredCount,
      isExternalSourceBlocked,
      durationMs: Date.now() - startTime,
    };
  }
}
