/**
 * DigitalNexCare Location, Area Coverage and Live Discovery Types
 * Chunk 3B - Unknown Area Discovery, Live Search & Streaming Architecture
 */

import { SouthAfricanProvince } from '../../types';

export type AreaDiscoveryStatus =
  | 'KNOWN'
  | 'DISCOVERING'
  | 'DISCOVERED'
  | 'NO_RESULTS_YET'
  | 'STALE'
  | 'FAILED_TEMPORARILY';

export type AreaCoverageStatus =
  | 'NO_RESULTS_YET'
  | 'PARTIAL_COVERAGE'
  | 'FULLER_COVERAGE';

export type LocationSourceType =
  | 'SEEDED_DIRECTORY'
  | 'EXTERNAL_DISCOVERY'
  | 'USER_PROVISIONAL'
  | 'GEOCODED';

export interface SouthAfricanLocationRecord {
  id: string;
  country: string;
  countryCode: string;
  province: SouthAfricanProvince;
  municipality: string | null;
  cityTown: string | null;
  suburb: string | null;
  areaName: string;
  normalizedAreaName: string;
  searchAliases: string[];
  latitude: number | null;
  longitude: number | null;
  sourceType: LocationSourceType;
  discoveryStatus: AreaDiscoveryStatus;
  coverageStatus: AreaCoverageStatus;
  firstDiscoveredAt: string;
  lastSearchedAt: string;
  lastIngestedAt: string | null;
  practitionerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AreaPractitionerCoverageRecord {
  id: string;
  areaId: string;
  areaName: string;
  province: SouthAfricanProvince;
  categoryId: string;
  categoryName: string;
  specialtyId: string | null;
  specialtyName: string | null;
  recordsCount: number;
  coverageStatus: AreaCoverageStatus;
  lastIngestedAt: string | null;
  lastSearchAt: string;
  nextRefreshAt: string | null;
  externalSearchCount: number;
}

export type LiveSearchStatus =
  | 'CREATED'
  | 'SEARCHING_DATABASE'
  | 'DATABASE_RESULTS_READY'
  | 'EXTERNAL_DISCOVERY_STARTED'
  | 'STREAMING_RESULTS'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'NO_RESULTS'
  | 'FAILED';

export interface LivePractitionerSearchRecord {
  id: string;
  userId: string | null;
  query: string;
  areaId: string | null;
  areaName: string;
  categoryId: string;
  status: LiveSearchStatus;
  statusMessage: string;
  cachedResultsCount: number;
  externalResultsCount: number;
  totalResultsCount: number;
  startedAt: string;
  firstResultAt: string | null;
  completedAt: string | null;
  errorCode: string | null;
  createdAt: string;
  metrics: {
    timeToFirstDbResultMs: number | null;
    timeToFirstExternalResultMs: number | null;
    externalSearchTotalMs: number | null;
    numberStreamed: number;
    numberSaved: number;
    numberUpdated: number;
  };
}

export interface LiveSearchEvent {
  type:
    | 'STATUS_CHANGE'
    | 'DATABASE_READY'
    | 'DISCOVERY_STARTED'
    | 'PRACTITIONER_STREAMED'
    | 'BATCH_STREAMED'
    | 'COMPLETED'
    | 'PARTIAL'
    | 'ERROR';
  searchId: string;
  status: LiveSearchStatus;
  statusMessage: string;
  practitioner?: any;
  practitioners?: any[];
  totalCount: number;
  metrics?: LivePractitionerSearchRecord['metrics'];
  timestamp: string;
}
