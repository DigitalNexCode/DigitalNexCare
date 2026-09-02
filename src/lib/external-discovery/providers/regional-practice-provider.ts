/**
 * DigitalNexCare Regional Practice Public Directories Provider
 * Modular crawler worker covering regional South African health centres, private clinics,
 * and provincial medical registers.
 */

import { DataAuthority } from '../../supabase/database.types';
import { BaseExternalPractitionerProvider } from './base-provider';
import { DiscoveryResult, LocationFilter, RawExternalPractitioner } from '../types';

export class RegionalPracticeProvider extends BaseExternalPractitionerProvider {
  providerId = 'prov-regional-practices';
  providerName = 'South African Regional Practice Web Directory';
  sourceAttribution = 'Verified Public Practice Web Portals';
  defaultAuthority: DataAuthority = 'PRACTICE_WEBSITE';

  private mockDirectory: RawExternalPractitioner[] = [
    {
      rawId: 'reg-01',
      sourceType: 'PRACTICE_WEBSITE',
      sourceAttribution: 'Verified Public Practice Web Portals',
      rawName: 'Dr. Sipho Mthembu',
      rawPracticeName: 'Kimberley Diamond City Health Clinic',
      rawSpecialty: 'General Practitioner (GP)',
      rawCategory: 'Primary Care',
      rawPhone: '053 832 9940',
      rawEmail: 'info@kimberleymedical.co.za',
      rawWebsite: 'https://kimberleymedical.co.za',
      rawAddress: '14 Chapel Street, Kimberley Central, Kimberley, 8301',
      rawCity: 'Kimberley',
      rawSuburb: 'Kimberley Central',
      rawProvince: 'Northern Cape',
      rawPostalCode: '8301',
      rawLatitude: -28.742,
      rawLongitude: 24.768,
      rawRating: 4.6,
      rawReviewCount: 19,
      rawHpcsaNumber: 'MP 0748190',
      rawServices: ['Family Health', 'Occupational Health Exams', 'Vaccinations'],
      rawLanguages: ['English', 'Afrikaans', 'Setswana'],
      rawAcceptedMedicalAids: ['Discovery Health', 'Bonitas', 'GEMS'],
      capturedAt: new Date().toISOString(),
    },
    {
      rawId: 'reg-02',
      sourceType: 'PRACTICE_WEBSITE',
      sourceAttribution: 'Verified Public Practice Web Portals',
      rawName: 'Dr. Megan Cloete',
      rawPracticeName: 'Rustenburg Wellness & Physio Studio',
      rawSpecialty: 'Physiotherapist',
      rawCategory: 'Rehabilitation & Physical Therapy',
      rawPhone: '014 592 1190',
      rawEmail: 'contact@rustenburgphysio.co.za',
      rawWebsite: 'https://rustenburgphysio.co.za',
      rawAddress: '220 Beyers Naude Drive, Rustenburg, 0299',
      rawCity: 'Rustenburg',
      rawSuburb: 'Rustenburg Central',
      rawProvince: 'North West',
      rawPostalCode: '0299',
      rawLatitude: -25.667,
      rawLongitude: 27.242,
      rawRating: 4.85,
      rawReviewCount: 26,
      rawHpcsaNumber: 'PT 0094182',
      rawServices: ['Sports Rehabilitation', 'Post-Op Mobilization', 'Dry Needling'],
      rawLanguages: ['English', 'Afrikaans'],
      rawAcceptedMedicalAids: ['Discovery Health', 'GEMS', 'Bonitas', 'Momentum Health'],
      capturedAt: new Date().toISOString(),
    },
    {
      rawId: 'reg-03',
      sourceType: 'PRACTICE_WEBSITE',
      sourceAttribution: 'Verified Public Practice Web Portals',
      rawName: 'Dr. Siphiwe Nkosi',
      rawPracticeName: 'Mthatha Comprehensive Health Care',
      rawSpecialty: 'Paediatrician',
      rawCategory: 'Specialist Medicine',
      rawPhone: '047 531 4420',
      rawEmail: 'reception@mthathachildcare.co.za',
      rawAddress: '38 Madeira Street, Mthatha Central, 5099',
      rawCity: 'Mthatha',
      rawSuburb: 'Mthatha Central',
      rawProvince: 'Eastern Cape',
      rawPostalCode: '5099',
      rawLatitude: -31.589,
      rawLongitude: 28.784,
      rawRating: 4.9,
      rawReviewCount: 31,
      rawHpcsaNumber: 'MP 0674120',
      rawServices: ['Paediatric Assessment', 'Immunizations', 'Newborn Screening'],
      rawLanguages: ['English', 'isiXhosa'],
      rawAcceptedMedicalAids: ['Discovery Health', 'GEMS', 'Bonitas'],
      capturedAt: new Date().toISOString(),
    },
  ];

