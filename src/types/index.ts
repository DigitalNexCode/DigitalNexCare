/**
 * DigitalNexCare Core TypeScript Domain Models
 * Permanent Constitution - Chunk 1
 */

export type UserRole =
  | 'PATIENT'
  | 'PROVIDER'
  | 'PRACTICE_MANAGER'
  | 'RECEPTION_SCHEDULER'
  | 'FINANCE_BILLING'
  | 'VERIFIER_TRUST_OPS'
  | 'PLATFORM_ADMIN'
  | 'SUPER_ADMIN'
  | 'ENTERPRISE_PARTNER';

export type PractitionerType = 'DIGITALNEXCARE_PROVIDER' | 'EXTERNAL_PRACTITIONER';

export type ClaimStatus =
  | 'UNCLAIMED'
  | 'CLAIM_REQUESTED'
  | 'UNDER_REVIEW'
  | 'CLAIMED'
  | 'REJECTED'
  | 'DISPUTED';

export type VerificationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'MORE_INFORMATION_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'EXPIRED';

export type DataAuthority =
  | 'DIGITALNEXCARE_VERIFIED_PROVIDER'
  | 'PRACTITIONER_CONFIRMED'
  | 'ADMIN_VERIFIED'
  | 'AUTHORITATIVE_PROFESSIONAL_REGISTER'
  | 'PRACTICE_WEBSITE'
  | 'OTHER_APPROVED_EXTERNAL_SOURCE';

export type SouthAfricanProvince =
  | 'Gauteng'
  | 'Western Cape'
  | 'KwaZulu-Natal'
  | 'Eastern Cape'
  | 'Free State'
  | 'Limpopo'
  | 'Mpumalanga'
  | 'North West'
  | 'Northern Cape';

export type PatientSubscriptionTier =
  | 'NEXCARE_FREE'
  | 'NEXCARE_ACCESS'
  | 'NEXCARE_PLUS'
  | 'NEXCARE_FAMILY';

export interface SubscriptionPlanInfo {
  id: PatientSubscriptionTier;
  name: string;
  tagline: string;
  priceZAR: number;
  monthlyReveals: number; // -1 for unlimited
  isPopular?: boolean;
  ctaText: string;
  features: string[];
}

export type AppointmentStatus =
  | 'HELD'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type AppointmentMode = 'IN_PERSON' | 'VIRTUAL' | 'HOME_VISIT';

export type PatientEligibility = 'ALL_PATIENTS' | 'NEW_PATIENT_ONLY' | 'EXISTING_PATIENT_ONLY';

export type ScheduleBlockType =
  | 'LEAVE'
  | 'LUNCH_BREAK'
  | 'ADMIN_TIME'
  | 'EMERGENCY_COVER'
  | 'PUBLIC_HOLIDAY'
  | 'PERSONAL';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface AppointmentTypeConfig {
  id: string;
  providerId: string;
  name: string; // e.g. "Standard Consultation (GP)"
  description?: string;
  durationMinutes: number; // e.g. 15, 30, 45, 60
  locationName: string; // Practice Room 2B / Online Video Link
  mode: AppointmentMode;
  patientEligibility: PatientEligibility;
  leadTimeHours: number; // Minimum notice before booking, e.g. 2 hours
  bookingHorizonDays: number; // Max days in advance, e.g. 30 days
  bufferBeforeMinutes: number; // e.g. 5 mins prep
  bufferAfterMinutes: number; // e.g. 5 mins sanitization / notes
  minCancellationNoticeHours: number; // e.g. 24 hours
  cancellationPolicyText: string;
  priceZAR: number;
  isActive: boolean;
}

export interface DayTimeInterval {
  id: string;
  startTime: string; // "08:30"
  endTime: string; // "13:00"
}

export interface RecurringDaySchedule {
  dayOfWeek: DayOfWeek;
  isEnabled: boolean;
  intervals: DayTimeInterval[];
}

export interface ScheduleBlock {
  id: string;
  providerId: string;
  title: string;
  blockType: ScheduleBlockType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAllDay: boolean;
  notes?: string;
  createdAt: string;
}

