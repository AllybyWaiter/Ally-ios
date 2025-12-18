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
  type: 'WebApplication' | 'FAQPage' | 'Article' | 'Organization' | 'BreadcrumbList';
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
          description: 'AI-powered aquarium, pool, and spa water care assistant',
          url: SITE_URL,
          applicationCategory: 'LifestyleApplication',
          operatingSystem: 'Web, iOS, Android',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free tier available',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '150',
          },
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
