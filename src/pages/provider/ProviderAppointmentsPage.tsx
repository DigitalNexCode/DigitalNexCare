import React, { useState } from 'react';
import { ProviderLayout } from '../../components/layout/ProviderLayout';
import { MOCK_PROVIDERS } from '../../data/mockDatabase';
import { SchedulingEngine } from '../../lib/scheduling/scheduling-engine';
import { ProviderCalendarView } from '../../components/calendar/ProviderCalendarView';
import { DetailedAppointment } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  CalendarDays,
  ListFilter,
  FileText,
  Mail,
  Video,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export const ProviderAppointmentsPage: React.FC = () => {
  const provider = MOCK_PROVIDERS[0];
  const [viewTab, setViewTab] = useState<'CALENDAR' | 'LIST'>('CALENDAR');
  const [appointments, setAppointments] = useState<DetailedAppointment[]>(
    SchedulingEngine.getAppointments({ providerId: provider.id })
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const refresh = () => {
    setAppointments(SchedulingEngine.getAppointments({ providerId: provider.id }));
  };

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  const handleMarkComplete = (aptId: string) => {
    try {
      const all = SchedulingEngine.getAppointments();
      const updated = all.map((a) => (a.id === aptId ? { ...a, status: 'COMPLETED' as const } : a));
      localStorage.setItem('dnc_detailed_appointments_v1', JSON.stringify(updated));
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ProviderLayout
      title="Practice Appointments & Calendar"
      subtitle="Interactive multi-view calendar, patient intake review, status tracking, and scheduling management."
    >
      <div className="space-y-6">
        {/* View Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewTab('CALENDAR')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewTab === 'CALENDAR'
                  ? 'bg-[#176BFF] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Practice Calendar View
            </button>
            <button
              onClick={() => setViewTab('LIST')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewTab === 'LIST'
                  ? 'bg-[#176BFF] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> All Bookings List ({appointments.length})
            </button>
          </div>

          {viewTab === 'LIST' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Filter:</span>
              <select
                className="p-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:ring-2 focus:ring-[#176BFF]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RESCHEDULED">Rescheduled</option>
              </select>
            </div>
          )}
        </div>

        {/* View 1: Multi-view Calendar */}
        {viewTab === 'CALENDAR' && (
          <ProviderCalendarView providerId={provider.id} onAppointmentUpdated={refresh} />
        )}

        {/* View 2: Detailed Bookings List */}
        {viewTab === 'LIST' && (
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                No appointments found matching filter.
              </div>
            ) : (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{apt.patientName}</h3>
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
                      <span className="text-[11px] text-slate-400 font-mono">
                        Ref: {apt.bookingReference}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {apt.date} at {apt.startTime} - {apt.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {apt.durationMinutes} mins ({apt.appointmentTypeName})
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {apt.patientPhone}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Reason: <strong className="text-slate-800">{apt.reasonForVisit}</strong>
                    </p>

                    {apt.symptoms && (
                      <p className="text-[11px] text-slate-500 italic">
                        Intake: "{apt.symptoms}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {apt.status === 'CONFIRMED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMarkComplete(apt.id)}
                      >
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </ProviderLayout>
  );
};
