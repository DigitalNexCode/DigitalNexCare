/**
 * DigitalNexCare External Practitioner Discovery & Ingestion Types
 * Chunk 3 - External Discovery, Normalization, Fingerprinting, Compression & Ingestion
 */

import { SouthAfricanProvince, DataAuthority, PractitionerType, ClaimStatus, VerificationStatus } from '../supabase/database.types';

export type MatchConfidence = 'EXACT_MATCH' | 'HIGH_CONFIDENCE_MATCH' | 'POSSIBLE_MATCH' | 'NEW_PRACTITIONER';

export type IngestionJobStatus = 'QUEUED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'SOURCE_BLOCKED';

export interface LocationFilter {
  province?: SouthAfricanProvince | string;
  city?: string;
  suburb?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  radiusKm?: number;
}

export interface DiscoverySearchParams {
  query?: string;
  practitionerName?: string;
  practiceName?: string;
  specialty?: string;
  category?: string;
  province?: SouthAfricanProvince | string;
  city?: string;
  suburb?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  limit?: number;
}

export interface RawExternalPractitioner {
  rawId?: string;
  sourceType: string;
  sourceUrl?: string;
  sourceAttribution: string;
  rawHtmlOrJson?: string | Record<string, any>;
  rawName: string;
  rawPracticeName?: string;
  rawSpecialty?: string;
  rawCategory?: string;
  rawPhone?: string;
  rawEmail?: string;
  rawWebsite?: string;
  rawAddress?: string;
  rawCity?: string;
  rawSuburb?: string;
  rawProvince?: string;
  rawPostalCode?: string;
  rawLatitude?: number;
  rawLongitude?: number;
  rawRating?: number;
  rawReviewCount?: number;
  rawHpcsaNumber?: string;
  rawServices?: string[];
  rawLanguages?: string[];
  rawAcceptedMedicalAids?: string[];
  openingStatus?: string | null;
  websiteVisited?: boolean;
  capturedAt: string;
}

export interface NormalizedPractitioner {
  displayName: string;
  normalizedName: string;
  title: string;
  practiceName: string;
  normalizedPracticeName: string;
  specialty: string;
  category: string;
  services: string[];
  phone: string;
  normalizedPhone: string; // Canonical E.164 +27 format
  email: string | null;
  website: string | null;
  address: string;
  suburb: string;
  city: string;
  province: SouthAfricanProvince;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  hpcsaNumber: string | null;
  rating: number;
  reviewCount: number;
  languages: string[];
  acceptedMedicalAids: string[];
  sourceAttribution: string;
  sourceType: string;
  dataAuthority: DataAuthority;
  fingerprint: string;
  capturedAt: string;
}

export interface FingerprintSignals {
  normalizedName: string;
  normalizedPracticeName?: string;
  normalizedPhone?: string;
  normalizedAddress?: string;
  hpcsaNumber?: string;
  suburb: string;
  city: string;
  province: string;
  latitude?: number;
  longitude?: number;
}

export interface DeduplicationMatchResult {
  confidence: MatchConfidence;
  confidenceScore: number; // 0.0 to 1.0
  existingPractitionerId?: string;
  reasons: string[];
  conflictingFields?: Array<{
    field: string;
    existingValue: string;
    existingAuthority: DataAuthority;
    incomingValue: string;
    incomingAuthority: DataAuthority;
  }>;
}

export interface CompressionResult {
  contentHash: string; // SHA-256
  rawSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatio: number; // e.g. 0.82 = 82% saved
  compressionMethod: 'Zstandard' | 'GZIP' | 'Deflate';
  storagePath: string;
  bucket: string;
  isDuplicateSnapshot: boolean;
  sanitizedPayload: string;
}

export interface DiscoveryResult {
  status: 'SUCCESS' | 'NO_RESULTS' | 'PARTIAL' | 'SOURCE_BLOCKED' | 'ERROR';
  source: string;
  foundCount: number;
  normalizedPractitioners: NormalizedPractitioner[];
  results?: RawExternalPractitioner[];
  rawPractitioners?: RawExternalPractitioner[];
  errorMessage?: string;
  durationMs: number;
}

export interface ExternalPractitionerProvider {
  providerId: string;
  providerName: string;
  sourceAttribution: string;
  defaultAuthority: DataAuthority;

  searchByName(name: string, location?: LocationFilter): Promise<DiscoveryResult>;
  searchByCategory(categoryOrSpecialty: string, location?: LocationFilter): Promise<DiscoveryResult>;
  searchByLocation(location: LocationFilter): Promise<DiscoveryResult>;
  searchNearby(latitude: number, longitude: number, radiusKm: number): Promise<DiscoveryResult>;
  getDetails(sourceId: string): Promise<RawExternalPractitioner | null>;
  normalizeResult(raw: RawExternalPractitioner): NormalizedPractitioner;
  refreshPractitioner(id: string): Promise<NormalizedPractitioner | null>;
}

export interface IngestionJobRecord {
  id: string;
  name: string;
  targetProvince: SouthAfricanProvince;
  targetCity?: string;
  targetSpecialty?: string;
  targetCategory?: string;
  status: IngestionJobStatus;
  currentBatch: number;
  totalBatches: number;
  recordsFound: number;
  recordsCreated: number;
  recordsUpdated: number;
  duplicatesDetected: number;
  conflictsFlagged: number;
  errorsCount: number;
  compressionBytesSaved: number;
  checkpoint?: string;
  errorLog?: string[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface DataConflictRecord {
  id: string;
  practitionerId: string;
  practitionerName: string;
  fieldName: string;
  existingValue: string;
  existingAuthority: DataAuthority;
  incomingValue: string;
  incomingAuthority: DataAuthority;
  sourceType: string;
  status: 'PENDING_REVIEW' | 'RESOLVED_RETAIN_EXISTING' | 'RESOLVED_ACCEPT_INCOMING';
  flaggedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface SourceSnapshotRecord {
  id: string;
  practitionerId?: string;
  practitionerName?: string;
  sourceType: string;
  storagePath: string;
  bucket: string;
  compression: string;
  contentHash: string;
  rawSizeBytes: number;
  compressedSizeBytes: number;
  compressionSavingsPercent: number;
  capturedAt: string;
  metadata?: Record<string, any>;
}
