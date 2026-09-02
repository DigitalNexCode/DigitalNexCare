import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { MOCK_PROVIDERS } from '../../data/mockDatabase';
import { SchedulingEngine } from '../../lib/scheduling/scheduling-engine';
import {
  AppointmentSlot,
  AppointmentTypeConfig,
  SlotHoldRecord,
  DetailedAppointment,
  AppointmentMode,
} from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { SA_MEDICAL_AIDS } from '../../lib/constants';
import {
  Calendar,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Building,
  User,
  CreditCard,
  Check,
  ArrowRight,
  ArrowLeft,
  Video,
  MapPin,
  AlertTriangle,
  Timer,
  FileText,
  Lock,
} from 'lucide-react';

export const BookingFlowPage: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const provider = MOCK_PROVIDERS.find((p) => p.id === providerId) || MOCK_PROVIDERS[0];

  // Appointment Types
  const appointmentTypes = SchedulingEngine.getAppointmentTypes(provider.id);
  const [selectedTypeId, setSelectedTypeId] = useState<string>(
    appointmentTypes[0]?.id || 'apt-type-001'
  );
  const selectedType =
    appointmentTypes.find((t) => t.id === selectedTypeId) || appointmentTypes[0];

  // Step Management (1: Type & Reason, 2: Slot & Hold, 3: Patient Details, 4: Medical Aid & Intake, 5: Review & Confirm, 6: Confirmed)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Form States
  const [reasonForVisit, setReasonForVisit] = useState('Routine consultation / check-up');
  const [preferredMode, setPreferredMode] = useState<AppointmentMode>('IN_PERSON');
  const [selectedDate, setSelectedDate] = useState('2026-09-03');
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [activeHold, setActiveHold] = useState<SlotHoldRecord | null>(null);
  const [holdTimeLeft, setHoldTimeLeft] = useState<number>(600); // 10 minutes in seconds
  const [holdError, setHoldError] = useState<string | null>(null);

  // Patient & Intake Details
  const [patientType, setPatientType] = useState<'SELF' | 'DEPENDANT'>('SELF');
  const [patientName, setPatientName] = useState('Lerato Khumalo');
  const [patientEmail, setPatientEmail] = useState('lerato.khumalo@example.co.za');
  const [patientPhone, setPatientPhone] = useState('+27 82 555 0192');
  const [dependantName, setDependantName] = useState('');
  const [dependantRelationship, setDependantRelationship] = useState('CHILD');

  // Intake Clinical Information
  const [symptoms, setSymptoms] = useState('');
  const [allergies, setAllergies] = useState('None known');
  const [currentMedications, setCurrentMedications] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'MEDICAL_AID' | 'CARD_AT_PRACTICE' | 'ONLINE'>(
    'MEDICAL_AID'
  );
  const [medicalAidScheme, setMedicalAidScheme] = useState('Discovery Health');
  const [memberNumber, setMemberNumber] = useState('908234112');
  const [dependantCode, setDependantCode] = useState('00');

  // Confirmed Appointment Result
  const [confirmedAppointment, setConfirmedAppointment] = useState<DetailedAppointment | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generated Slots for selected date
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);

  useEffect(() => {
    if (provider && selectedTypeId && selectedDate) {
      const slots = SchedulingEngine.generateAvailableSlots(
        provider.id,
        selectedTypeId,
        selectedDate,
        selectedDate
      );
      setAvailableSlots(slots);
      if (slots.length > 0 && (!selectedSlot || selectedSlot.date !== selectedDate)) {
        setSelectedSlot(slots[0]);
      }
    }
  }, [provider.id, selectedTypeId, selectedDate]);

  // Hold Countdown Timer
  useEffect(() => {
    if (!activeHold) return;
    const interval = setInterval(() => {
      const expiresAt = new Date(activeHold.expiresAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setHoldTimeLeft(diff);
      if (diff <= 0) {
        setActiveHold(null);
        setHoldError('Your slot reservation hold has expired. Please select a time slot again.');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeHold]);

  const handleSelectSlotAndHold = (slot: AppointmentSlot) => {
    setSelectedSlot(slot);
    setHoldError(null);
    const res = SchedulingEngine.holdSlot({
      slotId: slot.id,
      providerId: provider.id,
      patientId: 'pat-001',
      patientName,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      appointmentTypeId: selectedTypeId,
      expiryMinutes: 10,
    });

    if (res.success && res.hold) {
      setActiveHold(res.hold);
      setHoldTimeLeft(600);
    } else {
      setHoldError(res.message || 'Unable to hold this slot.');
    }
  };

  const handleProceedFromSlot = () => {
    if (!selectedSlot) return;
    if (!activeHold) {
      handleSelectSlotAndHold(selectedSlot);
    }
    setStep(3);
  };

  const handleFinalConfirmBooking = () => {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    setBookingError(null);

    setTimeout(() => {
      const res = SchedulingEngine.confirmBooking({
        holdId: activeHold?.holdId,
        providerId: provider.id,
        patientId: 'pat-001',
        patientName: patientType === 'SELF' ? patientName : dependantName || patientName,
        patientEmail,
        patientPhone,
        patientType,
        dependantName: patientType === 'DEPENDANT' ? dependantName : undefined,
        dependantRelationship: patientType === 'DEPENDANT' ? dependantRelationship : undefined,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        mode: selectedType.mode,
        appointmentTypeId: selectedTypeId,
        paymentMethod,
        medicalAidScheme: paymentMethod === 'MEDICAL_AID' ? medicalAidScheme : undefined,
        medicalAidMemberNumber: paymentMethod === 'MEDICAL_AID' ? memberNumber : undefined,
        medicalAidDependantCode: paymentMethod === 'MEDICAL_AID' ? dependantCode : undefined,
        reasonForVisit,
        symptoms,
        allergies,
        currentMedications,
      });

      setIsSubmitting(false);

      if (res.success && res.appointment) {
        setConfirmedAppointment(res.appointment);
        setStep(6);
      } else {
        setBookingError(res.message || 'Failed to complete booking.');
      }
    }, 400);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Step Progress Indicators */}
        {step < 6 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
              <span className={step >= 1 ? 'text-[#176BFF]' : ''}>1. Consultation</span>
              <span className={step >= 2 ? 'text-[#176BFF]' : ''}>2. Slot & Hold</span>
              <span className={step >= 3 ? 'text-[#176BFF]' : ''}>3. Patient</span>
              <span className={step >= 4 ? 'text-[#176BFF]' : ''}>4. Intake & Scheme</span>
              <span className={step >= 5 ? 'text-[#176BFF]' : ''}>5. Review</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#176BFF] h-full transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Temporary Hold Notification Banner */}
        {activeHold && step >= 2 && step < 6 && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>
                Slot reserved exclusively for you on{' '}
                <strong>
                  {activeHold.date} at {activeHold.startTime} - {activeHold.endTime}
                </strong>
              </span>
            </div>
            <span className="font-mono font-bold bg-amber-200/60 px-2 py-0.5 rounded-md text-amber-950">
              {formatTimer(holdTimeLeft)} left
            </span>
          </div>
        )}

        {/* Booking Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          {/* Provider Overview Header */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <img
              src={provider.photoUrl}
              alt={provider.fullName}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-100"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-slate-900">{provider.fullName}</h2>
                <Badge variant="verified" size="sm">
                  Verified
                </Badge>
              </div>
              <p className="text-xs font-semibold text-[#176BFF]">{provider.specialty}</p>
              <p className="text-xs text-slate-500">
                {provider.practiceName} • {provider.suburb}, {provider.city}
              </p>
            </div>
          </div>

          {/* STEP 1: Consultation Type & Reason */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#176BFF]" /> 1. Select Consultation Type & Reason
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose from {provider.fullName}'s verified appointment catalog.
                </p>
              </div>

              <div className="space-y-2.5">
                {appointmentTypes.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTypeId(t.id);
                      setPreferredMode(t.mode);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedTypeId === t.id
                        ? 'border-[#176BFF] bg-blue-50/50 ring-2 ring-[#176BFF]/20 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                          <Badge variant={t.mode === 'VIRTUAL' ? 'info' : 'success'} size="sm">
                            {t.mode === 'VIRTUAL' ? 'Virtual Video' : 'In-Person'}
                          </Badge>
                        </div>
                        {t.description && (
                          <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {t.durationMinutes} mins
                          </span>
                          <span>•</span>
                          <span>{t.locationName}</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900">R{t.priceZAR}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Input
                  label="Primary Reason for Visit / Chief Complaint"
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  placeholder="e.g. Routine checkup, sore throat, script renewal"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" size="lg" onClick={() => setStep(2)}>
                  Continue to Select Time Slot →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Real Slot Generation & Hold */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#176BFF]" /> 2. Choose Real-Time Consultation Slot
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generated in real-time from provider's weekly working shifts, buffer rules, and leaves.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Select Consultation Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min="2026-09-02"
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#176BFF]"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  <span className="font-bold text-slate-900">{availableSlots.length}</span> slots available for {selectedType.name}
                </div>
              </div>

              {holdError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-[#FF3D71] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{holdError}</span>
                </div>
              )}

              {availableSlots.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  No available slots found on {selectedDate}. The practice may be closed, fully booked, or on lunch/leave. Please choose another date.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handleSelectSlotAndHold(slot)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#176BFF] bg-blue-50/70 ring-2 ring-[#176BFF]/30 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#176BFF]" />
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                          Available • Instant Hold
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!selectedSlot}
                  onClick={handleProceedFromSlot}
                >
                  Continue to Patient Details →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Patient & Dependant Details */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#176BFF]" /> 3. Patient Information
              </h3>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="patientType"
                    checked={patientType === 'SELF'}
                    onChange={() => setPatientType('SELF')}
                  />
                  For Myself ({patientName})
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="patientType"
                    checked={patientType === 'DEPENDANT'}
                    onChange={() => setPatientType('DEPENDANT')}
                  />
                  For a Dependant / Child
                </label>
              </div>

              {patientType === 'DEPENDANT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <Input
                    label="Dependant Full Name"
                    value={dependantName}
                    onChange={(e) => setDependantName(e.target.value)}
                    placeholder="e.g. Sipho Khumalo"
                    required
                  />
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs">Relationship</label>
                    <select
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#176BFF]"
                      value={dependantRelationship}
                      onChange={(e) => setDependantRelationship(e.target.value)}
                    >
                      <option value="CHILD">Child</option>
                      <option value="SPOUSE">Spouse / Partner</option>
                      <option value="PARENT">Parent</option>
                      <option value="OTHER">Other Dependant</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Contact Email (for Calendar Invites)"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                />
                <Input
                  label="SA Mobile Number (for SMS Confirmations)"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  ← Back
                </Button>
                <Button variant="primary" size="lg" onClick={() => setStep(4)}>
                  Medical Scheme & Intake →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Medical Aid & Clinical Intake */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#176BFF]" /> 4. Medical Aid & Clinical Intake
              </h3>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'MEDICAL_AID'}
                    onChange={() => setPaymentMethod('MEDICAL_AID')}
                  />
                  <span>Claim through Medical Aid Scheme</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'CARD_AT_PRACTICE'}
                    onChange={() => setPaymentMethod('CARD_AT_PRACTICE')}
                  />
                  <span>Pay Cash / Card at Practice (R{selectedType.priceZAR})</span>
                </label>
              </div>

              {paymentMethod === 'MEDICAL_AID' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <Select
                    label="Medical Aid Scheme"
                    value={medicalAidScheme}
                    onChange={(e) => setMedicalAidScheme(e.target.value)}
                    options={SA_MEDICAL_AIDS}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Membership Number"
                      value={memberNumber}
                      onChange={(e) => setMemberNumber(e.target.value)}
                    />
                    <Input
                      label="Dependant Code (e.g. 00)"
                      value={dependantCode}
                      onChange={(e) => setDependantCode(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Intake Questionnaire */}
              <div className="pt-2 border-t border-slate-100 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900">Clinical Pre-Visit Intake (Optional)</h4>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Detailed Symptoms / Notes</label>
                  <textarea
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#176BFF]"
                    rows={2}
                    placeholder="Briefly describe what you are experiencing"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Known Drug Allergies"
                    placeholder="e.g. Penicillin, Sulfa drugs, None"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                  />
                  <Input
                    label="Current Chronic Medications"
                    placeholder="e.g. Ecotrin, Glucophage"
                    value={currentMedications}
                    onChange={(e) => setCurrentMedications(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep(3)}>
                  ← Back
                </Button>
                <Button variant="primary" size="lg" onClick={() => setStep(5)}>
                  Review & Confirm Booking →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Final Confirmation */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> 5. Review & Confirm Consultation
              </h3>

              {bookingError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-[#FF3D71] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{bookingError}</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Practitioner</span>
                  <span className="font-bold text-slate-900">{provider.fullName} ({provider.specialty})</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Consultation Type</span>
                  <span className="font-bold text-slate-900">{selectedType.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Date & Time</span>
                  <span className="font-bold text-[#176BFF]">
                    {selectedSlot?.date} at {selectedSlot?.startTime} - {selectedSlot?.endTime}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Patient</span>
                  <span className="font-bold text-slate-900">
                    {patientType === 'SELF' ? patientName : `${dependantName} (${dependantRelationship})`}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Billing Method</span>
                  <span className="font-bold text-slate-900">
                    {paymentMethod === 'MEDICAL_AID' ? `Medical Scheme (${medicalAidScheme})` : `Cash / Card (R${selectedType.priceZAR})`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Location</span>
                  <span className="font-bold text-slate-900">{selectedType.locationName}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 text-[11px] text-[#176BFF] space-y-1">
                <p className="font-bold">DigitalNexCare Free Booking Guarantee</p>
                <p>
                  Direct provider bookings are 100% free with zero platform fees. {selectedType.cancellationPolicyText}
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep(4)}>
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  onClick={handleFinalConfirmBooking}
                >
                  Confirm Free Appointment Booking
                </Button>
              </div>
            </div>
          )}

          {/* STEP 6: Success / Confirmation */}
          {step === 6 && confirmedAppointment && (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Appointment Successfully Confirmed!
              </h3>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-700">
                Reference: {confirmedAppointment.bookingReference}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Your consultation with <strong>{provider.fullName}</strong> is booked for{' '}
                <strong>
                  {confirmedAppointment.date} at {confirmedAppointment.startTime}
                </strong>
                . A confirmation SMS & calendar invite have been sent to {confirmedAppointment.patientPhone}.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                <Link to="/patient/appointments">
                  <Button variant="primary">View in My Appointments</Button>
                </Link>
                <Link to="/find-care">
                  <Button variant="outline">Back to Find Care</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
