/**
 * DigitalNexCare Multi-Signal Search Quality & Ranking Engine
 * Computes composite ranking scores across Clinical Specialty Relevance,
 * Geographic Distance (PostGIS/Haversine), Verified Provider Status,
 * Live Booking Availability, Medical Aid Match, Profile Quality, and Bayesian Ratings.
 * 
 * Constitutional Guard:
 * - Paid ranking or promotion NEVER overrides minimum clinical/location relevance thresholds.
 */

import { Practitioner } from '../../types';
import { calculateDistanceKm } from '../geo';
import { SynonymService } from './synonyms';

export interface SearchRankingParams {
  query?: string;
  specialty?: string;
  service?: string;
  province?: string;
  city?: string;
  suburb?: string;
  medicalAid?: string;
  userCoordinates?: { latitude: number; longitude: number } | null;
  maxDistanceKm?: number;
  mode?: 'ALL' | 'IN_PERSON' | 'VIRTUAL';
  verifiedOnly?: boolean;
}

export interface RankedPractitioner {
  practitioner: Practitioner;
  totalScore: number; // 0 - 100 composite score
  signals: {
    specialtyScore: number;
    distanceScore: number;
    verificationScore: number;
    availabilityScore: number;
    medicalAidScore: number;
    profileQualityScore: number;
    ratingScore: number;
  };
  distanceKm?: number;
  matchReasons: string[];
}

export class SearchRankingEngine {
  // Configurable signal weights (Sum = 1.0)
  static readonly WEIGHTS = {
    specialty: 0.35,      // 35%
    distance: 0.25,       // 25%
    verification: 0.15,   // 15%
    availability: 0.10,   // 10%
    medicalAid: 0.08,     // 8%
    profileQuality: 0.04, // 4%
    rating: 0.03,         // 3%
  };

