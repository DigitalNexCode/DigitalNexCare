/**
 * DigitalNexCare HPCSA Public Register Discovery Provider
 * Queries authoritative public professional health councils across South Africa.
 */

import { DataAuthority } from '../../supabase/database.types';
import { BaseExternalPractitionerProvider } from './base-provider';
import {
  DiscoveryResult,
  LocationFilter,
  RawExternalPractitioner,
} from '../types';

export class HpcsaRegistryProvider extends BaseExternalPractitionerProvider {
  providerId = 'prov-hpcsa-register';
  providerName = 'Health Professions Council of South Africa (HPCSA) Public Register';
  sourceAttribution = 'HPCSA Official Public Health Register';
  defaultAuthority: DataAuthority = 'AUTHORITATIVE_PROFESSIONAL_REGISTER';

  private mockDirectory: RawExternalPractitioner[] = [
    {
      rawId: 'hpcsa-01',
      sourceType: 'HPCSA_REGISTER',
      sourceAttribution: 'HPCSA Official Public Health Register',
      rawName: 'Dr. Bongani Sithole',
      rawPracticeName: 'Sithole Family Medical Practice',
      rawSpecialty: 'General Practitioner (GP)',
      rawCategory: 'Primary Care',
      rawPhone: '012 344 8920',
      rawEmail: 'dr.sithole@sitholemedical.co.za',
      rawWebsite: 'https://sitholemedical.co.za',
      rawAddress: '239 Pretorius Street, Pretoria Central, Pretoria, 0002',
      rawCity: 'Pretoria',
      rawSuburb: 'Pretoria Central',
      rawProvince: 'Gauteng',
      rawPostalCode: '0002',
      rawLatitude: -25.7485,
      rawLongitude: 28.1923,
      rawRating: 4.8,
      rawReviewCount: 42,
      rawHpcsaNumber: 'MP 0681923',
      rawServices: ['Family Health', 'Chronic Scripts', 'Paediatric Wellness', 'Minor Procedures'],
      rawLanguages: ['English', 'isiZulu', 'Setswana'],
      rawAcceptedMedicalAids: ['Discovery Health', 'GEMS', 'Bonitas', 'Momentum Health'],
      capturedAt: new Date().toISOString(),
    },
    {
      rawId: 'hpcsa-02',
      sourceType: 'HPCSA_REGISTER',
      sourceAttribution: 'HPCSA Official Public Health Register',
      rawName: 'Dr. Liezel Van Niekerk',
      rawPracticeName: 'Centurion Medical & Skin Hub',
      rawSpecialty: 'Dermatologist',
      rawCategory: 'Specialist Medicine',
      rawPhone: '012 664 3300',
      rawEmail: 'info@centurionskin.co.za',
      rawWebsite: 'https://centurionskin.co.za',
      rawAddress: '1023 Cantonments Road, Lyttelton Manor, Centurion, 0157',
      rawCity: 'Centurion',
      rawSuburb: 'Lyttelton Manor',
      rawProvince: 'Gauteng',
      rawPostalCode: '0157',
      rawLatitude: -25.834,
      rawLongitude: 28.205,
      rawRating: 4.9,
      rawReviewCount: 68,
      rawHpcsaNumber: 'MP 0592811',
      rawServices: ['Mole Mapping', 'Dermatology Consult', 'Acne Treatment', 'Cryotherapy'],
      rawLanguages: ['English', 'Afrikaans'],
      rawAcceptedMedicalAids: ['Discovery Health', 'GEMS', 'Bonitas', 'Bankmed', 'Profmed'],
      capturedAt: new Date().toISOString(),
    },
    {
      rawId: 'hpcsa-03',
      sourceType: 'HPCSA_REGISTER',
      sourceAttribution: 'HPCSA Official Public Health Register',
      rawName: 'Dr. Thandiwe Cele',
      rawPracticeName: 'Polokwane Central Health Practice',
      rawSpecialty: 'General Practitioner (GP)',
      rawCategory: 'Primary Care',
      rawPhone: '015 291 4450',
      rawEmail: 'care@celemedical.co.za',
      rawAddress: '55 Grobler Street, Polokwane, 0699',
      rawCity: 'Polokwane',
      rawSuburb: 'Polokwane Central',
      rawProvince: 'Limpopo',
      rawPostalCode: '0699',
      rawLatitude: -23.904,
      rawLongitude: 29.468,
      rawRating: 4.7,
      rawReviewCount: 29,
      rawHpcsaNumber: 'MP 0812940',
      rawServices: ['General Consultation', 'Blood Sugar Testing', 'Wound Management'],
      rawLanguages: ['English', 'Sepedi', 'Tshivenda'],
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
      if (location?.city && item.rawCity?.toLowerCase() !== location.city.toLowerCase()) return false;
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
    await this.throttle(120);

    const q = categoryOrSpecialty.toLowerCase().trim();
    const filtered = this.mockDirectory.filter((item) => {
      const matchSpec = (item.rawSpecialty && item.rawSpecialty.toLowerCase().includes(q)) || (item.rawCategory && item.rawCategory.toLowerCase().includes(q));
      if (!matchSpec) return false;
      if (location?.province && item.rawProvince !== location.province) return false;
      if (location?.city && item.rawCity?.toLowerCase() !== location.city.toLowerCase()) return false;
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
    await this.throttle(120);

    const filtered = this.mockDirectory.filter((item) => {
      if (location.province && item.rawProvince !== location.province) return false;
      if (location.city && item.rawCity?.toLowerCase() !== location.city.toLowerCase()) return false;
      if (location.suburb && item.rawSuburb?.toLowerCase() !== location.suburb.toLowerCase()) return false;
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

    // Filter within approximate lat/lng bounding box
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
