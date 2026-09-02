/**
 * DigitalNexCare South Africa Healthcare Layperson Synonyms & Terminology Engine
 * Translates colloquial South African terms, everyday layperson phrases, and acronyms
 * into standardized clinical specialties and services WITHOUT diagnostic claims.
 * 
 * Constitutional Mandate:
 * - Purely taxonomy navigation and specialty mapping.
 * - NEVER diagnose disease or symptom causes.
 */

export interface SpecialtySynonymMatch {
  term: string;
  canonicalSpecialty: string;
  subSpecialties: string[];
  suggestedServices: string[];
  navigationExplanation?: string;
  isAmbiguous?: boolean;
  clarificationOptions?: { specialty: string; description: string }[];
}

export const SOUTH_AFRICAN_HEALTHCARE_SYNONYMS: Record<string, SpecialtySynonymMatch> = {
  // General & Family Care
  gp: {
    term: 'gp',
    canonicalSpecialty: 'General Practitioner (GP)',
    subSpecialties: ['Family Medicine', 'Primary Healthcare', 'Chronic Disease Management'],
    suggestedServices: ['General Consultation', 'Prescription Renewal', 'Blood Pressure Check', 'Flu Vaccination'],
    navigationExplanation: 'General Practitioners manage day-to-day healthcare, primary diagnoses, referrals, and family medicine.',
  },
  'family doctor': {
    term: 'family doctor',
    canonicalSpecialty: 'General Practitioner (GP)',
    subSpecialties: ['Family Medicine', 'Primary Healthcare'],
    suggestedServices: ['General Consultation', 'Health Screening'],
  },
  'house doctor': {
    term: 'house doctor',
    canonicalSpecialty: 'General Practitioner (GP)',
    subSpecialties: ['Family Medicine'],
    suggestedServices: ['General Consultation'],
  },

  // Dermatology / Skin
  'skin doctor': {
    term: 'skin doctor',
    canonicalSpecialty: 'Dermatologist',
    subSpecialties: ['Medical Dermatology', 'Cosmetic Dermatology', 'Paediatric Dermatology'],
    suggestedServices: ['Mole Mapping & Biopsy', 'Acne Management', 'Eczema & Psoriasis Care', 'Skin Cancer Screening'],
    navigationExplanation: 'Dermatologists specialize in hair, skin, and nail conditions.',
  },
  skin: {
    term: 'skin',
    canonicalSpecialty: 'Dermatologist',
    subSpecialties: ['Medical Dermatology'],
    suggestedServices: ['Skin Examination', 'Acne Treatment'],
  },
  acne: {
    term: 'acne',
    canonicalSpecialty: 'Dermatologist',
    subSpecialties: ['Medical Dermatology'],
    suggestedServices: ['Acne Consultation', 'Chemical Peels', 'Scar Revision'],
  },
  rash: {
    term: 'rash',
    canonicalSpecialty: 'Dermatologist',
    subSpecialties: ['Medical Dermatology', 'Allergy Care'],
    suggestedServices: ['Dermatological Assessment', 'Allergy Patch Testing'],
  },
  mole: {
    term: 'mole',
    canonicalSpecialty: 'Dermatologist',
    subSpecialties: ['Skin Cancer Screening'],
    suggestedServices: ['Mole Mapping', 'Dermoscopy'],
  },

  // Dental & Oral Health
  'tooth doctor': {
    term: 'tooth doctor',
    canonicalSpecialty: 'Dentist',
    subSpecialties: ['General Dentistry', 'Cosmetic Dentistry', 'Endodontics', 'Orthodontics'],
    suggestedServices: ['Dental Checkup & Cleaning', 'Fillings', 'Root Canal', 'Teeth Whitening'],
    navigationExplanation: 'Dentists specialize in teeth, gums, and oral health.',
  },
  teeth: {
    term: 'teeth',
    canonicalSpecialty: 'Dentist',
    subSpecialties: ['General Dentistry'],
    suggestedServices: ['Dental Checkup & Cleaning', 'Fillings'],
  },
  dentist: {
    term: 'dentist',
    canonicalSpecialty: 'Dentist',
    subSpecialties: ['General Dentistry', 'Cosmetic Dentistry', 'Paediatric Dentistry'],
    suggestedServices: ['Dental Checkup & Cleaning', 'Extractions', 'Crowns & Bridges'],
  },
  braces: {
    term: 'braces',
    canonicalSpecialty: 'Dentist',
    subSpecialties: ['Orthodontics'],
    suggestedServices: ['Orthodontic Assessment', 'Clear Aligners', 'Braces Consultation'],
    navigationExplanation: 'Orthodontists and specialized dentists adjust teeth alignment and bite.',
  },

  // Eye Care (Optometrist vs Ophthalmologist Distinction)
  'eye doctor': {
    term: 'eye doctor',
    canonicalSpecialty: 'Optometrist / Ophthalmologist',
    subSpecialties: ['Optometry (Vision & Glasses)', 'Ophthalmology (Eye Surgery & Medical)'],
    suggestedServices: ['Comprehensive Eye Exam', 'Glaucoma Screening', 'Cataract Consultation', 'Prescription Glasses'],
    isAmbiguous: true,
    navigationExplanation: 'Eye care encompasses Optometrists (routine vision tests, prescriptions, glasses) and Ophthalmologists (medical eye diseases & surgical treatments).',
    clarificationOptions: [
      {
        specialty: 'Optometrist',
        description: 'Primary vision exams, prescription glasses, contact lenses, and non-surgical eye health checks.',
      },
      {
        specialty: 'Ophthalmologist',
        description: 'Medical doctor & surgeon specializing in complex eye disorders, cataracts, glaucoma, and laser surgery.',
      },
    ],
  },
  glasses: {
    term: 'glasses',
    canonicalSpecialty: 'Optometrist / Ophthalmologist',
    subSpecialties: ['Optometry'],
    suggestedServices: ['Vision Test', 'Spectacle Dispensing', 'Contact Lens Fitting'],
  },
  optometry: {
    term: 'optometry',
    canonicalSpecialty: 'Optometrist / Ophthalmologist',
    subSpecialties: ['Optometry'],
    suggestedServices: ['Eye Examination', 'Refraction Test'],
  },
  eyes: {
    term: 'eyes',
    canonicalSpecialty: 'Optometrist / Ophthalmologist',
    subSpecialties: ['Optometry', 'Ophthalmology'],
    suggestedServices: ['Eye Examination'],
  },

  // Physical Rehabilitation & Musculoskeletal
  physio: {
    term: 'physio',
    canonicalSpecialty: 'Physiotherapist',
    subSpecialties: ['Sports Injuries', 'Orthopaedic Rehab', 'Postural Rehabilitation'],
    suggestedServices: ['Sports Injury Assessment', 'Dry Needling', 'Back & Neck Mobilization', 'Post-Op Rehab'],
    navigationExplanation: 'Physiotherapists restore movement and function after injury, surgery, or illness.',
  },
  physiotherapy: {
    term: 'physiotherapy',
    canonicalSpecialty: 'Physiotherapist',
    subSpecialties: ['Sports Injuries', 'Orthopaedic Rehab'],
    suggestedServices: ['Physical Assessment', 'Dry Needling', 'Manual Therapy'],
  },
  'back pain': {
    term: 'back pain',
    canonicalSpecialty: 'Physiotherapist',
    subSpecialties: ['Spinal Rehabilitation', 'General Practice', 'Orthopaedics'],
    suggestedServices: ['Back & Neck Mobilization', 'Posture Correction', 'Spinal Exam'],
  },
  'muscle pain': {
    term: 'muscle pain',
    canonicalSpecialty: 'Physiotherapist',
    subSpecialties: ['Sports Injuries', 'Pain Management'],
    suggestedServices: ['Dry Needling', 'Deep Tissue Release'],
  },
  'bone doctor': {
    term: 'bone doctor',
    canonicalSpecialty: 'Orthopaedic Surgeon',
    subSpecialties: ['Joint Replacement', 'Sports Surgery', 'Spinal Surgery', 'Fracture Care'],
    suggestedServices: ['Joint Assessment', 'Arthroscopy Consultation', 'Fracture Management'],
    navigationExplanation: 'Orthopaedic Surgeons diagnose and treat conditions of bones, joints, ligaments, and tendons.',
  },
  orthopaedic: {
    term: 'orthopaedic',
    canonicalSpecialty: 'Orthopaedic Surgeon',
    subSpecialties: ['Joint Care', 'Trauma'],
    suggestedServices: ['Orthopaedic Assessment'],
  },
  'foot doctor': {
    term: 'foot doctor',
    canonicalSpecialty: 'Podiatrist',
    subSpecialties: ['Biomechanics', 'Diabetic Foot Care', 'Orthotics'],
    suggestedServices: ['Gait Analysis', 'Custom Orthotics', 'Ingrown Toenail Treatment'],
    navigationExplanation: 'Podiatrists treat feet, ankles, and lower extremity biomechanical problems.',
  },
  podiatrist: {
    term: 'podiatrist',
    canonicalSpecialty: 'Podiatrist',
    subSpecialties: ['Foot & Ankle Care'],
    suggestedServices: ['Custom Orthotics', 'Foot Care'],
  },

  // Paediatrics / Children
  'child doctor': {
    term: 'child doctor',
    canonicalSpecialty: 'Paediatrician',
    subSpecialties: ['Neonatal Care', 'Developmental Paediatrics', 'Childhood Allergies'],
    suggestedServices: ['Developmental Assessment', 'Newborn Check', 'Childhood Vaccinations', 'Asthma Management'],
    navigationExplanation: 'Paediatricians provide medical care for infants, children, and adolescents.',
  },
  'baby doctor': {
    term: 'baby doctor',
    canonicalSpecialty: 'Paediatrician',
    subSpecialties: ['Neonatal Care', 'Infant Nutrition'],
    suggestedServices: ['Newborn Health Check', 'Growth Milestone Tracking'],
  },
  paediatrician: {
    term: 'paediatrician',
    canonicalSpecialty: 'Paediatrician',
    subSpecialties: ['General Paediatrics'],
    suggestedServices: ['Child Consultation', 'Vaccination'],
  },

  // Women's Health & Gynaecology
  gynae: {
    term: 'gynae',
    canonicalSpecialty: 'Gynaecologist & Obstetrician',
    subSpecialties: ['Obstetrics (Pregnancy & Birth)', 'Gynaecological Health', 'Fertility Care'],
    suggestedServices: ['Pap Smear', 'Antenatal Ultrasound', 'Contraception Consultation', 'Pelvic Health Exam'],
    navigationExplanation: 'Gynaecologists and Obstetricians manage female reproductive health and pregnancy.',
  },
  gynecologist: {
    term: 'gynecologist',
    canonicalSpecialty: 'Gynaecologist & Obstetrician',
    subSpecialties: ['Women\'s Health'],
    suggestedServices: ['Routine Gynae Exam', 'Pap Smear'],
  },
  pregnancy: {
    term: 'pregnancy',
    canonicalSpecialty: 'Gynaecologist & Obstetrician',
    subSpecialties: ['Obstetrics', 'Maternal Health'],
    suggestedServices: ['Antenatal Sonogram / Ultrasound', 'Prenatal Screening'],
  },
  'women doctor': {
    term: 'women doctor',
    canonicalSpecialty: 'Gynaecologist & Obstetrician',
    subSpecialties: ['Women\'s Health'],
    suggestedServices: ['Annual Well-Woman Check'],
  },

  // Mental Health
  therapist: {
    term: 'therapist',
    canonicalSpecialty: 'Psychologist / Therapist',
    subSpecialties: ['Clinical Psychology', 'Counselling Psychology', 'Cognitive Behavioural Therapy'],
    suggestedServices: ['Individual Psychotherapy', 'Stress & Burnout Therapy', 'Couples Counselling'],
    navigationExplanation: 'Psychologists and registered therapists provide talk therapy and mental health support.',
  },
  counselor: {
    term: 'counselor',
    canonicalSpecialty: 'Psychologist / Therapist',
    subSpecialties: ['Counselling Psychology'],
    suggestedServices: ['Supportive Counselling', 'Anxiety & Grief Management'],
  },
  psychologist: {
    term: 'psychologist',
    canonicalSpecialty: 'Psychologist / Therapist',
    subSpecialties: ['Clinical Psychology'],
    suggestedServices: ['CBT Therapy', 'Psychological Assessment'],
  },
  'mental health': {
    term: 'mental health',
    canonicalSpecialty: 'Psychologist / Therapist',
    subSpecialties: ['Psychology', 'Psychiatry'],
    suggestedServices: ['Mental Health Assessment', 'Therapy Session'],
  },

  // ENT & Hearing
  ent: {
    term: 'ent',
    canonicalSpecialty: 'ENT / Audiologist',
    subSpecialties: ['Otorhinolaryngology', 'Audiology', 'Sinus & Allergy Care'],
    suggestedServices: ['Hearing Assessment', 'Sinus Endoscopy', 'Tonsil & Adenoid Check', 'Ear Microsuction'],
    navigationExplanation: 'Ear, Nose & Throat (ENT) specialists and Audiologists treat auditory and upper airway conditions.',
  },
  'ear doctor': {
    term: 'ear doctor',
    canonicalSpecialty: 'ENT / Audiologist',
    subSpecialties: ['Audiology', 'Otorhinolaryngology'],
    suggestedServices: ['Hearing Test', 'Ear Wax Removal', 'Tinnitus Evaluation'],
  },
  sinus: {
    term: 'sinus',
    canonicalSpecialty: 'ENT / Audiologist',
    subSpecialties: ['Sinus Care', 'Rhinology'],
    suggestedServices: ['Sinus Assessment', 'Allergic Rhinitis Management'],
  },

  // Nutrition & Diet
  dietitian: {
    term: 'dietitian',
    canonicalSpecialty: 'Dietitian',
    subSpecialties: ['Clinical Nutrition', 'Sports Nutrition', 'Diabetic Meal Planning'],
    suggestedServices: ['Nutritional Assessment', 'Personalized Meal Plan', 'Metabolic Health Guidance'],
    navigationExplanation: 'Registered Dietitians translate medical nutrition science into actionable dietary plans.',
  },
  diet: {
    term: 'diet',
    canonicalSpecialty: 'Dietitian',
    subSpecialties: ['Clinical Nutrition'],
    suggestedServices: ['Dietary Consultation', 'Meal Planning'],
  },
  nutritionist: {
    term: 'nutritionist',
    canonicalSpecialty: 'Dietitian',
    subSpecialties: ['Dietetics & Nutrition'],
    suggestedServices: ['Nutritional Assessment'],
  },
};

