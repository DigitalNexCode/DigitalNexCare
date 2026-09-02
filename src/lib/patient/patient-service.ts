/**
 * DigitalNexCare Patient Domain Service
 * Chunk 7 - Patient Account, Dependants, Medical Aid, Intake, and Reviews Engine
 */

import {
  PatientUser,
  PatientDependant,
  PatientMedicalAidProfile,
  PatientPreferences,
  PatientIntakeResponse,
  PatientReviewRecord,
  DetailedAppointment,
  PatientSubscriptionTier,
} from '../../types';
import { DEMO_PATIENT, MOCK_PROVIDERS } from '../../data/mockDatabase';
import { NotificationService } from '../notifications/notification-service';

const STORAGE_KEY_PATIENT = 'dnc_patient_profile_v1';
const STORAGE_KEY_DEPENDANTS = 'dnc_patient_dependants_v1';
const STORAGE_KEY_MEDICAL_AID = 'dnc_patient_medical_aid_v1';
const STORAGE_KEY_INTAKE = 'dnc_patient_intake_responses_v1';
const STORAGE_KEY_REVIEWS = 'dnc_patient_reviews_v1';

export class PatientService {
  /**
   * Get Current Patient Profile
   */
  static getPatientProfile(): PatientUser {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PATIENT);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }

    const defaultProfile: PatientUser = {
      id: 'patient-lerato-001',
      email: 'lerato.m@example.co.za',
      fullName: 'Lerato Khumalo',
      phone: '+27 82 555 1234',
      role: 'PATIENT',
      dateOfBirth: '1990-06-15',
      nationalIdOrPassport: '9006155029087',
      gender: 'FEMALE',
      province: 'Gauteng',
      city: 'Pretoria',
      suburb: 'Hatfield',
      address: '142 Burnett Street',
      preferences: {
        smsNotifications: true,
        emailNotifications: true,
        whatsAppNotifications: true,
        appointmentReminders: true,
        reminderLeadHours: 24,
        marketingUpdates: false,
        languagePreference: 'English',
        accessibilityNeeds: 'None',
      },
      currentPlan: 'NEXCARE_FREE',
      revealsUsedThisMonth: 1,
      monthlyRevealLimit: 2,
      billingPeriodEnd: '2026-03-31',
      unlockedPractitionerIds: ['ext-1'],
      dependants: this.getDependants(),
      medicalAid: this.getMedicalAidProfile(),
    };

    this.savePatientProfile(defaultProfile);
    return defaultProfile;
  }

  /**
   * Update Patient Profile & Preferences
   */
  static savePatientProfile(profile: PatientUser): PatientUser {
    try {
      localStorage.setItem(STORAGE_KEY_PATIENT, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save patient profile to localStorage', e);
    }
    return profile;
  }

  /**
   * Update Patient Preferences
   */
  static updatePreferences(prefs: Partial<PatientPreferences>): PatientPreferences {
    const profile = this.getPatientProfile();
    profile.preferences = { ...profile.preferences, ...prefs };
    this.savePatientProfile(profile);
    return profile.preferences;
  }

  // ==========================================
  // DEPENDANTS MANAGEMENT
  // ==========================================

  /**
   * Get all registered dependants
   */
  static getDependants(): PatientDependant[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DEPENDANTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    const initialDependants: PatientDependant[] = [
      {
        id: 'dep-101',
        fullName: 'Thabo Khumalo',
        relationship: 'CHILD',
        idNumberOrDOB: '2016-04-12',
        dateOfBirth: '2016-04-12',
        nationalId: '1604125029088',
        gender: 'MALE',
        medicalAidDependantCode: '01',
        emergencyContactName: 'Lerato Khumalo (Mother)',
        emergencyContactPhone: '+27 82 555 1234',
        allergies: 'Penicillin allergy',
        chronicConditions: 'Asthma (Mild, uses Ventolin as required)',
        guardianConsent: true,
      },
      {
        id: 'dep-102',
        fullName: 'Sipho Khumalo',
        relationship: 'SPOUSE',
        idNumberOrDOB: '1988-11-20',
        dateOfBirth: '1988-11-20',
        nationalId: '8811205029089',
        gender: 'MALE',
        medicalAidDependantCode: '02',
        emergencyContactName: 'Lerato Khumalo',
        emergencyContactPhone: '+27 82 555 1234',
        allergies: 'None known',
        chronicConditions: 'None',
        guardianConsent: true,
      },
    ];

    try {
      localStorage.setItem(STORAGE_KEY_DEPENDANTS, JSON.stringify(initialDependants));
    } catch {}

    return initialDependants;
  }

  /**
   * Add or Update Dependant
   */
  static saveDependant(dependant: PatientDependant): PatientDependant[] {
    const list = this.getDependants();
    const existingIndex = list.findIndex((d) => d.id === dependant.id);

    if (existingIndex >= 0) {
      list[existingIndex] = dependant;
    } else {
      list.push({
        ...dependant,
        id: dependant.id || `dep-${Date.now()}`,
      });
    }

    try {
      localStorage.setItem(STORAGE_KEY_DEPENDANTS, JSON.stringify(list));
    } catch {}

    // Update patient profile copy
    const profile = this.getPatientProfile();
    profile.dependants = list;
    this.savePatientProfile(profile);

    return list;
  }

  /**
   * Delete Dependant
   */
  static deleteDependant(id: string): PatientDependant[] {
    const list = this.getDependants().filter((d) => d.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_DEPENDANTS, JSON.stringify(list));
    } catch {}

    const profile = this.getPatientProfile();
    profile.dependants = list;
    this.savePatientProfile(profile);

    return list;
  }

  // ==========================================
  // MEDICAL AID PROFILE MANAGEMENT
  // ==========================================

  /**
   * Get Medical Aid Profile
   */
  static getMedicalAidProfile(): PatientMedicalAidProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MEDICAL_AID);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    const initial: PatientMedicalAidProfile = {
      schemeName: 'Discovery Health',
      planName: 'Classic Comprehensive',
      membershipNumber: '908234112',
      mainMemberName: 'Lerato Khumalo',
      mainMemberIdNumber: '9006155029087',
      dependantCode: '00',
      hasGapCover: true,
      gapCoverProvider: 'Stratum Benefits',
      gapCoverPolicyNumber: 'GAP-88301-SA',
      eligibilityStatus: 'VERIFIED',
      lastVerifiedDate: '2026-03-01',
    };

    try {
      localStorage.setItem(STORAGE_KEY_MEDICAL_AID, JSON.stringify(initial));
    } catch {}

    return initial;
  }

  /**
   * Save Medical Aid Profile
   */
  static saveMedicalAidProfile(profileData: PatientMedicalAidProfile): PatientMedicalAidProfile {
    try {
      localStorage.setItem(STORAGE_KEY_MEDICAL_AID, JSON.stringify(profileData));
    } catch {}

    const patient = this.getPatientProfile();
    patient.medicalAid = profileData;
    this.savePatientProfile(patient);

    // Create In-App Notification
    NotificationService.createNotification({
      userId: patient.id,
      type: 'MEDICAL_AID_UPDATE',
      title: 'Medical Aid Profile Updated',
      message: `Your medical aid details for ${profileData.schemeName} (${profileData.planName}) have been saved and verified.`,
      actionUrl: '/patient/medical-aid',
      actionLabel: 'View Medical Profile',
    });

    return profileData;
  }

  /**
   * Real-time Medical Aid Scheme & Option Eligibility Verification Simulator
   */
  static verifySchemeEligibility(scheme: string, memberNumber: string): {
    isValid: boolean;
    status: 'VERIFIED' | 'REQUIRES_REVALIDATION' | 'UNVERIFIED';
    message: string;
    benefitsActive: boolean;
  } {
    if (!scheme || !memberNumber) {
      return {
        isValid: false,
        status: 'UNVERIFIED',
        message: 'Scheme and Membership number are required for verification.',
        benefitsActive: false,
      };
    }

    // Standard South African medical schemes validation
    if (memberNumber.trim().length >= 6) {
      return {
        isValid: true,
        status: 'VERIFIED',
        message: `Verified active membership with ${scheme} for number ${memberNumber}. Benefit limits are valid for direct settlement.`,
        benefitsActive: true,
      };
    }

    return {
      isValid: false,
      status: 'REQUIRES_REVALIDATION',
      message: 'Membership number format is incomplete. Please confirm your card details.',
      benefitsActive: false,
    };
  }

  // ==========================================
  // CLINICAL INTAKE PRE-VISIT FORMS
  // ==========================================

  /**
   * Get all patient intake questionnaire responses
   */
  static getIntakeResponses(): PatientIntakeResponse[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INTAKE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    const initialIntake: PatientIntakeResponse[] = [
      {
        id: 'intake-base-001',
        patientId: 'patient-lerato-001',
        patientName: 'Lerato Khumalo',
        providerName: 'Dr. Naledi Mokoena (General Practitioner)',
        chiefComplaint: 'Persistent seasonal allergies and mild sinus pressure for 2 weeks.',
        symptomDuration: '14 days',
        painSeverityScale: 3,
        chronicConditions: ['None reported'],
        currentMedications: [
          { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily at night' },
        ],
        allergies: [
          { substance: 'Sulphonamides', reaction: 'Mild skin hives', severity: 'MODERATE' },
        ],
        surgicalHistory: 'Tonsillectomy (2008)',
        familyHistory: 'Maternal hypertension',
        lifestyle: {
          smokingStatus: 'NEVER',
          alcoholUsage: 'OCCASIONAL',
          physicalActivity: 'MODERATE',
        },
        digitalSignature: 'Lerato Khumalo',
        consentAccepted: true,
        popiaConsentAccepted: true,
        submittedAt: '2026-03-01T10:15:00Z',
        updatedAt: '2026-03-01T10:15:00Z',
      },
    ];

    try {
      localStorage.setItem(STORAGE_KEY_INTAKE, JSON.stringify(initialIntake));
    } catch {}

    return initialIntake;
  }

  /**
   * Submit or Update Pre-Visit Intake Form
   */
  static saveIntakeResponse(intake: Omit<PatientIntakeResponse, 'id' | 'submittedAt' | 'updatedAt'> & { id?: string }): PatientIntakeResponse {
    const list = this.getIntakeResponses();
    const now = new Date().toISOString();

    let savedRecord: PatientIntakeResponse;

    if (intake.id) {
      const index = list.findIndex((i) => i.id === intake.id);
      if (index >= 0) {
        savedRecord = {
          ...list[index],
          ...intake,
          id: intake.id,
          updatedAt: now,
        };
        list[index] = savedRecord;
      } else {
        savedRecord = {
          ...intake,
          id: intake.id,
          submittedAt: now,
          updatedAt: now,
        };
        list.push(savedRecord);
      }
    } else {
      savedRecord = {
        ...intake,
        id: `intake-${Date.now()}`,
        submittedAt: now,
        updatedAt: now,
      };
      list.unshift(savedRecord);
    }

    try {
      localStorage.setItem(STORAGE_KEY_INTAKE, JSON.stringify(list));
    } catch {}

    // Notification
    NotificationService.createNotification({
      userId: savedRecord.patientId,
      type: 'INTAKE_REQUIRED',
      title: 'Pre-Visit Intake Form Submitted',
      message: `Your medical intake form for ${savedRecord.providerName || 'your consultation'} was successfully securely processed.`,
      actionUrl: '/patient/intake',
      actionLabel: 'View Health Form',
    });

    return savedRecord;
  }

  // ==========================================
  // PATIENT REVIEWS ENGINE
  // ==========================================

  /**
   * Get all patient reviews (alias)
   */
  static getReviews(): PatientReviewRecord[] {
    return this.getPatientReviews();
  }

  /**
   * Get all patient reviews
   */
  static getPatientReviews(): PatientReviewRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REVIEWS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    const initialReviews: PatientReviewRecord[] = [
      {
        id: 'rev-001',
        patientId: 'patient-lerato-001',
        patientName: 'Lerato K.',
        providerId: 'prov-1',
        providerName: 'Dr. Naledi Mokoena',
        appointmentId: 'apt-prev-001',
        rating: 5,
        waitingTimeRating: 5,
        bedsideMannerRating: 5,
        facilityRating: 5,
        tags: ['Punctual', 'Thorough Explanation', 'Clean Practice', 'Friendly Staff'],
        comment: 'Dr. Mokoena was incredibly attentive and explained my diagnosis in clear, understandable terms. Minimal wait time at the Hatfield rooms.',
        verifiedVisit: true,
        practitionerResponse: 'Thank you Lerato! We strive to make consultations as comfortable and informative as possible.',
        respondedAt: '2026-02-16T14:30:00Z',
        createdAt: '2026-02-15T11:20:00Z',
      },
    ];

    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(initialReviews));
    } catch {}

    return initialReviews;
  }

  /**
   * Submit Verified Patient Review
   */
  static submitReview(review: Omit<PatientReviewRecord, 'id' | 'createdAt'>): PatientReviewRecord {
    const list = this.getPatientReviews();
    const newReview: PatientReviewRecord = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    list.unshift(newReview);

    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(list));
    } catch {}

    // Notify Patient
    NotificationService.createNotification({
      userId: review.patientId,
      type: 'REVIEW_REQUEST',
      title: 'Review Published',
      message: `Your verified review for ${review.providerName} is now live and helping other South Africans make informed care decisions.`,
      actionUrl: '/patient/reviews',
      actionLabel: 'View My Reviews',
    });

    return newReview;
  }
}
