import React, { useState } from 'react';
import { PatientLayout } from '../../components/layout/PatientLayout';
import { PatientService } from '../../lib/patient/patient-service';
import { PatientDependant } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import {
  UserPlus,
  Users,
  Trash2,
  Edit2,
  ShieldCheck,
  AlertCircle,
  Heart,
  Calendar,
  CreditCard,
  Phone,
  CheckCircle2,
} from 'lucide-react';

export const PatientDependantsPage: React.FC = () => {
  const [dependants, setDependants] = useState<PatientDependant[]>(() => PatientService.getDependants());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState<'CHILD' | 'SPOUSE' | 'PARENT' | 'SIBLING' | 'EXTENDED_FAMILY' | 'OTHER'>('CHILD');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'>('FEMALE');
  const [medicalAidDependantCode, setMedicalAidDependantCode] = useState('01');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [guardianConsent, setGuardianConsent] = useState(true);

  const openAddModal = () => {
    setEditingId(null);
    setFullName('');
    setRelationship('CHILD');
    setDateOfBirth('2018-05-12');
    setNationalId('');
    setGender('FEMALE');
    setMedicalAidDependantCode(`0${dependants.length + 1}`);
    setEmergencyContactName('Lerato Khumalo');
    setEmergencyContactPhone('+27 82 555 1234');
    setAllergies('');
    setChronicConditions('');
    setGuardianConsent(true);
    setIsModalOpen(true);
  };

  const openEditModal = (dep: PatientDependant) => {
    setEditingId(dep.id);
    setFullName(dep.fullName);
    setRelationship(dep.relationship);
    setDateOfBirth(dep.dateOfBirth || dep.idNumberOrDOB || '');
    setNationalId(dep.nationalId || '');
    setGender(dep.gender || 'FEMALE');
    setMedicalAidDependantCode(dep.medicalAidDependantCode || '01');
    setEmergencyContactName(dep.emergencyContactName || '');
    setEmergencyContactPhone(dep.emergencyContactPhone || '');
    setAllergies(dep.allergies || '');
    setChronicConditions(dep.chronicConditions || '');
    setGuardianConsent(dep.guardianConsent);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const dependantRecord: PatientDependant = {
      id: editingId || `dep-${Date.now()}`,
      fullName,
      relationship,
      idNumberOrDOB: nationalId || dateOfBirth,
      dateOfBirth,
      nationalId,
      gender,
      medicalAidDependantCode,
      emergencyContactName,
      emergencyContactPhone,
      allergies,
      chronicConditions,
      guardianConsent,
    };

    const updated = PatientService.saveDependant(dependantRecord);
    setDependants(updated);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this dependant from your account?')) {
      const updated = PatientService.deleteDependant(id);
      setDependants(updated);
    }
  };

  return (
    <PatientLayout
      title="Dependants & Family Members"
      subtitle="Manage household members and dependants for seamless appointment bookings and medical aid routing."
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs text-slate-500 font-semibold">
            {dependants.length} Registered Household Dependants
          </span>
          <p className="text-xs text-slate-500 mt-0.5">
            Book appointments on behalf of children, spouses, or parents with instant profile linking.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openAddModal}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Add Dependant
        </Button>
      </div>

      {/* Dependants List */}
      <div className="space-y-4">
        {dependants.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Dependants Registered</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add children, spouses, or senior family members to book consultations directly on their behalf.
            </p>
            <Button variant="primary" size="sm" onClick={openAddModal}>
              Register First Dependant
            </Button>
          </div>
        ) : (
          dependants.map((dep) => (
            <div
              key={dep.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{dep.fullName}</h3>
                    <Badge variant="brand" size="sm">
                      {dep.relationship}
                    </Badge>
                    {dep.guardianConsent && (
                      <Badge variant="verified" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                        Guardian Authorized
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      DOB: <strong className="text-slate-700">{dep.dateOfBirth || dep.idNumberOrDOB}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      Medical Aid Code: <strong className="text-slate-700">{dep.medicalAidDependantCode}</strong>
                    </span>
                    {dep.emergencyContactPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        Emergency: <strong className="text-slate-700">{dep.emergencyContactPhone}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(dep)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(dep.id)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {/* Clinical Flags (Allergies & Conditions) */}
              {(dep.allergies || dep.chronicConditions) && (
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                    <Heart className="w-4 h-4 text-[#FF3D71] flex-shrink-0" /> Clinical Notes:
                  </div>
                  <div className="text-amber-800 space-x-2">
                    {dep.allergies && (
                      <span>
                        <strong>Allergies:</strong> {dep.allergies}
                      </span>
                    )}
                    {dep.chronicConditions && (
                      <span>
                        <strong>Chronic Conditions:</strong> {dep.chronicConditions}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Dependant Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Dependant Profile' : 'Add Household Dependant'}
        description="Register or update family member details for healthcare bookings and medical aid claims."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Legal Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Sipho Khumalo"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as any)}
              options={[
                { value: 'CHILD', label: 'Child / Minor' },
                { value: 'SPOUSE', label: 'Spouse / Partner' },
                { value: 'PARENT', label: 'Parent / Elder' },
                { value: 'SIBLING', label: 'Sibling' },
                { value: 'EXTENDED_FAMILY', label: 'Extended Family' },
                { value: 'OTHER', label: 'Other Dependant' },
              ]}
            />
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              options={[
                { value: 'FEMALE', label: 'Female' },
                { value: 'MALE', label: 'Male' },
                { value: 'OTHER', label: 'Other' },
                { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
            <Input
              label="Medical Aid Dependant Code"
              value={medicalAidDependantCode}
              onChange={(e) => setMedicalAidDependantCode(e.target.value)}
              placeholder="e.g. 01, 02, 03"
              required
            />
          </div>

          <Input
            label="South African ID / Birth Certificate Number"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            placeholder="13-digit ID or birth cert number"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Emergency Contact Name"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              placeholder="e.g. Lerato Khumalo (Mother)"
            />
            <Input
              label="Emergency Contact Phone"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              placeholder="+27 82 555 1234"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Known Drug/Food Allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Peanuts"
            />
            <Input
              label="Chronic Conditions (if any)"
              value={chronicConditions}
              onChange={(e) => setChronicConditions(e.target.value)}
              placeholder="e.g. Asthma, Eczema"
            />
          </div>

          {relationship === 'CHILD' && (
            <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 cursor-pointer">
              <input
                type="checkbox"
                checked={guardianConsent}
                onChange={(e) => setGuardianConsent(e.target.checked)}
                className="w-4 h-4 text-[#176BFF] rounded-sm mt-0.5"
                required
              />
              <span className="text-xs text-blue-900 leading-snug">
                <strong>Legal Guardian Declaration:</strong> I confirm I am the legal parent or guardian authorized to book medical consultations and share health details for this minor.
              </span>
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingId ? 'Save Updates' : 'Add Dependant'}
            </Button>
          </div>
        </form>
      </Modal>
    </PatientLayout>
  );
};
