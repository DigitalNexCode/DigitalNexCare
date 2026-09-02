import React, { useEffect } from 'react';
import { SEOConfig } from '../../lib/seo/metadata';

export const SEOHead: React.FC<SEOConfig> = ({
  title,
  description,
  canonicalUrl = 'https://digitalnexcare.co.za',
  ogType = 'website',
  ogImage = 'https://digitalnexcare.co.za/apple-touch-icon.png',
  schemaJsonLd,
}) => {
  useEffect(() => {
    // Set document title
    document.title = `${title} | DigitalNexCare South Africa`;

    // Set or update standard meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(selector) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        if (isProperty) el.setAttribute('property', name);
        else el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateMeta('description', description);
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:url', canonicalUrl, true);
    updateMeta('og:image', ogImage, true);
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);

    // Canonical link
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    // JSON-LD structured data
    if (schemaJsonLd) {
      let script = document.querySelector('#dnc-jsonld-schema') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'dnc-jsonld-schema';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schemaJsonLd);
    }
  }, [title, description, canonicalUrl, ogType, ogImage, schemaJsonLd]);

  return null;
};
