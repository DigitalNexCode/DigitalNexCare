/**
 * DigitalNexCare Partner API Execution Service
 * Production-ready mock and server execution layer for partner endpoints.
 */

import { MOCK_PROVIDERS } from '../../data/mockDatabase';
import {
  PartnerApiAuth,
  PartnerProviderSearchRequest,
  PartnerProviderProfileResponse,
  PartnerAvailabilitySlot,
  PartnerCreateBookingRequest,
  PartnerBookingRecord,
} from './types';
import { calculateDistanceKm } from '../geo';

export class PartnerApiService {
  private static demoBookings: Map<string, PartnerBookingRecord> = new Map();
  private static idempotencyStore: Map<string, PartnerBookingRecord> = new Map();

  // Valid test demo API keys
  private static validKeys: Record<string, PartnerApiAuth> = {
    'dnc_live_medscheme_9921a8b': {
      apiKey: 'dnc_live_medscheme_9921a8b',
      partnerId: 'partner-discovery-health-za',
      partnerName: 'Discovery Health Integrated Partner',
      tier: 'MEDICAL_SCHEME',
      rateLimitPerMinute: 600,
    },
    'dnc_test_sandbox_4490ef1': {
      apiKey: 'dnc_test_sandbox_4490ef1',
      partnerId: 'partner-sandbox-developer',
      partnerName: 'Developer Sandbox Partner',
      tier: 'ENTERPRISE',
      rateLimitPerMinute: 120,
    },
  };

  /**
   * Validate Partner API Token
   */
  static validateToken(authHeader?: string): { valid: boolean; partner?: PartnerApiAuth; error?: string } {
    if (!authHeader) {
      return { valid: false, error: 'Missing Authorization header. Use Bearer <API_KEY>' };
    }
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const partner = this.validKeys[token];
    if (!partner) {
      return { valid: false, error: 'Invalid or expired API Key' };
    }
    return { valid: true, partner };
  }

