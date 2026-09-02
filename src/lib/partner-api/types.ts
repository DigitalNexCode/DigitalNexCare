/**
 * DigitalNexCare Partner Integration API Specifications
 * RESTful & JSON-RPC schema for external enterprise partners, insurers, and clinical portals.
 */

export interface PartnerApiAuth {
  apiKey: string;
  partnerId: string;
  partnerName: string;
  tier: 'ENTERPRISE' | 'MEDICAL_SCHEME' | 'PRACTICE_NETWORK';
  rateLimitPerMinute: number;
}

export interface PartnerProviderSearchRequest {
  query?: string;
  specialty?: string;
  province?: string;
  city?: string;
  suburb?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  medicalAid?: string;
  verifiedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface PartnerProviderProfileResponse {
  id: string;
  slug: string;
  fullName: string;
  title: string;
  specialty: string;
  subSpecialties: string[];
  services: string[];
  practiceName: string;
  province: string;
  city: string;
  suburb: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  rating: number;
  reviewCount: number;
  languages: string[];
  acceptedMedicalAids: string[];
  offersVirtual: boolean;
  offersInPerson: boolean;
  hpcsaNumber?: string;
  verificationStatus: string;
  consultationFeeZAR?: number;
  availableSlotCount: number;
}

export interface PartnerAvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  mode: 'IN_PERSON' | 'VIRTUAL' | 'HOME_VISIT';
  priceZAR: number;
  isAvailable: boolean;
}

export interface PartnerCreateBookingRequest {
  idempotencyKey: string;
  providerId: string;
  slotId: string;
  patient: {
    fullName: string;
    idNumberOrDOB: string;
    email: string;
    phone: string;
    medicalAid?: {
      schemeName: string;
      membershipNumber: string;
      dependantCode: string;
    };
  };
  reason: string;
  consultationType: 'IN_PERSON' | 'VIRTUAL' | 'HOME_VISIT';
  callbackWebhookUrl?: string;
}

export interface PartnerBookingRecord {
  bookingId: string;
  providerId: string;
  providerName: string;
  practiceName: string;
  patientName: string;
  patientEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'HELD' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED';
  consultationType: 'IN_PERSON' | 'VIRTUAL' | 'HOME_VISIT';
  address: string;
  referenceNumber: string;
  createdAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}