export class SynonymService {
  /**
   * Resolve any user query to layperson synonym match if present
   */
  static resolveQuery(query: string): SpecialtySynonymMatch | null {
    if (!query || !query.trim()) return null;
    const clean = query.trim().toLowerCase();

    // Direct match
    if (SOUTH_AFRICAN_HEALTHCARE_SYNONYMS[clean]) {
      return SOUTH_AFRICAN_HEALTHCARE_SYNONYMS[clean];
    }

    // Substring or token match
    const words = clean.split(/\s+/);
    for (const word of words) {
      if (SOUTH_AFRICAN_HEALTHCARE_SYNONYMS[word]) {
        return SOUTH_AFRICAN_HEALTHCARE_SYNONYMS[word];
      }
    }

    // Compound phrases match
    for (const [key, match] of Object.entries(SOUTH_AFRICAN_HEALTHCARE_SYNONYMS)) {
      if (clean.includes(key)) {
        return match;
      }
    }

    return null;
  }

  /**
   * Get all canonical specialty recommendations
   */
  static getAllSpecialties(): string[] {
    const set = new Set<string>();
    for (const match of Object.values(SOUTH_AFRICAN_HEALTHCARE_SYNONYMS)) {
      set.add(match.canonicalSpecialty);
    }
    return Array.from(set);
  }
}
