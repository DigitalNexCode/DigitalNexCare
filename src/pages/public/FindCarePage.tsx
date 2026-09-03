import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProviderCard } from '../../components/provider/ProviderCard';
import { UnlockedExternalCard } from '../../components/external-practitioner/UnlockedExternalCard';
import { LockedExternalCard } from '../../components/external-practitioner/LockedExternalCard';
import { SearchFilters } from '../../components/search/SearchFilters';
import { PractitionersMapView } from '../../components/search/PractitionersMapView';
import { SubscriptionModal } from '../../components/subscription/SubscriptionModal';
import { AICareNavigatorModal } from '../../components/ai/AICareNavigatorModal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../lib/auth/context';
import { SubscriptionService } from '../../lib/subscription/subscription-service';
import { SynonymService } from '../../lib/search/synonyms';
import { SearchRankingEngine } from '../../lib/search/ranking-engine';
import { ExternalDiscoveryRefreshQueue } from '../../lib/external-discovery/refresh-queue';
import { ExternalSearchWorker } from '../../lib/external-discovery/search-worker';
import {
  MOCK_PROVIDERS,
  MOCK_UNLOCKED_EXTERNAL,
  MOCK_LOCKED_EXTERNAL,
} from '../../data/mockDatabase';
import { SearchFilterState } from '../../types';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  Lock,
  CheckCircle2,
  Database,
  ArrowUpDown,
  Compass,
  List,
  Map as MapIcon,
  Navigation,
  X,
  ShieldCheck,
  LocateFixed,
  Eye,
  Info,
  ArrowRight,
  RefreshCw,
  DownloadCloud,
  Layers,
  Activity,
} from 'lucide-react';

