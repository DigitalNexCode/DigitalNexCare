import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Chunk8OperationsService } from '../../lib/admin/chunk8-service';
import { TrustCase, TrustCaseType, TrustCaseStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  UserX,
  FileCheck,
  CheckCircle2,
  Clock,
  Search,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const AdminTrustOpsPage: React.FC = () => {
  const [cases, setCases] = useState<TrustCase[]>(
    Chunk8OperationsService.getTrustCases()
  );

  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [activeResolveId, setActiveResolveId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleResolve = (caseId: string, status: TrustCaseStatus) => {
    Chunk8OperationsService.updateTrustCase(caseId, {
      status,
      resolutionNotes: resolutionNotes || `Case marked as ${status} by Trust & Safety Officer.`,
      resolvedAt: new Date().toISOString(),
      assignedTo: 'trust-officer-rsa',
    });

    setCases([...Chunk8OperationsService.getTrustCases()]);
    setActiveResolveId(null);
    setResolutionNotes('');
    setSuccessMsg(`Trust case ${caseId} updated to [${status}].`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const getCaseTypeBadge = (type: TrustCaseType) => {
    switch (type) {
      case 'CLAIM_DISPUTE':
        return <Badge variant="warning" size="sm">Claim Ownership Dispute</Badge>;
      case 'IDENTITY_VERIFICATION':
        return <Badge variant="brand" size="sm">Identity Verification</Badge>;
      case 'REVIEW_APPEAL':
        return <Badge variant="neutral" size="sm">Review Appeal</Badge>;
      case 'FRAUD_DETECTION':
        return <Badge variant="danger" size="sm">Fraud Detection</Badge>;
      case 'ACCOUNT_ABUSE':
        return <Badge variant="danger" size="sm">Account Abuse</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{type}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">LOW</span>;
    }
  };

  const filteredCases = cases.filter((c) => {
    if (filterType !== 'ALL' && c.caseType !== filterType) return false;
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    return true;
  });

  const openCount = cases.filter((c) => c.status === 'OPEN' || c.status === 'IN_INVESTIGATION').length;

  return (
    <AdminLayout
      title="Trust, Safety & Dispute Resolution Ops"
      subtitle="Investigate practitioner profile claim conflicts, identity fraud, review disputes, and suspicious platform activity."
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Trust & Safety Operations Queue ({openCount} Active Cases)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Audited workflows for HPCSA registration fraud prevention, practice hijacking mitigation, and verified booking integrity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs rounded-xl border-slate-200 p-2 font-medium bg-slate-50"
            >
              <option value="ALL">All Case Types</option>
              <option value="CLAIM_DISPUTE">Claim Disputes</option>
              <option value="IDENTITY_VERIFICATION">Identity Verification</option>
              <option value="REVIEW_APPEAL">Review Appeals</option>
              <option value="FRAUD_DETECTION">Fraud Detection</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs rounded-xl border-slate-200 p-2 font-medium bg-slate-50"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_INVESTIGATION">In Investigation</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Cases List */}
        <div className="space-y-4">
          {filteredCases.map((cs) => (
            <div
              key={cs.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  {getCaseTypeBadge(cs.caseType)}
                  {getPriorityBadge(cs.priority)}
                  <span className="text-xs font-mono text-slate-400">ID: {cs.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={cs.status === 'RESOLVED' ? 'verified' : cs.status === 'OPEN' ? 'warning' : 'neutral'}
                    size="sm"
                  >
                    {cs.status}
                  </Badge>
                  <span className="text-[11px] text-slate-400">
                    Logged: {new Date(cs.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{cs.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {cs.description}
                </p>
              </div>

              {/* Entity Information */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <div>
                  Target Entity: <strong className="text-slate-800">{cs.targetEntityType} ({cs.targetEntityId})</strong>
                </div>
                {cs.assignedTo && (
                  <div>
                    Investigator: <strong className="text-slate-800">{cs.assignedTo}</strong>
                  </div>
                )}
                {cs.resolutionNotes && (
                  <div className="w-full text-slate-700 pt-1 border-t border-slate-200">
                    Resolution Note: <em>{cs.resolutionNotes}</em>
                  </div>
                )}
              </div>

              {/* Action Form */}
              {activeResolveId === cs.id ? (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                  <label className="text-xs font-bold text-slate-800 block">
                    Case Resolution & Statutory Findings:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Document proof examined (HPCSA e-Register, certified ID copy, practice lease)..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#176BFF] focus:border-transparent"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveResolveId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(cs.id, 'DISMISSED')}
                    >
                      Dismiss Case
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleResolve(cs.id, 'RESOLVED')}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Mark Case Resolved
                    </Button>
                  </div>
                </div>
              ) : (
                cs.status !== 'RESOLVED' && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveResolveId(cs.id)}
                    >
                      Investigate & Resolve Case
                    </Button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};
