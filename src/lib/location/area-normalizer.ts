/**
 * DigitalNexCare South African Area Normalizer & Alias Engine
 * Chunk 3B - Standardized geographic normalization for cities, suburbs, townships, and unknown areas.
 */

import { SouthAfricanProvince } from '../../types';

export interface NormalizedAreaInfo {
  rawQuery: string;
  normalizedName: string;
  canonicalAreaName: string;
  cityOrTown: string | null;
  suburbOrTownship: string | null;
  province: SouthAfricanProvince | null;
  aliases: string[];
  isTownshipOrZone: boolean;
}

// Canonical city and abbreviation mapping
const CITY_ABBREVIATION_MAP: Record<string, { canonical: string; province: SouthAfricanProvince }> = {
  pta: { canonical: 'Pretoria', province: 'Gauteng' },
  tshwane: { canonical: 'Pretoria', province: 'Gauteng' },
  jhb: { canonical: 'Johannesburg', province: 'Gauteng' },
  joburg: { canonical: 'Johannesburg', province: 'Gauteng' },
  egoli: { canonical: 'Johannesburg', province: 'Gauteng' },
  cpt: { canonical: 'Cape Town', province: 'Western Cape' },
  kaapstad: { canonical: 'Cape Town', province: 'Western Cape' },
  pe: { canonical: 'Gqeberha', province: 'Eastern Cape' },
  'port elizabeth': { canonical: 'Gqeberha', province: 'Eastern Cape' },
  el: { canonical: 'East London', province: 'Eastern Cape' },
  emonti: { canonical: 'East London', province: 'Eastern Cape' },
  dbn: { canonical: 'Durban', province: 'KwaZulu-Natal' },
  ethekwini: { canonical: 'Durban', province: 'KwaZulu-Natal' },
  bfn: { canonical: 'Bloemfontein', province: 'Free State' },
  mangaung: { canonical: 'Bloemfontein', province: 'Free State' },
  plk: { canonical: 'Polokwane', province: 'Limpopo' },
  pietersburg: { canonical: 'Polokwane', province: 'Limpopo' },
  kby: { canonical: 'Kimberley', province: 'Northern Cape' },
  mhl: { canonical: 'eMalahleni', province: 'Mpumalanga' },
  witbank: { canonical: 'eMalahleni', province: 'Mpumalanga' },
  nelspruit: { canonical: 'Mbombela', province: 'Mpumalanga' },
  potch: { canonical: 'Potchefstroom', province: 'North West' },
  rustenburg: { canonical: 'Rustenburg', province: 'North West' },
  hebron: { canonical: 'Hebron', province: 'North West' },
  'ga-rankuwa': { canonical: 'Ga-Rankuwa', province: 'North West' },
  garankuwa: { canonical: 'Ga-Rankuwa', province: 'North West' },
  brits: { canonical: 'Brits', province: 'North West' },
  klerksdorp: { canonical: 'Klerksdorp', province: 'North West' },
  mahikeng: { canonical: 'Mahikeng', province: 'North West' },
  hartbeespoort: { canonical: 'Hartbeespoort', province: 'North West' },
  mabopane: { canonical: 'Mabopane', province: 'Gauteng' },
  soshanguve: { canonical: 'Soshanguve', province: 'Gauteng' },
  hammanskraal: { canonical: 'Hammanskraal', province: 'Gauteng' },
  mamelodi: { canonical: 'Mamelodi', province: 'Gauteng' },
  atteridgeville: { canonical: 'Atteridgeville', province: 'Gauteng' },
  sandton: { canonical: 'Johannesburg', province: 'Gauteng' },
  centurion: { canonical: 'Pretoria', province: 'Gauteng' },
  midrand: { canonical: 'Johannesburg', province: 'Gauteng' },
  soweto: { canonical: 'Johannesburg', province: 'Gauteng' },
  randburg: { canonical: 'Johannesburg', province: 'Gauteng' },
  roodepoort: { canonical: 'Johannesburg', province: 'Gauteng' },
  benoni: { canonical: 'Ekurhuleni', province: 'Gauteng' },
  boksburg: { canonical: 'Ekurhuleni', province: 'Gauteng' },
  'kempton park': { canonical: 'Ekurhuleni', province: 'Gauteng' },
  bellville: { canonical: 'Cape Town', province: 'Western Cape' },
  stellenbosch: { canonical: 'Stellenbosch', province: 'Western Cape' },
  umhlanga: { canonical: 'Durban', province: 'KwaZulu-Natal' },
  ballito: { canonical: 'Ballito', province: 'KwaZulu-Natal' },
  pietermaritzburg: { canonical: 'Pietermaritzburg', province: 'KwaZulu-Natal' },
};

