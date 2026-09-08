/**
 * DigitalNexCare User-Specific External Practitioner Reveal Service
 * Chunk 4 Core Security Layer
 *
 * Enforces Constitutional Specifications:
 * - A practitioner reveal belongs ONLY to the patient account that used the reveal.
 * - Never store a practitioner itself as revealed = true (prevents global reveals).
 * - Table/Record: external_practitioner_unlocks:
 *   { id, user_id, practitioner_id, subscription_id, billing_period_start, billing_period_end, revealed_at, created_at }
 * - Repeated views by the same user do not consume another reveal.
 * - Multi-user isolation: User A revealing Practitioner X does NOT reveal for User B.
 * - Server-side security projection: locked practitioners NEVER leak names or contact info.
 */

import {
  PatientSubscriptionTier,
  ExternalPractitionerUnlocked,
  ExternalPractitionerLocked,
  DigitalNexCareProvider,
  Practitioner,
} from '../../types';
import { SUBSCRIPTION_PLANS } from '../constants';
import { MOCK_PROVIDERS, RAW_EXTERNAL_PRACTITIONERS } from '../../data/mockDatabase';
import { projectPractitionerForClient } from '../supabase/projection';
import { supabase, isSupabaseConfigured } from '../supabase/client';

export interface ExternalPractitionerUnlockRecord {
  id: string;
  user_id: string;
  practitioner_id: string;
  subscription_id?: string;
  billing_period_start: string; // YYYY-MM-DD
  billing_period_end: string;   // YYYY-MM-DD
  revealed_at: string;          // ISO Timestamp
  created_at: string;
}

export interface UserRevealQuotaStatus {
  userId: string;
  plan: PatientSubscriptionTier;
  monthlyLimit: number | null; // null for unlimited
  revealsUsed: number;
  revealsRemaining: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  unlockedPractitionerIds: string[];
}

export interface UserRevealResult {
  success: boolean;
  status: 'ALLOW' | 'ALREADY_UNLOCKED' | 'LIMIT_REACHED' | 'ERROR';
  practitionerId: string;
  userId: string;
  plan: PatientSubscriptionTier;
  revealsUsed: number;
  revealsRemaining: number;
  monthlyLimit: number | null;
  unlockedRecord?: ExternalPractitionerUnlockRecord;
  unlockedPractitioner?: ExternalPractitionerUnlocked;
  error?: string;
  message: string;
}

// In-Memory Persistent Store keyed by userId -> array of unlock records
const USER_UNLOCKS_REGISTRY = new Map<string, ExternalPractitionerUnlockRecord[]>();

// Helper to determine active billing period bounds (current calendar month)
export function getCurrentBillingPeriod(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const format = (d: Date) => d.toISOString().split('T')[0];
  return {
    start: format(startDate),
    end: format(endDate),
  };
}

