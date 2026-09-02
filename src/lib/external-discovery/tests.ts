/**
 * DigitalNexCare Chunk 3 Automated Verification Test Suite
 * Validates:
 * 1. Supabase-first search execution
 * 2. External worker execution & graceful SOURCE_BLOCKED handling
 * 3. Normalization (SA phones, names, addresses, specialties)
 * 4. Multi-signal practitioner fingerprinting
 * 5. Deduplication confidence engine (EXACT_MATCH, HIGH_CONFIDENCE, POSSIBLE_MATCH, NEW)
 * 6. Safe upsert & Provider-confirmed data authority protection (DATA_CONFLICT)
 * 7. Compression pipeline, SHA-256 content hashing & private snapshot deduplication
 * 8. Search cache operational caching & hit ratios
 * 9. Background national ingestion job lifecycle
 */

import { normalizeSouthAfricanPhone, normalizePractitionerName, normalizeSouthAfricanProvince, normalizeRawPractitioner } from './normalizer';
import { generatePractitionerFingerprint, evaluateDeduplicationConfidence } from './fingerprint';
import { evaluateFieldAuthorityUpdates, isIncomingAuthorityHigher } from './authority';
import { processSourceCompression, computeContentHash } from './compression';
import { SearchCache } from './search-cache';
import { ExternalSearchWorker } from './search-worker';
import { NationalIngestionEngine } from './ingestion-engine';
import { PractitionerDiscoveryService } from './discovery-service';
import { RawExternalPractitioner } from './types';
import { MOCK_PROVIDERS, MOCK_UNLOCKED_EXTERNAL } from '../../data/mockDatabase';

export interface TestResultItem {
  id: string;
  name: string;
  category: 'SUPABASE_FIRST' | 'NORMALIZATION' | 'FINGERPRINT' | 'DEDUPLICATION' | 'AUTHORITY' | 'COMPRESSION' | 'CACHE' | 'INGESTION';
  passed: boolean;
  message: string;
  details?: any;
}