export interface SlotHoldRecord {
  holdId: string;
  slotId: string;
  providerId: string;
  patientId: string;
  patientName: string;
  date: string;
  startTime: string;
  endTime: string;
  appointmentTypeId: string;
  heldAt: string; // ISO string
  expiresAt: string; // ISO string (e.g. 10 mins)
  status: 'ACTIVE' | 'EXPIRED' | 'RELEASED' | 'CONVERTED';
}

export interface DetailedAppointment {
  id: string;
  bookingReference: string; // e.g. "DNC-APT-84920"
  providerId: string;
  providerName: string;
  practiceName: string;
  specialty: string;
  address: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientType: 'SELF' | 'DEPENDANT';
  dependantName?: string;
  dependantRelationship?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  mode: AppointmentMode;
  appointmentTypeId: string;
  appointmentTypeName: string;
  durationMinutes: number;
  priceZAR: number;
  paymentMethod: 'MEDICAL_AID' | 'CARD_AT_PRACTICE' | 'ONLINE';
  medicalAidScheme?: string;
  medicalAidMemberNumber?: string;
  medicalAidDependantCode?: string;
  reasonForVisit: string;
  symptoms?: string;
  allergies?: string;
  currentMedications?: string;
  status: AppointmentStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  rescheduledFromId?: string;
  rescheduledToId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface MedicalAidScheme {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  popularPlans: string[];
}

export interface AppointmentSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  mode: AppointmentMode;
  priceZAR?: number;
  isAvailable: boolean;
}

export interface PractitionerReview {
  id: string;
  patientName: string;
  rating: number; // 1 - 5
  date: string;
  comment: string;
  verifiedVisit: boolean;
  practitionerResponse?: string;
}

export interface BasePractitioner {
  id: string;
  slug: string;
  practitionerType: PractitionerType;
  specialty: string;
  subSpecialties?: string[];
  services: string[];
  practiceName: string;
  province: SouthAfricanProvince;
  city: string;
  suburb: string;
  address: string;
  coordinates: LocationCoordinates;
  rating: number;
  reviewCount: number;
  languages: string[];
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  acceptedMedicalAids: string[];
  offersVirtual: boolean;
  offersInPerson: boolean;
  dataAuthority: DataAuthority;
  lastVerifiedAt: string;
}

export interface DigitalNexCareProvider extends BasePractitioner {
  practitionerType: 'DIGITALNEXCARE_PROVIDER';
  fullName: string;
  title: string; // e.g. Dr., Prof., Sr.
  photoUrl: string;
  hpcsaNumber?: string;
  sancNumber?: string;
  verificationStatus: VerificationStatus;
  claimStatus: ClaimStatus;
  bio: string;
  experienceYears: number;
  consultationFeeZAR: number;
  availableSlots: AppointmentSlot[];
  reviews: PractitionerReview[];
  phone: string;
  email: string;
  website?: string;
}

export interface ExternalPractitionerUnlocked extends BasePractitioner {
  practitionerType: 'EXTERNAL_PRACTITIONER';
  fullName: string;
  title: string;
  phone: string;
  website?: string;
  email?: string;
  sourceAttribution: string;
  claimStatus: ClaimStatus;
}

export interface ExternalPractitionerLocked {
  id: string;
  practitionerType: 'EXTERNAL_PRACTITIONER';
  isLocked: true;
  anonymizedTitle: string; // e.g. "Dentist in Pretoria East"
  specialty: string;
  services: string[];
  province: SouthAfricanProvince;
  city: string;
  generalArea: string; // e.g. "Pretoria East" or "Sandton CBD"
  approximateDistanceKm?: number;
  rating?: number;
  reviewCount?: number;
  offersVirtual: boolean;
  offersInPerson: boolean;
  acceptedMedicalAids: string[];
  requiresSubscription: true;
}

export type Practitioner =
  | DigitalNexCareProvider
  | ExternalPractitionerUnlocked
  | ExternalPractitionerLocked;

export interface PatientPreferences {
  smsNotifications: boolean;
  emailNotifications: boolean;
  whatsAppNotifications: boolean;
  appointmentReminders: boolean;
  reminderLeadHours: number; // 2, 12, 24, 48
  marketingUpdates: boolean;
  languagePreference: string;
  accessibilityNeeds?: string;
}

export interface PatientDependant {
  id: string;
  fullName: string;
  relationship: 'CHILD' | 'SPOUSE' | 'PARENT' | 'SIBLING' | 'EXTENDED_FAMILY' | 'OTHER';
  idNumberOrDOB: string;
  dateOfBirth?: string;
  nationalId?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  medicalAidDependantCode: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  chronicConditions?: string;
  guardianConsent: boolean;
}

