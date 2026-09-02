/**
 * DigitalNexCare Structured Metadata & SEO Generator
 * Generates OpenGraph, JSON-LD Schema.org MedicalBusiness / Physician metadata, and canonical links.
 */

export interface SEOConfig {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  schemaJsonLd?: Record<string, any>;
}

export function generatePhysicianSchema(provider: {
  fullName: string;
  specialty: string;
  practiceName: string;
  address: string;
  city: string;
  province: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  consultationFeeZAR?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: provider.fullName,
    medicalSpecialty: provider.specialty,
    worksFor: {
      '@type': 'MedicalOrganization',
      name: provider.practiceName,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: provider.address,
      addressLocality: provider.city,
      addressRegion: provider.province,
      addressCountry: 'ZA',
    },
    telephone: provider.phone || '+27 12 000 0000',
    image: provider.photoUrl || 'https://digitalnexcare.co.za/icon.png',
    priceRange: provider.consultationFeeZAR ? `ZAR ${provider.consultationFeeZAR}` : 'ZAR 600 - 1200',
    ...(provider.rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: provider.rating,
            reviewCount: provider.reviewCount || 1,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}
