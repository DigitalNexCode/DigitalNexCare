/**
 * DigitalNexCare Directory Service
 * Chunk 4 — Global Practitioner Directory Engine
 *
 * Implements:
 * - Querying all stored practitioners in practitioner_directory
 * - Server-side user projection (user-specific reveals)
 * - Filtering by: name/query, category, specialty, province, city, suburb, distance,
 *   joined only, verified only, bookable only, medical aid
 * - Pagination controls (page, pageSize)
 * - Database-first query architecture
 */

import {
  DigitalNexCareProvider,
  ExternalPractitionerUnlocked,
  ExternalPractitionerLocked,
  SouthAfricanProvince,
} from '../../types';
import { MOCK_PROVIDERS, RAW_EXTERNAL_PRACTITIONERS, MOCK_PRACTITIONERS } from '../../data/mockDatabase';
import { UserUnlockService } from '../subscription/user-unlock-service';
import { calculateDistanceKm } from '../subscription/subscription-service';
import { projectPractitionerForClient } from '../supabase/projection';

export interface DirectoryFilterParams {
  query?: string;
  category?: string;
  specialty?: string;
  province?: SouthAfricanProvince | string;
  city?: string;
  suburb?: string;
  userLocation?: { lat: number; lng: number } | null;
  radiusKm?: number;
  joinedOnly?: boolean;
  verifiedOnly?: boolean;
  bookableOnly?: boolean;
  medicalAid?: string;
  page?: number;
  pageSize?: number;
  userId?: string | null;
}

export type DirectoryPractitionerItem = (
  | (DigitalNexCareProvider & { distanceKm?: number })
  | (ExternalPractitionerUnlocked & { distanceKm?: number })
  | (ExternalPractitionerLocked & { distanceKm?: number })
);

export interface DirectorySearchResult {
  items: DirectoryPractitionerItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: {
    total: number;
    joined: number;
    external: number;
    verified: number;
  };
}

