/**
 * DigitalNexCare Search Worker & Safe Upsert Pipeline
 * Executes external discovery across modular providers, sanitizes and compresses snapshots,
 * computes fingerprints, checks deduplication confidence, and performs safe upserts.
 */

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
    durationMs: number;
  }> {
    const startTime = Date.now();
    const discoveredList: NormalizedPractitioner[] = [];
    let isBlocked = false;

    // 1. Run parallel search queries across active external discovery workers
    const promises = this.providers.map(async (provider) => {
      try {
        if (params.latitude && params.longitude) {
          return await provider.searchNearby(params.latitude, params.longitude, params.radiusKm || 50);
        } else if (params.specialty || params.category) {
          return await provider.searchByCategory(params.specialty || params.category || '', {
            province: params.province,
            city: params.city,
            suburb: params.suburb,
          });
        } else if (params.practitionerName || params.query) {
          return await provider.searchByName(params.practitionerName || params.query || '', {
            province: params.province,
            city: params.city,
            suburb: params.suburb,
          });
        } else {
          return await provider.searchByLocation({
            province: params.province,
            city: params.city,
            suburb: params.suburb,
          });
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
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Process Safe Upsert Pipeline
    let createdCount = 0;
    let updatedCount = 0;
    let duplicateCount = 0;
    let conflictCount = 0;
    let totalCompressionSavings = 0;

    for (const incoming of discoveredList) {
      // Step A: Compression Pipeline & Private Snapshot Storage
      const rawPayload: RawExternalPractitioner = {
        sourceType: incoming.sourceType,
        sourceAttribution: incoming.sourceAttribution,
        rawName: incoming.displayName,
        rawPracticeName: incoming.practiceName,
        rawSpecialty: incoming.specialty,
        rawPhone: incoming.phone,
        rawEmail: incoming.email || undefined,
        rawWebsite: incoming.website || undefined,
        rawAddress: incoming.address,
        rawCity: incoming.city,
        rawSuburb: incoming.suburb,
        rawProvince: incoming.province,
        rawLatitude: incoming.latitude,
        rawLongitude: incoming.longitude,
        rawRating: incoming.rating,
        rawReviewCount: incoming.reviewCount,
        rawHpcsaNumber: incoming.hpcsaNumber || undefined,
        rawServices: incoming.services,
        rawLanguages: incoming.languages,
        rawAcceptedMedicalAids: incoming.acceptedMedicalAids,
        capturedAt: incoming.capturedAt,
      };

      const compressionRes = processSourceCompression(rawPayload);
      totalCompressionSavings += compressionRes.rawSizeBytes - compressionRes.compressedSizeBytes;

      // Step B: Deduplication & Fingerprint Matching
      let bestMatchResult = { confidence: 'NEW_PRACTITIONER' as any, confidenceScore: 0, existingId: '', existingItem: null as Practitioner | null };

      for (const existing of MOCK_PRACTITIONERS) {
        const match = evaluateDeduplicationConfidence(incoming, existing);
        if (match.confidenceScore > bestMatchResult.confidenceScore) {
          bestMatchResult = {
            confidence: match.confidence,
            confidenceScore: match.confidenceScore,
            existingId: existing.id,
            existingItem: existing,
          };
        }
      }

      // Step C: Apply Safe Authority Upsert Rules
      if (bestMatchResult.confidence === 'EXACT_MATCH' || bestMatchResult.confidence === 'HIGH_CONFIDENCE_MATCH') {
        if (bestMatchResult.existingItem) {
          const { safeUpdates, conflicts } = evaluateFieldAuthorityUpdates(bestMatchResult.existingItem, incoming);
          Object.assign(bestMatchResult.existingItem, safeUpdates);

          if (conflicts.length > 0) {
            conflictCount += conflicts.length;
            CONFLICT_REGISTRY.push(...conflicts);
          }
          updatedCount++;
        }
      } else if (bestMatchResult.confidence === 'POSSIBLE_MATCH') {
        duplicateCount++;
        DUPLICATE_CANDIDATE_REGISTRY.push({
          id: `dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sourceId: incoming.fingerprint,
          targetId: bestMatchResult.existingId,
          confidenceScore: bestMatchResult.confidenceScore,
          reasons: ['Similar name and geographic overlap detected; manual review required.'],
          status: 'PENDING_REVIEW',
          createdAt: new Date().toISOString(),
        });
      } else {
        // Step D: Create New External Practitioner
        createdCount++;
        const newExternalRecord: ExternalPractitionerUnlocked = {
          id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          slug: incoming.normalizedName.replace(/\s+/g, '-'),
          practitionerType: 'EXTERNAL_PRACTITIONER',
          fullName: incoming.displayName,
          title: incoming.title,
          specialty: incoming.specialty,
          services: incoming.services,
          practiceName: incoming.practiceName,
          province: incoming.province,
          city: incoming.city,
          suburb: incoming.suburb,
          address: incoming.address,
          coordinates: { latitude: incoming.latitude, longitude: incoming.longitude },
          rating: incoming.rating,
          reviewCount: incoming.reviewCount,
          languages: incoming.languages,
          gender: 'FEMALE',
          acceptedMedicalAids: incoming.acceptedMedicalAids,
          offersVirtual: false,
          offersInPerson: true,
          phone: incoming.phone,
          email: incoming.email || '',
          website: incoming.website || '',
          sourceAttribution: incoming.sourceAttribution,
          dataAuthority: incoming.dataAuthority,
          claimStatus: 'UNCLAIMED',
          lastVerifiedAt: incoming.capturedAt,
        };

        // Keep searchable fields canonical and indexable
        (newExternalRecord as any).practitionerFingerprint = incoming.fingerprint;
        (newExternalRecord as any).hpcsaNumber = incoming.hpcsaNumber;
        MOCK_PRACTITIONERS.push(newExternalRecord);
        RAW_EXTERNAL_PRACTITIONERS.push(newExternalRecord);

        // Also add locked representation for subscription enforcement
        const lockedRecord: ExternalPractitionerLocked = {
          id: newExternalRecord.id,
          practitionerType: 'EXTERNAL_PRACTITIONER',
          isLocked: true,
          anonymizedTitle: `${newExternalRecord.specialty} in ${newExternalRecord.suburb || newExternalRecord.city}`,
          specialty: newExternalRecord.specialty,
          services: newExternalRecord.services,
          province: newExternalRecord.province,
          city: newExternalRecord.city,
          generalArea: `${newExternalRecord.suburb}, ${newExternalRecord.city}`,
          approximateDistanceKm: 3.8,
          rating: newExternalRecord.rating,
          reviewCount: newExternalRecord.reviewCount,
          offersVirtual: newExternalRecord.offersVirtual,
          offersInPerson: newExternalRecord.offersInPerson,
          acceptedMedicalAids: newExternalRecord.acceptedMedicalAids,
          requiresSubscription: true,
        };
        MOCK_LOCKED_EXTERNAL.push(lockedRecord);
      }
    }

    return {
      status: discoveredList.length > 0 ? 'SUCCESS' : 'NO_RESULTS',
      results: discoveredList,
      createdCount,
      updatedCount,
      duplicateCount,
      conflictCount,
      compressionBytesSaved: totalCompressionSavings,
      durationMs: Date.now() - startTime,
    };
  }
}