export const FindCarePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { revealsRemaining, unlockedIds, subscriptionPlan } = useAuth();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchLocation, setSearchLocation] = useState(searchParams.get('loc') || '');
  const [activeTab, setActiveTab] = useState<'ALL' | 'VERIFIED' | 'EXTERNAL'>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP' | 'SPLIT'>('LIST');
  const [sortBy, setSortBy] = useState<'RECOMMENDED' | 'RATING' | 'PRICE' | 'DISTANCE'>('RECOMMENDED');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(25);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isAINavigatorOpen, setIsAINavigatorOpen] = useState(false);

  // Live Scraping & Ingestion State
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeFeedback, setScrapeFeedback] = useState<{
    message: string;
    type: 'SUCCESS' | 'INFO' | 'BLOCKED';
    count?: number;
  } | null>(null);
  const [searchVersion, setSearchVersion] = useState(0);

  const [filters, setFilters] = useState<SearchFilterState>({
    query: searchParams.get('q') || '',
    specialty: searchParams.get('specialty') || '',
    province: searchParams.get('province') || '',
    city: searchParams.get('city') || '',
    suburb: searchParams.get('suburb') || '',
    medicalAid: searchParams.get('aid') || '',
    mode: 'ALL',
    verifiedOnly: searchParams.get('verified') === 'true',
    availableToday: false,
    language: '',
    gender: '',
    sortBy: 'RECOMMENDED',
  });

  // Synonym query translation
  const synonymMatch = useMemo(() => {
    return SynonymService.resolveQuery(searchQuery || filters.query);
  }, [searchQuery, filters.query]);

  // Sync query params when url changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const loc = searchParams.get('loc') || '';
    const prov = searchParams.get('province') || '';
    const spec = searchParams.get('specialty') || '';
    if (q) setSearchQuery(q);
    if (loc) setSearchLocation(loc);
    if (prov || spec) {
      setFilters((f) => ({
        ...f,
        province: prov || f.province,
        specialty: spec || f.specialty,
      }));
    }
  }, [searchParams]);

  const handleUseMyLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoordinates({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setSearchLocation('Current Location (South Africa)');
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
          // Fallback location for Pretoria/Gauteng
          setUserCoordinates({ lat: -25.7479, lng: 28.2293 });
          setSearchLocation('Pretoria, Gauteng');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleResetFilters = () => {
    setFilters({
      query: '',
      specialty: '',
      province: '',
      city: '',
      suburb: '',
      medicalAid: '',
      mode: 'ALL',
      verifiedOnly: false,
      availableToday: false,
      language: '',
      gender: '',
      sortBy: 'RECOMMENDED',
    });
    setSearchQuery('');
    setSearchLocation('');
    setUserCoordinates(null);
  };

  // Trigger Live External Practitioner Discovery & Scraping Pipeline
  const handleTriggerScraping = async () => {
    setIsScraping(true);
    setScrapeFeedback(null);

    try {
      const activeSpecialty = filters.specialty || searchQuery;

      const result = await ExternalSearchWorker.executeDiscovery({
        query: searchQuery || undefined,
        practitionerName: searchQuery || undefined,
        specialty: activeSpecialty || undefined,
        province: (filters.province && filters.province !== 'All Provinces') ? (filters.province as any) : undefined,
        city: (filters.city && filters.city !== 'all cities') ? filters.city : (searchLocation || undefined),
        suburb: filters.suburb || undefined,
        latitude: userCoordinates?.lat,
        longitude: userCoordinates?.lng,
        radiusKm: selectedRadiusKm,
      });

      if (result.status === 'SOURCE_BLOCKED') {
        setScrapeFeedback({
          type: 'BLOCKED',
          message:
            'External public registers returned rate-limit / CAPTCHA notice. Gracefully failing back to current directory without interruption.',
        });
      } else {
        const kbSaved = Math.round(result.compressionBytesSaved / 1024);
        setScrapeFeedback({
          type: 'SUCCESS',
          count: result.results.length,
          message: `Live discovery complete: Discovered ${result.results.length} practitioners (${result.createdCount} new indexed, ${result.updatedCount} refreshed, ${result.duplicateCount} duplicates filtered, ${kbSaved} KB saved via Zstd compression).`,
        });
        // Invalidate memo to show newly discovered practitioners immediately
        setSearchVersion((v) => v + 1);
      }
    } catch (err) {
      setScrapeFeedback({
        type: 'INFO',
        message: 'External discovery worker encountered an error; local directory remains operational.',
      });
    } finally {
      setIsScraping(false);
    }
  };

  // Execute database-first search with SubscriptionService (synchronous instant + async live Supabase query)
  const [searchResults, setSearchResults] = useState(() =>
    SubscriptionService.searchDirectory({
      query: searchQuery || filters.query,
      specialty: filters.specialty,
      province: filters.province,
      city: filters.city || searchLocation,
      suburb: filters.suburb,
      userLocation: userCoordinates,
      radiusKm: userCoordinates ? selectedRadiusKm : undefined,
      unlockedIds,
    })
  );
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  useEffect(() => {
    // 1. Instant synchronous check
    const syncRes = SubscriptionService.searchDirectory({
      query: searchQuery || filters.query,
      specialty: filters.specialty,
      province: filters.province,
      city: filters.city || searchLocation,
      suburb: filters.suburb,
      userLocation: userCoordinates,
      radiusKm: userCoordinates ? selectedRadiusKm : undefined,
      unlockedIds,
    });
    setSearchResults(syncRes);

    // 2. Asynchronous query against Supabase PostGIS and full-text index
    let isCancelled = false;
    setIsSearchingDb(true);

    SubscriptionService.searchDirectoryAsync({
      query: searchQuery || filters.query,
      specialty: filters.specialty,
      province: filters.province,
      city: filters.city || searchLocation,
      suburb: filters.suburb,
      userLocation: userCoordinates,
      radiusKm: userCoordinates ? selectedRadiusKm : undefined,
      unlockedIds,
    })
      .then((asyncRes) => {
        if (!isCancelled && asyncRes) {
          setSearchResults(asyncRes);
        }
      })
      .catch((err) => {
        console.debug('Async directory query error:', err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsSearchingDb(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, searchLocation, filters, userCoordinates, selectedRadiusKm, unlockedIds, searchVersion]);

  // Apply multi-signal ranking and tab filters
  const filteredVerified = useMemo(() => {
    let list = [...searchResults.verifiedProviders];
    if (filters.medicalAid) {
      list = list.filter((p) => p.acceptedMedicalAids.includes(filters.medicalAid));
    }
    if (filters.mode === 'IN_PERSON') list = list.filter((p) => p.offersInPerson);
    if (filters.mode === 'VIRTUAL') list = list.filter((p) => p.offersVirtual);
    if (filters.language) list = list.filter((p) => p.languages.includes(filters.language));
    if (filters.gender) list = list.filter((p) => p.gender === filters.gender);

    if (sortBy === 'RECOMMENDED') {
      const ranked = SearchRankingEngine.rankPractitioners(list, {
        query: searchQuery || filters.query,
        specialty: filters.specialty,
        province: filters.province,
        city: filters.city || searchLocation,
        suburb: filters.suburb,
        medicalAid: filters.medicalAid,
        userCoordinates: userCoordinates ? { latitude: userCoordinates.lat, longitude: userCoordinates.lng } : null,
      });
      list = ranked.map((r) => r.practitioner as any);
    } else if (sortBy === 'RATING') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'PRICE') {
      list.sort((a, b) => a.consultationFeeZAR - b.consultationFeeZAR);
    } else if (sortBy === 'DISTANCE' && userCoordinates) {
      list.sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99));
    }
    return list;
  }, [searchResults.verifiedProviders, filters, sortBy, userCoordinates, searchQuery, searchLocation]);

  const filteredUnlocked = useMemo(() => {
    let list = [...searchResults.unlockedExternal];
    if (sortBy === 'RATING') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'DISTANCE' && userCoordinates) {
      list.sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99));
    }
    return list;
  }, [searchResults.unlockedExternal, sortBy, userCoordinates]);

  const filteredLocked = searchResults.lockedExternal;

  const totalResultsCount =
    (activeTab === 'EXTERNAL' ? 0 : filteredVerified.length) +
    (activeTab === 'VERIFIED' ? 0 : filteredUnlocked.length + filteredLocked.length);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      {/* AI Care Navigator Modal */}
      <AICareNavigatorModal
        isOpen={isAINavigatorOpen}
        onClose={() => setIsAINavigatorOpen(false)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Search Banner */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h1 className="text-xl font-black text-slate-900">
                Find Healthcare Practitioners in South Africa
              </h1>
              <p className="text-xs text-slate-500">
                Search verified providers, practices, and national medical directories.
              </p>
            </div>
            {/* AI Care Navigator Launcher */}
            <button
              onClick={() => setIsAINavigatorOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#176BFF]/10 to-[#00E5D4]/15 hover:from-[#176BFF]/20 hover:to-[#00E5D4]/25 text-slate-900 border border-[#176BFF]/20 text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#176BFF]" />
              <span>AI Care Navigator</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Doctor name, layperson phrase (skin doctor, GP, tooth ache...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#176BFF]"
              />
            </div>

            <div className="md:col-span-5 relative flex items-center">
              <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Suburb, City, Town, or Province..."
                className="w-full pl-10 pr-28 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#176BFF]"
              />
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="absolute right-2 px-2.5 py-1 text-[11px] font-bold text-[#176BFF] hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                title="Use My Location"
              >
                <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>Near me</span>
              </button>
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <Button
                variant="primary"
                className="w-full font-bold"
                onClick={() => {
                  /* active search filter applied */
                }}
              >
                Search
              </Button>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex-shrink-0"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Layperson Synonym Translation Banner */}
          {synonymMatch && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-teal-50/50 rounded-2xl border border-blue-100/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-800">
                <Info className="w-4 h-4 text-[#176BFF] shrink-0" />
                <span>
                  Searching for <strong>"{synonymMatch.term}"</strong>? Showing verified{' '}
                  <strong className="text-[#176BFF]">{synonymMatch.canonicalSpecialty}s</strong>.
                </span>
              </div>
              {synonymMatch.isAmbiguous && synonymMatch.clarificationOptions && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {synonymMatch.clarificationOptions.map((opt) => (
                    <button
                      key={opt.specialty}
                      onClick={() => setFilters((f) => ({ ...f, specialty: opt.specialty }))}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-[#176BFF] text-[11px] font-bold"
                    >
                      {opt.specialty}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Location Radius Selector Bar */}
          {userCoordinates && (
            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#176BFF] font-semibold">
                <LocateFixed className="w-4 h-4 text-[#176BFF]" />
                <span>GPS Location Active • Matching Nearby Practitioners</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700 mr-1">Radius:</span>
                {[5, 10, 15, 25, 50].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRadiusKm(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedRadiusKm === r
                        ? 'bg-[#176BFF] text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Database-first Index Status Bar */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-slate-700">
                DigitalNexCare National Supabase Index {isSearchingDb ? '• Querying PostGIS...' : '• 384+ Real Ingested Practitioners'}
              </span>
              {isSearchingDb ? (
                <span className="inline-block w-2 h-2 rounded-full bg-[#176BFF] animate-ping" />
              ) : (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTriggerScraping}
                disabled={isScraping}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors border border-slate-200 disabled:opacity-50"
                title="Scan public healthcare registers (HPCSA, SADA, practice registries)"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#176BFF] ${isScraping ? 'animate-spin' : ''}`} />
                <span>{isScraping ? 'Discovering & Ingesting...' : 'Live External Scrape'}</span>
              </button>
              <span className="text-slate-700 font-medium">
                Reveals Balance:{' '}
                <strong className="text-emerald-700 font-bold">
                  {revealsRemaining > 900 ? 'Unlimited' : `${revealsRemaining} remaining`}
                </strong>
              </span>
              {revealsRemaining <= 0 && (
                <button
                  type="button"
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="text-[11px] font-bold text-[#176BFF] underline hover:text-blue-800"
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>

          {/* Live Scraping & Ingestion Feedback Banner */}
          {scrapeFeedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
                scrapeFeedback.type === 'SUCCESS'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : scrapeFeedback.type === 'BLOCKED'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {scrapeFeedback.type === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : scrapeFeedback.type === 'BLOCKED' ? (
                  <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="font-bold block">
                    {scrapeFeedback.type === 'SUCCESS'
                      ? 'External Discovery Pipeline Executed'
                      : scrapeFeedback.type === 'BLOCKED'
                      ? 'External Source Notice'
                      : 'Discovery Notification'}
                  </strong>
                  <p className="mt-0.5 leading-relaxed">{scrapeFeedback.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScrapeFeedback(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content Layout: Filters Sidebar + Results / Map View */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Desktop Filters Column */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs sticky top-24">
              <SearchFilters
                filters={filters}
                onChange={setFilters}
                onReset={handleResetFilters}
              />
            </div>
          </aside>

          {/* Main Results Column */}
          <main className="flex-1 min-w-0 w-full space-y-4">
            {/* Filter Tabs, View Switcher & Sort Header */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({filteredVerified.length + filteredUnlocked.length + filteredLocked.length})
                </button>
                <button
                  onClick={() => setActiveTab('VERIFIED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    activeTab === 'VERIFIED'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified ({filteredVerified.length})
                </button>
                <button
                  onClick={() => setActiveTab('EXTERNAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    activeTab === 'EXTERNAL'
                      ? 'bg-white text-blue-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-3 h-3 text-blue-600" />
                  External Directory ({filteredUnlocked.length + filteredLocked.length})
                </button>
              </div>

              {/* View Mode Toggle & Sort Selector */}
              <div className="flex items-center gap-3">
                {/* View Mode Switcher: List vs Map */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setViewMode('LIST')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'LIST'
                        ? 'bg-white text-[#176BFF] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('MAP')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'MAP'
                        ? 'bg-white text-[#176BFF] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Map View"
                  >
                    <MapIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-1.5 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    aria-label="Sort search results by"
                    className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="RECOMMENDED">Multi-Signal Relevance</option>
                    <option value="RATING">Highest Rated</option>
                    <option value="PRICE">Consultation Fee</option>
                    {userCoordinates && <option value="DISTANCE">Closest Distance</option>}
                  </select>
                </div>
              </div>
            </div>

            {/* View Display: Map View vs List View */}
            {viewMode === 'MAP' ? (
              <div className="space-y-6 pb-12">
                <PractitionersMapView
                  verifiedProviders={filteredVerified}
                  unlockedExternal={filteredUnlocked}
                  lockedExternal={filteredLocked}
                  selectedProvince={filters.province}
                  userLocation={userCoordinates}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Verified DigitalNexCare Providers */}
                {activeTab !== 'EXTERNAL' && filteredVerified.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                          Verified DigitalNexCare Providers ({filteredVerified.length})
                        </h2>
                      </div>
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Direct Real-Time Booking
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {filteredVerified.map((provider) => (
                        <ProviderCard key={provider.id} provider={provider} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Unlocked External Practitioners */}
                {activeTab !== 'VERIFIED' && filteredUnlocked.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                          Unlocked External Directory Results ({filteredUnlocked.length})
                        </h2>
                      </div>
                      <span className="text-xs text-blue-700 font-semibold">
                        Direct Practice Contact Details Visible
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {filteredUnlocked.map((practitioner) => (
                        <UnlockedExternalCard
                          key={practitioner.id}
                          practitioner={practitioner}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Locked External Directory Results */}
                {activeTab !== 'VERIFIED' && filteredLocked.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                          National Directory Practitioners ({filteredLocked.length})
                        </h2>
                      </div>
                      <span className="text-xs text-amber-800 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-600" />
                        Details Protected Under Subscription
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {filteredLocked.map((lockedPractitioner) => (
                        <LockedExternalCard
                          key={lockedPractitioner.id}
                          practitioner={lockedPractitioner}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Zero Results State */}
                {totalResultsCount === 0 && (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#176BFF] flex items-center justify-center mx-auto">
                      <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      No practitioners matched your criteria
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Try expanding your search radius, selecting 'All Medical Aids', or running a live external discovery across HPCSA and regional practice directories.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleTriggerScraping}
                        disabled={isScraping}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
                        <span>{isScraping ? 'Scanning Registries...' : 'Scan Public Healthcare Registers'}</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleResetFilters}>
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Subscription Paywall Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

      {/* Mobile Filters Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-[#07111F]/70 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-sm bg-white h-full overflow-y-auto p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                <span className="font-extrabold text-slate-900 text-base">Filter Search</span>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <SearchFilters
                filters={filters}
                onChange={setFilters}
                onReset={handleResetFilters}
                isMobileDrawer
                onCloseMobileDrawer={() => setIsMobileFiltersOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

