import React from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Users,
  ShieldCheck,
  FileText,
  AlertTriangle,
  HardDrive,
  Database,
  Search,
  Activity,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  return (
    <AdminLayout
      title="Platform Operations Command Center"
      subtitle="National practitioner indexing, verification queues, claims auditing, and ingestion jobs."
    >
      {/* 4 Primary Operational Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Pending Verifications</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">4</div>
          <Link to="/admin/verifications" className="text-xs text-[#176BFF] font-semibold mt-1 block">
            Review queue →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Claim Requests</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">2</div>
          <Link to="/admin/claims" className="text-xs text-[#176BFF] font-semibold mt-1 block">
            Audit claims →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Data Conflicts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">1</div>
          <Link to="/admin/conflicts" className="text-xs text-[#176BFF] font-semibold mt-1 block">
            Resolve conflicts →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Indexed Records</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">18,492</div>
          <span className="text-[11px] text-slate-500 mt-1 block">9 provinces covered</span>
        </div>
      </div>

      {/* Ingestion & Discovery Ops Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#176BFF]" /> Background Ingestion Pipelines
            </h3>
            <Link to="/admin/ingestion">
              <Button variant="outline" size="sm">
                Manage Queues
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900">
                  Job #JOB-902: Gauteng East Suburbs Practitioner Expansion
                </div>
                <div className="text-slate-500 mt-0.5">
                  Target: Dental & Allied • Normalized & Fingerprinted: 142 records
                </div>
              </div>
              <Badge variant="verified" size="sm">
                Completed
              </Badge>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900">
                  Job #JOB-903: Western Cape Winelands Regional Ingestion
                </div>
                <div className="text-slate-500 mt-0.5">
                  Batch: 50/200 • Compression: Zstandard (GZIP fallback)
                </div>
              </div>
              <Badge variant="brand" size="sm">
                In Progress
              </Badge>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#00E5D4]" /> Supabase Database & Security
              </h3>
              <Badge variant="success" size="sm">
                6 Migrations Applied
              </Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              PostGIS spatial indexing, PostgREST server projections, atomic reveal quotas (Free=2, Access=5, Plus=20, Family=unlimited), and RLS tenant isolation policies.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">RLS Policies Active (30+ Tables)</span>
            <Link to="/admin/database">
              <Button variant="accent" size="sm">
                Open Inspector →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
