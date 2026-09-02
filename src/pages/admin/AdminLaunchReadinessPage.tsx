import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  Search,
  Lock,
  Database,
  CreditCard,
  Smartphone,
  Zap,
  Globe,
  FileText,
  Activity,
  Award,
} from 'lucide-react';
import { LaunchTestSuite, TestResult } from '../../lib/qa/launch-test-suite';
import { Button } from '../../components/ui/Button';
import { SEOHead } from '../../components/seo/SEOHead';

export const AdminLaunchReadinessPage: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 25 });
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress({ completed: 0, total: 25 });

    try {
      const output = await LaunchTestSuite.runAllTests((completed, total, current) => {
        setProgress({ completed, total });
        setResults((prev) => [...prev, current]);
      });
      setResults(output);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const totalPassed = results.filter((r) => r.status === 'PASSED').length;
  const totalFailed = results.filter((r) => r.status === 'FAILED').length;
  const isAllPassed = results.length > 0 && totalFailed === 0;

  const categories = Array.from(new Set(results.map((r) => r.category)));

  const filteredResults = results.filter((r) => {
    const matchesCat = filterCategory === 'ALL' || r.category === filterCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      <SEOHead
        title="Launch Readiness & Security QA Audit | DigitalNexCare Admin"
        description="Comprehensive 25-point automated verification testing suite for DigitalNexCare."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Chunk 11 — Launch Readiness & Security Certification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Comprehensive Launch QA & Security Audit
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated execution of all 25 launch criteria across Security, Auth, RLS, Paywalls, Scheduling, and Performance.
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#176BFF] to-[#00E5D4] hover:opacity-95 text-white font-black text-xs transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{isRunning ? `Testing (${progress.completed}/${progress.total})...` : 'Execute All 25 Launch Tests'}</span>
        </button>
      </div>

      {/* Overall Scorecard Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${
        isAllPassed
          ? 'bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border-emerald-500/30 text-emerald-100'
          : totalFailed > 0
          ? 'bg-rose-950/30 border-rose-500/30 text-rose-100'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-start sm:items-center gap-4">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-2xl shadow-xl shrink-0 ${
            isAllPassed
              ? 'bg-emerald-500 text-white'
              : totalFailed > 0
              ? 'bg-rose-500 text-white'
              : 'bg-blue-600 text-white animate-pulse'
          }`}>
            {isAllPassed ? (
              <ShieldCheck className="w-8 h-8" />
            ) : totalFailed > 0 ? (
              <XCircle className="w-8 h-8" />
            ) : (
              <Activity className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">
                {isAllPassed
                  ? 'DIGITALNEXCARE BUILD COMPLETE — LAUNCH READINESS PASSED'
                  : isRunning
                  ? 'Executing Comprehensive Automated QA Suite...'
                  : 'Launch Tests Incomplete'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              {isAllPassed
                ? 'All 25 mandatory technical, security, privacy, and architectural criteria have passed verification with zero errors.'
                : 'Automated test harness is verifying system components, cryptographic signatures, RLS rules, and paywall quotas.'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-xs font-bold border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6 w-full lg:w-auto justify-between lg:justify-start">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Passed</span>
            <span className="text-2xl font-black text-emerald-400">{totalPassed} / {progress.total}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Failed</span>
            <span className={`text-2xl font-black ${totalFailed > 0 ? 'text-rose-400' : 'text-slate-500'}`}>{totalFailed}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Compliance</span>
            <span className="text-2xl font-black text-[#00E5D4]">
              {results.length > 0 ? Math.round((totalPassed / results.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test name, category, or assertion details..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-[#176BFF]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterCategory === 'ALL'
                ? 'bg-[#176BFF] text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All ({results.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-[#176BFF] text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Test Results Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredResults.map((test, index) => (
          <div
            key={test.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start sm:items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {test.category}
                    </span>
                    <h3 className="text-sm font-bold text-white">{test.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{test.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="font-mono text-[11px] text-slate-500">{test.durationMs} ms</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${
                  test.status === 'PASSED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {test.status === 'PASSED' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>{test.status}</span>
                </span>
              </div>
            </div>

            {/* Test Details Output */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 leading-relaxed break-words">
              <span className="text-[#00E5D4] font-bold">Assertion Output: </span>
              <span>{test.details}</span>
              {test.error && (
                <div className="text-rose-400 mt-1 font-bold">
                  Error: {test.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
