import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProviderLayout } from '../../components/layout/ProviderLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import {
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  Lock,
  Eye,
  Check,
} from 'lucide-react';
import {
  ProviderService,
  VERIFICATIONS_REGISTRY,
  VerificationDossier,
} from '../../lib/provider/provider-service';
import { SA_PROVINCES } from '../../lib/constants';

export const ProviderVerificationPage: React.FC = () => {
  // Pull current provider verification dossier
  const [dossier, setDossier] = useState<VerificationDossier>(
    VERIFICATIONS_REGISTRY[0] || {
      id: 'ver-current',
      providerId: 'prov-001',
      userId: 'usr-prov-001',
      practitionerName: 'Dr. Naledi Mokoena',
      council: 'HPCSA',
      registrationNumber: 'MP 0784920',
      practiceNumber: '0145892',
      idNumberOrPassport: '8506145890081',
      practiceAddress: '422 Burnett Street, Hatfield, Pretoria, 0028',
      province: 'Gauteng',
      city: 'Pretoria',
      suburb: 'Hatfield',
      status: 'VERIFIED',
      submittedAt: '2026-08-14T08:00:00Z',
      documents: [],
    }
  );

  const [council, setCouncil] = useState(dossier.council);
  const [regNumber, setRegNumber] = useState(dossier.registrationNumber);
  const [practiceNumber, setPracticeNumber] = useState(dossier.practiceNumber);
  const [idNumber, setIdNumber] = useState(dossier.idNumberOrPassport);
  const [address, setAddress] = useState(dossier.practiceAddress);
  const [selectedDocCategory, setSelectedDocCategory] = useState<
    'ID_DOCUMENT' | 'COUNCIL_CERTIFICATE' | 'PRACTICE_PROOF' | 'QUALIFICATION'
  >('COUNCIL_CERTIFICATE');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleDocumentAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle) return;
    setIsUploading(true);

    setTimeout(() => {
      const updated = ProviderService.submitVerificationDossier({
        providerId: dossier.providerId,
        userId: dossier.userId,
        practitionerName: dossier.practitionerName,
        council,
        registrationNumber: regNumber,
        practiceNumber,
        idNumberOrPassport: idNumber,
        practiceAddress: address,
        province: dossier.province,
        city: dossier.city,
        suburb: dossier.suburb,
        documents: [
          {
            title: newDocTitle,
            category: selectedDocCategory,
            fileName: newFileName || `${newDocTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`,
            sizeKb: Math.floor(Math.random() * 300) + 200,
          },
        ],
      });

      setDossier({ ...updated });
      setNewDocTitle('');
      setNewFileName('');
      setIsUploading(false);
      setFeedbackMessage('Document successfully attached to statutory compliance dossier.');
    }, 400);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="verified" size="md">VERIFIED (Active Good Standing)</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning" size="md">UNDER_REVIEW (Auditor Assigned)</Badge>;
      case 'SUBMITTED':
        return <Badge variant="brand" size="md">SUBMITTED (Pending Trust Ops)</Badge>;
      case 'MORE_INFORMATION_REQUIRED':
        return <Badge variant="warning" size="md">MORE_INFORMATION_REQUIRED</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" size="md">REJECTED</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger" size="md">SUSPENDED</Badge>;
      default:
        return <Badge variant="neutral" size="md">{status}</Badge>;
    }
  };

  return (
    <ProviderLayout
      title="Statutory Professional Verification"
      subtitle="DigitalNexCare enforces mandatory statutory council auditing with HPCSA, SADA, SANC, SAPC, and AHPCSA to protect South African patients."
    >
      <div className="space-y-6">
        {/* Verification Status Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Statutory Verification Lifecycle
                </div>
                <div className="text-lg font-black text-slate-900">
                  {dossier.practitionerName}
                </div>
              </div>
            </div>

            <div>{getStatusBadge(dossier.status)}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-semibold">Statutory Council</div>
              <div className="font-bold text-slate-800 mt-0.5">{dossier.council}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-semibold">Registration #</div>
              <div className="font-bold text-slate-800 mt-0.5">{dossier.registrationNumber}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-semibold">BHF Practice (PCNS)</div>
              <div className="font-bold text-slate-800 mt-0.5">{dossier.practiceNumber}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-semibold">Auditor Audit Status</div>
              <div className="font-bold text-emerald-700 mt-0.5">
                {dossier.reviewedBy ? `${dossier.reviewedBy}` : 'Pending Queue'}
              </div>
            </div>
          </div>

          {dossier.complianceNotes && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#176BFF] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Trust Ops Audit Note: </strong>
                {dossier.complianceNotes}
              </div>
            </div>
          )}

          {/* Anti-Self-Verification Guarantee Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              <strong>Rule 20 Enforced:</strong> A practitioner can never self-verify their account. Verification is exclusively authorized by DigitalNexCare Trust Ops.
            </span>
          </div>
        </div>

        {/* Verification Evidence & Supporting Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Compliance Dossier & Uploaded Evidence
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official South African statutory certificates and identity proof.
                </p>
              </div>

              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {(dossier?.documents || []).length} Files Attached
              </span>
            </div>

            {feedbackMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {feedbackMessage}
              </div>
            )}

            <div className="space-y-3">
              {(dossier?.documents || []).map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#176BFF] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{doc.title}</span>
                        {doc.verified ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
                            Verified ✓
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-bold">
                            Under Audit
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {doc.fileName} • {doc.sizeKb} KB • Uploaded {doc.uploadedAt.split('T')[0]}
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                    View
                  </Button>
                </div>
              ))}
            </div>

            {/* Document Upload Box */}
            <form onSubmit={handleDocumentAdd} className="pt-4 border-t border-slate-100 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Attach Additional Statutory Document:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Evidence Category"
                  value={selectedDocCategory}
                  onChange={(e) => setSelectedDocCategory(e.target.value as any)}
                  options={[
                    { value: 'COUNCIL_CERTIFICATE', label: 'Council Certificate of Good Standing' },
                    { value: 'ID_DOCUMENT', label: 'Certified ID Document / Passport' },
                    { value: 'PRACTICE_PROOF', label: 'BHF PCNS Practice Certificate / Proof' },
                    { value: 'QUALIFICATION', label: 'Degree / Specialty Qualification Certificate' },
                  ]}
                />

                <Input
                  label="Document Title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. HPCSA Certificate 2026"
                  required
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <div className="text-xs font-semibold text-slate-700">
                  Drag & Drop or Click to Select Verification File
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  PDF, PNG, JPEG up to 10MB
                </div>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setNewFileName(e.target.files[0].name);
                      if (!newDocTitle) setNewDocTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="hidden"
                  id="doc-file-upload"
                />
                <label
                  htmlFor="doc-file-upload"
                  className="mt-2 inline-block cursor-pointer text-xs font-bold text-[#176BFF] hover:underline"
                >
                  Browse local file
                </label>
                {newFileName && (
                  <div className="mt-2 text-xs font-semibold text-emerald-700">
                    Selected: {newFileName}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isUploading}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Upload & Submit to Queue
                </Button>
              </div>
            </form>
          </div>

          {/* Statutory Councils Guide & Verification Checklist */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900">
                Statutory Regulatory Councils
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">HPCSA</div>
                  <div className="text-slate-500 mt-0.5">
                    Medical practitioners, psychologists, optometrists, physiotherapists, dietitians.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">SADA</div>
                  <div className="text-slate-500 mt-0.5">
                    Dentists, dental therapists, oral hygienists, and specialists.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">SANC</div>
                  <div className="text-slate-500 mt-0.5">
                    Registered nurses, midwives, primary clinical nurse practitioners.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">AHPCSA</div>
                  <div className="text-slate-500 mt-0.5">
                    Chiropractors, homeopaths, phytotherapists, and allied professionals.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 space-y-3 text-xs text-emerald-950">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verification Checklist</span>
              </div>
              <ul className="space-y-1.5 text-emerald-800">
                <li>• ID Number confirmed against Home Affairs standard</li>
                <li>• Council e-Register status: Good Standing</li>
                <li>• Active BHF Practice PCNS code match</li>
                <li>• Physical consultation rooms verified</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
};
