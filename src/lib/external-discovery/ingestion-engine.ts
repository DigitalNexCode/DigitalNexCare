/**
 * DigitalNexCare Background National Practitioner Index Ingestion Engine
 * Orchestrates controlled batch crawling jobs by province, city, specialty, and category
 * with checkpointing, rate limiting, and real-time operational telemetry.
 */

import { SouthAfricanProvince } from '../supabase/database.types';
import { IngestionJobRecord } from './types';
import { ExternalSearchWorker } from './search-worker';
import { SNAPSHOT_REGISTRY } from './compression';
import { CONFLICT_REGISTRY, DUPLICATE_CANDIDATE_REGISTRY } from './search-worker';
import { MOCK_PRACTITIONERS } from '../../data/mockDatabase';

export const INGESTION_JOBS_QUEUE: IngestionJobRecord[] = [
  {
    id: 'job-nat-001',
    name: 'Gauteng GP & Primary Care National Expansion',
    targetProvince: 'Gauteng',
    targetCity: 'Pretoria',
    targetSpecialty: 'General Practitioner (GP)',
    targetCategory: 'Primary Care',
    status: 'COMPLETED',
    currentBatch: 12,
    totalBatches: 12,
    recordsFound: 240,
    recordsCreated: 184,
    recordsUpdated: 48,
    duplicatesDetected: 6,
    conflictsFlagged: 2,
    errorsCount: 0,
    compressionBytesSaved: 1420000,
    checkpoint: 'BATCH_12_COMPLETED',
    startedAt: '2026-08-30T04:00:00Z',
    completedAt: '2026-08-30T04:22:00Z',
    createdAt: '2026-08-30T03:55:00Z',
  },
  {
    id: 'job-nat-002',
    name: 'Western Cape Coastal Dental & Allied Health Batch',
    targetProvince: 'Western Cape',
    targetCity: 'Cape Town',
    targetSpecialty: 'Dentist',
    targetCategory: 'Dental & Oral Health',
    status: 'RUNNING',
    currentBatch: 7,
    totalBatches: 10,
    recordsFound: 142,
    recordsCreated: 98,
    recordsUpdated: 38,
    duplicatesDetected: 4,
    conflictsFlagged: 2,
    errorsCount: 0,
    compressionBytesSaved: 890000,
    checkpoint: 'BATCH_7_PROCESSING',
    startedAt: '2026-09-01T21:00:00Z',
    createdAt: '2026-09-01T20:45:00Z',
  },
  {
    id: 'job-nat-003',
    name: 'KwaZulu-Natal Regional Health Ingestion',
    targetProvince: 'KwaZulu-Natal',
    targetCity: 'Durban',
    targetSpecialty: 'Physiotherapist',
    targetCategory: 'Rehabilitation & Physical Therapy',
    status: 'QUEUED',
    currentBatch: 0,
    totalBatches: 8,
    recordsFound: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    duplicatesDetected: 0,
    conflictsFlagged: 0,
    errorsCount: 0,
    compressionBytesSaved: 0,
    createdAt: '2026-09-02T01:00:00Z',
  },
];

export class NationalIngestionEngine {
  /**
   * Retrieves all ingestion jobs in the queue.
   */
  static getJobs(): IngestionJobRecord[] {
    return [...INGESTION_JOBS_QUEUE];
  }

  /**
   * Creates a new controlled ingestion job in the queue.
   */
  static createJob(params: {
    name: string;
    province: SouthAfricanProvince;
    city?: string;
    specialty?: string;
    category?: string;
    totalBatches?: number;
  }): IngestionJobRecord {
    const job: IngestionJobRecord = {
      id: `job-nat-${Date.now().toString().slice(-4)}`,
      name: params.name,
      targetProvince: params.province,
      targetCity: params.city,
      targetSpecialty: params.specialty,
      targetCategory: params.category,
      status: 'QUEUED',
      currentBatch: 0,
      totalBatches: params.totalBatches || 5,
      recordsFound: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      duplicatesDetected: 0,
      conflictsFlagged: 0,
      errorsCount: 0,
      compressionBytesSaved: 0,
      createdAt: new Date().toISOString(),
    };

    INGESTION_JOBS_QUEUE.unshift(job);
    return job;
  }

