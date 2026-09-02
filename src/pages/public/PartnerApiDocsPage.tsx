import React, { useState } from 'react';
import {
  Code,
  Key,
  Play,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Terminal,
  Shield,
  Zap,
  Globe,
  Database,
  Calendar,
  Layers,
} from 'lucide-react';
import { PartnerApiService } from '../../lib/partner-api/service';
import { SEOHead } from '../../components/seo/SEOHead';

export const PartnerApiDocsPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('dnc_live_medscheme_9921a8b');
  const [activeTab, setActiveTab] = useState<'search' | 'profile' | 'availability' | 'createBooking' | 'getBooking' | 'cancelBooking'>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [responseJson, setResponseJson] = useState<string | null>(null);
  const [statusBadge, setStatusBadge] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Search parameters state
  const [searchQuery, setSearchQuery] = useState('Pretoria');
  const [specialty, setSpecialty] = useState('General Practitioner (GP)');
  
  // Profile parameters state
  const [providerId, setProviderId] = useState('prov-001');

  // Booking parameters state
  const [bookingSlotId, setBookingSlotId] = useState('slot-101');
  const [patientName, setPatientName] = useState('Lerato Mokoena');
  const [patientEmail, setPatientEmail] = useState('lerato@example.co.za');
  const [targetBookingId, setTargetBookingId] = useState('');

  const executeApiCall = async () => {
    setIsLoading(true);
    setResponseJson(null);
    setStatusBadge(null);

    const authHeader = `Bearer ${apiKey}`;

    try {
      if (activeTab === 'search') {
        const res = await PartnerApiService.searchProviders(authHeader, {
          query: searchQuery,
          specialty: specialty !== 'All' ? specialty : undefined,
          limit: 10,
        });
        setStatusBadge(res.error ? '401 UNAUTHORIZED' : '200 OK');
        setResponseJson(JSON.stringify(res, null, 2));
      } else if (activeTab === 'profile') {
        const res = await PartnerApiService.getProviderProfile(authHeader, providerId);
        setStatusBadge(res.error ? '404 NOT FOUND' : '200 OK');
        setResponseJson(JSON.stringify(res, null, 2));
      } else if (activeTab === 'availability') {
        const res = await PartnerApiService.getAvailability(authHeader, providerId);
        setStatusBadge(res.error ? '400 BAD REQUEST' : '200 OK');
        setResponseJson(JSON.stringify(res, null, 2));
      } else if (activeTab === 'createBooking') {
        const idempotencyKey = `idem-${Date.now()}`;
        const res = await PartnerApiService.createBooking(authHeader, {
          idempotencyKey,
          providerId,
          slotId: bookingSlotId,
          patient: {
            fullName: patientName,
            email: patientEmail,
            phone: '+27 82 123 4567',
            idNumberOrDOB: '1992-05-14',
          },
          reason: 'Routine health checkup and prescription refill',
          consultationType: 'IN_PERSON',
        });
        setStatusBadge(res.error ? '400 BAD REQUEST' : '201 CREATED');
        if (res.data) {
          setTargetBookingId(res.data.bookingId);
        }
        setResponseJson(JSON.stringify(res, null, 2));
      } else if (activeTab === 'getBooking') {
        const res = await PartnerApiService.getBooking(authHeader, targetBookingId || 'pbk-demo-001');
        setStatusBadge(res.error ? '404 NOT FOUND' : '200 OK');
        setResponseJson(JSON.stringify(res, null, 2));
      } else if (activeTab === 'cancelBooking') {
        const res = await PartnerApiService.cancelBooking(
          authHeader,
          targetBookingId || 'pbk-demo-001',
          'Patient requested rescheduling to next month'
        );
        setStatusBadge(res.error ? '400 BAD REQUEST' : '200 OK');
        setResponseJson(JSON.stringify(res, null, 2));
      }
    } catch (err: any) {
      setStatusBadge('500 ERROR');
      setResponseJson(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Partner Integration API Documentation | DigitalNexCare"
        description="Integrate South African healthcare provider search, real-time availability, and instant appointment booking into your enterprise portal, insurer app, or medical practice system."
        canonicalUrl="https://digitalnexcare.co.za/partner/api-docs"
      />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#176BFF]/10 text-[#00E5D4] text-xs font-bold border border-[#176BFF]/20">
            <Zap className="w-3.5 h-3.5" />
            <span>DigitalNexCare Partner Platform API v1</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Healthcare Integration & Booking API
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
            Connect medical aid schemes, health insurers, hospital networks, and third-party healthcare portals
            directly into DigitalNexCare’s verified practitioner directory and real-time scheduling engine.
          </p>
        </div>

        {/* Auth & Environment Banner */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#176BFF]/20 flex items-center justify-center text-[#00E5D4]">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Interactive API Playground & Credentials</h3>
                <p className="text-xs text-slate-400">Authenticated via HTTP Header: <code>Authorization: Bearer &lt;API_KEY&gt;</code></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                Sandbox Mode Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Active Partner API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-[#00E5D4] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Preset Demo Keys</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setApiKey('dnc_live_medscheme_9921a8b')}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium"
                >
                  Medical Scheme Key
                </button>
                <button
                  onClick={() => setApiKey('dnc_test_sandbox_4490ef1')}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium"
                >
                  Enterprise Sandbox
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Endpoints Documentation & Playground */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Endpoint Selector Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">
              API Endpoints
            </h3>
            
            <button
              onClick={() => { setActiveTab('search'); setResponseJson(null); }}
              className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                activeTab === 'search'
                  ? 'bg-[#176BFF]/15 border-[#176BFF] text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black">GET</span>
                <span className="text-xs font-bold">/providers/search</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('profile'); setResponseJson(null); }}
              className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                activeTab === 'profile'
                  ? 'bg-[#176BFF]/15 border-[#176BFF] text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black">GET</span>
                <span className="text-xs font-bold">/providers/:id</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('availability'); setResponseJson(null); }}
              className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                activeTab === 'availability'
                  ? 'bg-[#176BFF]/15 border-[#176BFF] text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black">GET</span>
                <span className="text-xs font-bold">/availability/:providerId</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('createBooking'); setResponseJson(null); }}
              className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                activeTab === 'createBooking'
                  ? 'bg-[#176BFF]/15 border-[#176BFF] text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md bg-[#176BFF]/30 text-[#00E5D4] text-[10px] font-black">POST</span>
                <span className="text-xs font-bold">/bookings</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('getBooking'); setResponseJson(null); }}
              className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                activeTab === 'getBooking'
                  ? 'bg-[#176BFF]/15 border-[#176BFF] text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black">GET</span>
                <span className="text-xs font-bold">/bookings/:bookingId</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('cancelBooking'); setResponseJson(null); }}
              className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                activeTab === 'cancelBooking'
                  ? 'bg-[#176BFF]/15 border-[#176BFF] text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-black">POST</span>
                <span className="text-xs font-bold">/bookings/:bookingId/cancel</span>
              </div>
            </button>
          </div>

          {/* Interactive Console Panel */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-white text-base">Request Parameters & Execution</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Customize payload parameters and trigger live API dispatch.</p>
                </div>
                <button
                  onClick={executeApiCall}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#176BFF] to-[#00E5D4] text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isLoading ? 'Executing...' : 'Run Request'}</span>
                </button>
              </div>

              {/* Dynamic Parameter Forms */}
              {activeTab === 'search' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Query / City / Suburb</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-[#00E5D4]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Specialty</label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-[#00E5D4]"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Provider ID or Slug</label>
                  <input
                    type="text"
                    value={providerId}
                    onChange={(e) => setProviderId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-[#00E5D4]"
                  />
                </div>
              )}

              {activeTab === 'createBooking' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Provider ID</label>
                      <input
                        type="text"
                        value={providerId}
                        onChange={(e) => setProviderId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Slot ID</label>
                      <input
                        type="text"
                        value={bookingSlotId}
                        onChange={(e) => setBookingSlotId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Patient Full Name</label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Patient Email</label>
                      <input
                        type="email"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === 'getBooking' || activeTab === 'cancelBooking') && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Booking ID</label>
                  <input
                    type="text"
                    placeholder="e.g. pbk-1725264000000-abcde"
                    value={targetBookingId}
                    onChange={(e) => setTargetBookingId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-[#00E5D4]"
                  />
                </div>
              )}

              {/* Response Viewer */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-300">Live JSON Response</span>
                    {statusBadge && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        statusBadge.includes('200') || statusBadge.includes('201')
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {statusBadge}
                      </span>
                    )}
                  </div>
                  {responseJson && (
                    <button
                      onClick={() => copyToClipboard(responseJson)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  )}
                </div>

                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-[#00E5D4] overflow-x-auto max-h-96">
                  {responseJson || '// Click "Run Request" to test endpoint live'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