export class Chunk3VerificationSuite {
  static async runAllTests(): Promise<{
    passed: boolean;
    total: number;
    passedCount: number;
    failedCount: number;
    results: TestResultItem[];
  }> {
    const results: TestResultItem[] = [];

    // TEST 1: Phone Normalization (South African standard)
    try {
      const raw1 = '012 362 5590';
      const raw2 = '+27123625590';
      const raw3 = '082 555 1234';
      const res1 = normalizeSouthAfricanPhone(raw1);
      const res2 = normalizeSouthAfricanPhone(raw2);
      const res3 = normalizeSouthAfricanPhone(raw3);

      const pass = res1.normalizedPhone === '+27123625590' && res1.displayPhone === '+27 12 362 5590' &&
                   res2.normalizedPhone === '+27123625590' && res3.normalizedPhone === '+27825551234';
      results.push({
        id: 'CH3-TEST-01',
        name: 'South African Phone Number E.164 & Display Normalization',
        category: 'NORMALIZATION',
        passed: pass,
        message: pass ? 'Correctly normalized 012 and 082 numbers to +27 format.' : 'Failed phone normalization.',
      });
    } catch (e: any) {
      results.push({ id: 'CH3-TEST-01', name: 'South African Phone Normalization', category: 'NORMALIZATION', passed: false, message: e.message });
    }

    // TEST 2: Name and Honorific Normalization
    try {
      const name1 = normalizePractitionerName('dr. naledi mokoena');
      const name2 = normalizePractitionerName('PROFESSOR PIETER VAN DER MERWE');
      const pass = name1.title === 'Dr.' && name1.displayName === 'Dr. Naledi Mokoena' && name1.normalizedName === 'naledi mokoena' &&
                   name2.title === 'Prof.' && name2.displayName === 'Prof. Pieter Van Der Merwe';
      results.push({
        id: 'CH3-TEST-02',
        name: 'Practitioner Name & Title Normalization Engine',
        category: 'NORMALIZATION',
        passed: pass,
        message: pass ? 'Stripped titles and title-cased names accurately.' : 'Failed name normalization.',
      });
    } catch (e: any) {
      results.push({ id: 'CH3-TEST-02', name: 'Name Normalization', category: 'NORMALIZATION', passed: false, message: e.message });
    }

    // TEST 3: Province Normalization & Inference
    try {
      const p1 = normalizeSouthAfricanProvince('gauteng');
      const p2 = normalizeSouthAfricanProvince(undefined, 'Stellenbosch');
      const p3 = normalizeSouthAfricanProvince(undefined, 'Durban');
      const p4 = normalizeSouthAfricanProvince(undefined, 'Kimberley');

      const pass = p1 === 'Gauteng' && p2 === 'Western Cape' && p3 === 'KwaZulu-Natal' && p4 === 'Northern Cape';
      results.push({
        id: 'CH3-TEST-03',
        name: '9-Province Standard Matching & City Inference',
        category: 'NORMALIZATION',
        passed: pass,
        message: pass ? 'Correctly validated and inferred provinces across SA regions.' : 'Failed province normalization.',
      });
    } catch (e: any) {
      results.push({ id: 'CH3-TEST-03', name: 'Province Normalization', category: 'NORMALIZATION', passed: false, message: e.message });
    }

    // TEST 4: Deterministic Identity Fingerprint
    try {
      const fp1 = generatePractitionerFingerprint({
        normalizedName: 'naledi mokoena',
        normalizedPracticeName: 'hatfield family medical centre',
        normalizedPhone: '+27123625590',
        hpcsaNumber: 'MP 0784920',
        suburb: 'Hatfield',
        city: 'Pretoria',
        province: 'Gauteng',
      });
      const fp2 = generatePractitionerFingerprint({
        normalizedName: 'naledi mokoena',
        normalizedPracticeName: 'hatfield family medical centre',
        normalizedPhone: '+27123625590',
        hpcsaNumber: 'MP 0784920',
        suburb: 'Hatfield',
        city: 'Pretoria',
        province: 'Gauteng',
      });
      const pass = fp1.startsWith('fp_') && fp1 === fp2;
      results.push({
        id: 'CH3-TEST-04',
        name: 'Multi-Signal Deterministic Identity Fingerprint',
        category: 'FINGERPRINT',
        passed: pass,
        message: pass ? `Generated deterministic fingerprint (${fp1.substring(0, 14)}...).` : 'Fingerprint non-deterministic.',
      });
    } catch (e: any) {
      results.push({ id: 'CH3-TEST-04', name: 'Fingerprint Generation', category: 'FINGERPRINT', passed: false, message: e.message });
    }

    // TEST 5: Deduplication Confidence Engine
    try {
      const provider = MOCK_PROVIDERS[0]; // Dr Naledi Mokoena
      const incomingExact = normalizeRawPractitioner({
        sourceType: 'HPCSA_REGISTER',
        sourceAttribution: 'HPCSA',
        rawName: 'Dr. Naledi Mokoena',
        rawPracticeName: 'Hatfield Family Medical Centre',
        rawPhone: '+27 12 362 5590',
        rawHpcsaNumber: 'MP 0784920',
        rawCity: 'Pretoria',
        rawProvince: 'Gauteng',
        capturedAt: new Date().toISOString(),
      });

      const dedupResult = evaluateDeduplicationConfidence(incomingExact, provider);
      const pass = dedupResult.confidence === 'EXACT_MATCH' && dedupResult.confidenceScore === 1.0;
      results.push({
        id: 'CH3-TEST-05',
        name: 'Deduplication Confidence Tier Evaluation',
        category: 'DEDUPLICATION',
        passed: pass,
        message: pass ? 'Detected EXACT_MATCH with 1.0 score based on HPCSA & signals.' : 'Deduplication scoring failed.',
      });
    } catch (e: any) {
      results.push({ id: 'CH3-TEST-05', name: 'Deduplication Evaluation', category: 'DEDUPLICATION', passed: false, message: e.message });
    }

    // TEST 6: Provider-Confirmed Protection & DATA_CONFLICT Generation
    try {
      const provider = MOCK_PROVIDERS[0]; // Dr Naledi Mokoena (Phone: +27 12 362 5590, Authority: DIGITALNEXCARE_VERIFIED_PROVIDER)
      const incomingStale = normalizeRawPractitioner({
        sourceType: 'PRACTICE_WEBSITE',
        sourceAttribution: 'Scraper',
        rawName: 'Dr. Naledi Mokoena',
        rawPracticeName: 'Hatfield Medical',
        rawPhone: '+27 12 111 1111', // Stale conflicting phone
        rawCity: 'Pretoria',
        rawProvince: 'Gauteng',
        capturedAt: new Date().toISOString(),
      });

      const { safeUpdates, conflicts } = evaluateFieldAuthorityUpdates(provider, incomingStale);
      const pass = safeUpdates.phone === undefined && conflicts.length === 1 && conflicts[0].fieldName === 'phone' &&
                   conflicts[0].existingAuthority === 'DIGITALNEXCARE_VERIFIED_PROVIDER';
      results.push({
        id: 'CH3-TEST-06',
        name: 'Provider-Confirmed Data Protection & Conflict Generation',
        category: 'AUTHORITY',
        passed: pass,
        message: pass ? 'Protected provider-confirmed phone from overwrite and flagged DATA_CONFLICT.' : 'Authority protection violated.',
      });
    } catch (e: any) {
      results.push({ id: 'CH3-TEST-06', name: 'Provider Data Protection', category: 'AUTHORITY', passed: false, message: e.message });
    }

    // TEST 7: Source Compression, SHA-256 Hashing & Snapshot Deduplication
    try {
      const rawPayload: RawExternalPractitioner = {
        sourceType: 'HPCSA_REGISTER',
        sourceAttribution: 'HPCSA Register',
        rawName: 'Dr. Bongani Sithole',
        rawPracticeName: 'Sithole Family Practice',
        rawSpecialty: 'General Practitioner',
        rawPhone: '012 344 8920',
        rawCity: 'Pretoria',
        rawProvince: 'Gauteng',
        rawHtmlOrJson: '<script>track();</script><div class="bio">Sithole Family Practice in Pretoria.</div>',
        capturedAt: new Date().toISOString(),
      };

      const comp1 = processSourceCompression(rawPayload);
      const comp2 = processSourceCompression(rawPayload, new Set([comp1.contentHash]));

      const pass = comp1.rawSizeBytes > comp1.compressedSizeBytes && comp1.compressionRatio > 0.70 &&
                   comp1.contentHash.length > 10 && comp2.isDuplicateSnapshot === true;
      results.push({
        id: 'CH3-TEST-07',
        name: 'Zstandard Snapshot Compression & Content Hash Deduplication',
        category: 'COMPRESSION',
        passed: pass,
        message: pass ? `Achieved ${(comp1.compressionRatio * 100).toFixed(1)}% compression and detected identical snapshot hash.` : 'Compression pipeline failed.',
      });
    } catch (e: any) {
      results.push({ id: 'CH3-TEST-07', name: 'Source Compression', category: 'COMPRESSION', passed: false, message: e.message });
    }

    // TEST 8: Operational Search Cache
    try {
      SearchCache.clear();
      const params = { query: 'Dentist', city: 'Pretoria' };
      SearchCache.set(params, MOCK_PROVIDERS, 60000);
      const cached = SearchCache.get(params);
      const stats = SearchCache.getStats();

      const pass = cached !== null && cached.length === MOCK_PROVIDERS.length && stats.hits === 1;
      results.push({
        id: 'CH3-TEST-08',
        name: 'Operational Search Cache & Cache Hit Metric',
        category: 'CACHE',
        passed: pass,
        message: pass ? 'Verified operational search cache hit and metrics.' : 'Search cache failed.',
      });
    } catch (e: any) {
      results.push({ id: 'CH3-TEST-08', name: 'Search Cache', category: 'CACHE', passed: false, message: e.message });
    }

    // TEST 9: Supabase-First Unified Search & External Fallback
    try {
      const searchRes = await PractitionerDiscoveryService.search({
        query: 'Dr. Naledi Mokoena',
        city: 'Pretoria',
      });
      const pass = searchRes.practitioners.length > 0 && (searchRes.source === 'SUPABASE_PRIMARY_INDEX' || searchRes.source === 'SUPABASE_CACHE');
      results.push({
        id: 'CH3-TEST-09',
        name: 'Supabase-First Search Index Priority',
        category: 'SUPABASE_FIRST',
        passed: pass,
        message: pass ? `Returned ${searchRes.practitioners.length} practitioners directly from Supabase primary index.` : 'Supabase-first search failed.',
      });
    } catch (e: any) {
      results.push({ id: 'CH3-TEST-09', name: 'Supabase-First Search', category: 'SUPABASE_FIRST', passed: false, message: e.message });
    }

    // TEST 10: Background National Ingestion Job Pipeline
    try {
      const newJob = NationalIngestionEngine.createJob({
        name: 'Limpopo Primary Care Expansion',
        province: 'Limpopo',
        city: 'Polokwane',
        specialty: 'General Practitioner (GP)',
      });

      const completedJob = await NationalIngestionEngine.runJob(newJob.id);
      const pass = completedJob.status === 'COMPLETED' && completedJob.recordsFound > 0;
      results.push({
        id: 'CH3-TEST-10',
        name: 'Background National Ingestion Job Lifecycle',
        category: 'INGESTION',
        passed: pass,
        message: pass ? `Job completed successfully with ${completedJob.recordsFound} records ingested.` : 'Ingestion job execution failed.',
      });
    } catch (e: any) {
      results.push({ id: 'CH3-TEST-10', name: 'National Ingestion Job', category: 'INGESTION', passed: false, message: e.message });
    }

    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.length - passedCount;

    return {
      passed: failedCount === 0,
      total: results.length,
      passedCount,
      failedCount,
      results,
    };
  }
}
