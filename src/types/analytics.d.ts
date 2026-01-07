/**
 * Global type declarations for analytics tracking
 */

interface GtagEventParams {
  transaction_id?: string;
  currency?: string;
  value?: number;
  items?: Array<{ item_name: string; price?: number }>;
  method?: string;
  content_name?: string;
  [key: string]: unknown;
}

interface Gtag {
  (command: 'event', eventName: string, eventParams?: GtagEventParams): void;
  (command: 'config', targetId: string, config?: Record<string, unknown>): void;
  (command: 'set', params: Record<string, unknown>): void;
}

interface FbqEventParams {
  currency?: string;
  value?: number;
  content_name?: string;
  [key: string]: unknown;
}

interface Fbq {
  (command: 'track', eventName: string, params?: FbqEventParams): void;
  (command: 'init', pixelId: string): void;
}

declare global {
  interface Window {
    gtag?: Gtag;
    fbq?: Fbq;
  }
}

export {};
