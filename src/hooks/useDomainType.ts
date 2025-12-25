import { useMemo } from 'react';

export type DomainType = 'marketing' | 'app' | 'development';

const MARKETING_DOMAINS = [
  'allybywaiter.com',
  'www.allybywaiter.com',
];

const APP_DOMAINS = [
  'allybywaiterapp.com',
  'www.allybywaiterapp.com',
];

export function useDomainType(): DomainType {
  return useMemo(() => {
    const hostname = window.location.hostname.toLowerCase();
    
    // Check if on marketing domain
    if (MARKETING_DOMAINS.includes(hostname)) {
      return 'marketing';
    }
    
    // Check if on app domain
    if (APP_DOMAINS.includes(hostname)) {
      return 'app';
    }
    
    // Development/preview environments - treat as marketing by default
    // This includes localhost, *.lovable.app, etc.
    return 'development';
  }, []);
}

export function getMarketingUrl(path: string = '/'): string {
  return `https://allybywaiter.com${path}`;
}

export function getAppUrl(path: string = '/'): string {
  return `https://allybywaiterapp.com${path}`;
}

export function isMarketingDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return MARKETING_DOMAINS.includes(hostname);
}

export function isAppDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return APP_DOMAINS.includes(hostname);
}
