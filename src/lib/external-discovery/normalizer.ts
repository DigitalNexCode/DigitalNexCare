/**
 * DigitalNexCare Practitioner Normalization Engine
 * Normalizes South African practitioner names, telephone numbers, addresses,
 * specialties, and professional registration codes according to national standards.
 */

import { SouthAfricanProvince } from '../supabase/database.types';
import { SA_PROVINCES } from '../constants';
import { RawExternalPractitioner, NormalizedPractitioner } from './types';
import { generatePractitionerFingerprint } from './fingerprint';

/**
 * Normalizes South African telephone numbers to canonical E.164 (+27XXXXXXXXX)
 * and formatted human-readable (+27 XX XXX XXXX).
 */
export function normalizeSouthAfricanPhone(rawPhone?: string | null): {
  normalizedPhone: string; // +27XXXXXXXXX
  displayPhone: string; // +27 XX XXX XXXX
} {
  if (!rawPhone) {
    return { normalizedPhone: '', displayPhone: '' };
  }

  // Remove non-numeric characters except +
  let cleaned = rawPhone.replace(/[^\d+]/g, '');

  // Handle +27 prefix
  if (cleaned.startsWith('+27')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('27')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Clean remaining non-digits
  cleaned = cleaned.replace(/\D/g, '');

  if (cleaned.length === 9) {
    const e164 = `+27${cleaned}`;
    const area = cleaned.substring(0, 2);
    const mid = cleaned.substring(2, 5);
    const end = cleaned.substring(5);
    const display = `+27 ${area} ${mid} ${end}`;
    return { normalizedPhone: e164, displayPhone: display };
  }

  // Fallback if unusual length
  const fallback = rawPhone.trim();
  return {
    normalizedPhone: fallback.startsWith('+') ? fallback : `+27${fallback.replace(/^0/, '')}`,
    displayPhone: fallback,
  };
}

/**
 * Normalizes practitioner names, separating honorific titles from canonical full names.
 */
export function normalizePractitionerName(rawName: string): {
  title: string;
  displayName: string;
  normalizedName: string;
} {
  if (!rawName) {
    return { title: 'Dr.', displayName: 'Healthcare Professional', normalizedName: 'healthcare professional' };
  }

  let cleaned = rawName.trim().replace(/\s+/g, ' ');

  // Extract common titles
  let title = 'Dr.';
  const titleRegex = /^(dr\.?|prof\.?|professor|doctor|mr\.?|mrs\.?|ms\.?|sr\.?|sister)\s+/i;
  const match = cleaned.match(titleRegex);

  if (match) {
    const rawTitle = match[1].toLowerCase().replace('.', '');
    if (rawTitle === 'dr' || rawTitle === 'doctor') title = 'Dr.';
    else if (rawTitle === 'prof' || rawTitle === 'professor') title = 'Prof.';
    else if (rawTitle === 'mr') title = 'Mr.';
    else if (rawTitle === 'mrs') title = 'Mrs.';
    else if (rawTitle === 'ms') title = 'Ms.';
    else if (rawTitle === 'sr' || rawTitle === 'sister') title = 'Sr.';

    cleaned = cleaned.replace(titleRegex, '').trim();
  }

  // Title case the cleaned name
  const titleCased = cleaned
    .split(' ')
    .map((word) => {
      if (!word) return '';
      // Support double-barrel names e.g. Du Plessis, Van Der Merwe
      const lower = word.toLowerCase();
      if (['van', 'der', 'de', 'du', 'la', 'le', 'von', 'ten'].includes(lower)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  const displayName = `${title} ${titleCased}`;
  const normalizedName = titleCased.toLowerCase();

  return { title, displayName, normalizedName };
}

/**
 * Normalizes practice names by removing redundant marketing fluff and standardizing suffixes.
 */
export function normalizePracticeName(rawPracticeName?: string, practitionerDisplayName?: string): {
  practiceName: string;
  normalizedPracticeName: string;
} {
  if (!rawPracticeName || rawPracticeName.trim().length === 0) {
    const fallback = practitionerDisplayName ? `${practitionerDisplayName}'s Practice` : 'Private Practice';
    return {
      practiceName: fallback,
      normalizedPracticeName: fallback.toLowerCase(),
    };
  }

  let cleaned = rawPracticeName.trim().replace(/\s+/g, ' ');
  // Standardize abbreviations
  cleaned = cleaned.replace(/\bMed\s+Ctr\b/gi, 'Medical Centre');
  cleaned = cleaned.replace(/\bMed\s+Center\b/gi, 'Medical Centre');
  cleaned = cleaned.replace(/\bDent\s+Studio\b/gi, 'Dental Studio');
  cleaned = cleaned.replace(/\bPhysio\b/gi, 'Physiotherapy');

  return {
    practiceName: cleaned,
    normalizedPracticeName: cleaned.toLowerCase(),
  };
}

/**
 * Normalizes South African provinces and infers province from known cities if missing.
 */
export function normalizeSouthAfricanProvince(
  rawProvince?: string,
  rawCity?: string,
  rawSuburb?: string
): SouthAfricanProvince {
  if (rawProvince) {
    const provLower = rawProvince.toLowerCase().trim();
    for (const validProv of SA_PROVINCES) {
      if (provLower === validProv.toLowerCase()) {
        return validProv as SouthAfricanProvince;
      }
    }
    // Substring matching
    if (provLower.includes('gauteng') || provLower.includes('gp')) return 'Gauteng';
    if (provLower.includes('western cape') || provLower.includes('wc')) return 'Western Cape';
    if (provLower.includes('kwazulu') || provLower.includes('kzn') || provLower.includes('natal')) return 'KwaZulu-Natal';
    if (provLower.includes('eastern cape') || provLower.includes('ec')) return 'Eastern Cape';
    if (provLower.includes('free state') || provLower.includes('fs')) return 'Free State';
    if (provLower.includes('limpopo') || provLower.includes('lp')) return 'Limpopo';
    if (provLower.includes('mpumalanga') || provLower.includes('mp')) return 'Mpumalanga';
    if (provLower.includes('north west') || provLower.includes('nw')) return 'North West';
    if (provLower.includes('northern cape') || provLower.includes('nc')) return 'Northern Cape';
  }

  // Infer from city
  const loc = `${rawCity || ''} ${rawSuburb || ''}`.toLowerCase();
  if (loc.includes('pretoria') || loc.includes('johannesburg') || loc.includes('sandton') || loc.includes('centurion') || loc.includes('soweto') || loc.includes('midrand') || loc.includes('randburg') || loc.includes('mabopane')) {
    return 'Gauteng';
  }
  if (loc.includes('cape town') || loc.includes('stellenbosch') || loc.includes('bellville') || loc.includes('somerset west') || loc.includes('paarl') || loc.includes('george') || loc.includes('hermanus')) {
    return 'Western Cape';
  }
  if (loc.includes('durban') || loc.includes('umhlanga') || loc.includes('pietermaritzburg') || loc.includes('ballito') || loc.includes('pinetown') || loc.includes('richards bay')) {
    return 'KwaZulu-Natal';
  }
  if (loc.includes('gqeberha') || loc.includes('port elizabeth') || loc.includes('east london') || loc.includes('mthatha') || loc.includes('makhanda')) {
    return 'Eastern Cape';
  }
  if (loc.includes('bloemfontein') || loc.includes('welkom') || loc.includes('bethlehem') || loc.includes('sasolburg')) {
    return 'Free State';
  }
  if (loc.includes('polokwane') || loc.includes('tzaneen') || loc.includes('mokopane') || loc.includes('thohoyandou')) {
    return 'Limpopo';
  }
  if (loc.includes('mbombela') || loc.includes('nelspruit') || loc.includes('witbank') || loc.includes('emalahleni') || loc.includes('secunda')) {
    return 'Mpumalanga';
  }
  if (loc.includes('rustenburg') || loc.includes('potchefstroom') || loc.includes('klerksdorp') || loc.includes('mahikeng')) {
    return 'North West';
  }
  if (loc.includes('kimberley') || loc.includes('upington') || loc.includes('springbok') || loc.includes('de aar')) {
    return 'Northern Cape';
  }

  return 'Gauteng'; // Default primary market
}

/**
 * Standardizes healthcare specialty names and categories.
 */
export function normalizeSpecialty(rawSpecialty?: string): { specialty: string; category: string } {
  if (!rawSpecialty) {
    return { specialty: 'General Practitioner (GP)', category: 'Primary Care' };
  }

  const lower = rawSpecialty.toLowerCase();
  if (lower.includes('gp') || lower.includes('general practitioner') || lower.includes('family medicine') || lower.includes('doctor')) {
    return { specialty: 'General Practitioner (GP)', category: 'Primary Care' };
  }
  if (lower.includes('dent') || lower.includes('oral') || lower.includes('orthodont')) {
    return { specialty: 'Dentist', category: 'Dental & Oral Health' };
  }
  if (lower.includes('physio') || lower.includes('physical therapy')) {
    return { specialty: 'Physiotherapist', category: 'Rehabilitation & Physical Therapy' };
  }
  if (lower.includes('paed') || lower.includes('pediat') || lower.includes('child')) {
    return { specialty: 'Paediatrician', category: 'Specialist Medicine' };
  }
  if (lower.includes('psych') || lower.includes('therap') || lower.includes('counsel')) {
    return { specialty: 'Psychologist / Therapist', category: 'Mental Health' };
  }
  if (lower.includes('optom') || lower.includes('ophthalm') || lower.includes('eye') || lower.includes('vision')) {
    return { specialty: 'Optometrist / Ophthalmologist', category: 'Vision & Eye Care' };
  }
  if (lower.includes('derm') || lower.includes('skin')) {
    return { specialty: 'Dermatologist', category: 'Specialist Medicine' };
  }
  if (lower.includes('audio') || lower.includes('ent') || lower.includes('ear') || lower.includes('hearing')) {
    return { specialty: 'ENT / Audiologist', category: 'Specialist Medicine' };
  }
  if (lower.includes('gynae') || lower.includes('obgyn') || lower.includes('obstet')) {
    return { specialty: 'Gynaecologist & Obstetrician', category: 'Women’s Health' };
  }

  return { specialty: rawSpecialty.trim(), category: 'Specialist Healthcare' };
}

/**
 * Full normalization pipeline converting raw external practitioner payload
 * into a canonical, deduplicable, and safe DigitalNexCare data object.
 */
export function normalizeRawPractitioner(raw: RawExternalPractitioner): NormalizedPractitioner {
  const { title, displayName, normalizedName } = normalizePractitionerName(raw.rawName);
  const { practiceName, normalizedPracticeName } = normalizePracticeName(raw.rawPracticeName, displayName);
  const { normalizedPhone, displayPhone } = normalizeSouthAfricanPhone(raw.rawPhone);
  const { specialty, category } = normalizeSpecialty(raw.rawSpecialty || raw.rawCategory);
  const province = normalizeSouthAfricanProvince(raw.rawProvince, raw.rawCity, raw.rawSuburb);

  const city = raw.rawCity ? raw.rawCity.trim() : 'Pretoria';
  const suburb = raw.rawSuburb ? raw.rawSuburb.trim() : city;
  const address = raw.rawAddress
    ? raw.rawAddress.trim()
    : `${suburb}, ${city}, ${province}, South Africa`;

  const latitude = typeof raw.rawLatitude === 'number' && !isNaN(raw.rawLatitude) ? raw.rawLatitude : -25.7479;
  const longitude = typeof raw.rawLongitude === 'number' && !isNaN(raw.rawLongitude) ? raw.rawLongitude : 28.2293;

  const rating = typeof raw.rawRating === 'number' ? Math.min(5, Math.max(1, raw.rawRating)) : 4.6;
  const reviewCount = typeof raw.rawReviewCount === 'number' ? raw.rawReviewCount : 12;

  // Professional registration number normalization
  let hpcsaNumber: string | null = null;
  if (raw.rawHpcsaNumber) {
    hpcsaNumber = raw.rawHpcsaNumber.trim().toUpperCase();
  }

  const fingerprint = generatePractitionerFingerprint({
    normalizedName,
    normalizedPracticeName,
    normalizedPhone,
    normalizedAddress: address.toLowerCase().trim(),
    hpcsaNumber: hpcsaNumber || undefined,
    suburb,
    city,
    province,
    latitude,
    longitude,
  });

  return {
    displayName,
    normalizedName,
    title,
    practiceName,
    normalizedPracticeName,
    specialty,
    category,
    services: raw.rawServices && raw.rawServices.length > 0 ? raw.rawServices : ['Consultation', 'General Assessment'],
    phone: displayPhone || '+27 12 000 0000',
    normalizedPhone,
    email: raw.rawEmail ? raw.rawEmail.toLowerCase().trim() : null,
    website: raw.rawWebsite ? (raw.rawWebsite.startsWith('http') ? raw.rawWebsite.trim() : `https://${raw.rawWebsite.trim()}`) : null,
    address,
    suburb,
    city,
    province,
    postalCode: raw.rawPostalCode || null,
    latitude,
    longitude,
    hpcsaNumber,
    rating,
    reviewCount,
    languages: raw.rawLanguages && raw.rawLanguages.length > 0 ? raw.rawLanguages : ['English', 'Afrikaans'],
    acceptedMedicalAids: raw.rawAcceptedMedicalAids && raw.rawAcceptedMedicalAids.length > 0
      ? raw.rawAcceptedMedicalAids
      : ['Discovery Health', 'GEMS', 'Bonitas'],
    sourceAttribution: raw.sourceAttribution || 'Public Professional Health Directory',
    sourceType: raw.sourceType || 'PUBLIC_REGISTER',
    dataAuthority: 'OTHER_APPROVED_EXTERNAL_SOURCE',
    fingerprint,
    capturedAt: raw.capturedAt || new Date().toISOString(),
  };
}
