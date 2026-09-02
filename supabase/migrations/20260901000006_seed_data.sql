-- DigitalNexCare Schema Migration 06: Seed Data & Buckets
-- Permanent Constitution Chunk 2

-- 1. Create Private Storage Bucket for Snapshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'practitioner-source-snapshots',
  'practitioner-source-snapshots',
  FALSE,
  52428800, -- 50MB
  ARRAY['application/json', 'application/gzip', 'application/zstd', 'text/plain']
) ON CONFLICT (id) DO UPDATE SET public = FALSE;

-- 2. Seed Patient Subscription Plans
INSERT INTO public.patient_subscription_plans (
  id,
  name,
  tagline,
  price_cents,
  monthly_external_reveals,
  is_popular,
  features
) VALUES
  (
    'NEXCARE_FREE',
    'NexCare Free',
    'Essential healthcare discovery across South Africa',
    0,
    2,
    FALSE,
    '["Direct booking of joined DigitalNexCare providers (Free forever)", "2 unique external practitioner contact reveals / month", "Medical aid compatibility checks", "Search by specialty, suburb, city, and province", "Appointment reminders and digital booking history"]'::jsonb
  ),
  (
    'NEXCARE_ACCESS',
    'NexCare Access',
    'Increased monthly external practitioner unlocks for active patients',
    5000, -- R50.00
    5,
    FALSE,
    '["5 unique external practitioner reveals / month", "Full unlocked phone, website, email & address", "Directions and map navigation", "Saved practitioners directory", "Reveal history & quick-dial access", "Direct booking of joined DigitalNexCare providers"]'::jsonb
  ),
  (
    'NEXCARE_PLUS',
    'NexCare Plus',
    'Comprehensive healthcare discovery with advanced search filters',
    10000, -- R100.00
    20,
    TRUE,
    '["20 unique external practitioner reveals / month", "Advanced practitioner comparison matrix", "Broader radius & GPS location searching", "Saved custom provider lists", "Medical aid network priority matching", "Export practice contact details", "Direct booking of joined DigitalNexCare providers"]'::jsonb
  ),
  (
    'NEXCARE_FAMILY',
    'NexCare Family',
    'Unlimited healthcare access for your entire household',
    25000, -- R250.00
    NULL, -- Reasonable-use unlimited
    FALSE,
    '["Reasonable-use unlimited external reveals for household", "Shared family saved practitioner lists", "Dependant medical aid management", "Authorised household booking delegation", "Priority concierge patient support", "Direct booking of joined DigitalNexCare providers"]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  price_cents = EXCLUDED.price_cents,
  monthly_external_reveals = EXCLUDED.monthly_external_reveals,
  is_popular = EXCLUDED.is_popular,
  features = EXCLUDED.features;

-- 3. Seed Medical Schemes
INSERT INTO public.medical_schemes (code, name, administrator, is_active)
VALUES
  ('DISCOVERY', 'Discovery Health Medical Scheme', 'Discovery Health', TRUE),
  ('GEMS', 'Government Employees Medical Scheme (GEMS)', 'Metropolitan Health', TRUE),
  ('BONITAS', 'Bonitas Medical Fund', 'Medscheme', TRUE),
  ('MOMENTUM', 'Momentum Medical Scheme', 'Momentum Health Solutions', TRUE),
  ('MEDIHELP', 'Medihelp', 'Medihelp', TRUE),
  ('BESTMED', 'Bestmed Medical Scheme', 'Bestmed', TRUE),
  ('MEDSHIELD', 'Medshield Medical Scheme', 'Medshield', TRUE),
  ('FEDHEALTH', 'Fedhealth', 'Medscheme', TRUE),
  ('PROFMED', 'Profmed', 'PPS Healthcare', TRUE),
  ('COMPCARE', 'CompCare Medical Scheme', 'Universal Healthcare', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 4. Seed Specialties
INSERT INTO public.specialties (code, name, description, icon_name, is_popular)
VALUES
  ('GP', 'General Practitioner', 'Primary healthcare, diagnosis, prescriptions, and health checkups', 'Stethoscope', TRUE),
  ('DENTIST', 'Dentist & Dental Surgeon', 'Oral health, teeth cleaning, fillings, orthodontics, and implants', 'Smile', TRUE),
  ('PAEDIATRICIAN', 'Paediatrician', 'Specialised medical care for infants, children, and adolescents', 'Baby', TRUE),
  ('GYNAECOLOGIST', 'Obstetrician & Gynaecologist', 'Women''s reproductive health, pregnancy, and prenatal care', 'HeartPulse', TRUE),
  ('PSYCHOLOGIST', 'Clinical Psychologist', 'Mental health therapy, counseling, and emotional wellbeing', 'Brain', TRUE),
  ('PHYSIO', 'Physiotherapist', 'Rehabilitation, muscle pain, sports injuries, and mobility recovery', 'Activity', TRUE),
  ('DERMATOLOGIST', 'Dermatologist', 'Skin, hair, nails, acne treatment, and mole screening', 'Sparkles', TRUE),
  ('OPTOMETRIST', 'Optometrist', 'Eye examinations, vision testing, spectacles, and contact lenses', 'Eye', TRUE),
  ('ORTHOPAEDIC', 'Orthopaedic Surgeon', 'Bones, joints, ligaments, tendons, and musculoskeletal surgery', 'Shield', FALSE),
  ('AUDIOLOGIST', 'Audiologist & Speech Therapist', 'Hearing evaluations, hearing aids, and speech therapy', 'Ear', FALSE),
  ('PODIATRIST', 'Podiatrist', 'Foot and ankle health, orthotics, and diabetic foot care', 'Footprints', FALSE),
  ('DIETITIAN', 'Registered Dietitian', 'Clinical nutrition, meal planning, and metabolic conditions', 'Apple', FALSE)
ON CONFLICT (code) DO NOTHING;
