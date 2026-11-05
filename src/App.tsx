import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth/context';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { BackToTopButton } from './components/layout/BackToTopButton';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { FindCarePage } from './pages/public/FindCarePage';
import { NearMePage } from './pages/public/NearMePage';
import { SpecialtiesPage } from './pages/public/SpecialtiesPage';
import { SpecialtyLandingPage } from './pages/public/SpecialtyLandingPage';
import { LocationsPage } from './pages/public/LocationsPage';
import { LocationLandingPage } from './pages/public/LocationLandingPage';
import { DirectBookingPage } from './pages/public/DirectBookingPage';
import { PartnerApiDocsPage } from './pages/public/PartnerApiDocsPage';
import { MedicalAidPage } from './pages/public/MedicalAidPage';
import { PricingPage } from './pages/public/PricingPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { ForProvidersPage } from './pages/public/ForProvidersPage';
import { ProviderDetailPage } from './pages/public/ProviderDetailPage';
import { ExternalPractitionerDetailPage } from './pages/public/ExternalPractitionerDetailPage';
import { BookingFlowPage } from './pages/public/BookingFlowPage';
import { SubscriptionCheckoutPage } from './pages/public/SubscriptionCheckoutPage';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import {
  TermsPage,
  PrivacyPolicyPage,
  PopiaCompliancePage,
  MedicalDisclaimerPage,
} from './pages/public/LegalPages';

// Auth Pages
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { EmailVerificationPage } from './pages/auth/EmailVerificationPage';
import { ProfileCompletionPage } from './pages/auth/ProfileCompletionPage';

// Patient Protected Pages
import { PatientDashboardPage } from './pages/patient/PatientDashboardPage';
import { PatientProfilePage } from './pages/patient/PatientProfilePage';
import { PatientAppointmentsPage } from './pages/patient/PatientAppointmentsPage';
import { PatientMedicalAidPage } from './pages/patient/PatientMedicalAidPage';
import { PatientDependantsPage } from './pages/patient/PatientDependantsPage';
import { PatientIntakePage } from './pages/patient/PatientIntakePage';
import { PatientNotificationsPage } from './pages/patient/PatientNotificationsPage';
import { PatientReviewsPage } from './pages/patient/PatientReviewsPage';
import { PatientSubscriptionPage } from './pages/patient/PatientSubscriptionPage';
import { PatientExternalUnlocksPage } from './pages/patient/PatientExternalUnlocksPage';
import { PatientUsagePage } from './pages/patient/PatientUsagePage';

// Provider Protected Pages
import { ProviderDashboardPage } from './pages/provider/ProviderDashboardPage';
import { ProviderSchedulePage } from './pages/provider/ProviderSchedulePage';
import { ProviderAppointmentsPage } from './pages/provider/ProviderAppointmentsPage';
import { ProviderFindExistingPage } from './pages/provider/ProviderFindExistingPage';
import { ProviderManualRegistrationPage } from './pages/provider/ProviderManualRegistrationPage';
import { ProviderVerificationPage } from './pages/provider/ProviderVerificationPage';
import { ProviderProfileEditPage } from './pages/provider/ProviderProfileEditPage';
import { ProviderTeamPage } from './pages/provider/ProviderTeamPage';
import { ProviderLocationsPage } from './pages/provider/ProviderLocationsPage';
import { ProviderServicesPage } from './pages/provider/ProviderServicesPage';
import { ProviderReviewsPage } from './pages/provider/ProviderReviewsPage';
import { ProviderAnalyticsPage } from './pages/provider/ProviderAnalyticsPage';
import { ProviderFinanceDashboardPage } from './pages/provider/ProviderFinanceDashboardPage';

