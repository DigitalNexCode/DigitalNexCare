/**
 * DigitalNexCare AI Care Navigation Engine
 * 
 * Constitutional Directives:
 * 1. DigitalNexCare is NOT a treating provider or diagnostic tool.
 * 2. NEVER provide a medical diagnosis (e.g., "You have disease X").
 * 3. Purely translate patient conversational descriptions, layman symptoms, or healthcare goals
 *    into appropriate healthcare specialties, consultation expectations, and navigation filters.
 */

import { SOUTH_AFRICAN_HEALTHCARE_SYNONYMS, SynonymService } from '../search/synonyms';

export interface CareNavigationRecommendation {
  userQuery: string;
  matchedSpecialties: {
    name: string;
    description: string;
    recommendedServices: string[];
    urgencyGuidance?: string;
  }[];
  consultationExpectation: string;
  suggestedSearchFilter: {
    specialty: string;
    query?: string;
  };
  disclaimer: string;
}

export class AICareNavigator {
  private static isEnabled = true;

  static isFeatureEnabled(): boolean {
    return this.isEnabled;
  }

  static toggleFeature(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Analyze patient narrative and return structured specialty navigation guidance.
   * STRICTLY NON-DIAGNOSTIC.
   */
  static async navigateIntent(patientText: string): Promise<CareNavigationRecommendation> {
    const clean = patientText.toLowerCase().trim();
    const synonym = SynonymService.resolveQuery(clean);

    const baseDisclaimer =
      'DigitalNexCare is an access and scheduling platform, not a medical practitioner. We do not provide medical diagnosis or treatment advice. For emergency care, contact South Africa National Emergency Services at 112 or Netcare 911 (082 911).';

    // Emergency red flags check
    if (
      clean.includes('chest pain') ||
      clean.includes('can\'t breathe') ||
      clean.includes('severe bleeding') ||
      clean.includes('stroke') ||
      clean.includes('unconscious')
    ) {
      return {
        userQuery: patientText,
        matchedSpecialties: [
          {
            name: 'Emergency Medical Services / Hospital Casualty',
            description:
              'Immediate emergency department evaluation is recommended for severe, sudden, or potentially life-threatening symptoms.',
            recommendedServices: ['Emergency Triage', 'Urgent Medical Stabilization'],
            urgencyGuidance: 'EMERGENCY: Please call 112 or visit the nearest hospital emergency room immediately.',
          },
        ],
        consultationExpectation:
          'In emergency departments, triage nurses immediately evaluate vital signs and priority before physician review.',
        suggestedSearchFilter: {
          specialty: 'General Practitioner (GP)',
        },
        disclaimer: baseDisclaimer,
      };
    }

    if (synonym) {
      return {
        userQuery: patientText,
        matchedSpecialties: [
          {
            name: synonym.canonicalSpecialty,
            description:
              synonym.navigationExplanation ||
              `Specialists registered in ${synonym.canonicalSpecialty} treat related concerns and conduct comprehensive clinical exams.`,
            recommendedServices: synonym.suggestedServices,
          },
        ],
        consultationExpectation: `During your initial consultation, the practitioner will review your medical history, perform a physical or diagnostic examination, and discuss a personalized management plan.`,
        suggestedSearchFilter: {
          specialty: synonym.canonicalSpecialty,
        },
        disclaimer: baseDisclaimer,
      };
    }

    // Default general practice navigation
    return {
      userQuery: patientText,
      matchedSpecialties: [
        {
          name: 'General Practitioner (GP)',
          description:
            'General Practitioners (GPs) provide broad clinical evaluations, primary care management, and direct referrals to medical specialists where needed.',
          recommendedServices: ['General Clinical Examination', 'Primary Diagnostic Review', 'Specialist Referral'],
        },
      ],
      consultationExpectation:
        'A GP will conduct a thorough primary consultation and, if specialized intervention is needed, provide an authoritative medical referral.',
      suggestedSearchFilter: {
        specialty: 'General Practitioner (GP)',
      },
      disclaimer: baseDisclaimer,
    };
  }
}