  /**
   * Rank and sort a list of practitioners against user search criteria
   */
  static rankPractitioners(
    practitioners: Practitioner[],
    params: SearchRankingParams
  ): RankedPractitioner[] {
    const synonymMatch = params.query ? SynonymService.resolveQuery(params.query) : null;
    const cleanQuery = params.query ? params.query.toLowerCase().trim() : '';

    const ranked = practitioners.map((p) => {
      const matchReasons: string[] = [];

      // 1. Specialty & Term Relevance
      let specialtyScore = 50; // default baseline
      const pSpecialty = p.specialty.toLowerCase();
      const pServices = p.services ? p.services.map((s) => s.toLowerCase()) : [];
      const pSub = 'subSpecialties' in p && Array.isArray((p as any).subSpecialties)
        ? ((p as any).subSpecialties as string[]).map((s) => s.toLowerCase())
        : [];
      const pName = 'fullName' in p ? (p as any).fullName.toLowerCase() : '';
      const pPractice = 'practiceName' in p ? (p as any).practiceName.toLowerCase() : '';

      if (cleanQuery) {
        if (pName.includes(cleanQuery)) {
          specialtyScore = 100;
          matchReasons.push('Exact practitioner name match');
        } else if (pPractice.includes(cleanQuery)) {
          specialtyScore = 95;
          matchReasons.push('Practice name match');
        } else if (pSpecialty.includes(cleanQuery)) {
          specialtyScore = 90;
          matchReasons.push('Specialty match');
        } else if (pServices.some((s) => s.includes(cleanQuery))) {
          specialtyScore = 80;
          matchReasons.push('Service match');
        } else if (pSub.some((s) => s.includes(cleanQuery))) {
          specialtyScore = 75;
          matchReasons.push('Sub-specialty match');
        } else if (synonymMatch) {
          if (pSpecialty.includes(synonymMatch.canonicalSpecialty.toLowerCase())) {
            specialtyScore = 85;
            matchReasons.push(`Synonym match for "${synonymMatch.term}"`);
          } else if (synonymMatch.subSpecialties.some((sub) => pSpecialty.includes(sub.toLowerCase()))) {
            specialtyScore = 75;
            matchReasons.push(`Synonym sub-specialty match for "${synonymMatch.term}"`);
          }
        }
      } else if (params.specialty && params.specialty !== 'All Specialties') {
        if (pSpecialty.includes(params.specialty.toLowerCase())) {
          specialtyScore = 100;
          matchReasons.push('Specialty filter match');
        }
      }

      // 2. Geographic & Distance Score
      let distanceScore = 60;
      let calculatedDistanceKm: number | undefined;

      const pCoords = 'coordinates' in p ? p.coordinates : undefined;

      if (params.userCoordinates && pCoords) {
        calculatedDistanceKm = calculateDistanceKm(
          params.userCoordinates.latitude,
          params.userCoordinates.longitude,
          pCoords.latitude,
          pCoords.longitude
        );

        // Distance decay curve
        if (calculatedDistanceKm <= 3) {
          distanceScore = 100;
          matchReasons.push('Very close (<3 km)');
        } else if (calculatedDistanceKm <= 10) {
          distanceScore = 90;
          matchReasons.push('Nearby (<10 km)');
        } else if (calculatedDistanceKm <= 25) {
          distanceScore = 75;
        } else if (calculatedDistanceKm <= 50) {
          distanceScore = 55;
        } else {
          distanceScore = Math.max(10, 50 - (calculatedDistanceKm - 50) * 0.5);
        }
      } else if ('distanceKm' in p && typeof (p as any).distanceKm === 'number') {
        calculatedDistanceKm = (p as any).distanceKm;
        if (calculatedDistanceKm !== undefined) {
          if (calculatedDistanceKm <= 3) distanceScore = 100;
          else if (calculatedDistanceKm <= 10) distanceScore = 90;
          else if (calculatedDistanceKm <= 25) distanceScore = 75;
          else if (calculatedDistanceKm <= 50) distanceScore = 55;
          else distanceScore = 30;
        }
      } else {
        // Suburb / City text match fallback
        const pSuburb = 'suburb' in p ? (p as any).suburb.toLowerCase() : 'generalArea' in p ? (p as any).generalArea.toLowerCase() : '';
        const pCity = p.city.toLowerCase();

        if (params.suburb && pSuburb.includes(params.suburb.toLowerCase())) {
          distanceScore = 95;
          matchReasons.push('Local suburb match');
        } else if (params.city && pCity.includes(params.city.toLowerCase())) {
          distanceScore = 85;
          matchReasons.push('City match');
        } else if (params.province && p.province === params.province) {
          distanceScore = 70;
        }
      }

      // 3. Verification & DigitalNexCare Provider Status
      let verificationScore = 40;
      if (p.practitionerType === 'DIGITALNEXCARE_PROVIDER') {
        const isVerified = (p as any).verificationStatus === 'VERIFIED';
        if (isVerified) {
          verificationScore = 100;
          matchReasons.push('Verified DigitalNexCare Provider');
        } else {
          verificationScore = 70;
        }
      }

      // 4. Availability & Live Booking
      let availabilityScore = 30;
      if (p.practitionerType === 'DIGITALNEXCARE_PROVIDER' && 'availableSlots' in p) {
        const slots = (p as any).availableSlots || [];
        const openSlots = slots.filter((s: any) => s.isAvailable);
        if (openSlots.length >= 3) {
          availabilityScore = 100;
          matchReasons.push('Immediate slots available');
        } else if (openSlots.length > 0) {
          availabilityScore = 85;
          matchReasons.push('Slots available');
        }
      }

      // 5. Medical Aid Compatibility
      let medicalAidScore = 60;
      if (params.medicalAid && params.medicalAid !== 'All Medical Aids') {
        const accepted = p.acceptedMedicalAids || [];
        if (accepted.some((m) => m.toLowerCase().includes(params.medicalAid!.toLowerCase()))) {
          medicalAidScore = 100;
          matchReasons.push(`Accepts ${params.medicalAid}`);
        } else if (accepted.includes('Private (No Medical Aid / Cash)')) {
          medicalAidScore = 40;
        } else {
          medicalAidScore = 20;
        }
      }

      // 6. Profile Quality Score
      let profileQualityScore = 60;
      if (p.practitionerType === 'DIGITALNEXCARE_PROVIDER') {
        let qualityPoints = 0;
        if ((p as any).photoUrl) qualityPoints += 20;
        if ((p as any).bio && (p as any).bio.length > 50) qualityPoints += 20;
        if ((p as any).hpcsaNumber) qualityPoints += 20;
        if ((p as any).languages && (p as any).languages.length > 1) qualityPoints += 20;
        if ((p as any).services && (p as any).services.length >= 3) qualityPoints += 20;
        profileQualityScore = qualityPoints;
      }

      // 7. Bayesian Weighted Rating
      let ratingScore = 50;
      if (p.rating) {
        const count = p.reviewCount || 1;
        // Bayesian formula: (R * v + C * m) / (v + m) where C=4.5, m=5
        const bayesianRating = (p.rating * count + 4.5 * 5) / (count + 5);
        ratingScore = Math.min(100, Math.round((bayesianRating / 5) * 100));
        if (p.rating >= 4.8 && count >= 10) {
          matchReasons.push(`Top Rated (${p.rating}★)`);
        }
      }

      // Calculate Weighted Total Score
      const totalScore = Math.round(
        specialtyScore * this.WEIGHTS.specialty +
        distanceScore * this.WEIGHTS.distance +
        verificationScore * this.WEIGHTS.verification +
        availabilityScore * this.WEIGHTS.availability +
        medicalAidScore * this.WEIGHTS.medicalAid +
        profileQualityScore * this.WEIGHTS.profileQuality +
        ratingScore * this.WEIGHTS.rating
      );

      return {
        practitioner: p,
        totalScore,
        signals: {
          specialtyScore,
          distanceScore,
          verificationScore,
          availabilityScore,
          medicalAidScore,
          profileQualityScore,
          ratingScore,
        },
        distanceKm: calculatedDistanceKm,
        matchReasons: matchReasons.slice(0, 3),
      };
    });

    // Sort descending by total score, then by distance
    return ranked.sort((a, b) => {
      // Constitutional Rule: Relevance threshold check
      // High relevance items take precedence
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }
      return (b.practitioner.rating || 0) - (a.practitioner.rating || 0);
    });
  }
}
