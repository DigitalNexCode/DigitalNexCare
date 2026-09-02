/**
 * DigitalNexCare SADA (South African Dental Association) & Allied Registry Provider
 */

import { DataAuthority } from '../../supabase/database.types';
import { BaseExternalPractitionerProvider } from './base-provider';
import { DiscoveryResult, LocationFilter, RawExternalPractitioner } from '../types';

export class SadaDentalProvider extends BaseExternalPractitionerProvider {
  providerId = 'prov-sada-register';
  providerName = 'South African Dental Association (SADA) Directory';
  sourceAttribution = 'SADA Professional Dental Directory';
  defaultAuthority: DataAuthority = 'AUTHORITATIVE_PROFESSIONAL_REGISTER';

  private mockDirectory: RawExternalPractitioner[] = [
    {
      rawId: 'sada-01',
      sourceType: 'SADA_REGISTER',
      sourceAttribution: 'SADA Professional Dental Directory',
      rawName: 'Dr. Johan Pretorius',
      rawPracticeName: 'Pretorius Oral Health & Implant Studio',
      rawSpecialty: 'Dentist',
      rawCategory: 'Dental & Oral Health',
      rawPhone: '012 346 1120',
      rawEmail: 'reception@pretoriusdental.co.za',
      rawWebsite: 'https://pretoriusdental.co.za',
      rawAddress: '88 Milner Street, Waterkloof, Pretoria, 0181',
      rawCity: 'Pretoria',
      rawSuburb: 'Waterkloof',
      rawProvince: 'Gauteng',
      rawPostalCode: '0181',
      rawLatitude: -25.776,
      rawLongitude: 28.241,
      rawRating: 4.9,
      rawReviewCount: 88,
      rawHpcsaNumber: 'DP 0192841',
      rawServices: ['Dental Implants', 'Cosmetic Veneers', 'Root Canal', 'Teeth Whitening'],
      rawLanguages: ['English', 'Afrikaans'],
      rawAcceptedMedicalAids: ['Discovery Health', 'Bonitas', 'Fedhealth', 'Bestmed Medical Scheme'],
      capturedAt: new Date().toISOString(),
    },
    {
      rawId: 'sada-02',
      sourceType: 'SADA_REGISTER',
      sourceAttribution: 'SADA Professional Dental Directory',
      rawName: 'Dr. Karabo Moeketsi',
      rawPracticeName: 'Nelspruit Family Dental Clinic',
      rawSpecialty: 'Dentist',
      rawCategory: 'Dental & Oral Health',
      rawPhone: '013 752 9080',
      rawEmail: 'info@nelspruitdental.co.za',
      rawAddress: '14 Rothery Street, Mbombela, 1200',
      rawCity: 'Nelspruit',
      rawSuburb: 'Mbombela Central',
      rawProvince: 'Mpumalanga',
      rawPostalCode: '1200',
      rawLatitude: -25.475,
      rawLongitude: 30.969,
      rawRating: 4.75,
      rawReviewCount: 34,
      rawHpcsaNumber: 'DP 0214892',
      rawServices: ['Routine Checkup', 'Scaling & Polishing', 'Paediatric Dentistry'],
      rawLanguages: ['English', 'siSwati', 'isiZulu'],
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
    const isDental = q.includes('dent') || q.includes('oral') || q.includes('orthodont');
    const filtered = isDental ? this.mockDirectory.filter((item) => {
      if (location?.province && item.rawProvince !== location.province) return false;
      if (location?.city && item.rawCity?.toLowerCase() !== location.city.toLowerCase()) return false;
      return true;
    }) : [];

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