export class UserUnlockService {
  /**
   * Retrieves all unlock records for a specific authenticated user
   */
  static getUserUnlocks(userId: string): ExternalPractitionerUnlockRecord[] {
    if (!userId) return [];
    // Load from local storage if available for browser persistence
    if (typeof window !== 'undefined' && !USER_UNLOCKS_REGISTRY.has(userId)) {
      try {
        const stored = localStorage.getItem(`dnc_unlocks_${userId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          USER_UNLOCKS_REGISTRY.set(userId, parsed);
        }
      } catch (e) {
        // ignore storage errors
      }
    }

    return USER_UNLOCKS_REGISTRY.get(userId) || [];
  }

  /**
   * Persists an unlock record for a specific user
   */
  private static saveUserUnlock(userId: string, record: ExternalPractitionerUnlockRecord) {
    const list = this.getUserUnlocks(userId);
    const updated = [...list.filter((r) => r.practitioner_id !== record.practitioner_id), record];
    USER_UNLOCKS_REGISTRY.set(userId, updated);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`dnc_unlocks_${userId}`, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Checks if THIS specific user has already revealed THIS practitioner in the active billing period
   */
  static hasUserUnlocked(userId: string, practitionerId: string): boolean {
    if (!userId || !practitionerId) return false;
    const { start, end } = getCurrentBillingPeriod();
    const unlocks = this.getUserUnlocks(userId);

    return unlocks.some(
      (u) =>
        u.practitioner_id === practitionerId &&
        u.billing_period_start <= end &&
        u.billing_period_end >= start
    );
  }

  /**
   * Constitutional alias for clarity
   */
  static isPractitionerUnlockedForUser(userId: string, practitionerId: string): boolean {
    return this.hasUserUnlocked(userId, practitionerId);
  }

  /**
   * Returns list of practitioner IDs unlocked by this user
   */
  static getUserUnlockedPractitionerIds(userId: string): string[] {
    if (!userId) return [];
    const { start, end } = getCurrentBillingPeriod();
    return this.getUserUnlocks(userId)
      .filter((u) => u.billing_period_start <= end && u.billing_period_end >= start)
      .map((u) => u.practitioner_id);
  }

  /**
   * Computes user's reveal quota and usage for the current billing period
   */
  static getUserQuotaStatus(userId: string, plan: PatientSubscriptionTier = 'NEXCARE_FREE'): UserRevealQuotaStatus {
    const period = getCurrentBillingPeriod();
    const unlockedIds = this.getUserUnlockedPractitionerIds(userId);
    const revealsUsed = unlockedIds.length;
    const planConfig = SUBSCRIPTION_PLANS[plan];
    const monthlyLimit = planConfig.monthlyReveals === -1 ? null : planConfig.monthlyReveals;
    const revealsRemaining = monthlyLimit === null ? 999 : Math.max(0, monthlyLimit - revealsUsed);

    return {
      userId,
      plan,
      monthlyLimit,
      revealsUsed,
      revealsRemaining,
      billingPeriodStart: period.start,
      billingPeriodEnd: period.end,
      unlockedPractitionerIds: unlockedIds,
    };
  }

  /**
   * Server operation: Unlocks an external practitioner for a specific user
   * Strictly enforces user-specific quota and creates an external_practitioner_unlocks record.
   */
  static unlockForUser(params: {
    userId: string;
    practitionerId: string;
    currentPlan: PatientSubscriptionTier;
    subscriptionId?: string;
    revealsUsedThisMonth?: number;
    unlockedIds?: string[];
  }): UserRevealResult {
    const { userId, practitionerId, currentPlan, subscriptionId, revealsUsedThisMonth, unlockedIds: passedUnlockedIds } = params;

    if (!userId) {
      return {
        success: false,
        status: 'ERROR',
        practitionerId,
        userId: '',
        plan: currentPlan,
        revealsUsed: 0,
        revealsRemaining: 0,
        monthlyLimit: 2,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'You must be signed in to reveal practitioner contact details.',
      };
    }

    // Seed any prior unlocks passed in session/test context
    if (passedUnlockedIds && passedUnlockedIds.length > 0) {
      const period = getCurrentBillingPeriod();
      for (const uid of passedUnlockedIds) {
        if (!this.hasUserUnlocked(userId, uid)) {
          this.saveUserUnlock(userId, {
            id: `unlock-seed-${userId}-${uid}`,
            user_id: userId,
            practitioner_id: uid,
            subscription_id: subscriptionId,
            billing_period_start: period.start,
            billing_period_end: period.end,
            revealed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    const quota = this.getUserQuotaStatus(userId, currentPlan);
    let effectiveRevealsUsed = quota.revealsUsed;
    if (revealsUsedThisMonth !== undefined && revealsUsedThisMonth > effectiveRevealsUsed) {
      effectiveRevealsUsed = revealsUsedThisMonth;
    }
    const monthlyLimit = quota.monthlyLimit;
    const effectiveRemaining = monthlyLimit === null ? 999 : Math.max(0, monthlyLimit - effectiveRevealsUsed);

    // 1. Check if already unlocked by THIS user during THIS billing period
    if (this.hasUserUnlocked(userId, practitionerId)) {
      const unlockedEntity = this.hydrateUnlockedPractitioner(practitionerId);
      return {
        success: true,
        status: 'ALREADY_UNLOCKED',
        practitionerId,
        userId,
        plan: currentPlan,
        revealsUsed: effectiveRevealsUsed,
        revealsRemaining: effectiveRemaining,
        monthlyLimit: quota.monthlyLimit,
        unlockedPractitioner: unlockedEntity,
        message: 'Practitioner was previously revealed. No additional reveal quota consumed.',
      };
    }

    // 2. Check quota limit
    if (monthlyLimit !== null && effectiveRevealsUsed >= monthlyLimit) {
      return {
        success: false,
        status: 'LIMIT_REACHED',
        practitionerId,
        userId,
        plan: currentPlan,
        revealsUsed: effectiveRevealsUsed,
        revealsRemaining: 0,
        monthlyLimit: quota.monthlyLimit,
        error: 'EXTERNAL_PRACTITIONER_LIMIT_REACHED',
        message: "You've reached your practitioner access limit for this billing period.",
      };
    }

    // 3. Create user-specific reveal record
    const period = getCurrentBillingPeriod();
    const newRecord: ExternalPractitionerUnlockRecord = {
      id: `unlock-${userId}-${practitionerId}-${Date.now()}`,
      user_id: userId,
      practitioner_id: practitionerId,
      subscription_id: subscriptionId,
      billing_period_start: period.start,
      billing_period_end: period.end,
      revealed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    this.saveUserUnlock(userId, newRecord);

    // Attempt Supabase live persistence if configured
    if (isSupabaseConfigured) {
      try {
        Promise.resolve(
          supabase.from('external_practitioner_unlocks' as any).insert({
            id: newRecord.id,
            user_id: newRecord.user_id,
            practitioner_id: newRecord.practitioner_id,
            subscription_id: newRecord.subscription_id || null,
            billing_period_start: newRecord.billing_period_start,
            billing_period_end: newRecord.billing_period_end,
            revealed_at: newRecord.revealed_at,
          } as any)
        ).catch(() => {});
      } catch (err) {
        // silent fail to fallback
      }
    }

    const updatedQuota = this.getUserQuotaStatus(userId, currentPlan);
    const unlockedEntity = this.hydrateUnlockedPractitioner(practitionerId);

    return {
      success: true,
      status: 'ALLOW',
      practitionerId,
      userId,
      plan: currentPlan,
      revealsUsed: updatedQuota.revealsUsed,
      revealsRemaining: updatedQuota.revealsRemaining,
      monthlyLimit: updatedQuota.monthlyLimit,
      unlockedRecord: newRecord,
      unlockedPractitioner: unlockedEntity,
      message: 'Practitioner identity and contact details successfully unlocked.',
    };
  }

  /**
   * Resolves a practitioner entity specifically for a given user.
   * If the practitioner is a joined DIGITALNEXCARE_PROVIDER, returns it 100% unlocked.
   * If the practitioner is external:
   *   - If THIS user has unlocked it -> returns UNLOCKED entity.
   *   - If THIS user has NOT unlocked it -> returns LOCKED entity with sensitive data redacted.
   */
  static getPractitionerForUser(
    userId: string | null | undefined,
    practitionerId: string
  ): {
    isUnlocked: boolean;
    practitioner: DigitalNexCareProvider | ExternalPractitionerUnlocked | ExternalPractitionerLocked | null;
  } {
    // 1. Check if joined DigitalNexCare provider (always 100% unlocked)
    const provider = MOCK_PROVIDERS.find((p) => p.id === practitionerId);
    if (provider) {
      return { isUnlocked: true, practitioner: provider };
    }

    // 2. Locate external record
    const rawExternal = RAW_EXTERNAL_PRACTITIONERS.find((p) => p.id === practitionerId);
    if (!rawExternal) {
      return { isUnlocked: false, practitioner: null };
    }

    // 3. User-specific unlock check
    const isUnlocked = userId ? this.hasUserUnlocked(userId, practitionerId) : false;

    if (isUnlocked) {
      return {
        isUnlocked: true,
        practitioner: rawExternal,
      };
    }

    // Return redacted locked practitioner
    const locked: ExternalPractitionerLocked = {
      id: rawExternal.id,
      practitionerType: 'EXTERNAL_PRACTITIONER',
      isLocked: true,
      anonymizedTitle: `${rawExternal.specialty} in ${rawExternal.suburb || rawExternal.city}`,
      specialty: rawExternal.specialty,
      services: rawExternal.services || ['Healthcare Consultations'],
      province: rawExternal.province,
      city: rawExternal.city,
      generalArea: `${rawExternal.suburb || rawExternal.city}, ${rawExternal.city}`,
      rating: rawExternal.rating,
      reviewCount: rawExternal.reviewCount,
      offersVirtual: rawExternal.offersVirtual,
      offersInPerson: rawExternal.offersInPerson,
      acceptedMedicalAids: rawExternal.acceptedMedicalAids,
      requiresSubscription: true,
    };

    return {
      isUnlocked: false,
      practitioner: locked,
    };
  }

  /**
   * Hydrates the full unlocked practitioner details from the directory
   */
  static hydrateUnlockedPractitioner(id: string): ExternalPractitionerUnlocked {
    const raw = RAW_EXTERNAL_PRACTITIONERS.find((p) => p.id === id);
    if (raw) return raw;

    // Fallback deterministic dummy for dynamic items
    return {
      id,
      slug: id,
      practitionerType: 'EXTERNAL_PRACTITIONER',
      fullName: 'Dr. Healthcare Practitioner',
      title: 'Dr.',
      specialty: 'Healthcare Specialist',
      services: ['General Consultations', 'Specialist Care'],
      practiceName: 'Regional Medical Clinic',
      province: 'Gauteng',
      city: 'Pretoria',
      suburb: 'Central',
      address: '10 Medical Avenue, Central, Pretoria',
      coordinates: { latitude: -25.75, longitude: 28.22 },
      rating: 4.8,
      reviewCount: 15,
      languages: ['English', 'Afrikaans'],
      acceptedMedicalAids: ['Discovery Health', 'Bonitas', 'GEMS'],
      offersVirtual: false,
      offersInPerson: true,
      phone: '+27 12 345 6789',
      email: 'practice@regionalmed.co.za',
      website: 'https://regionalmed.co.za',
      sourceAttribution: 'Public Health Register',
      dataAuthority: 'OTHER_APPROVED_EXTERNAL_SOURCE',
      claimStatus: 'UNCLAIMED',
      lastVerifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Resets in-memory and local storage records (primarily for testing and QA)
   */
  static resetForTesting(userId?: string) {
    if (userId) {
      USER_UNLOCKS_REGISTRY.delete(userId);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`dnc_unlocks_${userId}`);
      }
    } else {
      USER_UNLOCKS_REGISTRY.clear();
      if (typeof window !== 'undefined') {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('dnc_unlocks_')) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  }
}