export interface PatientMedicalAidProfile {
  schemeName: string;
  planName: string;
  membershipNumber: string;
  mainMemberName: string;
  mainMemberIdNumber?: string;
  dependantCode: string;
  hasGapCover?: boolean;
  gapCoverProvider?: string;
  gapCoverPolicyNumber?: string;
  eligibilityStatus: 'VERIFIED' | 'PENDING' | 'REQUIRES_REVALIDATION' | 'UNVERIFIED';
  lastVerifiedDate?: string;
}

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
}

export interface AllergyItem {
  substance: string;
  reaction: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE_ANAPHYLACTIC';
}

export interface PatientIntakeResponse {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  providerId?: string;
  providerName?: string;
  chiefComplaint: string;
  symptomDuration: string;
  painSeverityScale: number; // 1 - 10
  chronicConditions: string[];
  currentMedications: MedicationItem[];
  allergies: AllergyItem[];
  surgicalHistory: string;
  familyHistory: string;
  lifestyle: {
    smokingStatus: 'NEVER' | 'FORMER' | 'CURRENT';
    alcoholUsage: 'NONE' | 'OCCASIONAL' | 'REGULAR';
    physicalActivity: 'SEDENTARY' | 'MODERATE' | 'ACTIVE';
  };
  digitalSignature: string;
  consentAccepted: boolean;
  popiaConsentAccepted: boolean;
  submittedAt: string;
  updatedAt: string;
}

export interface PatientReviewRecord {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  appointmentId: string;
  rating: number; // 1 - 5
  waitingTimeRating: number; // 1 - 5
  bedsideMannerRating: number; // 1 - 5
  facilityRating: number; // 1 - 5
  tags: string[];
  comment: string;
  verifiedVisit: boolean;
  practitionerResponse?: string;
  respondedAt?: string;
  createdAt: string;
}

export type NotificationType =
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REMINDER'
  | 'REVIEW_REQUEST'
  | 'SUBSCRIPTION_RENEWAL'
  | 'SUBSCRIPTION_LIMIT_WARNING'
  | 'PAYMENT_SUCCESS'
  | 'BOOKING_CONFIRMATION'
  | 'BOOKING_RESCHEDULED'
  | 'BOOKING_CANCELLED'
  | 'SUBSCRIPTION_ALERT'
  | 'REVEAL_LIMIT_WARNING'
  | 'MEDICAL_AID_UPDATE'
  | 'INTAKE_REQUIRED'
  | 'SYSTEM_NOTICE';

export type NotificationChannel = 'IN_APP' | 'SMS' | 'EMAIL' | 'WHATSAPP';

export type NotificationDeliveryStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface ChannelDispatchLog {
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  recipient: string;
  dispatchedAt: string;
  externalRef?: string;
  deliveryLatencyMs?: number;
}

export interface InAppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  read?: boolean;
  createdAt: string;
  channels: NotificationChannel[];
  dispatchLogs?: ChannelDispatchLog[];
  metadata?: any;
}

export interface Chunk7TestResult {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL';
  passed: boolean;
  details: string;
}

export interface PracticeLocation {
  id: string;
  practiceId: string;
  name: string;
  address: string;
  suburb: string;
  city: string;
  province: SouthAfricanProvince;
  coordinates: LocationCoordinates;
  phone: string;
  email: string;
  rooms: string[];
  isMainBranch: boolean;
  operatingHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  } | Record<string, string>;
}

export interface PracticeTeamMember {
  id: string;
  practiceId: string;
  userId?: string;
  fullName?: string;
  name?: string;
  email: string;
  phone: string;
  role: UserRole | 'PROVIDER' | 'PRACTICE_MANAGER' | 'RECEPTION_SCHEDULER' | 'FINANCE_BILLING';
  hpcsaOrSancNumber?: string;
  permissions: string[];
  active?: boolean;
  status?: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  joinedAt?: string;
  invitedAt?: string;
}

export interface PracticeService {
  id: string;
  practiceId: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceZAR: number;
  isVirtual: boolean;
  isInPerson: boolean;
  tariffCode?: string;
  icd10Category?: string;
  active: boolean;
}

