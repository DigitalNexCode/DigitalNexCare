/**
 * DigitalNexCare Server-Side Projection & Security Redaction Engine
 * Permanent Constitution - Chunks 0 & 2
 *
 * Enforces strict redaction of external practitioner identities when locked.
 * Ensures protected fields are never leaked to frontend payloads.
 */

import {
  Practitioner,
  ExternalPractitionerLocked,
  ExternalPractitionerUnlocked,
  DigitalNexCareProvider,
  SouthAfricanProvince,
  PatientSubscriptionTier,
} from '../../types';

export interface UnlockedPractitionerEntity {
  id: string;
  display_name: string;
  title?: string | null;
  practice_name?: string | null;
  specialty: string;
  sub_specialties?: string[];
  services: string[];
  province: SouthAfricanProvince;
  city: string;
  suburb: string;
  address_line?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  public_phone?: string | null;
  public_email?: string | null;
  website?: string | null;
  practitioner_type: 'DIGITALNEXCARE_PROVIDER' | 'EXTERNAL_PRACTITIONER';
  is_joined: boolean;
  is_bookable: boolean;
  rating: number;
  review_count: number;
  offers_virtual: boolean;
  offers_in_person: boolean;
  accepted_medical_aids?: string[];
  source_attribution?: string | null;
  claim_status?: string;
  verification_status?: string;
  consultation_fee_cents?: number;
  available_slots?: any[];
  reviews?: any[];
  hpcsa_number?: string;
  sanc_number?: string;
  bio?: string;
  experience_years?: number;
}

/**
 * Transforms an internal directory record into a secure, projected representation
 * based on whether the patient has unlocked the practitioner in their billing cycle.
 */
export function projectPractitionerForClient(
  record: UnlockedPractitionerEntity,
  isUnlocked: boolean
): Practitioner {
  // 1. DigitalNexCare Verified Providers are ALWAYS unlocked (Direct booking is free for all patients)
  if (record.is_joined || record.practitioner_type === 'DIGITALNEXCARE_PROVIDER') {
    const provider: DigitalNexCareProvider = {
      id: record.id,
      slug: record.id,
      practitionerType: 'DIGITALNEXCARE_PROVIDER',
      fullName: record.display_name,
      title: record.title || 'Dr.',
      specialty: record.specialty,
      subSpecialties: record.sub_specialties || [],
      services: record.services || [],
      practiceName: record.practice_name || 'Private Practice',
      province: record.province,
      city: record.city,
      suburb: record.suburb,
      address: record.address_line || `${record.suburb}, ${record.city}`,
      coordinates: {
        latitude: record.latitude || -26.2041,
        longitude: record.longitude || 28.0473,
      },
      rating: record.rating || 5.0,
      reviewCount: record.review_count || 0,
      languages: ['English', 'Afrikaans'],
      acceptedMedicalAids: record.accepted_medical_aids || [
        'Discovery Health',
        'GEMS',
        'Bonitas',
      ],
      offersVirtual: Boolean(record.offers_virtual),
      offersInPerson: Boolean(record.offers_in_person),
      dataAuthority: 'DIGITALNEXCARE_VERIFIED_PROVIDER',
      lastVerifiedAt: new Date().toISOString(),
      photoUrl:
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      verificationStatus: (record.verification_status as any) || 'VERIFIED',
      claimStatus: (record.claim_status as any) || 'CLAIMED',
      bio: record.bio || 'Verified South African healthcare provider.',
      experienceYears: record.experience_years || 8,
      consultationFeeZAR: record.consultation_fee_cents ? Math.round(record.consultation_fee_cents / 100) : 650,
      availableSlots: record.available_slots || [],
      reviews: record.reviews || [],
      phone: record.public_phone || '',
      email: record.public_email || '',
      website: record.website || '',
    };
    return provider;
  }

  // 2. Unlocked External Practitioner (Reveal used or covered by plan)
  if (isUnlocked) {
    const unlocked: ExternalPractitionerUnlocked = {
      id: record.id,
      slug: record.id,
      practitionerType: 'EXTERNAL_PRACTITIONER',
      fullName: record.display_name,
      title: record.title || 'Dr.',
      specialty: record.specialty,
      subSpecialties: record.sub_specialties || [],
      services: record.services || [],
      practiceName: record.practice_name || 'Private Practice',
      province: record.province,
      city: record.city,
      suburb: record.suburb,
      address: record.address_line || `${record.suburb}, ${record.city}`,
      coordinates: {
        latitude: record.latitude || -26.2041,
        longitude: record.longitude || 28.0473,
      },
      rating: record.rating || 4.5,
      reviewCount: record.review_count || 0,
      languages: ['English', 'Afrikaans'],
      acceptedMedicalAids: record.accepted_medical_aids || [
        'Discovery Health',
        'Bonitas',
      ],
      offersVirtual: Boolean(record.offers_virtual),
      offersInPerson: Boolean(record.offers_in_person),
      dataAuthority: 'OTHER_APPROVED_EXTERNAL_SOURCE',
      lastVerifiedAt: new Date().toISOString(),
      phone: record.public_phone || '',
      email: record.public_email || '',
      website: record.website || '',
      sourceAttribution: record.source_attribution || 'DigitalNexCare National Index',
      claimStatus: (record.claim_status as any) || 'UNCLAIMED',
    };
    return unlocked;
  }

  // 3. STRICT LOCKED EXTERNAL PRACTITIONER PROJECTION
  // Withhold: display_name, practice_name, public_phone, public_email, website, full address, exact GPS
  const locked: ExternalPractitionerLocked = {
    id: record.id,
    practitionerType: 'EXTERNAL_PRACTITIONER',
    isLocked: true,
    anonymizedTitle: `${record.specialty || 'Healthcare Practitioner'} in ${record.suburb}`,
    specialty: record.specialty,
    services: record.services || [],
    province: record.province,
    city: record.city,
    generalArea: `${record.suburb}, ${record.city}`,
    approximateDistanceKm: 3.2,
    rating: record.rating || 4.5,
    reviewCount: record.review_count || 0,
    offersVirtual: Boolean(record.offers_virtual),
    offersInPerson: Boolean(record.offers_in_person),
    acceptedMedicalAids: record.accepted_medical_aids || [
      'Discovery Health',
      'Bonitas',
    ],
    requiresSubscription: true,
  };

  return locked;
}

/**
 * Validates subscription quota rules in accordance with Constitution specifications.
 */
export function getPlanRevealLimit(plan: PatientSubscriptionTier): number | null {
  switch (plan) {
    case 'NEXCARE_FREE':
      return 2; // Freemium limit = 2
    case 'NEXCARE_ACCESS':
      return 5; // Access limit = 5
    case 'NEXCARE_PLUS':
      return 20; // Plus limit = 20
    case 'NEXCARE_FAMILY':
      return null; // Unlimited reasonable use
    default:
      return 2;
  }
}