// Known South African township prefixes / patterns
const TOWNSHIP_PATTERN = /\b(zone\s*\d+|block\s*[a-z0-9]+|ext(ension)?\s*\d+|section\s*[a-z0-9]+|unit\s*\d+|nu\s*\d+|phase\s*\d+|site\s*[a-z0-9]+|settlement|village)\b/i;

export class AreaNormalizer {
  /**
   * Cleans and formats input area strings
   */
  static clean(raw: string): string {
    if (!raw) return '';
    return raw
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-]/gi, '');
  }

  /**
   * Creates a normalized key for indexing and cache lookup
   */
  static toNormalizedKey(raw: string): string {
    const cleaned = this.clean(raw).toLowerCase();
    // Normalize abbreviations
    const tokens = cleaned.split(' ');
    const normalizedTokens = tokens.map((t) => {
      const match = CITY_ABBREVIATION_MAP[t];
      return match ? match.canonical.toLowerCase() : t;
    });
    return normalizedTokens.join(' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Extracts detailed normalized location information
   */
  static parseArea(raw: string, defaultProvince?: SouthAfricanProvince): NormalizedAreaInfo {
    const cleaned = this.clean(raw);
    const normalizedKey = this.toNormalizedKey(cleaned);
    const isTownshipOrZone = TOWNSHIP_PATTERN.test(cleaned);

    let canonicalAreaName = cleaned;
    let cityOrTown: string | null = null;
    let suburbOrTownship: string | null = null;
    let province: SouthAfricanProvince | null = defaultProvince || null;

    // Check abbreviation map
    const lowerClean = cleaned.toLowerCase();
    if (CITY_ABBREVIATION_MAP[lowerClean]) {
      const entry = CITY_ABBREVIATION_MAP[lowerClean];
      canonicalAreaName = entry.canonical;
      cityOrTown = entry.canonical;
      province = entry.province;
    } else {
      // Split by comma if provided, e.g. "Ga-Rankuwa Zone 5, Pretoria" or "Hatfield, Pretoria"
      if (cleaned.includes(',')) {
        const parts = cleaned.split(',').map((p) => p.trim());
        suburbOrTownship = parts[0];
        cityOrTown = parts[1];
        canonicalAreaName = `${parts[0]}, ${parts[1]}`;
      } else {
        suburbOrTownship = cleaned;
      }

      // Check if city or province mentioned in string
      for (const [key, entry] of Object.entries(CITY_ABBREVIATION_MAP)) {
        if (lowerClean.includes(key)) {
          if (!province) province = entry.province;
          if (!cityOrTown) cityOrTown = entry.canonical;
          break;
        }
      }
    }

    // Generate comprehensive aliases
    const aliases: string[] = [normalizedKey];
    if (cleaned.toLowerCase() !== normalizedKey) {
      aliases.push(cleaned.toLowerCase());
    }
    // Add variant without hyphens
    if (cleaned.includes('-')) {
      aliases.push(cleaned.replace(/-/g, ' ').toLowerCase().replace(/\s+/g, ' ').trim());
      aliases.push(cleaned.replace(/-/g, '').toLowerCase().trim());
    }
    // Add variant without "zone" or "ext"
    if (isTownshipOrZone) {
      const stripped = cleaned.replace(TOWNSHIP_PATTERN, '').trim().toLowerCase();
      if (stripped.length > 2 && !aliases.includes(stripped)) {
        aliases.push(stripped);
      }
    }

    return {
      rawQuery: raw,
      normalizedName: normalizedKey,
      canonicalAreaName: canonicalAreaName || cleaned,
      cityOrTown,
      suburbOrTownship,
      province,
      aliases,
      isTownshipOrZone,
    };
  }

  /**
   * Computes match confidence between search location and candidate practitioner location
   */
  static matchesLocation(
    searchArea: string,
    candidate: { suburb?: string; city?: string; province?: string; address?: string }
  ): boolean {
    if (!searchArea) return true;
    const searchNormalized = this.toNormalizedKey(searchArea);
    const searchTokens = searchNormalized.split(' ').filter((t) => t.length > 1);

    const targetText = `${candidate.suburb || ''} ${candidate.city || ''} ${candidate.province || ''} ${candidate.address || ''}`.toLowerCase();

    // Exact or substring match
    if (targetText.includes(searchNormalized)) return true;

    // Check aliases
    const parsed = this.parseArea(searchArea);
    for (const alias of parsed.aliases) {
      if (targetText.includes(alias)) return true;
    }

    // Token coverage match: at least 70% of tokens match
    const matchedTokens = searchTokens.filter((token) => targetText.includes(token));
    return matchedTokens.length / searchTokens.length >= 0.7;
  }
}