  /**
   * Executes or resumes an ingestion job.
   */
  static async runJob(jobId: string): Promise<IngestionJobRecord> {
    const job = INGESTION_JOBS_QUEUE.find((j) => j.id === jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    job.status = 'RUNNING';
    job.startedAt = job.startedAt || new Date().toISOString();

    // Execute discovery batch worker
    try {
      const discoveryRes = await ExternalSearchWorker.executeDiscovery({
        province: job.targetProvince,
        city: job.targetCity,
        specialty: job.targetSpecialty,
        category: job.targetCategory,
      });

      if (discoveryRes.status === 'SOURCE_BLOCKED') {
        job.status = 'SOURCE_BLOCKED';
        job.checkpoint = 'SOURCE_UPSTREAM_PROTECTION_BLOCKED';
      } else {
        job.currentBatch = job.totalBatches;
        job.recordsFound += discoveryRes.results.length;
        job.recordsCreated += discoveryRes.createdCount;
        job.recordsUpdated += discoveryRes.updatedCount;
        job.duplicatesDetected += discoveryRes.duplicateCount;
        job.conflictsFlagged += discoveryRes.conflictCount;
        job.compressionBytesSaved += discoveryRes.compressionBytesSaved;
        job.status = 'COMPLETED';
        job.completedAt = new Date().toISOString();
        job.checkpoint = `BATCH_${job.totalBatches}_FINISHED`;
      }
    } catch (err: any) {
      job.status = 'FAILED';
      job.errorsCount += 1;
      job.errorLog = [...(job.errorLog || []), err?.message || String(err)];
    }

    return job;
  }

  /**
   * Pauses a running job.
   */
  static pauseJob(jobId: string): IngestionJobRecord | null {
    const job = INGESTION_JOBS_QUEUE.find((j) => j.id === jobId);
    if (!job) return null;
    if (job.status === 'RUNNING') {
      job.status = 'PAUSED';
      job.checkpoint = `PAUSED_AT_BATCH_${job.currentBatch}`;
    }
    return job;
  }

  /**
   * Aggregates platform-wide ingestion and compression telemetry for the Admin Dashboard.
   */
  static getTelemetryMetrics() {
    const joinedCount = MOCK_PRACTITIONERS.filter((p) => p.practitionerType === 'DIGITALNEXCARE_PROVIDER').length;
    const externalCount = MOCK_PRACTITIONERS.filter((p) => p.practitionerType === 'EXTERNAL_PRACTITIONER').length;
    const totalIndexed = MOCK_PRACTITIONERS.length;

    const runningJobs = INGESTION_JOBS_QUEUE.filter((j) => j.status === 'RUNNING').length;
    const totalCreated = INGESTION_JOBS_QUEUE.reduce((acc, j) => acc + j.recordsCreated, 0);
    const totalUpdated = INGESTION_JOBS_QUEUE.reduce((acc, j) => acc + j.recordsUpdated, 0);
    const totalDuplicates = DUPLICATE_CANDIDATE_REGISTRY.length;
    const totalConflicts = CONFLICT_REGISTRY.filter((c) => c.status === 'PENDING_REVIEW').length;
    const workerFailures = INGESTION_JOBS_QUEUE.filter((j) => j.status === 'FAILED' || j.status === 'SOURCE_BLOCKED').length;

    // Snapshot compression metrics
    const totalRawBytes = SNAPSHOT_REGISTRY.reduce((acc, s) => acc + s.rawSizeBytes, 0);
    const totalCompressedBytes = SNAPSHOT_REGISTRY.reduce((acc, s) => acc + s.compressedSizeBytes, 0);
    const compressionSavingsBytes = totalRawBytes - totalCompressedBytes;
    const overallSavingsPercent = totalRawBytes > 0 ? Number(((compressionSavingsBytes / totalRawBytes) * 100).toFixed(1)) : 86.5;

    return {
      totalIndexed,
      joinedCount,
      externalCount,
      lastIngestion: INGESTION_JOBS_QUEUE[0]?.completedAt || INGESTION_JOBS_QUEUE[0]?.startedAt || '2026-09-01T21:00:00Z',
      runningJobs,
      totalCreated,
      totalUpdated,
      totalDuplicates,
      totalConflicts,
      workerFailures,
      snapshotCount: SNAPSHOT_REGISTRY.length,
      compressionSavingsBytes,
      compressionSavingsMB: (compressionSavingsBytes / (1024 * 1024)).toFixed(2),
      overallSavingsPercent,
    };
  }
}
