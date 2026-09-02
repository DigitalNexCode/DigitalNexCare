-- DigitalNexCare Schema Migration 01: Core Schema, Extensions & Directory
-- Permanent Constitution Chunk 2

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Core Enumerations
CREATE TYPE user_role_enum AS ENUM (
  'PATIENT',
  'PROVIDER',
  'PRACTICE_MANAGER',
  'RECEPTION_SCHEDULER',
  'FINANCE_BILLING',
  'VERIFIER_TRUST_OPS',
  'PLATFORM_ADMIN',
  'SUPER_ADMIN',
  'ENTERPRISE_PARTNER'
);

CREATE TYPE practitioner_type_enum AS ENUM (
  'DIGITALNEXCARE_PROVIDER',
  'EXTERNAL_PRACTITIONER'
);

CREATE TYPE claim_status_enum AS ENUM (
  'UNCLAIMED',
  'CLAIM_REQUESTED',
  'UNDER_REVIEW',
  'CLAIMED',
  'REJECTED',
  'DISPUTED'
);

CREATE TYPE verification_status_enum AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'MORE_INFORMATION_REQUIRED',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
  'EXPIRED'
);

CREATE TYPE data_authority_enum AS ENUM (
  'DIGITALNEXCARE_VERIFIED_PROVIDER',
  'PRACTITIONER_CONFIRMED',
  'ADMIN_VERIFIED',
  'AUTHORITATIVE_PROFESSIONAL_REGISTER',
  'PRACTICE_WEBSITE',
  'OTHER_APPROVED_EXTERNAL_SOURCE'
);

CREATE TYPE province_enum AS ENUM (
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape'
);

CREATE TYPE subscription_tier_enum AS ENUM (
  'NEXCARE_FREE',
  'NEXCARE_ACCESS',
  'NEXCARE_PLUS',
  'NEXCARE_FAMILY'
);

CREATE TYPE appointment_status_enum AS ENUM (
  'HELD',
  'CONFIRMED',
  'RESCHEDULED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW'
);

-- 3. Core IAM & User Management Tables

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  normalized_phone TEXT,
  national_id_or_passport TEXT,
  date_of_birth DATE,
  gender TEXT,
  avatar_url TEXT,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL DEFAULT 'PATIENT',
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT,
  practice_number TEXT,
  primary_phone TEXT,
  primary_email TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organisation_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL DEFAULT 'PRACTICE_MANAGER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organisation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'POPIA_DATA_PROCESSING', 'TERMS_OF_SERVICE', 'MARKETING'
  version TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_role user_role_enum,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  entity_id UUID,
  diff JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Taxonomy & Specialties
CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  typical_duration_minutes INT DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.visit_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Primary Practitioner Directory (Supabase Searchable Index)
CREATE TABLE IF NOT EXISTS public.practitioner_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  title TEXT, -- 'Dr', 'Prof', 'Sr'
  practice_name TEXT,
  normalized_practice_name TEXT,
  primary_category_id UUID REFERENCES public.specialties(id),
  professional_registration_number TEXT,
  public_phone TEXT,
  normalized_phone TEXT,
  public_email TEXT,
  website TEXT,
  address_line TEXT,
  suburb TEXT NOT NULL,
  city TEXT NOT NULL,
  province province_enum NOT NULL,
  postal_code TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location geography(Point, 4326),
  practitioner_fingerprint TEXT NOT NULL UNIQUE,
  practitioner_type practitioner_type_enum NOT NULL DEFAULT 'EXTERNAL_PRACTITIONER',
  is_joined BOOLEAN NOT NULL DEFAULT FALSE,
  is_bookable BOOLEAN NOT NULL DEFAULT FALSE,
  provider_id UUID, -- References public.providers(id) when joined
  practice_id UUID REFERENCES public.organisations(id),
  location_id UUID,
  claim_status claim_status_enum NOT NULL DEFAULT 'UNCLAIMED',
  verification_status verification_status_enum NOT NULL DEFAULT 'DRAFT',
  freshness_status TEXT NOT NULL DEFAULT 'FRESH',
  data_authority data_authority_enum NOT NULL DEFAULT 'OTHER_APPROVED_EXTERNAL_SOURCE',
  rating NUMERIC(3,2) DEFAULT 5.00,
  review_count INT DEFAULT 0,
  offers_virtual BOOLEAN NOT NULL DEFAULT FALSE,
  offers_in_person BOOLEAN NOT NULL DEFAULT TRUE,
  source_attribution TEXT DEFAULT 'DigitalNexCare National Index',
  first_discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_provider_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PostGIS and Trigram Indexes for Lightning Fast Search
CREATE INDEX IF NOT EXISTS idx_practitioner_location ON public.practitioner_directory USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_practitioner_norm_name_trgm ON public.practitioner_directory USING GIN (normalized_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_practitioner_norm_practice_trgm ON public.practitioner_directory USING GIN (normalized_practice_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_practitioner_suburb ON public.practitioner_directory (suburb);
CREATE INDEX IF NOT EXISTS idx_practitioner_city ON public.practitioner_directory (city);
CREATE INDEX IF NOT EXISTS idx_practitioner_province ON public.practitioner_directory (province);
CREATE INDEX IF NOT EXISTS idx_practitioner_claim ON public.practitioner_directory (claim_status);

-- Junction Tables for Directory
CREATE TABLE IF NOT EXISTS public.practitioner_directory_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES public.practitioner_directory(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(practitioner_id, specialty_id)
);

CREATE TABLE IF NOT EXISTS public.practitioner_directory_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES public.practitioner_directory(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  UNIQUE(practitioner_id, service_id)
);

-- 6. Source Provenance & Snapshots
CREATE TABLE IF NOT EXISTS public.practitioner_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES public.practitioner_directory(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_reference TEXT,
  priority INT NOT NULL DEFAULT 50,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.90,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  admin_verified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.practitioner_source_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID REFERENCES public.practitioner_directory(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  compression TEXT NOT NULL DEFAULT 'Zstandard', -- 'Zstandard' or 'GZIP'
  content_hash TEXT NOT NULL,
  raw_size_bytes BIGINT NOT NULL,
  compressed_size_bytes BIGINT NOT NULL,
  metadata JSONB,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Ingestion Jobs, Deduplication & Conflict Management
CREATE TABLE IF NOT EXISTS public.practitioner_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT,
  area TEXT,
  province province_enum NOT NULL,
  city TEXT,
  category TEXT,
  specialty TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  results_found INT NOT NULL DEFAULT 0,
  created_count INT NOT NULL DEFAULT 0,
  updated_count INT NOT NULL DEFAULT 0,
  duplicates_count INT NOT NULL DEFAULT 0,
  errors_count INT NOT NULL DEFAULT 0,
  error_log TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.practitioner_duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.practitioner_directory(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.practitioner_directory(id) ON DELETE CASCADE,
  confidence_score NUMERIC(3,2) NOT NULL,
  match_reasons JSONB,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'MERGED', 'DISMISSED'
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.practitioner_data_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES public.practitioner_directory(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  existing_value TEXT,
  existing_authority data_authority_enum NOT NULL,
  incoming_value TEXT,
  incoming_authority data_authority_enum NOT NULL,
  source_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'RESOLVED_RETAINED', 'RESOLVED_OVERWRITTEN'
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_external_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  practitioner_directory_id UUID NOT NULL REFERENCES public.practitioner_directory(id) ON DELETE CASCADE,
  claim_status claim_status_enum NOT NULL DEFAULT 'CLAIM_REQUESTED',
  verification_notes TEXT,
  proof_documents JSONB,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