  /**
   * GET /api/v1/partner/providers/search
   */
  static async searchProviders(
    authHeader: string,
    params: PartnerProviderSearchRequest
  ): Promise<{ data: PartnerProviderProfileResponse[]; total: number; error?: string }> {
    const auth = this.validateToken(authHeader);
    if (!auth.valid) return { data: [], total: 0, error: auth.error };

    let results = MOCK_PROVIDERS.filter((p) => {
      if (params.query) {
        const q = params.query.toLowerCase();
        const matches =
          p.fullName.toLowerCase().includes(q) ||
          p.practiceName.toLowerCase().includes(q) ||
          p.specialty.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.suburb.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (params.specialty && !p.specialty.toLowerCase().includes(params.specialty.toLowerCase())) {
        return false;
      }
      if (params.province && p.province !== params.province) {
        return false;
      }
      if (params.city && p.city.toLowerCase() !== params.city.toLowerCase()) {
        return false;
      }
      if (params.medicalAid && p.acceptedMedicalAids && !p.acceptedMedicalAids.includes(params.medicalAid)) {
        return false;
      }
      if (params.verifiedOnly && p.verificationStatus !== 'VERIFIED') {
        return false;
      }
      return true;
    });

    // Distance filtering if user coordinates provided
    if (params.latitude && params.longitude && params.radiusKm) {
      results = results.filter((p) => {
        if (!p.coordinates) return false;
        const d = calculateDistanceKm(params.latitude!, params.longitude!, p.coordinates.latitude, p.coordinates.longitude);
        return d <= params.radiusKm!;
      });
    }

    const projected: PartnerProviderProfileResponse[] = results.map((p) => ({
      id: p.id,
      slug: p.slug,
      fullName: p.fullName,
      title: p.title,
      specialty: p.specialty,
      subSpecialties: p.subSpecialties || [],
      services: p.services || [],
      practiceName: p.practiceName,
      province: p.province,
      city: p.city,
      suburb: p.suburb,
      address: p.address,
      coordinates: p.coordinates,
      rating: p.rating,
      reviewCount: p.reviewCount,
      languages: p.languages,
      acceptedMedicalAids: p.acceptedMedicalAids,
      offersVirtual: p.offersVirtual,
      offersInPerson: p.offersInPerson,
      hpcsaNumber: p.hpcsaNumber,
      verificationStatus: p.verificationStatus,
      consultationFeeZAR: p.consultationFeeZAR,
      availableSlotCount: (p.availableSlots || []).filter((s) => s.isAvailable).length,
    }));

    const offset = params.offset || 0;
    const limit = params.limit || 20;

    return {
      data: projected.slice(offset, offset + limit),
      total: projected.length,
    };
  }

  /**
   * GET /api/v1/partner/providers/:id
   */
  static async getProviderProfile(
    authHeader: string,
    providerId: string
  ): Promise<{ data?: PartnerProviderProfileResponse; error?: string }> {
    const auth = this.validateToken(authHeader);
    if (!auth.valid) return { error: auth.error };

    const p = MOCK_PROVIDERS.find((prov) => prov.id === providerId || prov.slug === providerId);
    if (!p) return { error: `Provider '${providerId}' not found` };

    return {
      data: {
        id: p.id,
        slug: p.slug,
        fullName: p.fullName,
        title: p.title,
        specialty: p.specialty,
        subSpecialties: p.subSpecialties || [],
        services: p.services || [],
        practiceName: p.practiceName,
        province: p.province,
        city: p.city,
        suburb: p.suburb,
        address: p.address,
        coordinates: p.coordinates,
        rating: p.rating,
        reviewCount: p.reviewCount,
        languages: p.languages,
        acceptedMedicalAids: p.acceptedMedicalAids,
        offersVirtual: p.offersVirtual,
        offersInPerson: p.offersInPerson,
        hpcsaNumber: p.hpcsaNumber,
        verificationStatus: p.verificationStatus,
        consultationFeeZAR: p.consultationFeeZAR,
        availableSlotCount: (p.availableSlots || []).filter((s) => s.isAvailable).length,
      },
    };
  }

  /**
   * GET /api/v1/partner/availability/:providerId
   */
  static async getAvailability(
    authHeader: string,
    providerId: string
  ): Promise<{ data?: PartnerAvailabilitySlot[]; error?: string }> {
    const auth = this.validateToken(authHeader);
    if (!auth.valid) return { error: auth.error };

    const p = MOCK_PROVIDERS.find((prov) => prov.id === providerId || prov.slug === providerId);
    if (!p) return { error: `Provider '${providerId}' not found` };

    return {
      data: (p.availableSlots || []).map((s) => ({
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        mode: s.mode,
        priceZAR: s.priceZAR ?? p.consultationFeeZAR ?? 650,
        isAvailable: s.isAvailable,
      })),
    };
  }

  /**
   * POST /api/v1/partner/bookings
   */
  static async createBooking(
    authHeader: string,
    body: PartnerCreateBookingRequest
  ): Promise<{ data?: PartnerBookingRecord; error?: string }> {
    const auth = this.validateToken(authHeader);
    if (!auth.valid) return { error: auth.error };

    if (!body.idempotencyKey) {
      return { error: 'Missing required parameter: idempotencyKey' };
    }

    // Idempotency check
    if (this.idempotencyStore.has(body.idempotencyKey)) {
      return { data: this.idempotencyStore.get(body.idempotencyKey) };
    }

    const provider = MOCK_PROVIDERS.find((p) => p.id === body.providerId || p.slug === body.providerId);
    if (!provider) return { error: `Provider '${body.providerId}' not found` };

    const slot = (provider.availableSlots || []).find((s) => s.id === body.slotId);
    if (!slot) return { error: `Slot '${body.slotId}' not found or no longer available` };

    const bookingId = `pbk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const refNum = `DNC-PRT-${Math.floor(100000 + Math.random() * 900000)}`;

    const bookingRecord: PartnerBookingRecord = {
      bookingId,
      providerId: provider.id,
      providerName: provider.fullName,
      practiceName: provider.practiceName,
      patientName: body.patient.fullName,
      patientEmail: body.patient.email,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: 'CONFIRMED',
      consultationType: body.consultationType,
      address: provider.address,
      referenceNumber: refNum,
      createdAt: new Date().toISOString(),
    };

    // Mark slot unavailable
    slot.isAvailable = false;

    this.demoBookings.set(bookingId, bookingRecord);
    this.idempotencyStore.set(body.idempotencyKey, bookingRecord);

    return { data: bookingRecord };
  }

  /**
   * GET /api/v1/partner/bookings/:bookingId
   */
  static async getBooking(
    authHeader: string,
    bookingId: string
  ): Promise<{ data?: PartnerBookingRecord; error?: string }> {
    const auth = this.validateToken(authHeader);
    if (!auth.valid) return { error: auth.error };

    const booking = this.demoBookings.get(bookingId);
    if (!booking) return { error: `Booking '${bookingId}' not found` };

    return { data: booking };
  }

  /**
   * POST /api/v1/partner/bookings/:bookingId/cancel
   */
  static async cancelBooking(
    authHeader: string,
    bookingId: string,
    reason?: string
  ): Promise<{ data?: PartnerBookingRecord; error?: string }> {
    const auth = this.validateToken(authHeader);
    if (!auth.valid) return { error: auth.error };

    const booking = this.demoBookings.get(bookingId);
    if (!booking) return { error: `Booking '${bookingId}' not found` };

    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date().toISOString();
    booking.cancellationReason = reason || 'Cancelled by partner system';

    return { data: booking };
  }
}
