import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  FileText,
  Check,
  X,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Building,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import {
  ProviderService,
  CLAIMS_REGISTRY,
  PractitionerClaimRecord,
} from '../../lib/provider/provider-service';

export const AdminClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<PractitionerClaimRecord[]>(CLAIMS_REGISTRY);
  const [selectedClaim, setSelectedClaim] = useState<PractitionerClaimRecord | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [activeDecision, setActiveDecision] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [decisionReason, setDecisionReason] = useState<string>('');

  const handleGrantClaim = (claimId: string) => {
    if (!decisionReason.trim()) {
      setActionErrorMsg('Constitutional requirement: Admin may not approve a claim without recording a statutory reason.');
      return;
    }

    const res = ProviderService.adminApproveClaimAndMerge({
      claimId,
      verifierId: 'AdminTrustOps-01',
      notes: decisionReason.trim(),
    });

    if (res.success) {
      setClaims([...CLAIMS_REGISTRY]);
      setActionSuccessMsg(res.message);
      setSelectedClaim(null);
      setActiveDecision(null);
      setDecisionReason('');
      setActionErrorMsg(null);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } else {
      setActionErrorMsg(res.message);
    }
  };

  const handleRejectClaim = (claimId: string) => {
    if (!decisionReason.trim()) {
      setActionErrorMsg('Constitutional requirement: Admin may not decline a claim without recording a reason.');
      return;
    }

    const res = ProviderService.adminRejectClaim({
      claimId,
      verifierId: 'AdminTrustOps-01',
      reason: decisionReason.trim(),
    });

    if (res.success) {
      setClaims([...CLAIMS_REGISTRY]);
      setActionSuccessMsg(res.message);
      setSelectedClaim(null);
      setActiveDecision(null);
      setDecisionReason('');
      setActionErrorMsg(null);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } else {
      setActionErrorMsg(res.message);
    }
  };

  return (
    <AdminLayout
      title="Provider Profile Claim & Merge Management"
      subtitle="Audit practitioner claim requests, verify statutory authority, and merge directory records into joined DigitalNexCare providers."
    >
      <div className="space-y-6">
        {/* Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Pending Claim Requests</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {claims.filter((c) => c.status === 'CLAIM_REQUESTED' || c.status === 'UNDER_REVIEW').length}
            </div>
            <span className="text-[11px] text-amber-600 font-semibold mt-1 block">Awaiting Verifier review</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Merged & Claimed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {claims.filter((c) => c.status === 'CLAIMED').length}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Joined providers active</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Statutory Alignment</span>
              <ShieldCheck className="w-4 h-4 text-[#176BFF]" />
            </div>
            <div className="text-2xl font-black text-slate-900">100%</div>
            <span className="text-[11px] text-[#176BFF] font-semibold mt-1 block">HPCSA / SADA registered</span>
          </div>
        </div>

        {actionSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {actionSuccessMsg}
          </div>
        )}

        {/* Claims Table / List */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Active Claim Requests
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Sorted by submission timestamp
            </span>
          </div>

          <div className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs transition-all hover:border-slate-300"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{claim.claimantName}</span>
                    <Badge
                      variant={
                        claim.status === 'CLAIMED'
                          ? 'verified'
                          : claim.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {claim.status}
                    </Badge>
                  </div>

                  <div className="text-slate-600">
                    Claim Target: <strong className="text-slate-900">{claim.directoryCandidate.practice}</strong> ({claim.directoryCandidate.location})
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                    <span>Council: <strong className="text-slate-700">{claim.council} #{claim.registrationNumber}</strong></span>
                    <span>BHF Practice: <strong className="text-slate-700">#{claim.practiceNumber}</strong></span>
                    <span>Phone: {claim.claimantPhone}</span>
                    <span>Email: {claim.claimantEmail}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedClaim(claim)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Inspect Dossier
                  </Button>

                  {claim.status !== 'CLAIMED' && claim.status !== 'REJECTED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedClaim(claim);
                        setDecisionReason('Statutory HPCSA council credentials verified against official register.');
                        setActionErrorMsg(null);
                      }}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Audit & Decision
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Claim Dossier Inspector Modal */}
        {selectedClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#176BFF]">
                    Statutory Profile Claim Audit
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {selectedClaim.claimantName}
                  </h3>
                  <p className="text-xs text-slate-500">Claim Reference #{selectedClaim.id}</p>
                </div>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comparison Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                  <div className="font-bold text-[#176BFF] uppercase tracking-wider text-[11px]">
                    Directory Candidate Record
                  </div>
                  <div><strong>Name:</strong> {selectedClaim.directoryCandidate.name}</div>
                  <div><strong>Specialty:</strong> {selectedClaim.directoryCandidate.specialty}</div>
                  <div><strong>Practice:</strong> {selectedClaim.directoryCandidate.practice}</div>
                  <div><strong>Location:</strong> {selectedClaim.directoryCandidate.location}</div>
                  <div><strong>Source:</strong> {selectedClaim.directoryCandidate.source}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Claimant Submitted Details
                  </div>
                  <div><strong>Council:</strong> {selectedClaim.council}</div>
                  <div><strong>Registration #:</strong> {selectedClaim.registrationNumber}</div>
                  <div><strong>BHF Practice #:</strong> {selectedClaim.practiceNumber}</div>
                  <div><strong>Email:</strong> {selectedClaim.claimantEmail}</div>
                  <div><strong>Phone:</strong> {selectedClaim.claimantPhone}</div>
                </div>
              </div>

              {/* Merge Operation Explanation */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Section 7: Claim Merge & Conversion Effect
                </div>
                <p className="leading-relaxed text-emerald-800">
                  Granting this claim converts the directory record into a joined <strong>DIGITALNEXCARE_PROVIDER</strong> with <strong>is_joined = true</strong> and <strong>data_authority = 'DIGITALNEXCARE_VERIFIED_PROVIDER'</strong>, immediately unlocking real direct booking slots.
                </p>
              </div>

              {actionErrorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{actionErrorMsg}</span>
                </div>
              )}

              {selectedClaim.status !== 'CLAIMED' && selectedClaim.status !== 'REJECTED' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Trust Ops Audit Reason (Mandatory)*:
                  </label>
                  <p className="text-[11px] text-slate-500">
                    As mandated by the DigitalNexCare Constitution, an administrator may not approve or decline without recording a verifiable reason.
                  </p>
                  <textarea
                    rows={2}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="e.g. Statutory HPCSA registry verified. Practice registration matched with BHF records."
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#176BFF] focus:border-[#176BFF] bg-white"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => { setSelectedClaim(null); setActionErrorMsg(null); }}>
                  Close
                </Button>

                {selectedClaim.status !== 'CLAIMED' && selectedClaim.status !== 'REJECTED' && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => handleRejectClaim(selectedClaim.id)}
                      leftIcon={<X className="w-4 h-4" />}
                    >
                      Reject Claim
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleGrantClaim(selectedClaim.id)}
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      Approve Claim & Merge Record
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
