import React, { useState } from 'react';
import { DetailedAppointment, ScheduleBlock, AppointmentSlot } from '../../types';
import { SchedulingEngine } from '../../lib/scheduling/scheduling-engine';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Video,
  MapPin,
  X,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface ProviderCalendarViewProps {
  providerId: string;
  onAppointmentUpdated?: () => void;
}

type CalendarViewMode = 'DAY' | 'WEEK' | 'MONTH';

export const ProviderCalendarView: React.FC<ProviderCalendarViewProps> = ({
  providerId,
  onAppointmentUpdated,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('WEEK');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-02');
  const [selectedAppointment, setSelectedAppointment] = useState<DetailedAppointment | null>(null);
  const [cancelModalApt, setCancelModalApt] = useState<DetailedAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Patient requested cancellation');

  const appointments = SchedulingEngine.getAppointments({ providerId });
  const blocks = SchedulingEngine.getBlocks(providerId);

  const currentDateObj = new Date(selectedDate);

  // Helper to format date
  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Navigate dates
  const handlePrev = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'DAY') d.setDate(d.getDate() - 1);
    else if (viewMode === 'WEEK') d.setDate(d.getDate() - 7);
    else if (viewMode === 'MONTH') d.setMonth(d.getMonth() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNext = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'DAY') d.setDate(d.getDate() + 1);
    else if (viewMode === 'WEEK') d.setDate(d.getDate() + 7);
    else if (viewMode === 'MONTH') d.setMonth(d.getMonth() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate('2026-09-02');
  };

  // Get week days for week view
  const getWeekDays = (baseDateStr: string) => {
    const curr = new Date(baseDateStr);
    const firstDay = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1); // Monday
    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(curr.setDate(firstDay + i));
      week.push(nextDate.toISOString().split('T')[0]);
    }
    return week;
  };

  // Get month days for month view
  const getMonthDays = (baseDateStr: string) => {
    const d = new Date(baseDateStr);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon = 0
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push(dayStr);
    }
    return days;
  };

  const weekDays = getWeekDays(selectedDate);
  const monthDays = getMonthDays(selectedDate);

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalApt) return;
    SchedulingEngine.cancelAppointment({
      appointmentId: cancelModalApt.id,
      cancelledBy: 'PROVIDER',
      cancellationReason: cancelReason,
    });
    setCancelModalApt(null);
    if (selectedAppointment?.id === cancelModalApt.id) {
      setSelectedAppointment(null);
    }
    if (onAppointmentUpdated) onAppointmentUpdated();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
      {/* Calendar Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-[#176BFF]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {currentDateObj.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
            </h3>
            <p className="text-xs text-slate-500">
              {appointments.filter((a) => a.status === 'CONFIRMED').length} Active Confirmed Appointments
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Switcher */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
            <button
              onClick={() => setViewMode('DAY')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'DAY' ? 'bg-white text-[#176BFF] shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('WEEK')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'WEEK' ? 'bg-white text-[#176BFF] shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('MONTH')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'MONTH' ? 'bg-white text-[#176BFF] shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Month
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handlePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* VIEW: DAY VIEW */}
      {viewMode === 'DAY' && (
        <div className="space-y-3">
          <div className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            {formatDateDisplay(selectedDate)}
          </div>

          <div className="space-y-2">
            {appointments.filter((a) => a.date === selectedDate).length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No consultations booked for this day.
              </div>
            ) : (
              appointments
                .filter((a) => a.date === selectedDate)
                .map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => setSelectedAppointment(apt)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-[#176BFF] hover:bg-blue-50/20 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[70px] py-1 px-2.5 rounded-xl bg-slate-100">
                        <span className="text-xs font-bold text-slate-900 block">{apt.startTime}</span>
                        <span className="text-[10px] text-slate-500">{apt.endTime}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{apt.patientName}</h4>
                          <Badge
                            variant={
                              apt.status === 'CONFIRMED'
                                ? 'success'
                                : apt.status === 'CANCELLED'
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {apt.status}
                          </Badge>
                          {apt.mode === 'VIRTUAL' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#176BFF] bg-blue-50 px-2 py-0.5 rounded-md">
                              <Video className="w-3 h-3" /> Virtual
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {apt.appointmentTypeName} • {apt.reasonForVisit}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-900">R{apt.priceZAR}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* VIEW: WEEK VIEW */}
      {viewMode === 'WEEK' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((dayStr) => {
            const dayApts = appointments.filter((a) => a.date === dayStr);
            const dayBlocks = blocks.filter((b) => dayStr >= b.startDate && dayStr <= b.endDate);
            const isToday = dayStr === '2026-09-02';

            return (
              <div
                key={dayStr}
                className={`p-3 rounded-2xl border flex flex-col min-h-[220px] ${
                  isToday ? 'bg-blue-50/40 border-[#176BFF]/40 ring-1 ring-[#176BFF]/20' : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2">
                  <span className="text-xs font-bold text-slate-700">{formatDateDisplay(dayStr)}</span>
                  {isToday && (
                    <span className="w-2 h-2 rounded-full bg-[#176BFF]" title="Today" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  {dayBlocks.map((b) => (
                    <div
                      key={b.id}
                      className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-semibold"
                    >
                      <span className="truncate block font-bold">{b.title}</span>
                      <span className="text-[9px] text-amber-600 block">
                        {b.isAllDay ? 'All Day' : `${b.startTime}-${b.endTime}`}
                      </span>
                    </div>
                  ))}

                  {dayApts.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className={`p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                        apt.status === 'CONFIRMED'
                          ? 'bg-white border-blue-200 hover:border-[#176BFF] text-slate-900 shadow-2xs'
                          : apt.status === 'CANCELLED'
                          ? 'bg-rose-50/60 border-rose-200 text-rose-800 line-through opacity-70'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#176BFF]">
                        <span>{apt.startTime}</span>
                        <span>{apt.mode === 'VIRTUAL' ? 'Telehealth' : 'In-Person'}</span>
                      </div>
                      <span className="font-bold block truncate mt-0.5">{apt.patientName}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{apt.reasonForVisit}</span>
                    </div>
                  ))}

                  {dayApts.length === 0 && dayBlocks.length === 0 && (
                    <span className="text-[11px] text-slate-400 block pt-4 text-center">No bookings</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: MONTH VIEW */}
      {viewMode === 'MONTH' && (
        <div>
          <div className="grid grid-cols-7 text-xs font-bold text-slate-400 text-center pb-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {monthDays.map((dayStr, idx) => {
              if (!dayStr) {
                return <div key={`empty-${idx}`} className="h-24 bg-slate-50/30 rounded-xl" />;
              }

              const dayApts = appointments.filter((a) => a.date === dayStr);
              const dayNum = Number(dayStr.split('-')[2]);
              const isToday = dayStr === '2026-09-02';

              return (
                <div
                  key={dayStr}
                  onClick={() => {
                    setSelectedDate(dayStr);
                    setViewMode('DAY');
                  }}
                  className={`h-24 p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:border-[#176BFF] ${
                    isToday ? 'bg-blue-50/50 border-[#176BFF]/40' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isToday ? 'text-[#176BFF]' : 'text-slate-800'}`}>
                      {dayNum}
                    </span>
                    {dayApts.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#176BFF] text-white text-[9px] font-bold flex items-center justify-center">
                        {dayApts.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {dayApts.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className="text-[9px] truncate px-1 rounded bg-slate-100 text-slate-700 font-medium"
                      >
                        {apt.startTime} {apt.patientName.split(' ')[0]}
                      </div>
                    ))}
                    {dayApts.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-semibold block">
                        +{dayApts.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedAppointment.patientName}</h3>
                  <Badge
                    variant={selectedAppointment.status === 'CONFIRMED' ? 'success' : 'danger'}
                    size="sm"
                  >
                    {selectedAppointment.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">Ref: {selectedAppointment.bookingReference}</p>
              </div>

              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Date & Time</span>
                  <strong className="text-slate-900">
                    {selectedAppointment.date} at {selectedAppointment.startTime} - {selectedAppointment.endTime}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Appointment Type</span>
                  <strong className="text-slate-900">{selectedAppointment.appointmentTypeName}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">Contact Details</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedAppointment.patientPhone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedAppointment.patientEmail}
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px]">Reason for Visit</span>
                <p className="font-semibold text-slate-900">{selectedAppointment.reasonForVisit}</p>
              </div>

              {selectedAppointment.symptoms && (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[11px]">Symptoms & Intake Notes</span>
                  <p className="p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-200/80">
                    {selectedAppointment.symptoms}
                  </p>
                </div>
              )}

              {selectedAppointment.allergies && (
                <div className="space-y-1">
                  <span className="text-[#FF3D71] block text-[11px] font-bold">Allergies Declared</span>
                  <p className="text-slate-800 font-semibold">{selectedAppointment.allergies}</p>
                </div>
              )}

              {selectedAppointment.medicalAidScheme && (
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Medical Aid Profile</span>
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{selectedAppointment.medicalAidScheme}</span>
                    <span className="text-slate-500 font-normal">
                      • Mem#: {selectedAppointment.medicalAidMemberNumber} (Code: {selectedAppointment.medicalAidDependantCode})
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {selectedAppointment.status === 'CONFIRMED' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setCancelModalApt(selectedAppointment)}
                >
                  Cancel Appointment
                </Button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <Button variant="ghost" size="sm" onClick={() => setSelectedAppointment(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-[#FF3D71]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Cancel Appointment</h3>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel the consultation for{' '}
              <strong className="text-slate-900">{cancelModalApt.patientName}</strong> on{' '}
              <strong>{cancelModalApt.date} at {cancelModalApt.startTime}</strong>? The time slot will be
              immediately released back into public availability.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Cancellation Reason</label>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#FF3D71]"
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" type="button" onClick={() => setCancelModalApt(null)}>
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
    </div>
  );
};
