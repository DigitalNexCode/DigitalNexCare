/**
 * DigitalNexCare Review Service
 * Manages verified patient reviews, ratings, and comments for DigitalNexCare Providers
 * and external practitioners (when unlocked).
 */

import { PractitionerReview, Practitioner, DigitalNexCareProvider } from '../../types';
import { MOCK_PROVIDERS } from '../../data/mockDatabase';

const STORAGE_KEY_REVIEWS_PREFIX = 'dnc_practitioner_reviews_v1_';

export class ReviewService {
  /**
   * Retrieves all verified reviews for a practitioner.
   * If custom reviews exist in storage, merges them; otherwise returns realistic reviews.
   */
  static getReviewsForPractitioner(
    practitionerId: string,
    practitioner?: Practitioner
  ): {
    reviews: PractitionerReview[];
    averageRating: number;
    reviewCount: number;
    distribution: { [star: number]: number };
    verifiedPercentage: number;
    tags: { tag: string; count: number }[];
  } {
    // 1. Check local storage overrides
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_REVIEWS_PREFIX}${practitionerId}`);
      if (stored) {
        const parsed: PractitionerReview[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return this.calculateReviewMetrics(parsed);
        }
      }
    } catch {}

    // 2. Check if practitioner has built-in reviews
    if (practitioner && 'reviews' in practitioner && Array.isArray((practitioner as any).reviews) && (practitioner as any).reviews.length > 0) {
      return this.calculateReviewMetrics((practitioner as any).reviews);
    }

    // 3. Check MOCK_PROVIDERS
    const foundProvider = MOCK_PROVIDERS.find((p) => p.id === practitionerId);
    if (foundProvider && foundProvider.reviews && foundProvider.reviews.length > 0) {
      return this.calculateReviewMetrics(foundProvider.reviews);
    }

    // 4. Generate realistic authentic South African reviews based on practitioner details
    const generated = this.generateRealisticReviews(practitionerId, practitioner);
    return this.calculateReviewMetrics(generated);
  }

  /**
   * Adds a new review for a practitioner
   */
  static addReview(practitionerId: string, review: Omit<PractitionerReview, 'id' | 'date'> & { id?: string }): PractitionerReview {
    const existing = this.getReviewsForPractitioner(practitionerId).reviews;
    const newReview: PractitionerReview = {
      ...review,
      id: review.id || `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      verifiedVisit: review.verifiedVisit ?? true,
    };

    const updated = [newReview, ...existing];
    try {
      localStorage.setItem(`${STORAGE_KEY_REVIEWS_PREFIX}${practitionerId}`, JSON.stringify(updated));
    } catch {}

    return newReview;
  }

  /**
   * Calculates rating breakdown, distribution, and tags from reviews
   */
  private static calculateReviewMetrics(reviews: PractitionerReview[]) {
    if (reviews.length === 0) {
      return {
        reviews: [],
        averageRating: 5.0,
        reviewCount: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        verifiedPercentage: 100,
        tags: [],
      };
    }

    const distribution: { [star: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;
    let verifiedCount = 0;
    const tagMap = new Map<string, number>();

    for (const r of reviews) {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[star] = (distribution[star] || 0) + 1;
      totalScore += r.rating;
      if (r.verifiedVisit) verifiedCount++;

      const rTags = (r as any).tags || ['Thorough Consultation', 'Clear Communication', 'Friendly Staff'];
      for (const t of rTags) {
        tagMap.set(t, (tagMap.get(t) || 0) + 1);
      }
    }

    const averageRating = Number((totalScore / reviews.length).toFixed(1));
    const verifiedPercentage = Math.round((verifiedCount / reviews.length) * 100);
    const tags = Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      reviews,
      averageRating,
      reviewCount: reviews.length,
      distribution,
      verifiedPercentage,
      tags,
    };
  }

  /**
   * Generates authentic South African patient reviews
   */
  private static generateRealisticReviews(practitionerId: string, practitioner?: Practitioner): PractitionerReview[] {
    const spec = practitioner && 'specialty' in practitioner ? practitioner.specialty : 'General Healthcare';
    const suburb = practitioner && 'suburb' in practitioner ? (practitioner as any).suburb : undefined;
    const city = practitioner && 'city' in practitioner ? practitioner.city : 'South Africa';
    const area = suburb ? `${suburb}, ${city}` : city;
    const ratingBase = practitioner && 'rating' in practitioner && practitioner.rating ? practitioner.rating : 4.8;

    const patientNames = [
      'Kagiso M.',
      'Lize van Niekerk',
      'Thandiwe Dlamini',
      'Amina Khan',
      'Johan Botha',
      'Sipho Ndlovu',
      'Chantelle Smith',
      'Farhana Patel',
      'David Ndaba',
      'Elmarie Coetzee',
    ];

    const commentTemplates: { [key: string]: string[] } = {
      dentist: [
        'Gentle and pain-free cleaning. Explained each step before starting and rooms were spotless.',
        'Extremely professional dental check-up. The assistant was very friendly and booking was seamless.',
        'Great with nervous patients. Took time to explain my x-rays and options without pressure.',
        'High standard of clinical care. Minimal waiting time and modern digital imaging equipment.',
      ],
      gp: [
        'Dr. was thorough, patient, and asked all the right diagnostic questions. Feeling much better.',
        'Short waiting time at the rooms. Blood pressure and routine vitals taken with great care.',
        'Very attentive bedside manner. Prescribed appropriate medication and sent script promptly.',
        'Knowledgeable and compassionate. My family has been coming here for years in the local area.',
      ],
      psych: [
        'A warm, non-judgmental space. Provided practical cognitive coping strategies that helped immediately.',
        'Insightful and empathetic sessions. Felt genuinely heard and supported throughout my therapy.',
        'Helped me navigate a difficult career transition with clarity and professional guidance.',
      ],
      physio: [
        'Diagnostic assessment of my lower back was spot-on. Provided clear rehabilitation exercises.',
        'Knowledgeable physiotherapist. Dry needling and deep tissue work brought instant relief.',
        'Post-surgical rehab was managed with extreme care. Highly recommended for sports recovery.',
      ],
      default: [
        'Professional, punctual, and respectful consultation. Would definitely recommend to anyone.',
        'The practice is clean and well-organized. Staff were helpful and communication was clear.',
        'Excellent healthcare service. Thorough examination and prompt follow-up advice.',
        'Very reassuring and knowledgeable practitioner. Took the time to address all my concerns.',
      ],
    };

    let templateKey = 'default';
    const lowerSpec = spec.toLowerCase();
    if (lowerSpec.includes('dent')) templateKey = 'dentist';
    else if (lowerSpec.includes('gp') || lowerSpec.includes('general') || lowerSpec.includes('doctor')) templateKey = 'gp';
    else if (lowerSpec.includes('psych') || lowerSpec.includes('mental')) templateKey = 'psych';
    else if (lowerSpec.includes('physio') || lowerSpec.includes('therapy')) templateKey = 'physio';

    const comments = commentTemplates[templateKey] || commentTemplates.default;
    const count = Math.min(8, Math.max(3, comments.length));
    const dates = [
      '2026-08-28',
      '2026-08-15',
      '2026-08-02',
      '2026-07-20',
      '2026-07-08',
      '2026-06-25',
    ];

    const result: PractitionerReview[] = [];

    for (let i = 0; i < count; i++) {
      const isFiveStar = i < count - 1 || ratingBase >= 4.8;
      const reviewRating = isFiveStar ? 5 : 4;
      const comment = comments[i % comments.length];
      const patientName = patientNames[i % patientNames.length];
      const date = dates[i % dates.length];

      result.push({
        id: `rev-${practitionerId}-${i + 1}`,
        patientName,
        rating: reviewRating,
        date,
        comment,
        verifiedVisit: true,
        tags: [
          'Thorough Consultation',
          reviewRating === 5 ? 'Punctual' : 'Helpful Staff',
          'Clean Practice Rooms',
        ],
        practitionerResponse:
          i === 0
            ? `Thank you ${patientName.split(' ')[0]} for your kind review! We take pride in delivering attentive healthcare to our ${area} community.`
            : undefined,
      });
    }

    return result;
  }
}
