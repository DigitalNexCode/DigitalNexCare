/**
 * DigitalNexCare South African Location Service
 * Chunk 3B - Manages sa_locations, area_practitioner_coverage, provisional area creation, and autocomplete.
 */

import { SouthAfricanProvince } from '../../types';
import { AreaDiscoveryStatus, AreaCoverageStatus, SouthAfricanLocationRecord, AreaPractitionerCoverageRecord } from './types';
import { AreaNormalizer } from './area-normalizer';
import { supabase } from '../supabase/client';

export interface LocationAutocompleteItem {
  id: string;
  areaName: string;
  suburb: string | null;
  cityTown: string | null;
  province: SouthAfricanProvince;
  latitude?: number | null;
  longitude?: number | null;
  isCustomDiscovery?: boolean;
  practitionerCount: number;
  discoveryStatus: AreaDiscoveryStatus;
}

// Initial robust seed of South African locations across all 9 provinces
const INITIAL_SA_LOCATIONS: Partial<SouthAfricanLocationRecord>[] = [
  // North West (including Hebron, Ga-Rankuwa, Brits, Rustenburg)
  { areaName: 'Hebron', cityTown: 'Hebron', suburb: 'Hebron', province: 'North West', latitude: -25.5567, longitude: 28.0069, practitionerCount: 14 },
  { areaName: 'Hebron Village', cityTown: 'Hebron', suburb: 'Hebron Village', province: 'North West', latitude: -25.5620, longitude: 28.0150, practitionerCount: 8 },
  { areaName: 'Hebron Mall (Ga-Rankuwa Border)', cityTown: 'Hebron', suburb: 'Hebron Mall', province: 'North West', latitude: -25.5580, longitude: 28.0090, practitionerCount: 11 },
  { areaName: 'Ga-Rankuwa Zone 1', cityTown: 'Ga-Rankuwa', suburb: 'Ga-Rankuwa Zone 1', province: 'North West', latitude: -25.6171, longitude: 27.9947, practitionerCount: 18 },
  { areaName: 'Ga-Rankuwa Central', cityTown: 'Ga-Rankuwa', suburb: 'Ga-Rankuwa Central', province: 'North West', latitude: -25.6120, longitude: 28.0010, practitionerCount: 22 },
  { areaName: 'Brits Central', cityTown: 'Brits', suburb: 'Central', province: 'North West', latitude: -25.6344, longitude: 27.7802, practitionerCount: 19 },
  { areaName: 'Hartbeespoort', cityTown: 'Hartbeespoort', suburb: 'Central', province: 'North West', latitude: -25.7282, longitude: 27.8890, practitionerCount: 16 },
  { areaName: 'Rustenburg CBD', cityTown: 'Rustenburg', suburb: 'Central', province: 'North West', latitude: -25.6676, longitude: 27.2421, practitionerCount: 22 },
  { areaName: 'Potchefstroom Central', cityTown: 'Potchefstroom', suburb: 'Central', province: 'North West', latitude: -26.7145, longitude: 27.0970, practitionerCount: 20 },
  { areaName: 'Klerksdorp Central', cityTown: 'Klerksdorp', suburb: 'Central', province: 'North West', latitude: -26.8667, longitude: 26.6667, practitionerCount: 18 },
  { areaName: 'Mahikeng CBD', cityTown: 'Mahikeng', suburb: 'Central', province: 'North West', latitude: -25.8652, longitude: 25.6442, practitionerCount: 15 },

  // Gauteng
  { areaName: 'Pretoria Central', cityTown: 'Pretoria', suburb: 'Pretoria Central', province: 'Gauteng', latitude: -25.7479, longitude: 28.1873, practitionerCount: 42 },
  { areaName: 'Hatfield', cityTown: 'Pretoria', suburb: 'Hatfield', province: 'Gauteng', latitude: -25.7505, longitude: 28.2378, practitionerCount: 28 },
  { areaName: 'Menlyn', cityTown: 'Pretoria', suburb: 'Menlyn', province: 'Gauteng', latitude: -25.7824, longitude: 28.2758, practitionerCount: 35 },
  { areaName: 'Centurion Central', cityTown: 'Centurion', suburb: 'Centurion Central', province: 'Gauteng', latitude: -25.8603, longitude: 28.1895, practitionerCount: 31 },
  { areaName: 'Mabopane Block B', cityTown: 'Pretoria', suburb: 'Mabopane', province: 'Gauteng', latitude: -25.4975, longitude: 28.0850, practitionerCount: 14 },
  { areaName: 'Soshanguve Block L', cityTown: 'Pretoria', suburb: 'Soshanguve', province: 'Gauteng', latitude: -25.5240, longitude: 28.1130, practitionerCount: 16 },
  { areaName: 'Hammanskraal Central', cityTown: 'Pretoria', suburb: 'Hammanskraal', province: 'Gauteng', latitude: -25.4050, longitude: 28.2750, practitionerCount: 14 },
  { areaName: 'Mamelodi East', cityTown: 'Pretoria', suburb: 'Mamelodi East', province: 'Gauteng', latitude: -25.7150, longitude: 28.3750, practitionerCount: 20 },
  { areaName: 'Atteridgeville', cityTown: 'Pretoria', suburb: 'Atteridgeville', province: 'Gauteng', latitude: -25.7720, longitude: 28.0750, practitionerCount: 16 },
  { areaName: 'Sandton City', cityTown: 'Johannesburg', suburb: 'Sandton', province: 'Gauteng', latitude: -26.1076, longitude: 28.0567, practitionerCount: 54 },
  { areaName: 'Rosebank', cityTown: 'Johannesburg', suburb: 'Rosebank', province: 'Gauteng', latitude: -26.1458, longitude: 28.0416, practitionerCount: 38 },
  { areaName: 'Soweto Meadowlands', cityTown: 'Johannesburg', suburb: 'Soweto', province: 'Gauteng', latitude: -26.2485, longitude: 27.8540, practitionerCount: 22 },
  { areaName: 'Midrand Central', cityTown: 'Johannesburg', suburb: 'Midrand', province: 'Gauteng', latitude: -25.9992, longitude: 28.1263, practitionerCount: 24 },
  { areaName: 'Randburg CBD', cityTown: 'Johannesburg', suburb: 'Randburg', province: 'Gauteng', latitude: -26.0936, longitude: 27.9991, practitionerCount: 25 },
  { areaName: 'Roodepoort North', cityTown: 'Johannesburg', suburb: 'Roodepoort', province: 'Gauteng', latitude: -26.1625, longitude: 27.8725, practitionerCount: 19 },
  { areaName: 'Fourways', cityTown: 'Johannesburg', suburb: 'Fourways', province: 'Gauteng', latitude: -26.0180, longitude: 28.0120, practitionerCount: 30 },
  { areaName: 'Bedfordview', cityTown: 'Johannesburg', suburb: 'Bedfordview', province: 'Gauteng', latitude: -26.1770, longitude: 28.1400, practitionerCount: 26 },
  { areaName: 'Kempton Park CBD', cityTown: 'Johannesburg', suburb: 'Kempton Park', province: 'Gauteng', latitude: -26.1020, longitude: 28.2320, practitionerCount: 24 },

  // Western Cape
  { areaName: 'Cape Town City Bowl', cityTown: 'Cape Town', suburb: 'City Bowl', province: 'Western Cape', latitude: -33.9249, longitude: 18.4241, practitionerCount: 48 },
  { areaName: 'Claremont', cityTown: 'Cape Town', suburb: 'Claremont', province: 'Western Cape', latitude: -33.9818, longitude: 18.4651, practitionerCount: 29 },
  { areaName: 'Sea Point', cityTown: 'Cape Town', suburb: 'Sea Point', province: 'Western Cape', latitude: -33.9180, longitude: 18.3888, practitionerCount: 24 },
  { areaName: 'Stellenbosch Central', cityTown: 'Stellenbosch', suburb: 'Central', province: 'Western Cape', latitude: -33.9321, longitude: 18.8602, practitionerCount: 22 },
  { areaName: 'Bellville CBD', cityTown: 'Cape Town', suburb: 'Bellville', province: 'Western Cape', latitude: -33.8943, longitude: 18.6294, practitionerCount: 27 },
  { areaName: 'George Central', cityTown: 'George', suburb: 'Central', province: 'Western Cape', latitude: -33.9630, longitude: 22.4617, practitionerCount: 18 },

  // KwaZulu-Natal
  { areaName: 'Durban Central', cityTown: 'Durban', suburb: 'Durban Central', province: 'KwaZulu-Natal', latitude: -29.8587, longitude: 31.0218, practitionerCount: 36 },
  { areaName: 'Umhlanga Rocks', cityTown: 'Durban', suburb: 'Umhlanga', province: 'KwaZulu-Natal', latitude: -29.7282, longitude: 31.0856, practitionerCount: 30 },
  { areaName: 'Pietermaritzburg CBD', cityTown: 'Pietermaritzburg', suburb: 'Central', province: 'KwaZulu-Natal', latitude: -29.6006, longitude: 30.3794, practitionerCount: 21 },
  { areaName: 'Ballito Coastal', cityTown: 'Ballito', suburb: 'Central', province: 'KwaZulu-Natal', latitude: -29.5390, longitude: 31.2144, practitionerCount: 15 },

  // Eastern Cape
  { areaName: 'Gqeberha Central (Port Elizabeth)', cityTown: 'Gqeberha', suburb: 'Central', province: 'Eastern Cape', latitude: -33.9608, longitude: 25.6022, practitionerCount: 25 },
  { areaName: 'East London CBD', cityTown: 'East London', suburb: 'Central', province: 'Eastern Cape', latitude: -33.0153, longitude: 27.9116, practitionerCount: 20 },
  { areaName: 'Mthatha Central', cityTown: 'Mthatha', suburb: 'Central', province: 'Eastern Cape', latitude: -31.5890, longitude: 28.7840, practitionerCount: 14 },

  // Free State
  { areaName: 'Bloemfontein Central', cityTown: 'Bloemfontein', suburb: 'Central', province: 'Free State', latitude: -29.1183, longitude: 26.2249, practitionerCount: 22 },

  // Limpopo
  { areaName: 'Polokwane Central', cityTown: 'Polokwane', suburb: 'Central', province: 'Limpopo', latitude: -23.9045, longitude: 29.4688, practitionerCount: 19 },

  // Mpumalanga
  { areaName: 'Mbombela Central (Nelspruit)', cityTown: 'Mbombela', suburb: 'Central', province: 'Mpumalanga', latitude: -25.4753, longitude: 30.9694, practitionerCount: 17 },

  // Northern Cape
  { areaName: 'Kimberley Central', cityTown: 'Kimberley', suburb: 'Central', province: 'Northern Cape', latitude: -28.7419, longitude: 24.7680, practitionerCount: 12 },
];