  async searchByName(name: string, location?: LocationFilter): Promise<DiscoveryResult> {
    const startTime = Date.now();
    await this.throttle(100);

    const q = name.toLowerCase().trim();
    const filtered = this.mockDirectory.filter((item) => {
      const matchName = item.rawName.toLowerCase().includes(q) || (item.rawPracticeName && item.rawPracticeName.toLowerCase().includes(q));
      if (!matchName) return false;
      if (location?.province && item.rawProvince !== location.province) return false;
      return true;
    });

    return {
      status: filtered.length > 0 ? 'SUCCESS' : 'NO_RESULTS',
      source: this.providerName,
      foundCount: filtered.length,
      normalizedPractitioners: filtered.map((r) => this.normalizeResult(r)),
      durationMs: Date.now() - startTime,
    };
  }

  async searchByCategory(categoryOrSpecialty: string, location?: LocationFilter): Promise<DiscoveryResult> {
    const startTime = Date.now();
    await this.throttle(100);

    const q = categoryOrSpecialty.toLowerCase().trim();
    const filtered = this.mockDirectory.filter((item) => {
      const matchSpec = (item.rawSpecialty && item.rawSpecialty.toLowerCase().includes(q)) || (item.rawCategory && item.rawCategory.toLowerCase().includes(q));
      if (!matchSpec) return false;
      if (location?.province && item.rawProvince !== location.province) return false;
      return true;
    });

    return {
      status: filtered.length > 0 ? 'SUCCESS' : 'NO_RESULTS',
      source: this.providerName,
      foundCount: filtered.length,
      normalizedPractitioners: filtered.map((r) => this.normalizeResult(r)),
      durationMs: Date.now() - startTime,
    };
  }

  async searchByLocation(location: LocationFilter): Promise<DiscoveryResult> {
    const startTime = Date.now();
    await this.throttle(100);

    const filtered = this.mockDirectory.filter((item) => {
      if (location.province && item.rawProvince !== location.province) return false;
      if (location.city && item.rawCity?.toLowerCase() !== location.city.toLowerCase()) return false;
      return true;
    });

    return {
      status: filtered.length > 0 ? 'SUCCESS' : 'NO_RESULTS',
      source: this.providerName,
      foundCount: filtered.length,
      normalizedPractitioners: filtered.map((r) => this.normalizeResult(r)),
      durationMs: Date.now() - startTime,
    };
  }

  async searchNearby(latitude: number, longitude: number, radiusKm: number): Promise<DiscoveryResult> {
    const startTime = Date.now();
    await this.throttle(100);

    const degDelta = radiusKm / 111.0;
    const filtered = this.mockDirectory.filter((item) => {
      if (!item.rawLatitude || !item.rawLongitude) return false;
      const latDiff = Math.abs(item.rawLatitude - latitude);
      const lngDiff = Math.abs(item.rawLongitude - longitude);
      return latDiff <= degDelta && lngDiff <= degDelta;
    });

    return {
      status: filtered.length > 0 ? 'SUCCESS' : 'NO_RESULTS',
      source: this.providerName,
      foundCount: filtered.length,
      normalizedPractitioners: filtered.map((r) => this.normalizeResult(r)),
      durationMs: Date.now() - startTime,
    };
  }

  async getDetails(sourceId: string): Promise<RawExternalPractitioner | null> {
    return this.mockDirectory.find((item) => item.rawId === sourceId) || null;
  }
}
