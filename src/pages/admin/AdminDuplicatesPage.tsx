import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Chunk8OperationsService } from '../../lib/admin/chunk8-service';
import { DuplicateCandidate } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  MapPin,
  Phone,
  Search,
  Sparkles,
  GitMerge,
} from 'lucide-react';

export const AdminDuplicatesPage: React.FC = () => {
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>(
    Chunk8OperationsService.getDuplicateCandidates()
  );
  const [notificationMsg, setNotificationMsg] = useState('');

  const handleResolve = (
    id: string,
    action: 'MERGE' | 'REJECT_MERGE' | 'MARK_DIFFERENT',
    notes?: string
  ) => {
    Chunk8OperationsService.resolveDuplicate(
      id,
      action,
      'admin-001',
      notes || 'Action audited and approved by Platform Administrator.'
    );
    setCandidates([...Chunk8OperationsService.getDuplicateCandidates()]);
    setNotificationMsg(`Duplicate candidate resolution [${action}] recorded.`);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'EXACT_MATCH':
        return <Badge variant="verified" size="sm">EXACT MATCH (100%)</Badge>;
      case 'HIGH_CONFIDENCE_MATCH':
        return <Badge variant="brand" size="sm">HIGH CONFIDENCE (90%+)</Badge>;
      case 'POSSIBLE_MATCH':
        return <Badge variant="warning" size="sm">POSSIBLE MATCH (Review Required)</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{confidence}</Badge>;
    }
  };

  const pendingList = candidates.filter((c) => c.status === 'PENDING_REVIEW');
  const resolvedList = candidates.filter((c) => c.status !== 'PENDING_REVIEW');

  return (
    <AdminLayout
      title="Practitioner Deduplication & Merging"
      subtitle="Detect, compare, and merge duplicate practitioner records ingested from external healthcare directories."
    >
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#176BFF]" />
              Deduplication Review Queue ({pendingList.length} Pending)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated fingerprinting matches normalized names, practice addresses, telephone numbers, and HPCSA numbers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              {resolvedList.length} Resolved Cases
            </span>
          </div>
        </div>

        {notificationMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            {notificationMsg}
          </div>
        )}

        {/* Pending Duplicates List */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pending Comparison Cases
          </h4>

          {pendingList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              All duplicate practitioner candidates have been reviewed and resolved.
            </div>
          ) : (
            pendingList.map((cand) => (
              <div
                key={cand.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    {getConfidenceBadge(cand.matchConfidence)}
                    <span className="text-xs text-slate-400">Score: {cand.score}% Match</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Detected: {new Date(cand.detectedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs text-slate-600">
                  <strong>Matching Signals:</strong>{' '}
                  <span className="text-slate-800 font-medium">{cand.reasons.join(' • ')}</span>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Canonical Master Record */}
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-indigo-600" />
                        Canonical Master Record ({cand.canonicalPractitionerId})
                      </span>
                      <Badge variant="verified" size="sm">Primary</Badge>
                    </div>
                    <div className="text-slate-900 font-bold text-sm">
                      {cand.canonicalData.name}
                    </div>
                    <div className="text-slate-600">
                      Practice: <strong>{cand.canonicalData.practiceName}</strong>
                    </div>
                    <div className="text-slate-600">
                      Address: {cand.canonicalData.address}, {cand.canonicalData.suburb}, {cand.canonicalData.city}
                    </div>
                    <div className="text-slate-600">
                      Phone: {cand.canonicalData.phone || 'N/A'} • HPCSA: {cand.canonicalData.hpcsaNumber || 'N/A'}
                    </div>
                  </div>

                  {/* Duplicate Ingested Candidate */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Incoming Ingested Record ({cand.duplicatePractitionerId})
                      </span>
                      <Badge variant="warning" size="sm">Incoming Match</Badge>
                    </div>
                    <div className="text-slate-900 font-bold text-sm">
                      {cand.duplicateData.name}
                    </div>
                    <div className="text-slate-600">
                      Practice: <strong>{cand.duplicateData.practiceName}</strong>
                    </div>
                    <div className="text-slate-600">
                      Address: {cand.duplicateData.address}, {cand.duplicateData.suburb}, {cand.duplicateData.city}
                    </div>
                    <div className="text-slate-600">
                      Phone: {cand.duplicateData.phone || 'N/A'} • Source: {cand.duplicateData.source || 'Scraped/Web'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-slate-600"
                    onClick={() => handleResolve(cand.id, 'MARK_DIFFERENT', 'Distinct clinicians operating at similar address.')}
                  >
                    Mark as Distinct Practitioners
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleResolve(cand.id, 'REJECT_MERGE', 'Duplicate rejected as false positive.')}
                  >
                    Reject Merge
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleResolve(cand.id, 'MERGE', 'Merged incoming data into canonical master profile.')}
                    leftIcon={<GitMerge className="w-3.5 h-3.5" />}
                  >
                    Approve & Merge Records
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resolved History */}
        {resolvedList.length > 0 && (
          <div className="space-y-4 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resolved Cases History ({resolvedList.length})
            </h4>
            <div className="space-y-3">
              {resolvedList.map((cand) => (
                <div
                  key={cand.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {cand.canonicalData.name} ⟷ {cand.duplicateData.name}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Status: <strong className="text-slate-800">{cand.status}</strong> • Note: {cand.resolutionNotes}
                    </div>
                  </div>
                  <Badge variant={cand.status === 'RESOLVED_MERGED' ? 'verified' : 'neutral'} size="sm">
                    {cand.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
