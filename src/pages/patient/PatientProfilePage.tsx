import React, { useState } from 'react';
import { PatientLayout } from '../../components/layout/PatientLayout';
import { PatientService } from '../../lib/patient/patient-service';
import { PatientUser, PatientPreferences, SouthAfricanProvince } from '../../types';
import { SA_PROVINCES } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Bell,
  Shield,
  CheckCircle2,
  Lock,
  Smartphone,
  MessageSquare,
  Clock,
  Sparkles,
} from 'lucide-react';

export const PatientProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<PatientUser>(() => PatientService.getPatientProfile());
  const [preferences, setPreferences] = useState<PatientPreferences>(profile.preferences);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileChange = (field: keyof PatientUser, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrefChange = (field: keyof PatientPreferences, value: any) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      const updatedProfile: PatientUser = {
        ...profile,
        preferences,
      };
      PatientService.savePatientProfile(updatedProfile);
      setSavedSuccess(true);
      setIsSaving(false);
      setTimeout(() => setSavedSuccess(false), 4000);
    }, 400);
  };

  return (
    <PatientLayout
      title="Patient Profile & Account Settings"
      subtitle="Manage your personal details, physical address, and communication preferences for consultations."
    >
      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#176BFF] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500">Legal identification for medical appointment verification</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Legal Name"
              value={profile.fullName}
              onChange={(e) => handleProfileChange('fullName', e.target.value)}
              placeholder="e.g. Lerato Khumalo"
              required
            />
            <Input
              label="South African ID Number / Passport"
              value={profile.nationalIdOrPassport || ''}
              onChange={(e) => handleProfileChange('nationalIdOrPassport', e.target.value)}
              placeholder="13-digit SA ID number"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={profile.dateOfBirth || ''}
              onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
              required
            />
            <Select
              label="Gender"
              value={profile.gender || 'FEMALE'}
              onChange={(e) => handleProfileChange('gender', e.target.value)}
              options={[
                { value: 'FEMALE', label: 'Female' },
                { value: 'MALE', label: 'Male' },
                { value: 'OTHER', label: 'Other' },
                { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
              ]}
            />
            <Input
              label="Preferred Language"
              value={preferences.languagePreference}
              onChange={(e) => handlePrefChange('languagePreference', e.target.value)}
              placeholder="English, isiZulu, Afrikaans, etc."
            />
          </div>
        </div>

        {/* Contact & Physical Address */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Contact & Address</h2>
              <p className="text-xs text-slate-500">Used for notifications and finding nearby healthcare practices</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={profile.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              required
            />
            <Input
              label="Mobile Telephone (SA +27)"
              value={profile.phone}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              placeholder="+27 82 555 1234"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Province"
              value={profile.province || 'Gauteng'}
              onChange={(e) => handleProfileChange('province', e.target.value as SouthAfricanProvince)}
              options={SA_PROVINCES.map((p) => ({ value: p, label: p }))}
            />
            <Input
              label="City / Town"
              value={profile.city || ''}
              onChange={(e) => handleProfileChange('city', e.target.value)}
              placeholder="e.g. Pretoria"
            />
            <Input
              label="Suburb"
              value={profile.suburb || ''}
              onChange={(e) => handleProfileChange('suburb', e.target.value)}
              placeholder="e.g. Hatfield"
            />
          </div>

          <Input
            label="Street Address"
            value={profile.address || ''}
            onChange={(e) => handleProfileChange('address', e.target.value)}
            placeholder="e.g. 142 Burnett Street"
          />
        </div>

        {/* Communication & Notification Preferences */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Notification Channels & Reminders</h2>
              <p className="text-xs text-slate-500">Configure how you receive consultation reminders and updates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={preferences.smsNotifications}
                onChange={(e) => handlePrefChange('smsNotifications', e.target.checked)}
                className="w-4 h-4 text-[#176BFF] rounded-sm focus:ring-[#176BFF]"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" /> SMS Alerts
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Direct SMS to your mobile phone</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => handlePrefChange('emailNotifications', e.target.checked)}
                className="w-4 h-4 text-[#176BFF] rounded-sm focus:ring-[#176BFF]"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> Email Updates
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Booking receipts & calendar invites</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={preferences.whatsAppNotifications}
                onChange={(e) => handlePrefChange('whatsAppNotifications', e.target.checked)}
                className="w-4 h-4 text-[#176BFF] rounded-sm focus:ring-[#176BFF]"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Instant WhatsApp notifications</p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Select
              label="Appointment Reminder Lead Time"
              value={String(preferences.reminderLeadHours)}
              onChange={(e) => handlePrefChange('reminderLeadHours', parseInt(e.target.value, 10))}
              options={[
                { value: '2', label: '2 Hours Before Appointment' },
                { value: '12', label: '12 Hours Before Appointment' },
                { value: '24', label: '24 Hours Before Appointment (Recommended)' },
                { value: '48', label: '48 Hours Before Appointment' },
              ]}
            />
            <Input
              label="Accessibility / Special Assistance Needs"
              value={preferences.accessibilityNeeds || ''}
              onChange={(e) => handlePrefChange('accessibilityNeeds', e.target.value)}
              placeholder="e.g. Wheelchair ramp, Sign language interpreter"
            />
          </div>
        </div>

        {/* POPIA & Privacy Declaration */}
        <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 flex items-start gap-3">
          <Shield className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-900 font-bold block mb-0.5">POPIA & Healthcare Privacy Safeguards</strong>
            Your personal information is strictly protected under the Protection of Personal Information Act (POPIA).
            Medical details are shared exclusively with treating practitioners you authorize upon booking.
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-bold flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Profile and communication preferences updated successfully!</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="primary" type="submit" isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </form>
    </PatientLayout>
  );
};