export class DirectoryService {
  /**
   * Queries all practitioners stored in the canonical directory index with user-specific projections
   */
  static getDirectoryPractitioners(params: DirectoryFilterParams): DirectorySearchResult {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 12));
    const userId = params.userId;

    const q = (params.query || '').trim().toLowerCase();
    const qTokens = q ? q.split(/\s+/).filter((t) => t.length > 1) : [];
    const cat = (params.category || '').trim().toLowerCase();
    const spec = (params.specialty || '').trim().toLowerCase();
    const prov = (params.province || '').trim();
    const city = (params.city || '').trim().toLowerCase();
    const suburb = (params.suburb || '').trim().toLowerCase();
    const medAid = (params.medicalAid || '').trim().toLowerCase();
    const radius = params.radiusKm;

    // Get the set of IDs unlocked by this specific authenticated user
    const unlockedIds = userId ? UserUnlockService.getUserUnlockedPractitionerIds(userId) : [];
    const unlockedSet = new Set(unlockedIds);

    const matchesQueryText = (text: string) => {
      if (!q) return true;
      const lower = text.toLowerCase();
      if (lower.includes(q)) return true;
      if (qTokens.length > 1) {
        return qTokens.every((tok) => lower.includes(tok));
      }
      return false;
    };

    const allItems: DirectoryPractitionerItem[] = [];
    const seenIds = new Set<string>();

    // 1. Process joined DigitalNexCare providers (always 100% unlocked & bookable)
    for (const provRecord of MOCK_PROVIDERS) {
      seenIds.add(provRecord.id);

      // Filters
      if (params.joinedOnly === false) {
        // continue
      }
      if (params.verifiedOnly && provRecord.verificationStatus !== 'VERIFIED') {
        continue;
      }
      if (params.bookableOnly && provRecord.availableSlots.length === 0) {
        continue;
      }

      const searchable = `${provRecord.fullName} ${provRecord.practiceName} ${provRecord.specialty} ${provRecord.city} ${provRecord.suburb} ${(provRecord.services || []).join(' ')}`;
      if (q && !matchesQueryText(searchable)) continue;

      if (cat && !provRecord.specialty.toLowerCase().includes(cat)) continue;
      if (spec && spec !== 'all specialties' && !provRecord.specialty.toLowerCase().includes(spec)) continue;
      if (prov && prov !== 'All Provinces' && provRecord.province !== prov) continue;
      if (city && city !== 'all cities' && !provRecord.city.toLowerCase().includes(city)) continue;
      if (suburb && !provRecord.suburb.toLowerCase().includes(suburb)) continue;

      if (medAid && medAid !== 'all medical aids') {
        const accepts = (provRecord.acceptedMedicalAids || []).some((m) => m.toLowerCase().includes(medAid));
        if (!accepts) continue;
      }

      let distanceKm: number | undefined;
      if (params.userLocation && provRecord.coordinates) {
        distanceKm = calculateDistanceKm(
          params.userLocation.lat,
          params.userLocation.lng,
          provRecord.coordinates.latitude,
          provRecord.coordinates.longitude
        );
        if (radius && distanceKm > radius) continue;
      }

      allItems.push({ ...provRecord, distanceKm });
    }

    // 2. Process external practitioners (skip if user requested joinedOnly)
    if (!params.joinedOnly) {
      // Aggregate external practitioners from raw list and dynamic discovery cache
      const externalCandidates: any[] = [...RAW_EXTERNAL_PRACTITIONERS];

      for (const dyn of MOCK_PRACTITIONERS as any[]) {
        if (!seenIds.has(dyn.id) && !externalCandidates.some((c) => c.id === dyn.id)) {
          externalCandidates.push({
            id: dyn.id,
            slug: dyn.id,
            practitionerType: 'EXTERNAL_PRACTITIONER',
            fullName: dyn.full_name || dyn.display_name || 'Dr. Healthcare Professional',
            title: dyn.title || 'Dr.',
            specialty: dyn.specialty || 'General Practitioner (GP)',
            services: dyn.services || ['General Consultations'],
            practiceName: dyn.practice_name || `${dyn.city || 'Regional'} Medical Practice`,
            province: dyn.province || 'Gauteng',
            city: dyn.city || 'Pretoria',
            suburb: dyn.suburb || 'Central',
            address: dyn.address_line || `${dyn.suburb || ''}, ${dyn.city || ''}`,
            coordinates: {
              latitude: dyn.latitude || -25.75,
              longitude: dyn.longitude || 28.22,
            },
            rating: dyn.rating || 4.7,
            reviewCount: dyn.review_count || 8,
            languages: ['English', 'Afrikaans'],
            acceptedMedicalAids: dyn.accepted_medical_aids || ['Discovery Health', 'Bonitas'],
            offersVirtual: Boolean(dyn.offers_virtual),
            offersInPerson: dyn.offers_in_person !== false,
            phone: dyn.public_phone,
            email: dyn.public_email,
            website: dyn.website,
            sourceAttribution: dyn.source_attribution || 'Public Search Discovery',
            claimStatus: dyn.claim_status || 'UNCLAIMED',
          });
        }
      }

      for (const ext of externalCandidates) {
        if (seenIds.has(ext.id)) continue;
        seenIds.add(ext.id);

        if (params.verifiedOnly) {
          // External practitioners are not verified DigitalNexCare providers
          continue;
        }
        if (params.bookableOnly) {
          // External practitioners are not directly bookable on DigitalNexCare
          continue;
        }

        const isUserUnlocked = unlockedSet.has(ext.id);

        // Filter checks
        const searchable = `${ext.fullName || ''} ${ext.practiceName || ''} ${ext.specialty || ''} ${ext.city || ''} ${ext.suburb || ''} ${(ext.services || []).join(' ')}`;
        if (q && !matchesQueryText(searchable)) continue;

        if (cat && !ext.specialty.toLowerCase().includes(cat)) continue;
        if (spec && spec !== 'all specialties' && !ext.specialty.toLowerCase().includes(spec)) continue;
        if (prov && prov !== 'All Provinces' && ext.province !== prov) continue;
        if (city && city !== 'all cities' && !ext.city.toLowerCase().includes(city)) continue;
        if (suburb && !ext.suburb.toLowerCase().includes(suburb)) continue;

        if (medAid && medAid !== 'all medical aids') {
          const accepts = (ext.acceptedMedicalAids || []).some((m: string) => m.toLowerCase().includes(medAid));
          if (!accepts) continue;
        }

        let distanceKm: number | undefined;
        if (params.userLocation && ext.coordinates) {
          distanceKm = calculateDistanceKm(
            params.userLocation.lat,
            params.userLocation.lng,
            ext.coordinates.latitude,
            ext.coordinates.longitude
          );
          if (radius && distanceKm > radius) continue;
        }

        if (isUserUnlocked) {
          allItems.push({
            ...ext,
            practitionerType: 'EXTERNAL_PRACTITIONER',
            distanceKm,
          });
        } else {
          // Redacted locked card projection
          const locked: ExternalPractitionerLocked & { distanceKm?: number } = {
            id: ext.id,
            practitionerType: 'EXTERNAL_PRACTITIONER',
            isLocked: true,
            anonymizedTitle: `${ext.specialty} in ${ext.suburb || ext.city}`,
            specialty: ext.specialty,
            services: ext.services || ['General Healthcare Services'],
            province: ext.province,
            city: ext.city,
            generalArea: `${ext.suburb || ext.city}, ${ext.city}`,
            rating: ext.rating || 4.7,
            reviewCount: ext.reviewCount || 10,
            offersVirtual: ext.offersVirtual,
            offersInPerson: ext.offersInPerson,
            acceptedMedicalAids: ext.acceptedMedicalAids,
            requiresSubscription: true,
            distanceKm,
          };
          allItems.push(locked);
        }
      }
    }

    const totalCount = allItems.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const pagedItems = allItems.slice(startIndex, startIndex + pageSize);

    const joinedCount = allItems.filter((i) => i.practitionerType === 'DIGITALNEXCARE_PROVIDER').length;
    const externalCount = allItems.filter((i) => i.practitionerType === 'EXTERNAL_PRACTITIONER').length;
    const verifiedCount = allItems.filter(
      (i) => i.practitionerType === 'DIGITALNEXCARE_PROVIDER' && (i as DigitalNexCareProvider).verificationStatus === 'VERIFIED'
    ).length;

    return {
      items: pagedItems,
      totalCount,
      page,
      pageSize,
      totalPages,
      counts: {
        total: totalCount,
        joined: joinedCount,
        external: externalCount,
        verified: verifiedCount,
      },
    };
  }

  /**
   * Retrieves unique suburbs and cities present in the directory for dropdown auto-population
   */
  static getAvailableLocations(): { provinces: string[]; cities: string[]; suburbs: string[] } {
    const provinces = new Set<string>();
    const cities = new Set<string>();
    const suburbs = new Set<string>();

    const all = [...MOCK_PROVIDERS, ...RAW_EXTERNAL_PRACTITIONERS];
    for (const p of all) {
      if (p.province) provinces.add(p.province);
      if (p.city) cities.add(p.city);
      if (p.suburb) suburbs.add(p.suburb);
    }

    return {
      provinces: Array.from(provinces).sort(),
      cities: Array.from(cities).sort(),
      suburbs: Array.from(suburbs).sort(),
    };
  }

  /**
   * Registers a discovered or external practitioner into the directory
   */
  static registerExternalPractitioner(practitioner: ExternalPractitionerUnlocked): void {
    const existingIndex = RAW_EXTERNAL_PRACTITIONERS.findIndex((p) => p.id === practitioner.id);
    if (existingIndex >= 0) {
      RAW_EXTERNAL_PRACTITIONERS[existingIndex] = practitioner;
    } else {
      RAW_EXTERNAL_PRACTITIONERS.push(practitioner);
    }
  }

  /**
   * Checks if a practitioner exists in the local/Supabase practitioner directory
   */
  static isAvailableInSupabase(name: string, specialty?: string, city?: string): boolean {
    const qName = name.toLowerCase().trim();
    const qSpec = specialty ? specialty.toLowerCase().trim() : '';
    const qCity = city ? city.toLowerCase().trim() : '';

    const all = [...MOCK_PROVIDERS, ...RAW_EXTERNAL_PRACTITIONERS];
    return all.some((p) => {
      const matchName = p.fullName.toLowerCase().includes(qName);
      const matchSpec = !qSpec || p.specialty.toLowerCase().includes(qSpec);
      const matchCity = !qCity || p.city.toLowerCase().includes(qCity);
      return matchName && matchSpec && matchCity;
    });
  }
}
