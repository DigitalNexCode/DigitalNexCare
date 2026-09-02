/**
 * DigitalNexCare Operational Search Cache
 * Prevents redundant external discovery executions for identical fresh searches.
 */

import { Practitioner } from '../../types';
import { DiscoverySearchParams } from './types';

interface CacheEntry {
  key: string;
  results: Practitioner[];
  timestamp: number;
  ttlMs: number;
  hits: number;
}

export class SearchCache {
  private static cache: Map<string, CacheEntry> = new Map();
  private static totalHits = 0;
  private static totalMisses = 0;

  /**
   * Generates a deterministic cache key from search parameters.
   */
  static generateKey(params: DiscoverySearchParams): string {
    const q = (params.query || '').trim().toLowerCase();
    const spec = (params.specialty || '').trim().toLowerCase();
    const prov = (params.province || '').trim().toLowerCase();
    const city = (params.city || '').trim().toLowerCase();
    const suburb = (params.suburb || '').trim().toLowerCase();
    const rad = params.radiusKm || 50;

    return `search_cache:${q}|${spec}|${prov}|${city}|${suburb}|${rad}`;
  }

  /**
   * Retrieves results from the operational search cache if present and unexpired.
   */
  static get(params: DiscoverySearchParams): Practitioner[] | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.totalMisses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key);
      this.totalMisses++;
      return null;
    }

    entry.hits++;
    this.totalHits++;
    return entry.results;
  }

  /**
   * Caches practitioner search results with specified TTL (default 1 hour = 3,600,000 ms).
   */
  static set(params: DiscoverySearchParams, results: Practitioner[], ttlMs = 3600000): void {
    const key = this.generateKey(params);
    this.cache.set(key, {
      key,
      results,
      timestamp: Date.now(),
      ttlMs,
      hits: 0,
    });
  }

  /**
   * Cache metrics for Admin operations center.
   */
  static getStats() {
    return {
      size: this.cache.size,
      hits: this.totalHits,
      misses: this.totalMisses,
      hitRatio: this.totalHits + this.totalMisses > 0
        ? Number((this.totalHits / (this.totalHits + this.totalMisses)).toFixed(2))
        : 0,
    };
  }

  /**
   * Clears the operational cache.
   */
  static clear(): void {
    this.cache.clear();
    this.totalHits = 0;
    this.totalMisses = 0;
  }
}
