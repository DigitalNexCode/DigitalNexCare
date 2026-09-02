/**
 * DigitalNexCare External Discovery Background Refresh Queue
 * Automatically checks result density and freshness.
 * If results are insufficient or stale, triggers non-blocking background refresh.
 */

import { ExternalSearchWorker } from './search-worker';

export interface BackgroundRefreshJob {
  id: string;
  query?: string;
  specialty?: string;
  province?: string;
  city?: string;
  suburb?: string;
  latitude?: number;
  longitude?: number;
  triggeredAt: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  resultCount?: number;
}

export class ExternalDiscoveryRefreshQueue {
  private static jobs: BackgroundRefreshJob[] = [];
  private static isProcessing = false;

  /**
   * Evaluate if a search query warrants a background refresh job
   */
  static evaluateAndEnqueue(params: {
    query?: string;
    specialty?: string;
    province?: string;
    city?: string;
    suburb?: string;
    latitude?: number;
    longitude?: number;
    resultCount: number;
    oldestVerificationDays?: number;
  }): boolean {
    const isDensityLow = params.resultCount < 3;
    const isStale = (params.oldestVerificationDays || 0) > 30;

    if (isDensityLow || isStale) {
      const jobId = `job-refresh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const job: BackgroundRefreshJob = {
        id: jobId,
        query: params.query,
        specialty: params.specialty,
        province: params.province,
        city: params.city,
        suburb: params.suburb,
        latitude: params.latitude,
        longitude: params.longitude,
        triggeredAt: new Date().toISOString(),
        status: 'QUEUED',
      };

      this.jobs.unshift(job);
      if (this.jobs.length > 50) this.jobs.pop();

      // Trigger background worker asynchronously without blocking
      setTimeout(() => this.processNext(), 100);
      return true;
    }

    return false;
  }

  private static async processNext() {
    if (this.isProcessing) return;
    const nextJob = this.jobs.find((j) => j.status === 'QUEUED');
    if (!nextJob) return;

    this.isProcessing = true;
    nextJob.status = 'RUNNING';

    try {
      const res = await ExternalSearchWorker.executeDiscovery({
        query: nextJob.query,
        specialty: nextJob.specialty,
        province: nextJob.province,
        city: nextJob.city,
        suburb: nextJob.suburb,
        latitude: nextJob.latitude,
        longitude: nextJob.longitude,
      });

      nextJob.status = 'COMPLETED';
      nextJob.resultCount = res.results.length;
    } catch (err) {
      console.warn('Background refresh worker failed gracefully', err);
      nextJob.status = 'FAILED';
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }

  static getRecentJobs(): BackgroundRefreshJob[] {
    return [...this.jobs];
  }
}
