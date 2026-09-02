/**
 * DigitalNexCare Base External Practitioner Provider
 * Implements strict compliance rules: No CAPTCHA solving, no anti-bot bypass,
 * no stealth fingerprint evasion, no authentication bypass.
 * Graceful SOURCE_BLOCKED handling on upstream resistance.
 */

import { DataAuthority } from '../../supabase/database.types';
import {
  ExternalPractitionerProvider,
  DiscoveryResult,
  LocationFilter,
  RawExternalPractitioner,
  NormalizedPractitioner,
} from '../types';
import { normalizeRawPractitioner } from '../normalizer';

export abstract class BaseExternalPractitionerProvider implements ExternalPractitionerProvider {
  abstract providerId: string;
  abstract providerName: string;
  abstract sourceAttribution: string;
  abstract defaultAuthority: DataAuthority;

  /**
   * Safe rate-limiting throttle between discovery calls.
   */
  protected async throttle(ms = 150): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Evaluates if source response indicates technical access blockage.
   * NEVER bypasses or evades; returns standardized SOURCE_BLOCKED.
   */
  protected handlePotentialBlock(error: any): DiscoveryResult {
    const errorMsg = error?.message || String(error);
    const isBlocked =
      errorMsg.includes('403') ||
      errorMsg.includes('429') ||
      errorMsg.includes('CAPTCHA') ||
      errorMsg.includes('Cloudflare') ||
      errorMsg.includes('bot');

    if (isBlocked) {
      return {
        status: 'SOURCE_BLOCKED',
        source: this.providerName,
        foundCount: 0,
        normalizedPractitioners: [],
        errorMessage: 'Source upstream technical protection encountered. Request failed gracefully without evasion.',
        durationMs: 0,
      };
    }

    return {
      status: 'ERROR',
      source: this.providerName,
      foundCount: 0,
      normalizedPractitioners: [],
      errorMessage: errorMsg,
      durationMs: 0,
    };
  }

  abstract searchByName(name: string, location?: LocationFilter): Promise<DiscoveryResult>;
  abstract searchByCategory(categoryOrSpecialty: string, location?: LocationFilter): Promise<DiscoveryResult>;
  abstract searchByLocation(location: LocationFilter): Promise<DiscoveryResult>;
  abstract searchNearby(latitude: number, longitude: number, radiusKm: number): Promise<DiscoveryResult>;
  abstract getDetails(sourceId: string): Promise<RawExternalPractitioner | null>;

  normalizeResult(raw: RawExternalPractitioner): NormalizedPractitioner {
    const normalized = normalizeRawPractitioner(raw);
    normalized.dataAuthority = this.defaultAuthority;
    normalized.sourceAttribution = this.sourceAttribution;
    return normalized;
  }

  async refreshPractitioner(id: string): Promise<NormalizedPractitioner | null> {
    const raw = await this.getDetails(id);
    if (!raw) return null;
    return this.normalizeResult(raw);
  }
}
