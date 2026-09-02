import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProviderLayout } from '../../components/layout/ProviderLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import {
  Search,
  Building,
  MapPin,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Globe,
  PlusCircle,
  HelpCircle,
  AlertCircle,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { ProviderService, PractitionerClaimRecord } from '../../lib/provider/provider-service';
import { SA_PROVINCES } from '../../lib/constants';
import { DigitalNexCareProvider, ExternalPractitionerUnlocked } from '../../types';

export const ProviderFindExistingPage: React.FC = () => {
  const navigate = useNavigate();

  // Search Form State
  const [practitionerName, setPractitionerName] = useState('Anel Botha');
  const [practiceName, setPracticeName] = useState('Botha Dental Studio');
  const [locationQuery, setLocationQuery] = useState('Pretoria');
  const [selectedProvince, setSelectedProvince] = useState('Gauteng');

  // Results State
  const [hasSearched, setHasSearched] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSource, setSearchSource] = useState<'SUPABASE' | 'EXTERNAL_DISCOVERY'>('SUPABASE');
  const [candidates, setCandidates] = useState<(DigitalNexCareProvider | ExternalPractitionerUnlocked)[]>([
    {
      id: 'ext-002',
      slug: 'pretoria-east-dental-studio',
      practitionerType: 'EXTERNAL_PRACTITIONER',
      fullName: 'Dr. Anel Botha',
      title: 'Dr.',
      specialty: 'Dentist',
      services: ['Routine Dental Exam', 'Teeth Cleaning', 'Paediatric Dentistry', 'Extractions'],
      practiceName: 'Botha Dental Studio Pretoria East',
      province: 'Gauteng',
      city: 'Pretoria',
      suburb: 'Faerie Glen',
      address: '740 Atterbury Road, Faerie Glen, Pretoria, 0081',
      coordinates: { latitude: -25.7876, longitude: 28.312 },
      rating: 4.7,
      reviewCount: 52,
      languages: ['English', 'Afrikaans'],
      gender: 'FEMALE',
      acceptedMedicalAids: ['Discovery Health', 'Bonitas', 'Fedhealth'],
      offersVirtual: false,
      offersInPerson: true,
      phone: '+27 12 991 3004',
      email: 'reception@bothadental.co.za',
      website: 'https://bothadental.co.za',
      sourceAttribution: 'Gauteng Health Register & Public Practice Directory',
      dataAuthority: 'OTHER_APPROVED_EXTERNAL_SOURCE',
      claimStatus: 'UNCLAIMED',
      lastVerifiedAt: '2026-06-20T12:00:00Z',
    },
  ]);

  // Active Claim Modal / Drawer State
  const [activeClaimCandidate, setActiveClaimCandidate] = useState<(DigitalNexCareProvider | ExternalPractitionerUnlocked) | null>(null);
  const [claimCouncil, setClaimCouncil] = useState<'HPCSA' | 'SADA' | 'SANC' | 'SAPC' | 'AHPCSA'>('HPCSA');
  const [claimRegNumber, setClaimRegNumber] = useState('DP 0519821');
  const [claimPracticeNumber, setClaimPracticeNumber] = useState('0182736');
  const [claimantPhone, setClaimantPhone] = useState('+27 12 991 3004');
  const [claimantEmail, setClaimantEmail] = useState('dr.botha@faerieglen.co.za');
  const [claimSubmitted, setClaimSubmitted] = useState<PractitionerClaimRecord | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    try {
      const res = await ProviderService.searchExistingPractitioners({
        name: practitionerName,
        practice: practiceName,
        location: locationQuery || selectedProvince,
      });
      setCandidates(res.results);
      setSearchSource(res.source);
      setHasSearched(true);
      setClaimSubmitted(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInitiateClaim = (candidate: DigitalNexCareProvider | ExternalPractitionerUnlocked) => {
    setActiveClaimCandidate(candidate);
  };

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClaimCandidate) return;

    const claim = ProviderService.createClaim({
      practitionerId: activeClaimCandidate.id,
      claimantUserId: 'usr-provider-active',
      claimantName: activeClaimCandidate.fullName,
      claimantEmail,
      claimantPhone,
      council: claimCouncil,
      registrationNumber: claimRegNumber,
      practiceNumber: claimPracticeNumber,
      practiceName: activeClaimCandidate.practiceName,
      directoryCandidate: {
        name: activeClaimCandidate.fullName,
        specialty: activeClaimCandidate.specialty,
        practice: activeClaimCandidate.practiceName,
        location: `${activeClaimCandidate.suburb}, ${activeClaimCandidate.city}, ${activeClaimCandidate.province}`,
        source: 'sourceAttribution' in activeClaimCandidate ? (activeClaimCandidate as any).sourceAttribution : 'DigitalNexCare National Index',
      },
    });

    setClaimSubmitted(claim);
    setActiveClaimCandidate(null);
  };

  return (
    <ProviderLayout
      title="Find Your Existing Profile"
      subtitle="DigitalNexCare indexes public healthcare practitioners in South Africa. Claim your pre-existing record or create a new practice."
    >
      <div className="space-y-6">
        {/* Onboarding Directive Banner */}
        <div className="bg-[#07111F] text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#176BFF] to-[#00E5D4] flex items-center justify-center flex-shrink-0 text-slate-900 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-900/60 text-[#00E5D4] border border-blue-700/50">
                <span>Section 18 & 19 Compliance Workflow</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Find Your Existing Practitioner or Practice Profile
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                Before registering a new record, we query the <strong>Supabase Practitioner Directory</strong> to see if your facility or statutory council profile is already indexed. If found, you can claim your profile and proceed directly to verification.
              </p>
            </div>
          </div>
        </div>

        {/* Search Panel */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Search the South African Health Directory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your professional name, practice rooms name, or municipal location.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Practitioner Name"
                value={practitionerName}
                onChange={(e) => setPractitionerName(e.target.value)}
                placeholder="e.g. Dr. Anel Botha"
                leftIcon={<Stethoscope className="w-4 h-4" />}
              />

              <Input
                label="Practice / Facility Name"
                value={practiceName}
                onChange={(e) => setPracticeName(e.target.value)}
                placeholder="e.g. Botha Dental Studio"
                leftIcon={<Building className="w-4 h-4" />}
              />

              <Input
                label="City / Suburb / Town"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="e.g. Pretoria / Faerie Glen"
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Search Strategy:</span>
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                  <DatabaseIcon /> Supabase First → External Fallback
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSearching}
                  leftIcon={<Search className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Search National Index
                </Button>
                <Link to="/provider/manual-registration">
                  <Button
                    type="button"
                    variant="outline"
                    leftIcon={<PlusCircle className="w-4 h-4" />}
                  >
                    Create Manually
                  </Button>
                </Link>
              </div>
            </div>
          </form>

          {/* Search Result Candidates */}
          {hasSearched && (
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span>Matched Practitioner Candidates</span>
                  <Badge variant="brand" size="sm">
                    {candidates.length} Found ({searchSource})
                  </Badge>
                </div>
              </div>

              {candidates.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="text-base font-bold text-slate-900">
                    No matching practitioner record was found
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    We could not locate your profile in the current index. You can adjust your search keywords or register your practice directly.
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPractitionerName('');
                        setPracticeName('');
                        setLocationQuery('');
                      }}
                    >
                      SEARCH AGAIN
                    </Button>
                    <Link to="/provider/manual-registration">
                      <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                        CREATE MANUALLY
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="bg-blue-50/70 border border-blue-200 rounded-3xl p-6 sm:p-7 space-y-5 transition-all hover:border-blue-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-black text-slate-900">{candidate.fullName}</h4>
                            <Badge variant={candidate.practitionerType === 'DIGITALNEXCARE_PROVIDER' ? 'verified' : 'neutral'} size="sm">
                              {candidate.practitionerType === 'DIGITALNEXCARE_PROVIDER' ? 'Joined Provider' : 'Unclaimed Directory Profile'}
                            </Badge>
                          </div>

                          <p className="text-xs font-bold text-[#176BFF]">
                            {candidate.specialty} • {candidate.practiceName}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {candidate.address || `${candidate.suburb}, ${candidate.city}, ${candidate.province}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                              Registration Preview: {'hpcsaNumber' in candidate ? (candidate as any).hpcsaNumber : 'Statutory Register ID Available'}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-right text-slate-500">
                          <div>Data Authority: <span className="font-bold text-slate-700">{candidate.dataAuthority}</span></div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Status: {candidate.claimStatus}</div>
                        </div>
                      </div>

                      {/* CONSTITUTIONAL QUESTION & THE 4 REQUIRED BUTTONS */}
                      <div className="pt-4 border-t border-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-black text-slate-900 tracking-tight">
                            IS THIS YOU OR YOUR PRACTICE?
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Claiming links your user account to this directory listing for statutory verification.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                            onClick={() => handleInitiateClaim(candidate)}
                          >
                            YES — CLAIM THIS PROFILE
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
                            }}
                          >
                            NOT ME
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPractitionerName('');
                              setPracticeName('');
                              setLocationQuery('');
                            }}
                          >
                            SEARCH AGAIN
                          </Button>

                          <Link to="/provider/manual-registration">
                            <Button variant="ghost" size="sm">
                              CREATE MANUALLY
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Claim Request Submission Confirmation Banner */}
          {claimSubmitted && (
            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3 text-emerald-950 font-black text-base">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div>Claim Request Submitted (Status: {claimSubmitted.status})</div>
                  <div className="text-xs font-normal text-emerald-800">
                    Claim ID: {claimSubmitted.id} • Target: {claimSubmitted.directoryCandidate.name}
                  </div>
                </div>
              </div>

              <p className="text-xs text-emerald-900 leading-relaxed">
                We have registered your claim. <strong>As required by Section 19 of the DigitalNexCare Constitution</strong>, claiming an existing listing does not immediately grant verified booking privileges. You must now submit statutory proof to the verification queue.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link to="/provider/verification">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Proceed to HPCSA / Statutory Verification
                  </Button>
                </Link>
                <Link to="/provider/dashboard">
                  <Button variant="outline" size="sm" className="bg-white">
                    Return to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Claim Initiation Modal */}
        {activeClaimCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#176BFF]">
                    Provider Profile Claim Request
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Claim: {activeClaimCandidate.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeClaimCandidate.practiceName} • {activeClaimCandidate.city}
                  </p>
                </div>
                <button
                  onClick={() => setActiveClaimCandidate(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Anti-Fraud Notice:</strong> Falsely claiming a medical practitioner profile violates South African law and DigitalNexCare terms. All claims undergo statutory council verification.
                </span>
              </div>

              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Statutory Council"
                    value={claimCouncil}
                    onChange={(e) => setClaimCouncil(e.target.value as any)}
                    options={[
                      { value: 'HPCSA', label: 'HPCSA (Medical/Dental)' },
                      { value: 'SADA', label: 'SADA (Dental Association)' },
                      { value: 'SANC', label: 'SANC (Nursing Council)' },
                      { value: 'SAPC', label: 'SAPC (Pharmacy Council)' },
                      { value: 'AHPCSA', label: 'AHPCSA (Allied Health)' },
                    ]}
                  />

                  <Input
                    label="Council Registration #"
                    value={claimRegNumber}
                    onChange={(e) => setClaimRegNumber(e.target.value)}
                    placeholder="e.g. MP 0784920"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="BHF Practice # (PCNS)"
                    value={claimPracticeNumber}
                    onChange={(e) => setClaimPracticeNumber(e.target.value)}
                    placeholder="e.g. 0145892"
                    required
                  />

                  <Input
                    label="Official Phone Number"
                    value={claimantPhone}
                    onChange={(e) => setClaimantPhone(e.target.value)}
                    placeholder="+27 12 362 5590"
                    required
                  />
                </div>

                <Input
                  label="Official Practice / Doctor Email"
                  type="email"
                  value={claimantEmail}
                  onChange={(e) => setClaimantEmail(e.target.value)}
                  placeholder="doctor@practice.co.za"
                  required
                />

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveClaimCandidate(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    leftIcon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Submit Claim Request
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
};

const DatabaseIcon = () => (
  <svg className="w-3.5 h-3.5 text-[#176BFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);
