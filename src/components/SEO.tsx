import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  type?: 'website' | 'article';
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  noindex?: boolean;
}

interface StructuredDataProps {
  type: 'WebApplication' | 'SoftwareApplication' | 'FAQPage' | 'Article' | 'Organization' | 'BreadcrumbList';
  data?: Record<string, unknown>;
}

const SITE_NAME = 'Ally by WA.I.TER';
const SITE_URL = 'https://allybywaiter.com';
const DEFAULT_IMAGE = '/og-image.png';
const TWITTER_HANDLE = '@allybywaiter';

export function SEO({
  title,
  description,
  path,
  type = 'website',
  image = DEFAULT_IMAGE,
  publishedTime,
  modifiedTime,
  author,
  tags,
  noindex = false,
}: SEOProps) {
  const location = useLocation();
  const currentPath = path || location.pathname;
  const canonicalUrl = `${SITE_URL}${currentPath}`;
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const fullImageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to update or create meta tags
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to update or create link tags
    const setLinkTag = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang 
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]:not([hreflang])`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        if (hreflang) element.setAttribute('hreflang', hreflang);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // Basic meta tags
    setMetaTag('description', description);
    setMetaTag('author', 'WA.I.TER');
    
    // Robots
    if (noindex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow');
    }

    // Open Graph tags
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', type, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:image', fullImageUrl, true);
    setMetaTag('og:site_name', SITE_NAME, true);
    setMetaTag('og:locale', 'en_US', true);

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:site', TWITTER_HANDLE);
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', fullImageUrl);

    // Article specific tags
    if (type === 'article') {
      if (publishedTime) setMetaTag('article:published_time', publishedTime, true);
      if (modifiedTime) setMetaTag('article:modified_time', modifiedTime, true);
      if (author) setMetaTag('article:author', author, true);
      if (tags) {
        tags.forEach((tag, index) => {
          setMetaTag(`article:tag:${index}`, tag, true);
        });
      }
    }

    // Canonical URL
    setLinkTag('canonical', canonicalUrl);

    // Hreflang tags for multi-language support
    setLinkTag('alternate', `${SITE_URL}${currentPath}`, 'en');
    setLinkTag('alternate', `${SITE_URL}${currentPath}?lang=es`, 'es');
    setLinkTag('alternate', `${SITE_URL}${currentPath}?lang=fr`, 'fr');
    setLinkTag('alternate', `${SITE_URL}${currentPath}`, 'x-default');

    // Cleanup function to remove article-specific tags on unmount
    return () => {
      if (type === 'article') {
        const articleTags = document.querySelectorAll('meta[property^="article:"]');
        articleTags.forEach(tag => tag.remove());
      }
    };
  }, [fullTitle, description, canonicalUrl, type, fullImageUrl, publishedTime, modifiedTime, author, tags, noindex, currentPath]);

  return null;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    let jsonLd: Record<string, unknown> = {};

    switch (type) {
      case 'WebApplication':
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Ally',
          alternateName: ['Ally App', 'Ally by WA.I.TER', 'WA.I.TER App'],
          description: 'AI-powered aquarium, pool, and spa water care assistant with photo water testing, voice commands, and smart maintenance scheduling.',
          url: SITE_URL,
          applicationCategory: 'LifestyleApplication',
          applicationSubCategory: ['Aquarium Management', 'Pool Care', 'Water Testing', 'Pet Care'],
          operatingSystem: 'Web, iOS, Android',
          browserRequirements: 'Requires a modern web browser with JavaScript enabled',
          offers: {
            '@type': 'AggregateOffer',
            lowPrice: '0',
            highPrice: '24.99',
            priceCurrency: 'USD',
            offerCount: '3',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '150',
            bestRating: '5',
            worstRating: '1',
          },
          featureList: [
            'AI water test photo analysis',
            'Voice commands and hands-free mode',
            'Smart maintenance scheduling',
            'Proactive water quality alerts',
            'Livestock and plant tracking',
            'Offline mode with sync',
          ],
          screenshot: `${SITE_URL}/screenshot-wide.png`,
          ...data,
        };
        break;

      case 'SoftwareApplication':
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Ally by WA.I.TER',
          alternateName: ['Ally', 'Ally App', 'WA.I.TER', 'Ally Aquarium App', 'Ally Pool App'],
          description: 'Ally is the #1 AI-powered water care assistant for aquariums, pools, spas, and ponds. Features photo water testing, voice commands, smart scheduling, and proactive alerts.',
          url: SITE_URL,
          downloadUrl: SITE_URL,
          installUrl: SITE_URL,
          applicationCategory: 'LifestyleApplication',
          applicationSubCategory: ['Aquarium Management', 'Pool Care', 'Water Testing', 'Pet Care', 'Home Automation'],
          operatingSystem: 'Web, iOS, Android',
          permissions: 'camera, microphone, notifications',
          softwareVersion: '1.0',
          releaseNotes: `${SITE_URL}/blog`,
          datePublished: '2024-01-01',
          inLanguage: ['en', 'es', 'fr'],
          isAccessibleForFree: true,
          offers: {
            '@type': 'AggregateOffer',
            lowPrice: '0',
            highPrice: '24.99',
            priceCurrency: 'USD',
            offerCount: '3',
            offers: [
              {
                '@type': 'Offer',
                name: 'Free Tier',
                price: '0',
                priceCurrency: 'USD',
                description: '1 water body, manual entry, basic features',
              },
              {
                '@type': 'Offer',
                name: 'Pro Plan',
                price: '9.99',
                priceCurrency: 'USD',
                description: 'Unlimited water bodies, AI photo analysis, voice commands',
              },
              {
                '@type': 'Offer',
                name: 'Business Plan',
                price: '24.99',
                priceCurrency: 'USD',
                description: 'Everything in Pro plus team features and API access',
              },
            ],
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '150',
            bestRating: '5',
            worstRating: '1',
          },
          author: {
            '@type': 'Organization',
            name: 'WA.I.TER',
            url: SITE_URL,
          },
          publisher: {
            '@type': 'Organization',
            name: 'WA.I.TER',
            url: SITE_URL,
            logo: {
              '@type': 'ImageObject',
              url: `${SITE_URL}/apple-touch-icon.png`,
            },
          },
          featureList: [
            'AI water test photo analysis with 98% accuracy',
            'Voice commands and hands-free mode for wet hands',
            'Smart maintenance scheduling with automated reminders',
            'Proactive water quality alerts before problems occur',
            'Livestock and plant tracking with photo galleries',
            'Cross-platform PWA for iOS, Android, and desktop',
            'Offline mode with automatic sync',
            'Weather integration for outdoor water bodies',
            'Support for aquariums, pools, spas, and ponds',
          ],
          screenshot: [
            {
              '@type': 'ImageObject',
              url: `${SITE_URL}/screenshot-wide.png`,
              caption: 'Ally dashboard showing water parameters and health status',
            },
            {
              '@type': 'ImageObject',
              url: `${SITE_URL}/screenshot-narrow.png`,
              caption: 'Ally mobile view with water test results',
            },
          ],
          keywords: 'aquarium app, pool app, water testing app, fish tank tracker, aquarium water test, pool water test, AI aquarium, smart pool care, aquarium maintenance, pool maintenance app',
          ...data,
        };
        break;

      case 'Organization':
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'WA.I.TER',
          url: SITE_URL,
          logo: `${SITE_URL}/apple-touch-icon.png`,
          sameAs: [
            'https://twitter.com/allybywaiter',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'info@allybywaiter.com',
            contactType: 'customer support',
          },
          ...data,
        };
        break;

      case 'FAQPage':
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: data?.questions || [],
        };
        break;

      case 'Article':
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          publisher: {
            '@type': 'Organization',
            name: 'WA.I.TER',
            logo: {
              '@type': 'ImageObject',
              url: `${SITE_URL}/apple-touch-icon.png`,
            },
          },
          ...data,
        };
        break;

      case 'BreadcrumbList':
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: data?.items || [],
        };
        break;
    }

    // Create or update the script tag
    const scriptId = `structured-data-${type}`;
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [type, data]);

  return null;
}

// Helper to generate FAQ structured data
export function generateFAQStructuredData(faqs: { question: string; answer: string }[]) {
  return faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  }));
}

// Helper to generate breadcrumb structured data
export function generateBreadcrumbData(items: { name: string; url: string }[]) {
  return items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.url}`,
  }));
}
