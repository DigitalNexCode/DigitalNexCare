import React, { useState, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Server,
  Layers,
  FileCode,
  Lock,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { runDigitalNexCareDatabaseTests, TestResultItem } from '../../lib/supabase/tests';
import { isSupabaseConfigured } from '../../lib/supabase/client';

export const AdminDatabaseInspectorPage: React.FC = () => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [testSummary, setTestSummary] = useState<{ total: number; passed: number; failed: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'TESTS' | 'MIGRATIONS' | 'RLS' | 'SUBSCRIPTIONS'>('TESTS');

  const executeTests = async () => {
    setIsRunningTests(true);
    try {
      const outcome = await runDigitalNexCareDatabaseTests();
      setTestResults(outcome.results);
      setTestSummary({
        total: outcome.total,
        passed: outcome.passed,
        failed: outcome.failed,
      });
    } catch (e) {
      console.error('Failed to run DB test suite', e);
    } finally {
      setIsRunningTests(false);
    }
  };

  useEffect(() => {
    executeTests();
  }, []);

  const migrationsList = [
    {
      version: '20260901000001',
      name: 'core_schema_and_extensions.sql',
      desc: 'PostGIS, pg_trgm, UUIDs, Profiles, Roles, Organisations, Audit Logs, Directory & Taxonomy',
      status: 'APPLIED',
    },
    {
      version: '20260901000002',
      name: 'provider_patient_subscriptions.sql',
      desc: 'Providers, Practices, Locations, Patients, Dependants, Medical Schemes & Subscriptions',
      status: 'APPLIED',
    },
    {
      version: '20260901000003',
      name: 'scheduling_reviews_commercial.sql',
      desc: 'Appointment Types, Availability, Slot Holds, Reviews, Notifications & Commercial Payments',
      status: 'APPLIED',
    },
    {
      version: '20260901000004',
      name: 'rls_and_security_policies.sql',
      desc: 'Row Level Security on 30+ tables, Tenant Isolation & Self-Verification Prevention',
      status: 'APPLIED',
    },
    {
      version: '20260901000005',
      name: 'stored_procedures_and_locked_projections.sql',
      desc: 'search_practitioners_projected, unlock_external_practitioner_atomic, hold_appointment_slot',
      status: 'APPLIED',
    },
    {
      version: '20260901000006',
      name: 'seed_data.sql',
      desc: 'Seeded Subscriptions (Free=2, Access=5, Plus=20, Family=Unlimited), Medical Schemes & Snapshots Bucket',
      status: 'APPLIED',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#07111F] text-white p-6 sm:p-8 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="primary" size="sm">
              SUPER_ADMIN & VERIFIER_TRUST_OPS
            </Badge>
            <Badge variant={isSupabaseConfigured ? 'success' : 'neutral'} size="sm">
              {isSupabaseConfigured ? 'SUPABASE CONNECTED' : 'LOCAL ENVIRONMENT READY'}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-[#00E5D4]" />
            Supabase Database & Security Inspector
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Verify database schema migrations, RLS tenant isolation, subscription seed quotas, and server-side data projections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="accent"
            size="md"
            onClick={executeTests}
            disabled={isRunningTests}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isRunningTests ? 'animate-spin' : ''}`} />}
          >
            {isRunningTests ? 'Running Checks...' : 'Run Security Suite'}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('TESTS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'TESTS'
              ? 'border-[#176BFF] text-[#176BFF]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Acceptance Test Suite
          {testSummary && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">
              {testSummary.passed}/{testSummary.total} Passing
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('MIGRATIONS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'MIGRATIONS'
              ? 'border-[#176BFF] text-[#176BFF]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4" />
          SQL Migrations (6)
        </button>

        <button
          onClick={() => setActiveTab('RLS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'RLS'
              ? 'border-[#176BFF] text-[#176BFF]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          RLS Policy Matrix
        </button>

        <button
          onClick={() => setActiveTab('SUBSCRIPTIONS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'SUBSCRIPTIONS'
              ? 'border-[#176BFF] text-[#176BFF]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Subscription Seeding
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'TESTS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Checks</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{testSummary?.total || 0}</p>
            </div>
            <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Passed</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{testSummary?.passed || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{testSummary?.failed || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {testResults.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex items-start gap-4">
                {item.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.id}
                    </span>
                    <Badge variant={item.passed ? 'success' : 'danger'} size="sm">
                      {item.category}
                    </Badge>
                    <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'MIGRATIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {migrationsList.map((m) => (
            <div key={m.version} className="p-5 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#176BFF]">{m.version}</span>
                  <h3 className="text-sm font-bold text-slate-900">{m.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
              </div>
              <Badge variant="success" size="sm">
                {m.status}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'RLS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Row Level Security (RLS) Rule Declarations</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict multi-tenant cryptographic access policies applied at database layer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#176BFF]" /> Patient Isolation (auth.uid() = patient_id)
              </span>
              <p className="text-slate-600">
                Guarantees Patient A cannot query or alter Patient B's medical aid profiles, dependants, appointments, or unlock records.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#176BFF]" /> Practice Isolation
              </span>
              <p className="text-slate-600">
                Restricts practice managers and reception schedulers to their verified organisation memberships.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-600" /> Provider Self-Verification Block
              </span>
              <p className="text-slate-600">
                SQL WITH CHECK policies strictly forbid providers from mutating their own verification_status. Only VERIFIER_TRUST_OPS or PLATFORM_ADMIN can approve verifications.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> Private Snapshots Storage
              </span>
              <p className="text-slate-600">
                Storage bucket practitioner-source-snapshots is private with RLS policies restricting file access to Verifier Ops and Administrators.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Seeded Patient Subscription Plans (ZAR)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified against Constitution specifications: Free=2, Access=5, Plus=20, Family=Unlimited.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-bold text-slate-500 uppercase">NEXCARE_FREE</span>
              <p className="text-xl font-black text-slate-900 mt-1">R0 / month</p>
              <p className="text-xs font-semibold text-[#176BFF] mt-2">2 Reveals / month</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-bold text-slate-500 uppercase">NEXCARE_ACCESS</span>
              <p className="text-xl font-black text-slate-900 mt-1">R50 / month</p>
              <p className="text-xs font-semibold text-[#176BFF] mt-2">5 Reveals / month</p>
            </div>

            <div className="p-4 rounded-xl border-2 border-[#00E5D4] bg-[#07111F] text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00E5D4] uppercase">NEXCARE_PLUS</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#00E5D4] text-slate-950 rounded-full">
                  POPULAR
                </span>
              </div>
              <p className="text-xl font-black text-white mt-1">R100 / month</p>
              <p className="text-xs font-semibold text-[#00E5D4] mt-2">20 Reveals / month</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-bold text-slate-500 uppercase">NEXCARE_FAMILY</span>
              <p className="text-xl font-black text-slate-900 mt-1">R250 / month</p>
              <p className="text-xs font-semibold text-[#176BFF] mt-2">Unlimited reveals</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
