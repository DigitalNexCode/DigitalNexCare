import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  AlertTriangle,
  Check,
  ShieldCheck,
  XCircle,
  Layers,
  RefreshCw,
  Users,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { CONFLICT_REGISTRY, DUPLICATE_CANDIDATE_REGISTRY } from '../../lib/external-discovery/search-worker';
import { DataConflictRecord } from '../../lib/external-discovery/types';

export const AdminConflictsPage: React.FC = () => {
  const [conflicts, setConflicts] = useState<DataConflictRecord[]>([...CONFLICT_REGISTRY]);
  const [duplicateCandidates, setDuplicateCandidates] = useState([...DUPLICATE_CANDIDATE_REGISTRY]);
  const [activeTab, setActiveTab] = useState<'CONFLICTS' | 'DUPLICATES'>('CONFLICTS');

  const handleResolveConflict = (conflictId: string, action: 'KEEP_EXISTING' | 'OVERRIDE_INCOMING') => {
    const item = CONFLICT_REGISTRY.find((c) => c.id === conflictId);
    if (item) {
      item.status = action === 'KEEP_EXISTING' ? 'RESOLVED_RETAIN_EXISTING' : 'RESOLVED_ACCEPT_INCOMING';
      item.resolvedAt = new Date().toISOString();
      item.resolutionNotes = action === 'KEEP_EXISTING'
        ? 'Retained higher-authority provider confirmed data per Constitution rule.'
        : 'Admin manual override applied.';
    }
    setConflicts([...CONFLICT_REGISTRY]);
  };

  const handleResolveDuplicate = (dupId: string, action: 'MERGE' | 'REJECT') => {
    const item = DUPLICATE_CANDIDATE_REGISTRY.find((d) => d.id === dupId);
    if (item) {
      item.status = action === 'MERGE' ? 'RESOLVED_MERGED' : 'RESOLVED_DISTINCT';
    }
    setDuplicateCandidates([...DUPLICATE_CANDIDATE_REGISTRY]);
  };

  const pendingConflicts = conflicts.filter((c) => c.status === 'PENDING_REVIEW');
  const resolvedConflicts = conflicts.filter((c) => c.status !== 'PENDING_REVIEW');

  return (
    <AdminLayout
      title="Data Conflict & Duplicate Review Center"
      subtitle="Enforce data authority rules and review possible duplicate practitioner records."
    >
      <div className="space-y-6">
        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('CONFLICTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'CONFLICTS'
                ? 'bg-[#176BFF] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Field Conflicts ({pendingConflicts.length} Pending)</span>
          </button>
          <button
            onClick={() => setActiveTab('DUPLICATES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'DUPLICATES'
                ? 'bg-[#176BFF] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Duplicate Candidates ({duplicateCandidates.filter((d) => d.status === 'PENDING_REVIEW').length} Pending)</span>
          </button>
        </div>

        {activeTab === 'CONFLICTS' && (
          <div className="space-y-4">
            {pendingConflicts.length === 0 && (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">All Field Conflicts Resolved</h4>
                <p className="text-xs text-slate-500">
                  No active conflicts between incoming crawlers and provider-confirmed data.
                </p>
              </div>
            )}

            {pendingConflicts.map((conf) => (
              <div key={conf.id} className="p-5 rounded-3xl bg-white border border-amber-200 shadow-xs space-y-4 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <span>Field Conflict: {conf.practitionerName} ({conf.fieldName.toUpperCase()})</span>
                  </div>
                  <Badge variant="warning" size="sm">
                    {conf.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-300">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Authoritative Record (Protected)
                    </div>
                    <div className="text-base font-black text-slate-900 mt-2">{conf.existingValue}</div>
                    <div className="text-[10px] text-emerald-800 font-semibold mt-1">
                      Authority: {conf.existingAuthority}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="font-bold text-slate-700">
                      Incoming External Crawler Data
                    </div>
                    <div className="text-base font-black text-slate-700 mt-2">{conf.incomingValue}</div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-1">
                      Authority: {conf.incomingAuthority} ({conf.sourceType})
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolveConflict(conf.id, 'OVERRIDE_INCOMING')}
                  >
                    Override with Incoming
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleResolveConflict(conf.id, 'KEEP_EXISTING')}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Keep Authoritative ({conf.existingValue})
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'DUPLICATES' && (
          <div className="space-y-4">
            {duplicateCandidates.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">No Ambiguous Duplicates</h4>
                <p className="text-xs text-slate-500">
                  Exact and high-confidence matches are automatically deduplicated.
                </p>
              </div>
            ) : (
              duplicateCandidates.map((dup) => (
                <div key={dup.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#176BFF]" />
                      Duplicate Review Candidate (#{dup.id})
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                      Confidence Score: {(dup.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                    {dup.reasons.join(', ')}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleResolveDuplicate(dup.id, 'REJECT')}>
                      Keep as Separate Records
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleResolveDuplicate(dup.id, 'MERGE')}>
                      Merge Records
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