export type DuplicateMatchConfidence = 'EXACT_MATCH' | 'HIGH_CONFIDENCE_MATCH' | 'POSSIBLE_MATCH';
export type DuplicateStatus = 'PENDING' | 'MERGED' | 'REJECTED' | 'DIFFERENT_PRACTITIONERS' | 'PENDING_REVIEW' | 'RESOLVED_MERGED' | 'RESOLVED_DISTINCT';

export interface DuplicateCandidate {
  id: string;
  confidence?: DuplicateMatchConfidence;
  matchConfidence?: DuplicateMatchConfidence;
  similarityScore?: number; // 0 - 100
  score?: number;
  primaryPractitionerId?: string;
  canonicalPractitionerId?: string;
  primaryName?: string;
  primaryPractice?: string;
  primaryAddress?: string;
  primaryPhone?: string;
  primarySpecialty?: string;
  primaryHpcsaNumber?: string;
  primarySource?: string;
  candidatePractitionerId?: string;
  duplicatePractitionerId?: string;
  candidateName?: string;
  candidatePractice?: string;
  candidateAddress?: string;
  candidatePhone?: string;
  candidateSpecialty?: string;
  candidateHpcsaNumber?: string;
  candidateSource?: string;
  matchSignals?: string[];
  reasons?: string[];
  status: DuplicateStatus;
  canonicalData?: {
    name: string;
    practiceName: string;
    address: string;
    suburb: string;
    city: string;
    phone?: string;
    hpcsaNumber?: string;
  };
  duplicateData?: {
    name: string;
    practiceName: string;
    address: string;
    suburb: string;
    city: string;
    phone?: string;
    source?: string;
  };
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export type DataAuthorityLevel =
  | 'DIGITALNEXCARE_VERIFIED_PROVIDER'
  | 'PRACTITIONER_CONFIRMED'
  | 'PRACTICE_CONFIRMED'
  | 'ADMIN_VERIFIED'
  | 'AUTHORITATIVE_PROFESSIONAL_REGISTER'
  | 'PRACTICE_WEBSITE'
  | 'OTHER_APPROVED_EXTERNAL_SOURCE';

export interface DataConflictRecord {
  id: string;
  practitionerId: string;
  practitionerName: string;
  practiceName: string;
  fieldName: string;
  currentValue?: string;
  existingValue?: string;
  currentAuthority?: DataAuthorityLevel | DataAuthority;
  existingAuthority?: DataAuthorityLevel | DataAuthority;
  discoveredValue?: string;
  incomingValue?: string;
  discoveredAuthority?: DataAuthorityLevel | DataAuthority;
  incomingAuthority?: DataAuthorityLevel | DataAuthority;
  sourceName?: string;
  incomingSource?: string;
  status: 'OPEN' | 'RESOLVED_KEEP_CURRENT' | 'RESOLVED_USE_DISCOVERED' | 'RESOLVED_CUSTOM' | 'PENDING_REVIEW' | 'RESOLVED_RETAIN_EXISTING' | 'RESOLVED_ACCEPT_INCOMING';
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface SubscriptionAdminTierConfig {
  id: PatientSubscriptionTier;
  name: string;
  priceZAR: number;
  monthlyReveals: number;
  revealAllowance?: number;
  isPopular?: boolean;
  active: boolean;
  tagline?: string;
  description?: string;
  features: string[];
}

export interface SubscriptionAnalyticsMetrics {
  freeUsers?: number;
  totalFreeUsers?: number;
  paidSubscribers?: number;
  activePaidSubscribers?: number;
  totalSubscribers?: number;
  mrrZAR?: number;
  monthlyRecurringRevenueZAR?: number;
  arrZAR?: number;
  upgradeRatePercent?: number;
  quotaExhaustionRatePercent?: number;
  paywallConversionRatePercent?: number;
  averageRevealsUsedPerUser?: number;
  churnRatePercent?: number;
  failedRenewalsCount?: number;
  planMix?: {
    access: number;
    plus: number;
    family: number;
  };
  planDistribution?: {
    tier: PatientSubscriptionTier;
    name: string;
    usersCount: number;
    mrrZAR: number;
    revealsAllocated: number;
    revealsConsumed: number;
  }[];
}

export type TrustCaseType =
  | 'CLAIM_DISPUTE'
  | 'IDENTITY_VERIFICATION'
  | 'REVIEW_APPEAL'
  | 'FRAUD_DETECTION'
  | 'ACCOUNT_ABUSE';

export type TrustCaseStatus = 'OPEN' | 'INVESTIGATING' | 'IN_INVESTIGATION' | 'RESOLVED' | 'DISMISSED';
export type TrustCasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'URGENT';

export interface TrustCase {
  id: string;
  caseNumber?: string;
  type?: TrustCaseType;
  caseType?: TrustCaseType;
  priority: TrustCasePriority;
  status: TrustCaseStatus;
  title?: string;
  description?: string;
  summary?: string;
  subjectName?: string;
  subjectType?: 'PRACTITIONER' | 'PATIENT' | 'REVIEW' | 'PRACTICE' | 'ACCOUNT';
  subjectId?: string;
  targetEntityType?: 'PRACTITIONER' | 'PRACTICE' | 'PATIENT' | 'REVIEW' | 'SUBSCRIPTION';
  targetEntityId?: string;
  submittedBy?: string;
  reporterName?: string;
  assignedTo?: string;
  submittedAt?: string;
  createdAt?: string;
  evidenceDescription?: string;
  evidenceAttachments?: string[];
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionAction?: string;
  resolutionNotes?: string;
}

export interface Review {
  id: string;
  providerId: string;
  patientId: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedVisit: boolean;
  appointmentId?: string;
  providerResponse?: {
    respondedAt: string;
    text: string;
  };
}

export interface ProviderAnalyticsData {
  providerId?: string;
  profileViews: number;
  searchImpressions?: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  noShows: number;
  conversionRatePercent: number;
  cancellationRatePercent: number;
  noShowRatePercent: number;
  satisfactionScore: number;
  revenueZAR: number;
  monthlyTrend: {
    month: string;
    views: number;
    bookings: number;
    cancellations: number;
    rating: number;
  }[];
  reviewsBreakdown?: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
}

export interface PlatformFeatureFlag {
  id: string;
  key: string;
  name?: string;
  description: string;
  category?: 'DISCOVERY' | 'SCHEDULING' | 'BILLING' | 'SECURITY' | 'REVIEWS';
  enabled: boolean;
  environment?: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  rolloutPercentage?: number;
  updatedAt: string;
  updatedBy?: string;
}

export interface Chunk8TestResult {
  id: string;
  name: string;
  category?: string;
  passed: boolean;
  details?: string;
  message?: string;
}

export interface Chunk8TestSummary {
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
  results: Chunk8TestResult[];
}


export interface PatientUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'PATIENT';
  dateOfBirth?: string;
  nationalIdOrPassport?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  province?: SouthAfricanProvince;
  city?: string;
  suburb?: string;
  address?: string;
  preferences: PatientPreferences;
  currentPlan: PatientSubscriptionTier;
  revealsUsedThisMonth: number;
  monthlyRevealLimit: number;
  billingPeriodEnd: string;
  unlockedPractitionerIds: string[];
  dependants: PatientDependant[];
  medicalAid?: PatientMedicalAidProfile;
}

export interface SearchFilterState {
  query: string;
  specialty: string;
  service: string;
  province: string;
  city: string;
  suburb: string;
  medicalAid: string;
  mode: 'ALL' | 'IN_PERSON' | 'VIRTUAL';
  verifiedOnly: boolean;
  availableToday: boolean;
  gender: string;
  language: string;
  maxDistanceKm?: number;
  sortBy: 'RECOMMENDED' | 'RATING' | 'DISTANCE' | 'EARLIEST_AVAILABILITY' | 'PRICE_LOW_HIGH';
  userCoordinates?: LocationCoordinates | null;
}

export interface IngestionJob {
  id: string;
  name: string;
  source: string;
  province: SouthAfricanProvince;
  city: string;
  specialty: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  recordsFound: number;
  recordsNormalized: number;
  duplicatesSkipped: number;
  conflictsFlagged: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userRole: UserRole;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  createdAt: string;
  nationalIdOrPassport?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  province?: SouthAfricanProvince;
  city?: string;
  suburb?: string;
  address?: string;
  // Patient specific details
  currentPlan?: PatientSubscriptionTier;
  revealsUsedThisMonth?: number;
  monthlyRevealLimit?: number;
  billingPeriodEnd?: string;
  unlockedPractitionerIds?: string[];
  dependants?: PatientDependant[];
  medicalAid?: PatientMedicalAidProfile;
  // Provider specific details
  title?: string;
  hpcsaNumber?: string;
  sancNumber?: string;
  sapcNumber?: string;
  ahpcsaNumber?: string;
  practiceNumber?: string;
  practiceName?: string;
  specialty?: string;
  verificationStatus?: VerificationStatus;
  claimStatus?: ClaimStatus;
  consultationFeeZAR?: number;
}

// ============================================================================
// CHUNK 9: PAYSTACK & YOCO PAYMENT AND SUBSCRIPTION TYPES
// ============================================================================

export type PaymentGatewayProvider = 'PAYSTACK' | 'YOCO';
export type PaymentTransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'ABANDONED';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'GRACE_PERIOD' | 'CANCELLED' | 'EXPIRED';

export interface PaymentCheckoutRequest {
  planId: PatientSubscriptionTier;
  userId: string;
  userEmail: string;
  userName?: string;
  gateway: PaymentGatewayProvider;
  callbackUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentCheckoutResponse {
  success: boolean;
  checkoutUrl: string;
  paymentReference: string;
  gatewayReference?: string;
  amountZAR: number;
  amountCents: number;
  gateway: PaymentGatewayProvider;
  error?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  status: PaymentTransactionStatus;
  paymentReference: string;
  gatewayReference: string;
  amountZAR: number;
  amountCents: number;
  currency: 'ZAR';
  gateway: PaymentGatewayProvider;
  planId: PatientSubscriptionTier;
  userId: string;
  userEmail: string;
  paidAt: string;
  authorizationCode?: string;
  rawGatewayResponse?: any;
  error?: string;
}

export interface WebhookPayload {
  gateway: PaymentGatewayProvider;
  rawBody: string;
  signature: string;
  event: string;
  data: any;
}

export interface WebhookProcessingResult {
  success: boolean;
  processed: boolean;
  idempotentIgnored?: boolean;
  eventId: string;
  subscriptionActivated?: boolean;
  subscriptionId?: string;
  error?: string;
}

export interface RefundRequest {
  paymentReference: string;
  gatewayReference?: string;
  amountZAR?: number;
  reason?: string;
  adminUserId: string;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  amountZAR: number;
  status: 'PROCESSED' | 'FAILED' | 'PENDING';
  message: string;
}

export interface PatientSubscriptionRecord {
  id: string;
  userId: string;
  userEmail: string;
  planId: PatientSubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  paymentGateway: PaymentGatewayProvider;
  gatewaySubscriptionId?: string;
  gatewayCustomerCode?: string;
  lastPaymentReference?: string;
  revealAllowance: number;
  revealsUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  planId: PatientSubscriptionTier;
  amountZAR: number;
  amountCents: number;
  currency: 'ZAR';
  gateway: PaymentGatewayProvider;
  gatewayReference: string;
  internalReference: string;
  status: PaymentTransactionStatus;
  subscriptionId?: string;
  paidAt: string;
  receiptUrl?: string;
  refunded: boolean;
  refundAmountZAR?: number;
  createdAt: string;
}

export interface PaymentReconciliationItem {
  id: string;
  internalPaymentId: string;
  gatewayReference: string;
  gateway: PaymentGatewayProvider;
  userEmail: string;
  planId: PatientSubscriptionTier;
  expectedAmountZAR: number;
  settledAmountZAR: number;
  internalStatus: PaymentTransactionStatus;
  gatewayStatus: PaymentTransactionStatus;
  subscriptionId: string;
  webhookState: 'DELIVERED' | 'VERIFIED' | 'FAILED' | 'IDEMPOTENT_DUPLICATE';
  lastVerifiedAt: string;
  hasMismatch: boolean;
  mismatchReason?: string;
}

export interface Chunk9TestResult {
  id: string;
  gateway: PaymentGatewayProvider | 'COMMON';
  name: string;
  passed: boolean;
  details: string;
  credentialsRequired?: boolean;
}

export interface Chunk9TestSummary {
  total: number;
  passed: number;
  failed: number;
  credentialsMissingCount: number;
  allPassed: boolean;
  results: Chunk9TestResult[];
}


