import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PatientLayout } from '../../components/layout/PatientLayout';
import { useAuth } from '../../lib/auth/context';
import { SchedulingEngine } from '../../lib/scheduling/scheduling-engine';
import { PatientService } from '../../lib/patient/patient-service';
import { NotificationService } from '../../lib/notifications/notification-service';
import { Chunk7TestRunner, Chunk7TestSummary } from '../../lib/patient/chunk7-test-runner';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Calendar,
  Clock,
  Unlock,
  Shield,
  Users,
  ChevronRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  Bell,
  Star,
  FileText,
  User,
  FlaskConical,
  XCircle,
} from 'lucide-react';

export const PatientDashboardPage: React.FC = () => {
  const { user, subscriptionPlan, revealsRemaining } = useAuth();
  const appointments = SchedulingEngine.getAppointments({ patientId: 'pat-001' });
  const upcomingAppointment = appointments.find((a) => a.status === 'CONFIRMED' || a.status === 'HELD') || appointments[0];

  const dependants = PatientService.getDependants();
  const medicalAid = PatientService.getMedicalAidProfile();
  const intakeForms = PatientService.getIntakeResponses();
  const reviews = PatientService.getReviews();
  const unreadNotifications = NotificationService.getUnreadCount();

  // Test Runner State
  const [testSummary, setTestSummary] = useState<Chunk7TestSummary | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const handleRunAcceptanceTests = () => {
    setIsRunningTests(true);
    setIsTestModalOpen(true);
    setTimeout(() => {
      const summary = Chunk7TestRunner.runAllTests();
      setTestSummary(summary);
      setIsRunningTests(false);
    }, 500);
  };

  return (
    <PatientLayout
      title={`Welcome back, ${user?.fullName || 'Lerato'}`}
      subtitle="Manage your upcoming consultations, medical aid profile, dependants, and pre-visit clinical forms."
    >
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Appointments</span>
            <Calendar className="w-4 h-4 text-[#176BFF]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{appointments.length}</div>
          <Link
            to="/patient/appointments"
            className="text-xs font-semibold text-[#176BFF] hover:underline mt-2 inline-block"
          >
            View schedule →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Dependants</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{dependants.length}</div>
          <Link
            to="/patient/dependants"
            className="text-xs font-semibold text-[#176BFF] hover:underline mt-2 inline-block"
          >
            Manage family →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Pre-Visit Forms</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{intakeForms.length}</div>
          <Link
            to="/patient/intake"
            className="text-xs font-semibold text-[#176BFF] hover:underline mt-2 inline-block"
          >
            Clinical intake →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Reveals Left</span>
            <Unlock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{revealsRemaining}</div>
          <Link
            to="/patient/external-unlocks"
            className="text-xs font-semibold text-[#176BFF] hover:underline mt-2 inline-block"
          >
            Reveal quota →
          </Link>
        </div>
      </div>

      {/* Next Appointment Card */}
      {upcomingAppointment && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#176BFF]" /> Next Upcoming Consultation
            </h2>
            <Badge variant={upcomingAppointment.status === 'CONFIRMED' ? 'verified' : 'slate'} size="sm">
              {upcomingAppointment.status}
            </Badge>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-base font-bold text-slate-900">
                {upcomingAppointment.providerName}
              </div>
              <div className="text-xs font-semibold text-[#176BFF]">
                {upcomingAppointment.specialty} • {upcomingAppointment.practiceName}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 font-bold text-slate-900">
                  <Calendar className="w-3.5 h-3.5 text-[#176BFF]" /> {upcomingAppointment.date} at {upcomingAppointment.startTime}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {upcomingAppointment.address}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/patient/intake">
                <Button variant="outline" size="sm" leftIcon={<FileText className="w-3.5 h-3.5 text-purple-600" />}>
                  Fill Intake Form
                </Button>
              </Link>
              <Link to="/patient/appointments">
                <Button variant="primary" size="sm">
                  Manage Booking
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/patient/profile"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#176BFF] hover:shadow-sm transition-all flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#176BFF] flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Profile & Communication</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage SMS, WhatsApp & email preferences, emergency contact, and language.
            </p>
          </div>
        </Link>

        <Link
          to="/patient/medical-aid"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#176BFF] hover:shadow-sm transition-all flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Medical Aid & Gap Cover</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {medicalAid.schemeName} ({medicalAid.planName}) • Status: {medicalAid.eligibilityStatus}
            </p>
          </div>
        </Link>

        <Link
          to="/patient/notifications"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#176BFF] hover:shadow-sm transition-all flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 relative">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF3D71] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Notifications & Alerts</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {unreadNotifications} unread message{unreadNotifications !== 1 ? 's' : ''} across In-App, SMS & WhatsApp.
            </p>
          </div>
        </Link>
      </div>

      {/* Chunk 7 Verification Suite Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#00E5D4]" />
            <h3 className="text-base font-bold text-white">Chunk 7 Acceptance Test Engine</h3>
          </div>
          <p className="text-xs text-slate-300">
            Automated verification for patient profiles, dependants, medical aid, clinical intake, multi-channel notifications, and reviews.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleRunAcceptanceTests}
          isLoading={isRunningTests}
          leftIcon={<FlaskConical className="w-4 h-4 text-[#176BFF]" />}
        >
          Run Chunk 7 Verification Suite
        </Button>
      </div>

      {/* Test Results Modal */}
      {isTestModalOpen && (
        <Modal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          title="DigitalNexCare — Chunk 7 Test Execution Report"
          description="Automated acceptance tests for Patient Account, Dependants, Medical Aid, Intake & Notifications"
        >
          <div className="space-y-4 text-xs">
            {isRunningTests || !testSummary ? (
              <div className="py-8 text-center text-slate-500">
                Running 9 acceptance tests across PatientService and NotificationService...
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100">
                  <span className="font-bold text-slate-800">
                    Results: {testSummary.passed} / {testSummary.total} Passed
                  </span>
                  <Badge variant={testSummary.allPassed ? 'verified' : 'danger'} size="sm">
                    {testSummary.allPassed ? 'ALL TESTS PASSED' : 'TESTS FAILED'}
                  </Badge>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {testSummary.results.map((res, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                        res.passed ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {res.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <strong className="text-slate-900 block font-bold">{res.name}</strong>
                          <p className="text-[11px] text-slate-600">{res.message}</p>
                        </div>
                      </div>
                      <Badge variant={res.passed ? 'verified' : 'danger'} size="sm">
                        {res.passed ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <Button variant="primary" size="sm" onClick={() => setIsTestModalOpen(false)}>
                    Close Test Report
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </PatientLayout>
  );
};
