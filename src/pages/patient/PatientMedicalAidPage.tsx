import React, { useState } from 'react';
import { PatientLayout } from '../../components/layout/PatientLayout';
import { PatientService } from '../../lib/patient/patient-service';
import { PatientMedicalAidProfile } from '../../types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SA_MEDICAL_AIDS } from '../../lib/constants';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Zap,
  Lock,
  FileText,
  CreditCard,
  Building,
  RefreshCw,
} from 'lucide-react';

export const PatientMedicalAidPage: React.FC = () => {
  const [profile, setProfile] = useState<PatientMedicalAidProfile>(() =>
    PatientService.getMedicalAidProfile()
  );

  const [scheme, setScheme] = useState(profile.schemeName);
  const [planOption, setPlanOption] = useState(profile.planName);
  const [memberNumber, setMemberNumber] = useState(profile.membershipNumber);
  const [mainMemberName, setMainMemberName] = useState(profile.mainMemberName);
  const [mainMemberIdNumber, setMainMemberIdNumber] = useState(profile.mainMemberIdNumber || '9006155029087');
  const [dependantCode, setDependantCode] = useState(profile.dependantCode);
  const [hasGapCover, setHasGapCover] = useState(profile.hasGapCover || false);
  const [gapCoverProvider, setGapCoverProvider] = useState(profile.gapCoverProvider || 'Stratum Benefits');
  const [gapCoverPolicyNumber, setGapCoverPolicyNumber] = useState(profile.gapCoverPolicyNumber || 'GAP-88301-SA');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    status: string;
    message: string;
    benefitsActive: boolean;
  } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: PatientMedicalAidProfile = {
      schemeName: scheme,
      planName: planOption,
      membershipNumber: memberNumber,
      mainMemberName,
      mainMemberIdNumber,
      dependantCode,
      hasGapCover,
      gapCoverProvider: hasGapCover ? gapCoverProvider : undefined,
      gapCoverPolicyNumber: hasGapCover ? gapCoverPolicyNumber : undefined,
      eligibilityStatus: verificationResult?.isValid ? 'VERIFIED' : profile.eligibilityStatus,
      lastVerifiedDate: new Date().toISOString().split('T')[0],
    };

    PatientService.saveMedicalAidProfile(updated);
    setProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleRunVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const res = PatientService.verifySchemeEligibility(scheme, memberNumber);
      setVerificationResult(res);
      setIsVerifying(false);
    }, 600);
  };

  return (
    <PatientLayout
      title="Medical Aid & Gap Cover Profile"
      subtitle="Store medical scheme credentials for automated doctor compatibility checks and seamless practice claims."
    >
      <form onSubmit={handleSave} className="space-y-6">
        {/* Scheme Status Banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#176BFF] flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{profile.schemeName}</h2>
                <Badge variant={profile.eligibilityStatus === 'VERIFIED' ? 'verified' : 'slate'} size="sm">
                  {profile.eligibilityStatus}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile.planName} • Member #{profile.membershipNumber} (Dep Code: {profile.dependantCode})
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleRunVerification}
            isLoading={isVerifying}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[#176BFF]" />}
          >
            Verify Scheme Eligibility
          </Button>
        </div>

        {/* Real-time Verification Feedback */}
        {verificationResult && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              verificationResult.isValid
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            {verificationResult.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="block font-bold mb-0.5">
                {verificationResult.isValid ? 'Scheme Eligibility Confirmed' : 'Verification Issue'}
              </strong>
              <p className="leading-relaxed">{verificationResult.message}</p>
            </div>
          </div>
        )}

        {/* Primary Scheme Fields */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Primary Medical Scheme Details</h3>
            <p className="text-xs text-slate-500">Ensure details match your physical medical aid card exactly</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Medical Scheme Name"
              value={scheme}
              onChange={(e) => setScheme(e.target.value)}
              options={SA_MEDICAL_AIDS.map((s) => ({ value: s, label: s }))}
            />
            <Input
              label="Plan / Option Name"
              value={planOption}
              onChange={(e) => setPlanOption(e.target.value)}
              placeholder="e.g. Classic Comprehensive / KeyCare Plus"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Principal Member Number"
              value={memberNumber}
              onChange={(e) => setMemberNumber(e.target.value)}
              placeholder="e.g. 908234112"
              required
            />
            <Input
              label="Main Member Dependant Code"
              value={dependantCode}
              onChange={(e) => setDependantCode(e.target.value)}
              placeholder="00 for main member"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Principal Member Legal Name"
              value={mainMemberName}
              onChange={(e) => setMainMemberName(e.target.value)}
              placeholder="Full name as registered on scheme"
              required
            />
            <Input
              label="Principal Member SA ID Number"
              value={mainMemberIdNumber}
              onChange={(e) => setMainMemberIdNumber(e.target.value)}
              placeholder="13-digit ID number"
            />
          </div>
        </div>

        {/* Gap Cover Section */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Gap Cover Policy</h3>
              <p className="text-xs text-slate-500">Covers shortfalls between medical scheme rates and private specialist fees</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasGapCover}
                onChange={(e) => setHasGapCover(e.target.checked)}
                className="w-4 h-4 text-[#176BFF] rounded-sm focus:ring-[#176BFF]"
              />
              <span className="text-xs font-bold text-slate-700">I have Gap Cover</span>
            </label>
          </div>

          {hasGapCover && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Gap Cover Provider"
                value={gapCoverProvider}
                onChange={(e) => setGapCoverProvider(e.target.value)}
                placeholder="Stratum Benefits, Kaelo, Sirago, etc."
              />
              <Input
                label="Gap Cover Policy / Member Number"
                value={gapCoverPolicyNumber}
                onChange={(e) => setGapCoverPolicyNumber(e.target.value)}
                placeholder="e.g. GAP-88301-SA"
              />
            </div>
          )}
        </div>

        {/* Compliance Notice */}
        <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 flex items-start gap-3">
          <Lock className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-900 font-bold block mb-0.5">POPIA & Direct Billing Disclaimer</strong>
            DigitalNexCare stores your medical scheme information securely in encrypted format. By saving your medical aid details, you authorize DigitalNexCare to populate your pre-visit intake claims when booking healthcare providers.
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-bold flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Medical Aid details and Gap Cover profile successfully saved!</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="primary" type="submit">
            Save Medical Aid Profile
          </Button>
        </div>
      </form>
    </PatientLayout>
  );
};
