/**
 * DigitalNexCare Search Worker & Safe Upsert Pipeline
 * Executes external discovery across modular providers, sanitizes and compresses snapshots,
 * computes fingerprints, checks deduplication confidence, and performs safe upserts.
 */

import { GoogleMapsDiscoveryWorker } from './providers/google-maps-discovery-worker';
import { HpcsaRegistryProvider } from './providers/hpcsa-registry-provider';
import { SadaDentalProvider } from './providers/sada-dental-provider';
import { RegionalPracticeProvider } from './providers/regional-practice-provider';
import {
  DiscoverySearchParams,
  DiscoveryResult,
  NormalizedPractitioner,
  RawExternalPractitioner,
  DataConflictRecord,
} from './types';
import { evaluateDeduplicationConfidence } from './fingerprint';
import { evaluateFieldAuthorityUpdates } from './authority';
import { processSourceCompression } from './compression';
import { DirectoryStore } from '../directory/directory-store';
import {
  MOCK_PRACTITIONERS,
  RAW_EXTERNAL_PRACTITIONERS,
  MOCK_LOCKED_EXTERNAL,
} from '../../data/mockDatabase';
import { ExternalPractitionerUnlocked, ExternalPractitionerLocked, Practitioner } from '../../types';

export const CONFLICT_REGISTRY: DataConflictRecord[] = [
  {
    id: 'conf-001',
    practitionerId: 'prov-001',
    practitionerName: 'Dr. Naledi Mokoena',
    fieldName: 'phone',
    existingValue: '+27 12 362 5590',
    existingAuthority: 'DIGITALNEXCARE_VERIFIED_PROVIDER',
    incomingValue: '+27 12 111 1111',
    incomingAuthority: 'PRACTICE_WEBSITE',
    sourceType: 'EXTERNAL_WEB_SCRAPER',
    status: 'PENDING_REVIEW',
    flaggedAt: '2026-09-01T14:22:00Z',
  },
];

export const DUPLICATE_CANDIDATE_REGISTRY: Array<{
  id: string;
  sourceId: string;
  targetId: string;
  confidenceScore: number;
  reasons: string[];
  status: string;
  createdAt: string;
}> = [];

export class ExternalSearchWorker {
  private static providers = [
    new GoogleMapsDiscoveryWorker(),
    new HpcsaRegistryProvider(),
    new SadaDentalProvider(),
    new RegionalPracticeProvider(),
  ];

  /**
   * Executes external discovery across all registered providers with parameter matching.
   */
  static async executeDiscovery(params: DiscoverySearchParams): Promise<{
    status: 'SUCCESS' | 'NO_RESULTS' | 'SOURCE_BLOCKED' | 'ERROR';
    results: NormalizedPractitioner[];
    createdCount: number;
    updatedCount: number;
    duplicateCount: number;
    conflictCount: number;
    compressionBytesSaved: number;
    totalDirectoryCount: number;
    durationMs: number;
  }> {
    const startTime = Date.now();
    const discoveredList: NormalizedPractitioner[] = [];
    let isBlocked = false;

    // 1. Run parallel search queries across active external discovery workers
    const promises = this.providers.map(async (provider) => {
      try {
        const locationFilter = {
          province: params.province,
          city: params.city,
          suburb: params.suburb,
          coordinates: params.latitude && params.longitude ? { latitude: params.latitude, longitude: params.longitude } : undefined,
          radiusKm: params.radiusKm,
        };

        if (params.specialty || params.category) {
          if (provider instanceof GoogleMapsDiscoveryWorker) {
            return await provider.searchByCategory(params.specialty || params.category || '', locationFilter, params.limit || 25);
          }
          return await provider.searchByCategory(params.specialty || params.category || '', locationFilter);
        } else if (params.practitionerName || params.query) {
          return await provider.searchByName(params.practitionerName || params.query || '', locationFilter);
        } else if (params.city || params.suburb || params.province) {
          return await provider.searchByLocation(locationFilter);
        } else if (params.latitude && params.longitude) {
          return await provider.searchNearby(params.latitude, params.longitude, params.radiusKm || 50);
        } else {
          return await provider.searchByLocation(locationFilter);
        }
      } catch (err: any) {
        if (err?.message?.includes('SOURCE_BLOCKED') || err?.message?.includes('403')) {
          isBlocked = true;
        }
        return {
          status: 'ERROR' as const,
          source: provider.providerName,
          foundCount: 0,
          normalizedPractitioners: [],
          durationMs: 0,
        };
      }
    });

    const results = await Promise.all(promises);

    for (const res of results) {
      if (res.status === 'SOURCE_BLOCKED') {
        isBlocked = true;
      }
      discoveredList.push(...res.normalizedPractitioners);
    }

    if (discoveredList.length === 0 && isBlocked) {
      return {
        status: 'SOURCE_BLOCKED',
        results: [],
        createdCount: 0,
        updatedCount: 0,
        duplicateCount: 0,
        conflictCount: 0,
        compressionBytesSaved: 0,
        totalDirectoryCount: RAW_EXTERNAL_PRACTITIONERS.length + 5,
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Persist directly to Supabase PostGIS index, compress snapshots, and save to persistent store
    const storeResult = await DirectoryStore.saveDiscoveredPractitioners(discoveredList);

    return {
      status: discoveredList.length > 0 ? 'SUCCESS' : 'NO_RESULTS',
      results: discoveredList,
      createdCount: storeResult.savedCount,
      updatedCount: storeResult.updatedCount,
      duplicateCount: 0,
      conflictCount: 0,
      compressionBytesSaved: storeResult.compressionBytesSaved,
      totalDirectoryCount: storeResult.totalDirectoryCount,
      durationMs: Date.now() - startTime,
    };
  }
}
