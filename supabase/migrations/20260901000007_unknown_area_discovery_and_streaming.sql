-- ==============================================================================
-- DIGITALNEXCARE MIGRATION 20260901000007
-- CHUNK 3B: UNKNOWN AREA DISCOVERY, LIVE SEARCH, STREAMING & AREA CACHING
-- ==============================================================================

-- 1. South African National Locations Index (sa_locations)
CREATE TABLE IF NOT EXISTS public.sa_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL DEFAULT 'South Africa',
  country_code TEXT NOT NULL DEFAULT 'ZA',
  province TEXT NOT NULL,
  municipality TEXT,
  city_town TEXT,
  suburb TEXT,
  area_name TEXT NOT NULL,
  normalized_area_name TEXT NOT NULL,
  search_aliases TEXT[] NOT NULL DEFAULT '{}',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  location GEOGRAPHY(POINT, 4326),
  source_type TEXT NOT NULL DEFAULT 'SEEDED_DIRECTORY' CHECK (source_type IN ('SEEDED_DIRECTORY', 'EXTERNAL_DISCOVERY', 'USER_PROVISIONAL', 'GEOCODED')),
  discovery_status TEXT NOT NULL DEFAULT 'KNOWN' CHECK (discovery_status IN ('KNOWN', 'DISCOVERING', 'DISCOVERED', 'NO_RESULTS_YET', 'STALE', 'FAILED_TEMPORARILY')),
  coverage_status TEXT NOT NULL DEFAULT 'PARTIAL_COVERAGE' CHECK (coverage_status IN ('NO_RESULTS_YET', 'PARTIAL_COVERAGE', 'FULLER_COVERAGE')),
  first_discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_ingested_at TIMESTAMPTZ,
  practitioner_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid area lookup and spatial query
CREATE INDEX IF NOT EXISTS idx_sa_locations_normalized_area ON public.sa_locations (normalized_area_name);
CREATE INDEX IF NOT EXISTS idx_sa_locations_province ON public.sa_locations (province);
CREATE INDEX IF NOT EXISTS idx_sa_locations_city_town ON public.sa_locations (city_town);
CREATE INDEX IF NOT EXISTS idx_sa_locations_discovery_status ON public.sa_locations (discovery_status);
CREATE INDEX IF NOT EXISTS idx_sa_locations_geom ON public.sa_locations USING GIST (location);

-- 2. Area Practitioner Coverage Index (area_practitioner_coverage)
CREATE TABLE IF NOT EXISTS public.area_practitioner_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES public.sa_locations(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  province TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  specialty_id TEXT,
  specialty_name TEXT,
  records_count INTEGER NOT NULL DEFAULT 0,
  coverage_status TEXT NOT NULL DEFAULT 'NO_RESULTS_YET' CHECK (coverage_status IN ('NO_RESULTS_YET', 'PARTIAL_COVERAGE', 'FULLER_COVERAGE')),
  last_ingested_at TIMESTAMPTZ,
  last_search_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_refresh_at TIMESTAMPTZ,
  external_search_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(area_id, category_id, specialty_id)
);

CREATE INDEX IF NOT EXISTS idx_area_coverage_area_cat ON public.area_practitioner_coverage (area_id, category_id);
CREATE INDEX IF NOT EXISTS idx_area_coverage_status ON public.area_practitioner_coverage (coverage_status);

-- 3. Live Practitioner Searches Session Table (live_practitioner_searches)
CREATE TABLE IF NOT EXISTS public.live_practitioner_searches (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  area_id UUID REFERENCES public.sa_locations(id) ON DELETE SET NULL,
  area_name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'SEARCHING_DATABASE', 'DATABASE_RESULTS_READY', 'EXTERNAL_DISCOVERY_STARTED', 'STREAMING_RESULTS', 'COMPLETED', 'PARTIAL', 'NO_RESULTS', 'FAILED')),
  status_message TEXT NOT NULL DEFAULT 'Initializing search...',
  cached_results_count INTEGER NOT NULL DEFAULT 0,
  external_results_count INTEGER NOT NULL DEFAULT 0,
  total_results_count INTEGER NOT NULL DEFAULT 0,
  time_to_first_db_result_ms INTEGER,
  time_to_first_external_result_ms INTEGER,
  external_search_total_ms INTEGER,
  number_streamed INTEGER NOT NULL DEFAULT 0,
  number_saved INTEGER NOT NULL DEFAULT 0,
  number_updated INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_result_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_searches_area ON public.live_practitioner_searches (area_name);
CREATE INDEX IF NOT EXISTS idx_live_searches_status ON public.live_practitioner_searches (status);

-- 4. Enable RLS
ALTER TABLE public.sa_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_practitioner_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_practitioner_searches ENABLE ROW LEVEL SECURITY;

-- Public read access for discovery
CREATE POLICY "Public can view locations" ON public.sa_locations FOR SELECT USING (true);
CREATE POLICY "Public can view area coverage" ON public.area_practitioner_coverage FOR SELECT USING (true);
CREATE POLICY "Public can view live searches" ON public.live_practitioner_searches FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role manages locations" ON public.sa_locations FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role manages coverage" ON public.area_practitioner_coverage FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role manages searches" ON public.live_practitioner_searches FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
