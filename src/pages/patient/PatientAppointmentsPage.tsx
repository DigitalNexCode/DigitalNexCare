import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PatientLayout } from '../../components/layout/PatientLayout';
import { SchedulingEngine } from '../../lib/scheduling/scheduling-engine';
import { PatientService } from '../../lib/patient/patient-service';
import { NotificationService } from '../../lib/notifications/notification-service';
import { DetailedAppointment, AppointmentSlot } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  ShieldCheck,
  XCircle,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  Video,
  FileText,
  Star,
  Sparkles,
} from 'lucide-react';

export const PatientAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<DetailedAppointment[]>(
    SchedulingEngine.getAppointments({ patientId: 'pat-001' })
  );
  const [filterTab, setFilterTab] = useState<'UPCOMING' | 'PAST' | 'ALL'>('UPCOMING');

  // Reschedule Modal State
  const [reschedulingApt, setReschedulingApt] = useState<DetailedAppointment | null>(null);
  const [newDate, setNewDate] = useState('2026-09-10');
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState<AppointmentSlot | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('Work schedule conflict');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  // Cancellation Modal State
  const [cancellingApt, setCancellingApt] = useState<DetailedAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [cancelNoticeInfo, setCancelNoticeInfo] = useState<{ isLate: boolean; hours: number } | null>(
    null
  );

  // Review Modal State
  const [reviewingApt, setReviewingApt] = useState<DetailedAppointment | null>(null);
  const [rating, setRating] = useState(5);
  const [waitRating, setWaitRating] = useState(5);
  const [bedsideRating, setBedsideRating] = useState(5);
  const [facilityRating, setFacilityRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTags, setReviewTags] = useState<string[]>(['Punctual', 'Thorough Examination']);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const refreshList = () => {
    setAppointments(SchedulingEngine.getAppointments({ patientId: 'pat-001' }));
  };

  const filtered = appointments.filter((a) => {
    if (filterTab === 'UPCOMING') return a.status === 'CONFIRMED' || a.status === 'HELD';
    if (filterTab === 'PAST') return a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'RESCHEDULED';
    return true;
  });

  const handleOpenReschedule = (apt: DetailedAppointment) => {
    setReschedulingApt(apt);
    setRescheduleError(null);
    const slots = SchedulingEngine.generateAvailableSlots(
      apt.providerId,
      apt.appointmentTypeId,
      newDate,
      newDate
    );
    setAvailableSlots(slots);
    if (slots.length > 0) setSelectedNewSlot(slots[0]);
  };

  const handleDateChangeForReschedule = (date: string) => {
    setNewDate(date);
    if (!reschedulingApt) return;
    const slots = SchedulingEngine.generateAvailableSlots(
      reschedulingApt.providerId,
      reschedulingApt.appointmentTypeId,
      date,
      date
    );
    setAvailableSlots(slots);
    if (slots.length > 0) setSelectedNewSlot(slots[0]);
    else setSelectedNewSlot(null);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingApt || !selectedNewSlot) return;

    setIsSubmittingReschedule(true);
    const oldDate = reschedulingApt.date;
    const oldTime = reschedulingApt.startTime;

    setTimeout(() => {
      const res = SchedulingEngine.rescheduleAppointment({
        appointmentId: reschedulingApt.id,
        newDate: selectedNewSlot.date,
        newStartTime: selectedNewSlot.startTime,
        newEndTime: selectedNewSlot.endTime,
        rescheduleReason,
      });

      setIsSubmittingReschedule(false);
      if (res.success) {
        if (res.newAppointment) {
          NotificationService.notifyRescheduled(res.newAppointment, oldDate, oldTime);
        }
        setReschedulingApt(null);
        refreshList();
      } else {
        setRescheduleError(res.message || 'Failed to reschedule.');
      }
    }, 400);
  };

  const handleOpenCancel = (apt: DetailedAppointment) => {
    setCancellingApt(apt);
    // Calculate notice
    const [y, m, d] = apt.date.split('-').map(Number);
    const [sh, sm] = apt.startTime.split(':').map(Number);
    const apptDateTime = new Date(y, m - 1, d, sh, sm);
    const now = new Date();
    const diffMs = apptDateTime.getTime() - now.getTime();
    const hours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
    setCancelNoticeInfo({ isLate: hours < 24, hours });
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingApt) return;

    SchedulingEngine.cancelAppointment({
      appointmentId: cancellingApt.id,
      cancelledBy: 'PATIENT',
      cancellationReason: cancelReason,
    });

    NotificationService.notifyCancelled(cancellingApt, cancelReason);

    setCancellingApt(null);
    refreshList();
  };

  const handleOpenReview = (apt: DetailedAppointment) => {
    setReviewingApt(apt);
    setRating(5);
    setWaitRating(5);
    setBedsideRating(5);
    setFacilityRating(5);
    setReviewComment('');
    setReviewTags(['Punctual', 'Great Explanations', 'Clean Rooms']);
    setReviewSubmitted(false);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingApt) return;

    PatientService.submitReview({
      patientId: reviewingApt.patientId,
      patientName: reviewingApt.patientName,
      providerId: reviewingApt.providerId,
      providerName: reviewingApt.providerName,
      appointmentId: reviewingApt.id,
      rating,
      waitingTimeRating: waitRating,
      bedsideMannerRating: bedsideRating,
      facilityRating,
      tags: reviewTags,
      comment: reviewComment || 'Very professional consultation. Clear communication and friendly care.',
      verifiedVisit: true,
    });

    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewingApt(null);
      setReviewSubmitted(false);
    }, 1500);
  };

  const toggleReviewTag = (tag: string) => {
    setReviewTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  return (
    <PatientLayout
      title="My Appointments & Consultations"
      subtitle="View, reschedule, or cancel your confirmed consultations with verified DigitalNexCare providers."
    >
      <div className="space-y-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setFilterTab('UPCOMING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'UPCOMING'
                ? 'bg-[#176BFF] text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Upcoming Consultations ({appointments.filter((a) => a.status === 'CONFIRMED').length})
          </button>
          <button
            onClick={() => setFilterTab('PAST')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'PAST'
                ? 'bg-[#176BFF] text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Past / Completed / Cancelled
          </button>
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'ALL'
                ? 'bg-[#176BFF] text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All ({appointments.length})
          </button>
        </div>

        {/* Appointment Cards */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              No appointments found in this section.
            </div>
          ) : (
            filtered.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{apt.providerName}</h3>
                    <Badge
                      variant={
                        apt.status === 'CONFIRMED'
                          ? 'success'
                          : apt.status === 'CANCELLED'
                          ? 'danger'
                          : apt.status === 'COMPLETED'
                          ? 'default'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {apt.status}
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">Ref: {apt.bookingReference}</span>
                  </div>

                  <p className="text-xs font-semibold text-[#176BFF]">
                    {apt.specialty} • {apt.practiceName}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-bold text-slate-900">
                      <Calendar className="w-3.5 h-3.5 text-[#176BFF]" />
                      {apt.date} at {apt.startTime} - {apt.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {apt.appointmentTypeName} ({apt.durationMinutes} mins)
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {apt.address}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 pt-1">
                    Patient: <strong className="text-slate-900">{apt.patientName}</strong> • Reason:{' '}
                    <span className="italic">{apt.reasonForVisit}</span>
                  </div>

                  {apt.cancellationReason && (
                    <div className="text-xs text-[#FF3D71] bg-rose-50 p-2 rounded-xl border border-rose-200">
                      Cancellation Reason: {apt.cancellationReason}
                    </div>
                  )}
                </div>

                {apt.status === 'CONFIRMED' && (
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                    <Link to="/patient/intake">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<FileText className="w-3.5 h-3.5 text-purple-600" />}
                      >
                        Pre-Visit Intake
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReschedule(apt)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Reschedule
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleOpenCancel(apt)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {apt.status === 'COMPLETED' && (
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenReview(apt)}
                      leftIcon={<Star className="w-3.5 h-3.5 text-amber-300" />}
                    >
                      Leave Verified Review
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Verified Review Modal */}
      {reviewingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Leave Verified Consultation Review
              </h3>
              <button
                onClick={() => setReviewingApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewSubmitted ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">Review Published!</h4>
                <p className="text-xs text-slate-500">
                  Thank you for helping other patients find quality healthcare in South Africa.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <span className="text-slate-500 block text-[11px]">Consultation Record</span>
                  <strong className="text-slate-900 font-bold">
                    {reviewingApt.providerName} ({reviewingApt.specialty})
                  </strong>
                  <span className="text-slate-500 block text-[11px] mt-0.5">
                    Visited on {reviewingApt.date} • Ref: {reviewingApt.bookingReference}
                  </span>
                </div>

                {/* Overall Rating */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Overall Experience Rating (1 - 5 Stars):
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="font-bold text-slate-700 ml-2 text-sm">{rating}/5 Stars</span>
                  </div>
                </div>

                {/* Sub-ratings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl">
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold block mb-1">
                      Punctuality & Wait:
                    </label>
                    <select
                      value={waitRating}
                      onChange={(e) => setWaitRating(parseInt(e.target.value, 10))}
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="5">5 - Immediate / On Time</option>
                      <option value="4">4 - Under 15 mins</option>
                      <option value="3">3 - 15-30 mins</option>
                      <option value="2">2 - 30+ mins wait</option>
                      <option value="1">1 - Long delay</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold block mb-1">
                      Bedside Manner:
                    </label>
                    <select
                      value={bedsideRating}
                      onChange={(e) => setBedsideRating(parseInt(e.target.value, 10))}
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="5">5 - Excellent & Caring</option>
                      <option value="4">4 - Very Good</option>
                      <option value="3">3 - Satisfactory</option>
                      <option value="2">2 - Rushed</option>
                      <option value="1">1 - Dismissive</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold block mb-1">
                      Facility & Hygiene:
                    </label>
                    <select
                      value={facilityRating}
                      onChange={(e) => setFacilityRating(parseInt(e.target.value, 10))}
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="5">5 - Spotless & Modern</option>
                      <option value="4">4 - Clean & Tidy</option>
                      <option value="3">3 - Acceptable</option>
                      <option value="2">2 - Needs Cleaning</option>
                      <option value="1">1 - Poor Hygiene</option>
                    </select>
                  </div>
                </div>

                {/* Experience Tags */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">What stood out?</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Punctual',
                      'Thorough Explanations',
                      'Clean Rooms',
                      'Gentle Care',
                      'Friendly Staff',
                      'Clear Pricing',
                      'Great with Kids',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleReviewTag(tag)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                          reviewTags.includes(tag)
                            ? 'bg-blue-50 text-[#176BFF] border border-[#176BFF] font-bold'
                            : 'bg-slate-100 text-slate-600 border border-transparent hover:bg-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Written Review */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Written Feedback (Optional)
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share specific details about your experience..."
                    rows={3}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#176BFF] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setReviewingApt(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    Submit Verified Review
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#176BFF]" /> Reschedule Consultation
              </h3>
              <button
                onClick={() => setReschedulingApt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Current Appointment</span>
                <strong className="text-slate-900">
                  {reschedulingApt.providerName} on {reschedulingApt.date} at {reschedulingApt.startTime}
                </strong>
              </div>

              {rescheduleError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[#FF3D71]">
                  {rescheduleError}
                </div>
              )}

              <Input
                label="Select New Date"
                type="date"
                value={newDate}
                min="2026-09-02"
                onChange={(e) => handleDateChangeForReschedule(e.target.value)}
                required
              />

              <div className="space-y-2">
                <label className="font-bold text-slate-700">Select Available Slot</label>
                {availableSlots.length === 0 ? (
                  <p className="p-4 rounded-xl bg-slate-50 text-slate-400 text-center">
                    No open slots on {newDate}. Please choose a different date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedNewSlot(slot)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedNewSlot?.id === slot.id
                            ? 'border-[#176BFF] bg-blue-50 text-[#176BFF] font-bold ring-2 ring-[#176BFF]/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {slot.startTime} - {slot.endTime}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Input
                label="Reason for Rescheduling"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                required
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="ghost" size="sm" type="button" onClick={() => setReschedulingApt(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={!selectedNewSlot}
                  isLoading={isSubmittingReschedule}
                >
                  Confirm Reschedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-[#FF3D71]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Cancel Appointment</h3>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel your consultation with{' '}
              <strong className="text-slate-900">{cancellingApt.providerName}</strong> on{' '}
              <strong>
                {cancellingApt.date} at {cancellingApt.startTime}
              </strong>
              ?
            </p>

            {cancelNoticeInfo && (
              <div
                className={`p-3 rounded-2xl text-xs ${
                  cancelNoticeInfo.isLate
                    ? 'bg-rose-50 border border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                <span className="font-bold block">
                  {cancelNoticeInfo.isLate
                    ? 'Late Cancellation Notice Warning'
                    : 'Standard Cancellation Notice'}
                </span>
                <span>
                  Notice given: {cancelNoticeInfo.hours} hours before consultation.{' '}
                  {cancelNoticeInfo.isLate
                    ? 'Practices typically require at least 24 hours notice.'
                    : 'Within policy window.'}
                </span>
              </div>
            )}

            <form onSubmit={handleConfirmCancel} className="space-y-3 text-xs">
              <Input
                label="Reason for Cancellation"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Work commitment, recovered"
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" type="button" onClick={() => setCancellingApt(null)}>
                  Keep Appointment
                </Button>
                <Button variant="danger" size="sm" type="submit">
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PatientLayout>
  );
};