// Admin Protected Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminFinanceDashboardPage } from './pages/admin/AdminFinanceDashboardPage';
import { SystemHealthDashboardPage } from './pages/admin/SystemHealthDashboardPage';
import { AdminLaunchReadinessPage } from './pages/admin/AdminLaunchReadinessPage';
import { AdminClaimsPage } from './pages/admin/AdminClaimsPage';
import { AdminVerificationsPage } from './pages/admin/AdminVerificationsPage';
import { AdminConflictsPage } from './pages/admin/AdminConflictsPage';
import { AdminDuplicatesPage } from './pages/admin/AdminDuplicatesPage';
import { AdminSubscriptionsPage } from './pages/admin/AdminSubscriptionsPage';
import { AdminTrustOpsPage } from './pages/admin/AdminTrustOpsPage';
import { AdminExternalDiscoveryPage } from './pages/admin/AdminExternalDiscoveryPage';
import { AdminIngestionJobsPage } from './pages/admin/AdminIngestionJobsPage';
import { AdminSnapshotsPage } from './pages/admin/AdminSnapshotsPage';
import { AdminDatabaseInspectorPage } from './pages/admin/AdminDatabaseInspectorPage';
import { SuperAdminUsersPage } from './pages/admin/SuperAdminUsersPage';
import { SuperAdminControlsPage } from './pages/admin/SuperAdminControlsPage';
import { SuperAdminAuditPage } from './pages/admin/SuperAdminAuditPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-[#00E5D4] selection:text-slate-900">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public Discovery & Information Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/find-care" element={<FindCarePage />} />
              <Route path="/search" element={<FindCarePage />} />
              <Route path="/near-me" element={<NearMePage />} />
              <Route path="/specialties" element={<SpecialtiesPage />} />
              <Route path="/specialties/:specialtySlug" element={<SpecialtyLandingPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/locations/:provinceSlug/:citySlug" element={<LocationLandingPage />} />
              <Route path="/medical-aid" element={<MedicalAidPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/for-providers" element={<ForProvidersPage />} />
              <Route path="/providers/:slug" element={<ProviderDetailPage />} />
              <Route path="/doctors/:slug" element={<ProviderDetailPage />} />
              <Route path="/b/:practiceSlug" element={<DirectBookingPage />} />
              <Route path="/b/:practiceSlug/:providerSlug" element={<DirectBookingPage />} />
              <Route path="/partner/api-docs" element={<PartnerApiDocsPage />} />
              <Route
                path="/external-practitioners/:slug"
                element={<ExternalPractitionerDetailPage />}
              />
              <Route path="/book/:providerId" element={<BookingFlowPage />} />
              <Route path="/subscribe/:planId" element={<SubscriptionCheckoutPage />} />
              <Route path="/subscription/checkout" element={<SubscriptionCheckoutPage />} />

              {/* Legal & Compliance Routes */}
              <Route path="/legal/terms" element={<TermsPage />} />
              <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/legal/popia" element={<PopiaCompliancePage />} />
              <Route path="/legal/disclaimer" element={<MedicalDisclaimerPage />} />

              {/* Authentication Lifecycle Routes */}
              <Route path="/auth/sign-in" element={<SignInPage />} />
              <Route path="/auth/sign-up" element={<SignUpPage />} />
              <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
              <Route path="/auth/complete-profile" element={<ProfileCompletionPage />} />

              {/* Patient Protected Portal */}
              <Route
                path="/patient/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/profile"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/appointments"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientAppointmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/medical-aid"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientMedicalAidPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/dependants"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientDependantsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/intake"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientIntakePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/notifications"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientNotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/reviews"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientReviewsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/subscription"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientSubscriptionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/subscription/usage"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientUsagePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/external-unlocks"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientExternalUnlocksPage />
                  </ProtectedRoute>
                }
              />

              {/* Provider Protected Portal */}
              <Route
                path="/provider/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER', 'PRACTICE_MANAGER']}>
                    <ProviderDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/schedule"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER', 'PRACTICE_MANAGER', 'RECEPTION_SCHEDULER']}>
                    <ProviderSchedulePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/appointments"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER', 'PRACTICE_MANAGER', 'RECEPTION_SCHEDULER']}>
                    <ProviderAppointmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/find-existing"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER', 'PRACTICE_MANAGER']}>
                    <ProviderFindExistingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/manual-registration"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER', 'PRACTICE_MANAGER']}>
                    <ProviderManualRegistrationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/verification"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER', 'PRACTICE_MANAGER']}>
                    <ProviderVerificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/profile"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER', 'PRACTICE_MANAGER']}>
                    <ProviderProfileEditPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/team"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER', 'PRACTICE_MANAGER']}>
                    <ProviderTeamPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/locations"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER', 'PRACTICE_MANAGER']}>
                    <ProviderLocationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/services"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER', 'PRACTICE_MANAGER']}>
                    <ProviderServicesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/reviews"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER', 'PRACTICE_MANAGER']}>
                    <ProviderReviewsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/analytics"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER', 'PRACTICE_MANAGER']}>
                    <ProviderAnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/finance"
                element={
                  <ProtectedRoute allowedRoles={['PROVIDER', 'PRACTICE_MANAGER', 'FINANCE_BILLING', 'SUPER_ADMIN']}>
                    <ProviderFinanceDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin & Trust Operations Portal */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute
                    allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN', 'VERIFIER_TRUST_OPS']}
                  >
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/providers"
                element={
                  <ProtectedRoute
                    allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN', 'VERIFIER_TRUST_OPS']}
                  >
                    <AdminDatabaseInspectorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/duplicates"
                element={
                  <ProtectedRoute
                    allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN', 'VERIFIER_TRUST_OPS']}
                  >
                    <AdminDuplicatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/claims"
                element={
                  <ProtectedRoute
                    allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN', 'VERIFIER_TRUST_OPS']}
                  >
                    <AdminClaimsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/verifications"
                element={
                  <ProtectedRoute
                    allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN', 'VERIFIER_TRUST_OPS']}
                  >
                    <AdminVerificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/conflicts"
                element={
                  <ProtectedRoute
                    allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN', 'VERIFIER_TRUST_OPS']}
                  >
                    <AdminConflictsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/trust"
                element={
                  <ProtectedRoute
                    allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN', 'VERIFIER_TRUST_OPS']}
                  >
                    <AdminTrustOpsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/subscriptions"
                element={
                  <ProtectedRoute
                    allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN']}
                  >
                    <AdminSubscriptionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/finance"
                element={
                  <ProtectedRoute
                    allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN', 'FINANCE_BILLING']}
                  >
                    <AdminFinanceDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute
                    allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN', 'VERIFIER_TRUST_OPS']}
                  >
                    <SuperAdminAuditPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/external-discovery"
                element={
                  <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN']}>
                    <AdminExternalDiscoveryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ingestion"
                element={
                  <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN']}>
                    <AdminIngestionJobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ingestion-jobs"
                element={
                  <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN']}>
                    <AdminIngestionJobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/snapshots"
                element={
                  <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN']}>
                    <AdminSnapshotsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/database"
                element={
                  <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN', 'VERIFIER_TRUST_OPS']}>
                    <AdminDatabaseInspectorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/system-health"
                element={
                  <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN', 'VERIFIER_TRUST_OPS']}>
                    <SystemHealthDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/launch-readiness"
                element={
                  <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'SUPER_ADMIN', 'VERIFIER_TRUST_OPS']}>
                    <AdminLaunchReadinessPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/admin-users"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SuperAdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/platform-settings"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SuperAdminControlsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/system-audit"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SuperAdminAuditPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
          <MobileBottomNav />
          <BackToTopButton />
          <OfflineIndicator />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