class LocationStore {
  private locations: Map<string, SouthAfricanLocationRecord> = new Map();
  private coverage: Map<string, AreaPractitionerCoverageRecord> = new Map();
  private initialized = false;

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    INITIAL_SA_LOCATIONS.forEach((seed) => {
      const parsed = AreaNormalizer.parseArea(seed.areaName!, seed.province);
      const id = `loc-seed-${parsed.normalizedName.replace(/\s+/g, '-')}`;
      const record: SouthAfricanLocationRecord = {
        id,
        country: 'South Africa',
        countryCode: 'ZA',
        province: seed.province || parsed.province || 'Gauteng',
        municipality: null,
        cityTown: seed.cityTown || parsed.cityOrTown,
        suburb: seed.suburb || parsed.suburbOrTownship,
        areaName: seed.areaName!,
        normalizedAreaName: parsed.normalizedName,
        searchAliases: parsed.aliases,
        latitude: seed.latitude || null,
        longitude: seed.longitude || null,
        sourceType: 'SEEDED_DIRECTORY',
        discoveryStatus: 'KNOWN',
        coverageStatus: 'FULLER_COVERAGE',
        firstDiscoveredAt: '2026-01-01T00:00:00Z',
        lastSearchedAt: new Date().toISOString(),
        lastIngestedAt: '2026-09-01T00:00:00Z',
        practitionerCount: seed.practitionerCount || 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      };
      this.locations.set(record.id, record);

      // Seed common coverage
      const catKey = `${record.id}__gp`;
      this.coverage.set(catKey, {
        id: `cov-${catKey}`,
        areaId: record.id,
        areaName: record.areaName,
        province: record.province,
        categoryId: 'primary_care',
        categoryName: 'General Practice',
        specialtyId: 'gp',
        specialtyName: 'General Practitioner (GP)',
        recordsCount: Math.round((seed.practitionerCount || 10) * 0.4),
        coverageStatus: 'FULLER_COVERAGE',
        lastIngestedAt: '2026-09-01T00:00:00Z',
        lastSearchAt: new Date().toISOString(),
        nextRefreshAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        externalSearchCount: 1,
      });

      // Seed Dentist coverage for major hubs (e.g. Pretoria Central, Hatfield, Sandton)
      if (record.areaName.includes('Pretoria') || record.areaName.includes('Hatfield') || record.areaName.includes('Sandton')) {
        const dentalKey = `${record.id}__dentist`;
        this.coverage.set(dentalKey, {
          id: `cov-${dentalKey}`,
          areaId: record.id,
          areaName: record.areaName,
          province: record.province,
          categoryId: 'dental_care',
          categoryName: 'Dental Care',
          specialtyId: 'dentist',
          specialtyName: 'Dentist',
          recordsCount: Math.round((seed.practitionerCount || 10) * 0.35),
          coverageStatus: 'FULLER_COVERAGE',
          lastIngestedAt: '2026-09-01T00:00:00Z',
          lastSearchAt: new Date().toISOString(),
          nextRefreshAt: new Date(Date.now() + 86400000 * 7).toISOString(),
          externalSearchCount: 1,
        });
      }
    });
    this.initialized = true;
  }

  /**
   * Loads persisted locations from Supabase if available
   */
  async syncWithSupabase() {
    try {
      const { data, error } = await supabase
        .from('sa_locations' as any)
        .select('*')
        .limit(200);

      if (!error && data && Array.isArray(data)) {
        data.forEach((row: any) => {
          const rec: SouthAfricanLocationRecord = {
            id: row.id,
            country: row.country || 'South Africa',
            countryCode: row.country_code || 'ZA',
            province: row.province,
            municipality: row.municipality,
            cityTown: row.city_town,
            suburb: row.suburb,
            areaName: row.area_name,
            normalizedAreaName: row.normalized_area_name,
            searchAliases: row.search_aliases || [],
            latitude: row.latitude ? Number(row.latitude) : null,
            longitude: row.longitude ? Number(row.longitude) : null,
            sourceType: row.source_type || 'EXTERNAL_DISCOVERY',
            discoveryStatus: row.discovery_status || 'DISCOVERED',
            coverageStatus: row.coverage_status || 'PARTIAL_COVERAGE',
            firstDiscoveredAt: row.first_discovered_at || new Date().toISOString(),
            lastSearchedAt: row.last_searched_at || new Date().toISOString(),
            lastIngestedAt: row.last_ingested_at,
            practitionerCount: row.practitioner_count || 0,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
          this.locations.set(rec.id, rec);
        });
      }
    } catch {
      // Fallback to in-memory store smoothly
    }
  }

  /**
   * Retrieves all location records
   */
  getAllLocations(): SouthAfricanLocationRecord[] {
    return Array.from(this.locations.values());
  }

  /**
   * Retrieves all area coverage records
   */
  getAllCoverage(): AreaPractitionerCoverageRecord[] {
    return Array.from(this.coverage.values());
  }

  /**
   * Looks up a location by ID
   */
  getLocationById(id: string): SouthAfricanLocationRecord | null {
    return this.locations.get(id) || null;
  }

  /**
   * Searches known locations for autocomplete
   */
  searchAutocomplete(rawQuery: string, limit: number = 8): LocationAutocompleteItem[] {
    if (!rawQuery || rawQuery.trim().length === 0) {
      // Return top seeded areas
      return Array.from(this.locations.values())
        .slice(0, limit)
        .map((loc) => ({
          id: loc.id,
          areaName: loc.areaName,
          suburb: loc.suburb,
          cityTown: loc.cityTown,
          province: loc.province,
          latitude: loc.latitude,
          longitude: loc.longitude,
          practitionerCount: loc.practitionerCount,
          discoveryStatus: loc.discoveryStatus,
        }));
    }

    const cleaned = AreaNormalizer.clean(rawQuery);
    const normalizedKey = AreaNormalizer.toNormalizedKey(cleaned);
    const results: LocationAutocompleteItem[] = [];

    // 1. Search known locations
    for (const loc of this.locations.values()) {
      const match =
        loc.normalizedAreaName.includes(normalizedKey) ||
        loc.searchAliases.some((a) => a.includes(normalizedKey)) ||
        (loc.cityTown && loc.cityTown.toLowerCase().includes(normalizedKey)) ||
        (loc.suburb && loc.suburb.toLowerCase().includes(normalizedKey));

      if (match) {
        results.push({
          id: loc.id,
          areaName: loc.areaName,
          suburb: loc.suburb,
          cityTown: loc.cityTown,
          province: loc.province,
          latitude: loc.latitude,
          longitude: loc.longitude,
          practitionerCount: loc.practitionerCount,
          discoveryStatus: loc.discoveryStatus,
        });
      }
      if (results.length >= limit) break;
    }

    // 2. If query doesn't match an existing area exactly, append "Search for '[query]'" option
    const exactMatch = results.some(
      (r) => r.areaName.toLowerCase() === cleaned.toLowerCase() ||
             r.areaName.toLowerCase() === normalizedKey
    );

    if (!exactMatch && cleaned.length >= 2) {
      const parsed = AreaNormalizer.parseArea(cleaned);
      results.push({
        id: `provisional-opt-${normalizedKey.replace(/\s+/g, '-')}`,
        areaName: parsed.canonicalAreaName,
        suburb: parsed.suburbOrTownship,
        cityTown: parsed.cityOrTown,
        province: parsed.province || 'Gauteng',
        latitude: null,
        longitude: null,
        isCustomDiscovery: true,
        practitionerCount: 0,
        discoveryStatus: 'DISCOVERING',
      });
    }

    return results;
  }

  /**
   * Finds or creates a provisional area record.
   * NEVER returns "Area does not exist".
   */
  findOrCreateProvisionalArea(
    rawQuery: string,
    coords?: { latitude: number; longitude: number }
  ): SouthAfricanLocationRecord {
    const parsed = AreaNormalizer.parseArea(rawQuery);
    const normalizedKey = parsed.normalizedName;

    // Check existing
    for (const loc of this.locations.values()) {
      if (
        loc.normalizedAreaName === normalizedKey ||
        loc.searchAliases.includes(normalizedKey)
      ) {
        loc.lastSearchedAt = new Date().toISOString();
        return loc;
      }
    }

    // Create provisional record
    const id = `loc-prov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const provisionalRecord: SouthAfricanLocationRecord = {
      id,
      country: 'South Africa',
      countryCode: 'ZA',
      province: parsed.province || 'Gauteng',
      municipality: null,
      cityTown: parsed.cityOrTown,
      suburb: parsed.suburbOrTownship,
      areaName: parsed.canonicalAreaName,
      normalizedAreaName: normalizedKey,
      searchAliases: parsed.aliases,
      latitude: coords?.latitude || null,
      longitude: coords?.longitude || null,
      sourceType: 'USER_PROVISIONAL',
      discoveryStatus: 'DISCOVERING',
      coverageStatus: 'NO_RESULTS_YET',
      firstDiscoveredAt: now,
      lastSearchedAt: now,
      lastIngestedAt: null,
      practitionerCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.locations.set(id, provisionalRecord);

    // Asynchronously attempt to persist to Supabase
    this.persistToSupabase(provisionalRecord).catch(() => {});

    return provisionalRecord;
  }

  /**
   * Updates an area after discovery has completed
   */
  updateAreaDiscovery(
    areaId: string,
    discoveredCount: number,
    coords?: { latitude: number; longitude: number }
  ): SouthAfricanLocationRecord | null {
    const loc = this.locations.get(areaId);
    if (!loc) return null;

    loc.practitionerCount += discoveredCount;
    loc.discoveryStatus = discoveredCount > 0 ? 'DISCOVERED' : 'NO_RESULTS_YET';
    loc.coverageStatus =
      loc.practitionerCount >= 10
        ? 'FULLER_COVERAGE'
        : loc.practitionerCount > 0
        ? 'PARTIAL_COVERAGE'
        : 'NO_RESULTS_YET';
    loc.lastIngestedAt = new Date().toISOString();
    loc.updatedAt = new Date().toISOString();
    if (coords && !loc.latitude) {
      loc.latitude = coords.latitude;
      loc.longitude = coords.longitude;
    }

    this.persistToSupabase(loc).catch(() => {});
    return loc;
  }

  /**
   * Records or updates coverage for an area + category
   */
  updateCategoryCoverage(
    areaId: string,
    categoryName: string,
    specialtyName: string | null,
    addedCount: number
  ): AreaPractitionerCoverageRecord {
    const loc = this.locations.get(areaId);
    const areaName = loc ? loc.areaName : 'Unknown Area';
    const province = loc ? loc.province : 'Gauteng';

    const categoryId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const specialtyId = specialtyName ? specialtyName.toLowerCase().replace(/[^a-z0-9]/g, '_') : null;
    const covKey = `${areaId}__${categoryId}__${specialtyId || 'all'}`;

    let cov = this.coverage.get(covKey);
    const now = new Date().toISOString();

    if (!cov) {
      cov = {
        id: `cov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        areaId,
        areaName,
        province,
        categoryId,
        categoryName,
        specialtyId,
        specialtyName,
        recordsCount: addedCount,
        coverageStatus: addedCount >= 5 ? 'FULLER_COVERAGE' : addedCount > 0 ? 'PARTIAL_COVERAGE' : 'NO_RESULTS_YET',
        lastIngestedAt: now,
        lastSearchAt: now,
        nextRefreshAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        externalSearchCount: 1,
      };
    } else {
      cov.recordsCount += addedCount;
      cov.coverageStatus = cov.recordsCount >= 5 ? 'FULLER_COVERAGE' : 'PARTIAL_COVERAGE';
      cov.lastIngestedAt = now;
      cov.lastSearchAt = now;
      cov.externalSearchCount += 1;
    }

    this.coverage.set(covKey, cov);
    return cov;
  }

  /**
   * Checks if an area + category already has fresh, sufficient coverage
   * Strictly respects Section 12: Coverage must be tracked per category.
   * e.g., Mabopane may have 35 dentists but only 2 psychologists.
   */
  hasSufficientCoverage(areaQuery: string, specialtyOrCategory?: string): { hasCoverage: boolean; count: number; locRecord: SouthAfricanLocationRecord | null } {
    const parsed = AreaNormalizer.parseArea(areaQuery);
    let matchedLoc: SouthAfricanLocationRecord | null = null;

    for (const loc of this.locations.values()) {
      if (
        loc.normalizedAreaName === parsed.normalizedName ||
        loc.searchAliases.includes(parsed.normalizedName)
      ) {
        matchedLoc = loc;
        break;
      }
    }

    if (!matchedLoc) {
      return { hasCoverage: false, count: 0, locRecord: null };
    }

    // Category-specific coverage check
    if (specialtyOrCategory && specialtyOrCategory.trim().length > 0 && specialtyOrCategory !== 'all') {
      const cleanSpec = specialtyOrCategory.toLowerCase().trim();
      let matchedCoverage: AreaPractitionerCoverageRecord | null = null;

      for (const cov of this.coverage.values()) {
        if (cov.areaId === matchedLoc.id) {
          const catMatch =
            (cov.specialtyName && cov.specialtyName.toLowerCase().includes(cleanSpec)) ||
            (cov.specialtyId && cleanSpec.includes(cov.specialtyId)) ||
            (cov.categoryName && cov.categoryName.toLowerCase().includes(cleanSpec)) ||
            (cov.categoryId && cleanSpec.includes(cov.categoryId));

          if (catMatch) {
            matchedCoverage = cov;
            break;
          }
        }
      }

      if (matchedCoverage) {
        const isSufficient = matchedCoverage.recordsCount >= 4 && matchedCoverage.coverageStatus !== 'NO_RESULTS_YET';
        return {
          hasCoverage: isSufficient,
          count: matchedCoverage.recordsCount,
          locRecord: matchedLoc,
        };
      }

      // If specific category not found in coverage records, it is NOT covered
      return { hasCoverage: false, count: 0, locRecord: matchedLoc };
    }

    // General area coverage check if no specific category was requested
    if (matchedLoc.practitionerCount >= 5 && matchedLoc.discoveryStatus !== 'STALE') {
      return { hasCoverage: true, count: matchedLoc.practitionerCount, locRecord: matchedLoc };
    }

    return { hasCoverage: false, count: matchedLoc.practitionerCount, locRecord: matchedLoc };
  }

  private async persistToSupabase(rec: SouthAfricanLocationRecord) {
    try {
      await supabase.from('sa_locations' as any).upsert(
        {
          id: rec.id.startsWith('loc-prov-') ? undefined : rec.id,
          country: rec.country,
          country_code: rec.countryCode,
          province: rec.province,
          municipality: rec.municipality,
          city_town: rec.cityTown,
          suburb: rec.suburb,
          area_name: rec.areaName,
          normalized_area_name: rec.normalizedAreaName,
          search_aliases: rec.searchAliases,
          latitude: rec.latitude,
          longitude: rec.longitude,
          source_type: rec.sourceType,
          discovery_status: rec.discoveryStatus,
          coverage_status: rec.coverageStatus,
          first_discovered_at: rec.firstDiscoveredAt,
          last_searched_at: rec.lastSearchedAt,
          last_ingested_at: rec.lastIngestedAt,
          practitioner_count: rec.practitionerCount,
          updated_at: rec.updatedAt,
        },
        { onConflict: 'normalized_area_name' }
      );
    } catch {
      // Ignored for environments without tables created
    }
  }
}

export const LocationService = new LocationStore();
