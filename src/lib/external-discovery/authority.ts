/**
 * DigitalNexCare Data Authority Hierarchy & Conflict Resolution Engine
 * Enforces field-level authority protection ensuring external crawlers never overwrite
 * provider-confirmed or verified data.
 */

import { DataAuthority } from '../supabase/database.types';
import { DataConflictRecord, NormalizedPractitioner } from './types';
import { Practitioner } from '../../types';

export const DATA_AUTHORITY_RANK: Record<DataAuthority, number> = {
  DIGITALNEXCARE_VERIFIED_PROVIDER: 6,
  PRACTITIONER_CONFIRMED: 5,
  ADMIN_VERIFIED: 4,
  AUTHORITATIVE_PROFESSIONAL_REGISTER: 3,
  PRACTICE_WEBSITE: 2,
  OTHER_APPROVED_EXTERNAL_SOURCE: 1,
};

/**
 * Returns true if incoming data authority is strictly higher than existing authority.
 */
export function isIncomingAuthorityHigher(
  incomingAuthority: DataAuthority,
  existingAuthority: DataAuthority
): boolean {
  const incomingRank = DATA_AUTHORITY_RANK[incomingAuthority] || 1;
  const existingRank = DATA_AUTHORITY_RANK[existingAuthority] || 1;
  return incomingRank > existingRank;
}

/**
 * Evaluates field-by-field updates between existing practitioner and incoming crawler data.
 * Protects provider-confirmed data and generates conflict records when crawler disagrees.
 */
export function evaluateFieldAuthorityUpdates(
  existing: Practitioner,
  incoming: NormalizedPractitioner
): {
  safeUpdates: Record<string, any>;
  conflicts: DataConflictRecord[];
} {
  const safeUpdates: Record<string, any> = {};
  const conflicts: DataConflictRecord[] = [];

  const existingAuthority: DataAuthority = (existing as any).dataAuthority || 'OTHER_APPROVED_EXTERNAL_SOURCE';
  const incomingAuthority: DataAuthority = incoming.dataAuthority || 'OTHER_APPROVED_EXTERNAL_SOURCE';

  const existingPhone = (existing as any).phone || '';
  const incomingPhone = incoming.phone || '';

  // 1. Phone check
  if (incomingPhone && existingPhone && incomingPhone.replace(/\D/g, '') !== existingPhone.replace(/\D/g, '')) {
    if (isIncomingAuthorityHigher(incomingAuthority, existingAuthority)) {
      safeUpdates.phone = incomingPhone;
    } else {
      // Conflict detected! Preserve provider confirmed/verified data and flag conflict
      conflicts.push({
        id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        practitionerId: existing.id,
        practitionerName: 'fullName' in existing ? (existing as any).fullName : incoming.displayName,
        fieldName: 'phone',
        existingValue: existingPhone,
        existingAuthority,
        incomingValue: incomingPhone,
        incomingAuthority,
        sourceType: incoming.sourceType,
        status: 'PENDING_REVIEW',
        flaggedAt: new Date().toISOString(),
      });
    }
  } else if (!existingPhone && incomingPhone) {
    safeUpdates.phone = incomingPhone;
  }

  // 2. Email check
  const existingEmail = (existing as any).email || '';
  const incomingEmail = incoming.email || '';
  if (incomingEmail && existingEmail && incomingEmail.toLowerCase() !== existingEmail.toLowerCase()) {
    if (isIncomingAuthorityHigher(incomingAuthority, existingAuthority)) {
      safeUpdates.email = incomingEmail;
    } else {
      conflicts.push({
        id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        practitionerId: existing.id,
        practitionerName: 'fullName' in existing ? (existing as any).fullName : incoming.displayName,
        fieldName: 'email',
        existingValue: existingEmail,
        existingAuthority,
        incomingValue: incomingEmail,
        incomingAuthority,
        sourceType: incoming.sourceType,
        status: 'PENDING_REVIEW',
        flaggedAt: new Date().toISOString(),
      });
    }
  } else if (!existingEmail && incomingEmail) {
    safeUpdates.email = incomingEmail;
  }

  // 3. Website check
  const existingWebsite = (existing as any).website || '';
  const incomingWebsite = incoming.website || '';
  if (incomingWebsite && !existingWebsite) {
    safeUpdates.website = incomingWebsite;
  }

  // Always update freshness timestamps safely
  safeUpdates.lastDiscoveredAt = new Date().toISOString();
  safeUpdates.lastRefreshedAt = new Date().toISOString();

  return { safeUpdates, conflicts };
}
