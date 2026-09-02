import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../lib/auth/context';
import { SouthAfricanProvince } from '../../types';
import {
  SA_PROVINCES,
  POPULAR_SPECIALTIES,
  SA_MEDICAL_AIDS,
} from '../../lib/constants';
import {
  ShieldCheck,
  User,
  MapPin,
  HeartPulse,
  Building,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  FileCheck,
} from 'lucide-react';

export const ProfileCompletionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, completePatientProfile, completeProviderProfile } = useAuth();

  const isProvider = user?.role === 'PROVIDER';

  // Common location state
  const [province, setProvince] = useState<SouthAfricanProvince>('Gauteng');
  const [city, setCity] = useState('Pretoria');
  const [suburb, setSuburb] = useState('Hatfield');
  const [address, setAddress] = useState('12 Burnett Street, Medical Centre');

  // Patient state
  const [nationalId, setNationalId] = useState('9204125890082');
  const [dateOfBirth, setDateOfBirth] = useState('1992-04-12');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'>('FEMALE');
  const [hasMedicalAid, setHasMedicalAid] = useState(true);
  const [schemeName, setSchemeName] = useState('Discovery Health');
  const [planName, setPlanName] = useState('Classic Comprehensive');
  const [membershipNumber, setMembershipNumber] = useState('984029112');
  const [dependantCode, setDependantCode] = useState('00');

  // Provider state
  const [title, setTitle] = useState('Dr.');
  const [specialty, setSpecialty] = useState('General Practitioner');
  const [statutoryCouncil, setStatutoryCouncil] = useState<'HPCSA' | 'SANC' | 'SAPC' | 'AHPCSA'>('HPCSA');
  const [registrationNumber, setRegistrationNumber] = useState('MP 0789456');
  const [practiceNumber, setPracticeNumber] = useState('0145892');
  const [practiceName, setPracticeName] = useState('Hatfield Family Health & Wellness');
  const [consultationFee, setConsultationFee] = useState(650);

  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isProvider) {
      const res = await completeProviderProfile({
        title,
        specialty,
        hpcsaNumber: statutoryCouncil === 'HPCSA' ? registrationNumber : undefined,
        sancNumber: statutoryCouncil === 'SANC' ? registrationNumber : undefined,
        sapcNumber: statutoryCouncil === 'SAPC' ? registrationNumber : undefined,
        ahpcsaNumber: statutoryCouncil === 'AHPCSA' ? registrationNumber : undefined,
        practiceNumber,
        practiceName,
        province,
        city,
        suburb,
        address,
        consultationFeeZAR: consultationFee,
      });

      setIsLoading(false);
      if (res.success) {
        navigate('/provider/dashboard');
      }
    } else {
      const res = await completePatientProfile({
        nationalIdOrPassport: nationalId,
        dateOfBirth,
        gender,
        province,
        city,
        suburb,
        address,
        medicalAid: hasMedicalAid
          ? {
              schemeName,
              planName,
              membershipNumber,
              mainMemberName: user?.fullName || 'Main Member',
              dependantCode,
            }
          : undefined,
      });

      setIsLoading(false);
      if (res.success) {
        navigate('/patient/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center space-y-2 mb-6">
        <Link to="/" className="inline-block">
          <BrandLogo variant="master" size="lg" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {isProvider ? 'Complete Your Healthcare Practice Profile' : 'Complete Your Patient Health Profile'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          {isProvider
            ? 'Set up statutory compliance, registration numbers, and practice information to receive bookings.'
            : 'Provide mandatory National Health Act verification and medical-aid details for seamless care access.'}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
          {/* Step Progress Indicators */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  activeStep >= 1 ? 'bg-[#176BFF] text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                1
              </span>
              <span className="text-xs font-bold text-slate-800">
                {isProvider ? 'Statutory Registration' : 'Personal Info'}
              </span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  activeStep >= 2 ? 'bg-[#176BFF] text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                2
              </span>
              <span className="text-xs font-bold text-slate-800">Location</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  activeStep >= 3 ? 'bg-[#176BFF] text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                3
              </span>
              <span className="text-xs font-bold text-slate-800">
                {isProvider ? 'Practice Details' : 'Medical Aid'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal or Statutory Info */}
            {activeStep === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-sm font-bold text-[#176BFF]">
                  {isProvider ? <Stethoscope className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  <span>{isProvider ? 'Statutory Council & Qualifications' : 'Identity Verification'}</span>
                </div>

                {isProvider ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Title</label>
                        <select
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#176BFF]"
                        >
                          <option value="Dr.">Dr.</option>
                          <option value="Prof.">Prof.</option>
                          <option value="Sr.">Sr. (Sister)</option>
                          <option value="Mr.">Mr.</option>
                          <option value="Ms.">Ms.</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Specialty</label>
                        <select
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#176BFF]"
                        >
                          {POPULAR_SPECIALTIES.map((spec) => (
                            <option key={spec} value={spec}>
                              {spec}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Professional Council
                        </label>
                        <select
                          value={statutoryCouncil}
                          onChange={(e) => setStatutoryCouncil(e.target.value as any)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#176BFF]"
                        >
                          <option value="HPCSA">HPCSA (Medical & Dental)</option>
                          <option value="SANC">SANC (Nursing Council)</option>
                          <option value="SAPC">SAPC (Pharmacy Council)</option>
                          <option value="AHPCSA">AHPCSA (Allied Health)</option>
                        </select>
                      </div>

                      <Input
                        label="Council Registration Number"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        placeholder="e.g. MP 0789456"
                        required
                      />
                    </div>

                    <Input
                      label="BHF / PCNS Practice Number"
                      value={practiceNumber}
                      onChange={(e) => setPracticeNumber(e.target.value)}
                      placeholder="e.g. 0145892"
                      required
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label="South African ID Number or Passport"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="13-digit SA ID number"
                      required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Date of Birth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        required
                      />

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#176BFF]"
                        >
                          <option value="FEMALE">Female</option>
                          <option value="MALE">Male</option>
                          <option value="OTHER">Other / Non-binary</option>
                          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 flex justify-end">
                  <Button type="button" variant="primary" onClick={() => setActiveStep(2)}>
                    Continue to Location →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {activeStep === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-sm font-bold text-[#176BFF]">
                  <MapPin className="w-4 h-4" />
                  <span>{isProvider ? 'Physical Practice Location' : 'Residential Location'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Province</label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value as SouthAfricanProvince)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#176BFF]"
                    >
                      {SA_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="City / Town"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pretoria, Cape Town, Durban"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Suburb"
                    value={suburb}
                    onChange={(e) => setSuburb(e.target.value)}
                    placeholder="e.g. Hatfield, Sandton, Claremont"
                    required
                  />

                  <Input
                    label="Street Address / Practice Chambers"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 42 Burnett Street"
                    required
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveStep(1)}>
                    ← Back
                  </Button>
                  <Button type="button" variant="primary" onClick={() => setActiveStep(3)}>
                    Continue to {isProvider ? 'Practice Details' : 'Medical Aid'} →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Medical Aid / Practice Setup */}
            {activeStep === 3 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-sm font-bold text-[#176BFF]">
                  {isProvider ? <Building className="w-4 h-4" /> : <HeartPulse className="w-4 h-4" />}
                  <span>{isProvider ? 'Practice Setup & Consultation Fee' : 'Medical Aid Scheme Profile'}</span>
                </div>

                {isProvider ? (
                  <>
                    <Input
                      label="Practice Legal or Commercial Name"
                      value={practiceName}
                      onChange={(e) => setPracticeName(e.target.value)}
                      placeholder="e.g. Hatfield Family Health & Wellness"
                      required
                    />

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Base In-Person Consultation Fee (ZAR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                          R
                        </span>
                        <input
                          type="number"
                          value={consultationFee}
                          onChange={(e) => setConsultationFee(Number(e.target.value))}
                          min={200}
                          max={5000}
                          step={50}
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176BFF]"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Patients can pay via medical aid or privately (Card / Instant EFT / Paystack / Yoco).
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Direct Booking Policy</span>
                      </div>
                      <p className="text-emerald-800">
                        Joining DigitalNexCare allows verified patients to book available slots directly without any paywalls or barrier fees.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Do you have medical aid?</span>
                        <span className="text-[11px] text-slate-500">
                          Toggle off if you prefer paying privately (Cash / Card).
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={hasMedicalAid}
                        onChange={(e) => setHasMedicalAid(e.target.checked)}
                        className="w-5 h-5 rounded text-[#176BFF] focus:ring-[#176BFF]"
                      />
                    </div>

                    {hasMedicalAid && (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Medical Scheme</label>
                            <select
                              value={schemeName}
                              onChange={(e) => setSchemeName(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#176BFF]"
                            >
                              {SA_MEDICAL_AIDS.map((aid) => (
                                <option key={aid} value={aid}>
                                  {aid}
                                </option>
                              ))}
                              <option value="Other">Other Medical Scheme</option>
                            </select>
                          </div>

                          <Input
                            label="Benefit Option / Plan"
                            value={planName}
                            onChange={(e) => setPlanName(e.target.value)}
                            placeholder="e.g. Classic Comprehensive"
                            required={hasMedicalAid}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="Membership / Policy Number"
                            value={membershipNumber}
                            onChange={(e) => setMembershipNumber(e.target.value)}
                            placeholder="e.g. 984029112"
                            required={hasMedicalAid}
                          />

                          <Input
                            label="Dependant Code (e.g. 00 for Main Member)"
                            value={dependantCode}
                            onChange={(e) => setDependantCode(e.target.value)}
                            placeholder="00"
                            required={hasMedicalAid}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="pt-4 flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveStep(2)}>
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    rightIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Finish Setup & Access Portal
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
