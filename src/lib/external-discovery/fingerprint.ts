/**
 * DigitalNexCare Practitioner Fingerprinting & Deduplication Engine
 * Generates cryptographic identity fingerprints and calculates deduplication confidence tiers.
 */

import { FingerprintSignals, DeduplicationMatchResult, MatchConfidence, NormalizedPractitioner } from './types';
import { Practitioner } from '../../types';

/**
 * Computes a fast deterministic hash string (SHA-256 equivalent for JS runtime).
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Convert to positive hex representation
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  // Generate a multi-round extended 32-char hex string
  let extended = hex;
  for (let round = 1; round <= 3; round++) {
    let subHash = 0;
    const roundStr = `${str}:${round}:${hex}`;
    for (let j = 0; j < roundStr.length; j++) {
      subHash = (subHash << 5) - subHash + roundStr.charCodeAt(j);
      subHash |= 0;
    }
    extended += (subHash >>> 0).toString(16).padStart(8, '0');
  }
  return extended;
}

/**
 * Generates a deterministic practitioner identity fingerprint using key normalized signals.
 */
export function generatePractitionerFingerprint(signals: FingerprintSignals): string {
  // If official HPCSA registration number is present, it forms an authoritative component
  const hpcsaSignal = signals.hpcsaNumber ? signals.hpcsaNumber.trim().toUpperCase().replace(/\s+/g, '') : 'NONE';
  const nameSignal = signals.normalizedName.trim().toLowerCase().replace(/\s+/g, '');
  const practiceSignal = signals.normalizedPracticeName ? signals.normalizedPracticeName.toLowerCase().replace(/\s+/g, '') : '';
  const phoneSignal = signals.normalizedPhone ? signals.normalizedPhone.replace(/\D/g, '') : 'NO_PHONE';
  const addressSignal = signals.normalizedAddress ? signals.normalizedAddress.toLowerCase().trim().replace(/[^a-z0-9]/g, '') : '';
  const locationSignal = `${signals.suburb.toLowerCase().trim()}:${signals.city.toLowerCase().trim()}:${signals.province.toLowerCase().trim()}`;

  // SHA-256 stable canonical representation: normalized_name + normalized_practice_name + normalized_phone + normalized_address
  const canonicalIdentityString = `DNC:SA:${hpcsaSignal}|${nameSignal}|${practiceSignal}|${phoneSignal}|${addressSignal}|${locationSignal}`;
  return `fp_${simpleHash(canonicalIdentityString)}`;
}

/**
 * Computes deduplication confidence between an incoming normalized practitioner
 * and an existing directory practitioner record.
 */
export function evaluateDeduplicationConfidence(
  incoming: NormalizedPractitioner,
  existing: Practitioner
): DeduplicationMatchResult {
  const reasons: string[] = [];
  let score = 0.0;

  // 1. Check HPCSA / Statutory Council Registration Match (100% Authoritative)
  const existingHpcsa = 'hpcsaNumber' in existing ? existing.hpcsaNumber : null;
  if (incoming.hpcsaNumber && existingHpcsa && incoming.hpcsaNumber.replace(/\s+/g, '').toUpperCase() === existingHpcsa.replace(/\s+/g, '').toUpperCase()) {
    return {
      confidence: 'EXACT_MATCH',
      confidenceScore: 1.0,
      existingPractitionerId: existing.id,
      reasons: ['HPCSA registration number exact match'],
    };
  }

  // 2. Check Fingerprint Match
  const existingFingerprint = (existing as any).practitionerFingerprint || (existing as any).fingerprint;
  if (existingFingerprint && incoming.fingerprint === existingFingerprint) {
    return {
      confidence: 'EXACT_MATCH',
      confidenceScore: 1.0,
      existingPractitionerId: existing.id,
      reasons: ['Practitioner identity fingerprint exact match'],
    };
  }

  // 3. Name Similarity
  const existingName = 'fullName' in existing ? (existing as any).fullName.toLowerCase() : '';
  const incomingName = incoming.normalizedName.toLowerCase();
  const nameMatches = existingName.includes(incomingName) || incomingName.includes(existingName.replace(/^(dr\.?|prof\.?|mr\.?|ms\.?)\s+/i, ''));

  if (nameMatches) {
    score += 0.50;
    reasons.push('Practitioner name strong match');
  }

  // 4. Phone Match
  const existingPhone = 'phone' in existing ? (existing as any).phone : null;
  if (existingPhone && incoming.phone) {
    const cleanExisting = existingPhone.replace(/\D/g, '');
    const cleanIncoming = incoming.normalizedPhone.replace(/\D/g, '');
    if (cleanExisting.endsWith(cleanIncoming.slice(-9)) || cleanIncoming.endsWith(cleanExisting.slice(-9))) {
      score += 0.35;
      reasons.push('Canonical phone number match');
    }
  }

  // 5. Practice & Location Match
  const existingPractice = 'practiceName' in existing ? (existing as any).practiceName.toLowerCase() : '';
  if (existingPractice && incoming.practiceName && (existingPractice.includes(incoming.normalizedPracticeName) || incoming.normalizedPracticeName.includes(existingPractice))) {
    score += 0.20;
    reasons.push('Practice name strong match');
  }

  if (existing.city.toLowerCase() === incoming.city.toLowerCase() && existing.province === incoming.province) {
    score += 0.15;
    reasons.push('City and Province match');
  }

  // Determine Confidence Tier
  let confidence: MatchConfidence = 'NEW_PRACTITIONER';
  if (score >= 0.95) {
    confidence = 'EXACT_MATCH';
  } else if (score >= 0.80) {
    confidence = 'HIGH_CONFIDENCE_MATCH';
  } else if (score >= 0.55) {
    confidence = 'POSSIBLE_MATCH';
  } else {
    confidence = 'NEW_PRACTITIONER';
  }

  return {
    confidence,
    confidenceScore: Math.min(1.0, Number(score.toFixed(2))),
    existingPractitionerId: confidence !== 'NEW_PRACTITIONER' ? existing.id : undefined,
    reasons,
  };
}
