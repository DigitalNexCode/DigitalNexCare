import React, { useState } from 'react';
import { ProviderLayout } from '../../components/layout/ProviderLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import {
  Building,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Stethoscope,
  MapPin,
  CreditCard,
  Clock,
  Sparkles,
  Save,
  Globe,
  Plus,
  Trash2,
} from 'lucide-react';
import { ProviderService } from '../../lib/provider/provider-service';
import { MOCK_PROVIDERS } from '../../data/mockDatabase';
import { SA_PROVINCES, SA_CITIES_BY_PROVINCE, HEALTHCARE_SPECIALTIES, SA_MEDICAL_AIDS } from '../../lib/constants';
import { SouthAfricanProvince, DigitalNexCareProvider } from '../../types';

export const ProviderProfileEditPage: React.FC = () => {
  const currentProvider = MOCK_PROVIDERS[0];

  const [fullName, setFullName] = useState(currentProvider.fullName);
  const [title, setTitle] = useState(currentProvider.title);
  const [specialty, setSpecialty] = useState(currentProvider.specialty);
  const [practiceName, setPracticeName] = useState(currentProvider.practiceName);
  const [phone, setPhone] = useState(currentProvider.phone);
  const [email, setEmail] = useState(currentProvider.email);
  const [website, setWebsite] = useState(currentProvider.website || '');
  const [bio, setBio] = useState(currentProvider.bio);
  const [experienceYears, setExperienceYears] = useState(currentProvider.experienceYears);
  const [consultationFeeZAR, setConsultationFeeZAR] = useState(currentProvider.consultationFeeZAR);
  const [province, setProvince] = useState<SouthAfricanProvince>(currentProvider.province);
  const [city, setCity] = useState(currentProvider.city);
  const [suburb, setSuburb] = useState(currentProvider.suburb);
  const [address, setAddress] = useState(currentProvider.address);
  const [offersVirtual, setOffersVirtual] = useState(currentProvider.offersVirtual);
  const [offersInPerson, setOffersInPerson] = useState(currentProvider.offersInPerson);
  const [acceptedMedicalAids, setAcceptedMedicalAids] = useState<string[]>(currentProvider.acceptedMedicalAids);

  // Dynamic services and subspecialties lists
  const [services, setServices] = useState<string[]>(currentProvider.services);
  const [newServiceInput, setNewServiceInput] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleMedicalAidToggle = (aid: string) => {
    setAcceptedMedicalAids((prev) =>
      prev.includes(aid) ? prev.filter((a) => a !== aid) : [...prev, aid]
    );
  };

  const handleAddService = () => {
    if (newServiceInput.trim() && !services.includes(newServiceInput.trim())) {
      setServices([...services, newServiceInput.trim()]);
      setNewServiceInput('');
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    setServices(services.filter((s) => s !== serviceToRemove));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      const res = ProviderService.updateProviderProfile(currentProvider.id, {
        fullName,
        title,
        specialty,
        practiceName,
        phone,
        email,
        website,
        bio,
        experienceYears: Number(experienceYears),
        consultationFeeZAR: Number(consultationFeeZAR),
        province,
        city,
        suburb,
        address,
        offersVirtual,
        offersInPerson,
        acceptedMedicalAids,
        services,
      });

      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }, 400);
  };

  return (
    <ProviderLayout
      title="Provider Profile & Practice Details"
      subtitle="Manage your authoritative public presence, clinical services, medical aids, and consultation pricing."
    >
      <div className="space-y-6">
        {/* Authoritative Data Seal Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  Authority Level 6 of 6
                </span>
                <span className="text-xs font-bold text-emerald-900">
                  DIGITALNEXCARE_VERIFIED_PROVIDER
                </span>
              </div>
              <h3 className="text-base font-bold text-emerald-950 mt-1">
                Authoritative Provider Edits Protected
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                In compliance with Section 22 of the platform constitution, your edits permanently supersede external directory crawlers.
              </p>
            </div>
          </div>

          <Badge variant="verified" size="md">
            Protected from Overwrite
          </Badge>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Profile updates saved successfully with authoritative verification rank!
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              1. Professional Identity & Biography
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              options={[
                { value: 'Dr.', label: 'Dr.' },
                { value: 'Prof.', label: 'Prof.' },
                { value: 'Mr.', label: 'Mr.' },
                { value: 'Ms.', label: 'Ms.' },
                { value: 'Sr.', label: 'Sr.' },
              ]}
            />

            <div className="sm:col-span-2">
              <Input
                label="Full Display Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Primary Specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              options={HEALTHCARE_SPECIALTIES.map((s) => ({ value: s, label: s }))}
            />

            <Input
              label="Experience (Years)"
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
            />

            <Input
              label="Base Consultation Fee (ZAR)"
              type="number"
              value={consultationFeeZAR}
              onChange={(e) => setConsultationFeeZAR(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Professional Biography
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#176BFF] focus:ring-1 focus:ring-[#176BFF]"
              placeholder="Detail your medical education, hospital affiliations, and special clinical interests..."
            />
          </div>

          <div className="border-b border-slate-100 pb-4 pt-4">
            <h3 className="text-base font-bold text-slate-900">
              2. Contact Information & Online Presence
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Direct Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <Input
              label="Practice Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Official Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://practice.co.za"
            />
          </div>

          <div className="border-b border-slate-100 pb-4 pt-4">
            <h3 className="text-base font-bold text-slate-900">
              3. Practice Location & Consultation Rooms
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Practice Facility Name"
              value={practiceName}
              onChange={(e) => setPracticeName(e.target.value)}
              required
            />

            <Select
              label="Province"
              value={province}
              onChange={(e) => {
                const p = e.target.value as SouthAfricanProvince;
                setProvince(p);
                setCity(SA_CITIES_BY_PROVINCE[p]?.[0] || '');
              }}
              options={SA_PROVINCES.map((p) => ({ value: p, label: p }))}
            />

            <Select
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              options={(SA_CITIES_BY_PROVINCE[province] || []).map((c) => ({ value: c, label: c }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Suburb"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              required
            />

            <div className="sm:col-span-2">
              <Input
                label="Physical Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="border-b border-slate-100 pb-4 pt-4">
            <h3 className="text-base font-bold text-slate-900">
              4. Clinical Services & Medical Aid Compatibility
            </h3>
          </div>

          {/* Services Offered Management */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Clinical Services Offered
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {services.map((srv) => (
                <span
                  key={srv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-[#176BFF] border border-blue-200"
                >
                  {srv}
                  <button
                    type="button"
                    onClick={() => handleRemoveService(srv)}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newServiceInput}
                onChange={(e) => setNewServiceInput(e.target.value)}
                placeholder="Add service (e.g. ECG, Paediatric Vaccination)..."
              />
              <Button type="button" variant="outline" onClick={handleAddService} leftIcon={<Plus className="w-4 h-4" />}>
                Add
              </Button>
            </div>
          </div>

          {/* Medical Aid Schemes Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Accepted Medical Aid Schemes
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SA_MEDICAL_AIDS.map((aid) => {
                const isSelected = acceptedMedicalAids.includes(aid);
                return (
                  <button
                    type="button"
                    key={aid}
                    onClick={() => handleMedicalAidToggle(aid)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-[#176BFF] font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {aid}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Authoritative Changes
            </Button>
          </div>
        </form>
      </div>
    </ProviderLayout>
  );
};
