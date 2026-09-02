import React, { useState } from 'react';
import { PatientLayout } from '../../components/layout/PatientLayout';
import { PatientService } from '../../lib/patient/patient-service';
import { PatientIntakeResponse, MedicationItem, AllergyItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  FileText,
  Heart,
  Pill,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Activity,
  UserCheck,
  Shield,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const COMMON_CHRONIC_CONDITIONS = [
  'Hypertension (High Blood Pressure)',
  'Type 2 Diabetes',
  'Type 1 Diabetes',
  'Asthma / Respiratory',
  'High Cholesterol (Hyperlipidemia)',
  'Cardiovascular Disease',
  'Thyroid Disorder',
  'Arthritis / Joint Disease',
  'Depression / Anxiety',
  'Epilepsy',
];

export const PatientIntakePage: React.FC = () => {
  const [history, setHistory] = useState<PatientIntakeResponse[]>(() =>
    PatientService.getIntakeResponses()
  );

  const [activeTab, setActiveTab] = useState<'NEW_FORM' | 'SUBMITTED_FORMS'>('NEW_FORM');
  const [selectedResponse, setSelectedResponse] = useState<PatientIntakeResponse | null>(null);

  // Form State
  const [providerName, setProviderName] = useState('Dr. Naledi Mokoena (General Practitioner)');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptomDuration, setSymptomDuration] = useState('3 days');
  const [painScale, setPainScale] = useState<number>(3);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState<MedicationItem[]>([
    { name: '', dosage: '', frequency: '' },
  ]);
  const [allergies, setAllergies] = useState<AllergyItem[]>([
    { substance: '', reaction: '', severity: 'MODERATE' },
  ]);
  const [surgicalHistory, setSurgicalHistory] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [smokingStatus, setSmokingStatus] = useState<'NEVER' | 'FORMER' | 'CURRENT'>('NEVER');
  const [alcoholUsage, setAlcoholUsage] = useState<'NONE' | 'OCCASIONAL' | 'REGULAR'>('OCCASIONAL');
  const [activityLevel, setActivityLevel] = useState<'SEDENTARY' | 'MODERATE' | 'ACTIVE'>('MODERATE');
  const [digitalSignature, setDigitalSignature] = useState('Lerato Khumalo');
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [popiaConsent, setPopiaConsent] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Condition toggle
  const toggleCondition = (cond: string) => {
    setSelectedConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  // Medication handlers
  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '' }]);
  };

  const updateMedication = (index: number, field: keyof MedicationItem, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  // Allergy handlers
  const addAllergy = () => {
    setAllergies([...allergies, { substance: '', reaction: '', severity: 'MODERATE' }]);
  };

  const updateAllergy = (index: number, field: keyof AllergyItem, value: any) => {
    const updated = [...allergies];
    updated[index] = { ...updated[index], [field]: value };
    setAllergies(updated);
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const validMeds = medications.filter((m) => m.name.trim().length > 0);
      const validAllergies = allergies.filter((a) => a.substance.trim().length > 0);

      const newIntake = PatientService.saveIntakeResponse({
        patientId: 'patient-lerato-001',
        patientName: 'Lerato Khumalo',
        providerName,
        chiefComplaint: chiefComplaint || 'Routine medical checkup and wellness consultation',
        symptomDuration,
        painSeverityScale: painScale,
        chronicConditions: selectedConditions.length > 0 ? selectedConditions : ['None reported'],
        currentMedications: validMeds,
        allergies: validAllergies,
        surgicalHistory: surgicalHistory || 'None reported',
        familyHistory: familyHistory || 'None reported',
        lifestyle: {
          smokingStatus,
          alcoholUsage,
          physicalActivity: activityLevel,
        },
        digitalSignature,
        consentAccepted,
        popiaConsentAccepted: popiaConsent,
      });

      setHistory(PatientService.getIntakeResponses());
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('SUBMITTED_FORMS');
      }, 2000);
    }, 600);
  };

  return (
    <PatientLayout
      title="Clinical Pre-Visit Intake Forms"
      subtitle="Complete your medical history and clinical intake questionnaires before your consultation to save time at the practice."
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('NEW_FORM')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'NEW_FORM'
              ? 'border-[#176BFF] text-[#176BFF]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Fill Pre-Visit Intake Form
        </button>

        <button
          onClick={() => setActiveTab('SUBMITTED_FORMS')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'SUBMITTED_FORMS'
              ? 'border-[#176BFF] text-[#176BFF]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Submitted Health Forms ({history.length})
        </button>
      </div>

      {activeTab === 'NEW_FORM' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Practitioner Header */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#176BFF] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Consultation Pre-Visit Information</h2>
                <p className="text-xs text-slate-500">
                  This form is shared securely with your treating doctor prior to arrival
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Treating Practitioner / Clinic"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                options={[
                  { value: 'Dr. Naledi Mokoena (General Practitioner)', label: 'Dr. Naledi Mokoena (General Practitioner)' },
                  { value: 'Dr. Pieter van der Merwe (Dentist)', label: 'Dr. Pieter van der Merwe (Dentist)' },
                  { value: 'Dr. Fatima Patel (Dermatologist)', label: 'Dr. Fatima Patel (Dermatologist)' },
                  { value: 'General Baseline Health Profile', label: 'General Baseline Health Profile (All Visits)' },
                ]}
              />

              <Input
                label="Symptom Duration / Onset"
                value={symptomDuration}
                onChange={(e) => setSymptomDuration(e.target.value)}
                placeholder="e.g. 3 days, 2 weeks, ongoing"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Chief Complaint & Reason for Visit <span className="text-[#FF3D71]">*</span>
              </label>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Describe your symptoms, main reason for booking, or questions for the doctor..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#176BFF] focus:outline-none"
                required
              />
            </div>

            {/* Pain / Discomfort Scale */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800">
                  Discomfort / Pain Severity Scale (1 - 10):{' '}
                  <span className="text-[#176BFF] font-black text-sm">{painScale}/10</span>
                </label>
                <Badge
                  variant={painScale <= 3 ? 'slate' : painScale <= 6 ? 'brand' : 'danger'}
                  size="sm"
                >
                  {painScale === 0
                    ? 'No Pain'
                    : painScale <= 3
                    ? 'Mild Discomfort'
                    : painScale <= 6
                    ? 'Moderate Pain'
                    : 'Severe / Intense'}
                </Badge>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={painScale}
                onChange={(e) => setPainScale(parseInt(e.target.value, 10))}
                className="w-full accent-[#176BFF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>1 (Minimal)</span>
                <span>5 (Moderate)</span>
                <span>10 (Worst Possible)</span>
              </div>
            </div>
          </div>

          {/* Chronic Medical Conditions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Chronic Medical Conditions</h3>
              <p className="text-xs text-slate-500">Select any diagnosed conditions you manage</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COMMON_CHRONIC_CONDITIONS.map((cond) => {
                const isSelected = selectedConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#176BFF] text-[#176BFF]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{cond}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#176BFF]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Medications */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" /> Current Medications & Supplements
                </h3>
                <p className="text-xs text-slate-500">List prescription medications, vitamins, or inhalers</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={addMedication}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Medication
              </Button>
            </div>

            <div className="space-y-3">
              {medications.map((med, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Input
                    label="Medication Name"
                    value={med.name}
                    onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                    placeholder="e.g. Amlodipine"
                  />
                  <Input
                    label="Dosage"
                    value={med.dosage}
                    onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                    placeholder="e.g. 5mg"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      label="Frequency"
                      value={med.frequency}
                      onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                      placeholder="e.g. Once daily in morning"
                    />
                    {medications.length > 1 && (
                      <Button
                        variant="danger"
                        size="sm"
                        type="button"
                        onClick={() => removeMedication(idx)}
                        className="mt-5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FF3D71]" /> Known Drug, Food & Latex Allergies
                </h3>
                <p className="text-xs text-slate-500">Vital for avoiding dangerous medication interactions</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={addAllergy}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Allergy
              </Button>
            </div>

            <div className="space-y-3">
              {allergies.map((alg, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Input
                    label="Substance / Drug"
                    value={alg.substance}
                    onChange={(e) => updateAllergy(idx, 'substance', e.target.value)}
                    placeholder="e.g. Penicillin, Codeine"
                  />
                  <Input
                    label="Reaction Description"
                    value={alg.reaction}
                    onChange={(e) => updateAllergy(idx, 'reaction', e.target.value)}
                    placeholder="e.g. Hives, Swelling, Anaphylaxis"
                  />
                  <div className="flex items-center gap-2">
                    <Select
                      label="Severity"
                      value={alg.severity}
                      onChange={(e) => updateAllergy(idx, 'severity', e.target.value)}
                      options={[
                        { value: 'MILD', label: 'Mild (Rash/Itch)' },
                        { value: 'MODERATE', label: 'Moderate (Hives/Nausea)' },
                        { value: 'SEVERE_ANAPHYLACTIC', label: 'Severe / Anaphylactic' },
                      ]}
                    />
                    {allergies.length > 1 && (
                      <Button
                        variant="danger"
                        size="sm"
                        type="button"
                        onClick={() => removeAllergy(idx)}
                        className="mt-5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Surgical & Family History */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Surgical & Family History</h3>
              <p className="text-xs text-slate-500">Provide any relevant past operations or family conditions</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Past Surgeries / Major Procedures"
                value={surgicalHistory}
                onChange={(e) => setSurgicalHistory(e.target.value)}
                placeholder="e.g. Appendectomy (2015), C-Section (2020)"
              />
              <Input
                label="Family Medical History"
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
                placeholder="e.g. Diabetes (Father), Heart disease (Mother)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <Select
                label="Smoking Status"
                value={smokingStatus}
                onChange={(e) => setSmokingStatus(e.target.value as any)}
                options={[
                  { value: 'NEVER', label: 'Never Smoked' },
                  { value: 'FORMER', label: 'Former Smoker' },
                  { value: 'CURRENT', label: 'Current Smoker' },
                ]}
              />
              <Select
                label="Alcohol Usage"
                value={alcoholUsage}
                onChange={(e) => setAlcoholUsage(e.target.value as any)}
                options={[
                  { value: 'NONE', label: 'None / Non-Drinker' },
                  { value: 'OCCASIONAL', label: 'Occasional / Social' },
                  { value: 'REGULAR', label: 'Regular' },
                ]}
              />
              <Select
                label="Physical Activity"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as any)}
                options={[
                  { value: 'SEDENTARY', label: 'Sedentary' },
                  { value: 'MODERATE', label: 'Moderate (1-3 days/wk)' },
                  { value: 'ACTIVE', label: 'Active (4+ days/wk)' },
                ]}
              />
            </div>
          </div>

          {/* Consent & Digital Signature */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#176BFF]" /> Digital Consent & Electronic Signature
              </h3>
              <p className="text-xs text-slate-500">Legal confirmation for POPIA-compliant medical data processing</p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="w-4 h-4 text-[#176BFF] rounded-sm mt-0.5"
                  required
                />
                <span className="text-xs text-slate-700 leading-snug">
                  I confirm that all health information provided above is accurate and complete to the best of my knowledge.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={popiaConsent}
                  onChange={(e) => setPopiaConsent(e.target.checked)}
                  className="w-4 h-4 text-[#176BFF] rounded-sm mt-0.5"
                  required
                />
                <span className="text-xs text-slate-700 leading-snug">
                  I consent under the <strong>POPIA Act</strong> for DigitalNexCare to securely transmit this clinical intake record directly to my selected healthcare provider.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <Input
                label="Full Legal Signature (Type Full Name)"
                value={digitalSignature}
                onChange={(e) => setDigitalSignature(e.target.value)}
                placeholder="e.g. Lerato Khumalo"
                required
              />
            </div>
          </div>

          {submitSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-bold flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Clinical pre-visit intake form successfully submitted and linked to your healthcare record!</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Submit Pre-Visit Intake Form
            </Button>
          </div>
        </form>
      ) : (
        /* Submitted Forms View */
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Submitted Forms Yet</h3>
              <p className="text-xs text-slate-500">
                Complete your pre-visit intake questionnaires before your upcoming appointments.
              </p>
              <Button variant="primary" size="sm" onClick={() => setActiveTab('NEW_FORM')}>
                Fill New Form
              </Button>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{item.chiefComplaint}</h3>
                      <Badge variant="verified" size="sm">
                        Verified POPIA Consent
                      </Badge>
                    </div>
                    <p className="text-xs text-[#176BFF] font-semibold mt-0.5">
                      {item.providerName || 'General Consultation'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {new Date(item.submittedAt).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedResponse(item)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Pain Scale</span>
                    <strong className="text-slate-900 font-bold">{item.painSeverityScale}/10</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Chronic Conditions</span>
                    <strong className="text-slate-900 font-bold">
                      {item.chronicConditions.join(', ') || 'None'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Active Meds</span>
                    <strong className="text-slate-900 font-bold">{item.currentMedications.length} listed</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Digital Signer</span>
                    <strong className="text-slate-900 font-bold">{item.digitalSignature}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedResponse && (
        <Modal
          isOpen={Boolean(selectedResponse)}
          onClose={() => setSelectedResponse(null)}
          title="Clinical Pre-Visit Record Details"
          description={`Submitted on ${new Date(selectedResponse.submittedAt).toLocaleString()}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <strong className="block text-slate-900 font-bold mb-1">Chief Complaint:</strong>
              <p className="text-slate-700">{selectedResponse.chiefComplaint}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <strong className="block text-slate-900 font-bold mb-1">Pain Scale:</strong>
                <p className="text-[#176BFF] font-bold text-sm">{selectedResponse.painSeverityScale}/10</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <strong className="block text-slate-900 font-bold mb-1">Symptom Duration:</strong>
                <p className="text-slate-700">{selectedResponse.symptomDuration}</p>
              </div>
            </div>

            <div>
              <strong className="block text-slate-900 font-bold mb-1">Active Medications:</strong>
              {selectedResponse.currentMedications.length === 0 ? (
                <p className="text-slate-500">None reported</p>
              ) : (
                <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                  {selectedResponse.currentMedications.map((m, i) => (
                    <li key={i}>
                      <strong>{m.name}</strong> - {m.dosage} ({m.frequency})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <strong className="block text-slate-900 font-bold mb-1">Allergies:</strong>
              {selectedResponse.allergies.length === 0 ? (
                <p className="text-slate-500">None reported</p>
              ) : (
                <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                  {selectedResponse.allergies.map((a, i) => (
                    <li key={i}>
                      <strong>{a.substance}</strong>: {a.reaction} ({a.severity})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
              <span>Electronic Signer: <strong>{selectedResponse.digitalSignature}</strong></span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> POPIA Approved
              </span>
            </div>
          </div>
        </Modal>
      )}
    </PatientLayout>
  );
};
