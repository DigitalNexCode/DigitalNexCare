import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Chunk8OperationsService } from '../../lib/admin/chunk8-service';
import { PlatformFeatureFlag } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Settings,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  CheckCircle2,
  Lock,
  CreditCard,
  Database,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const SuperAdminControlsPage: React.FC = () => {
  const [flags, setFlags] = useState<PlatformFeatureFlag[]>(
    Chunk8OperationsService.getFeatureFlags()
  );
  const [successMsg, setSuccessMsg] = useState('');

  const handleToggleFlag = (key: string, currentEnabled: boolean) => {
    Chunk8OperationsService.updateFeatureFlag(key, !currentEnabled);
    setFlags([...Chunk8OperationsService.getFeatureFlags()]);
    setSuccessMsg(`Feature flag [${key}] updated to ${!currentEnabled ? 'ENABLED' : 'DISABLED'}.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <AdminLayout
      title="Platform Controls & Runtime Feature Flags"
      subtitle="Super Administrator configuration for live platform capabilities, circuit breakers, and payment engines."
      isSuperAdmin
    >
      <div className="space-y-6">
        {/* Security Warning */}
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 flex items-start gap-4 shadow-xs">
          <ShieldAlert className="w-8 h-8 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-rose-950 text-sm">
              Restricted Super Administrator Workspace
            </h4>
            <p className="text-rose-800 mt-1 leading-relaxed">
              Modifications made here affect real-time routing, payment gateway webhooks, and national directory scraper workers across South Africa. All toggle events are immutably logged with actor IP addresses.
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Feature Flags */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#176BFF]" />
                Runtime Feature Flags & Circuit Breakers
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle capabilities across web client and background workers without application downtime.
              </p>
            </div>
            <Badge variant="verified" size="sm">
              Live Evaluation
            </Badge>
          </div>

          <div className="divide-y divide-slate-100">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm font-mono">{flag.key}</span>
                    <Badge variant={flag.enabled ? 'verified' : 'neutral'} size="sm">
                      {flag.enabled ? 'ACTIVE' : 'DISABLED'}
                    </Badge>
                    <span className="text-[11px] text-slate-400">({flag.environment})</span>
                  </div>
                  <p className="text-slate-600 mt-1">{flag.description}</p>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Rollout: {flag.rolloutPercentage}% • Last updated: {new Date(flag.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <Button
                  variant={flag.enabled ? 'danger' : 'primary'}
                  size="sm"
                  onClick={() => handleToggleFlag(flag.key, flag.enabled)}
                  leftIcon={flag.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                >
                  {flag.enabled ? 'Disable Flag' : 'Enable Flag'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Statutory & Gateway Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Gateways */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              South African Payment Gateways
            </h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Paystack SA</span>
                  <p className="text-slate-500 text-[11px]">Primary 3D-Secure Card & Ozow Instant EFT</p>
                </div>
                <Badge variant="verified" size="sm">Live Gateway</Badge>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Yoco Payments</span>
                  <p className="text-slate-500 text-[11px]">Secondary Card & In-Practice POS Link</p>
                </div>
                <Badge variant="verified" size="sm">Live Gateway</Badge>
              </div>
            </div>
          </div>

          {/* Statutory HPCSA Synchronization */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              Statutory HPCSA Register Sync
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automated daily checksum validation of all 9 statutory medical professional registers in South Africa.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
              <span className="text-slate-500">Last sync: 2 hours ago (Clean)</span>
              <Button variant="outline" size="sm">
                Trigger Manual Sync
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
