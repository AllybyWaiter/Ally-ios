/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// Production-safe logging for service worker context
// Service workers can't import from app modules, so we use a simple inline check
const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const swLog = {
  log: (...args: unknown[]) => { if (isDev) console.log(...args); },
  debug: (...args: unknown[]) => { if (isDev) console.debug(...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
  error: (...args: unknown[]) => console.error(...args), // Always log errors
};

// Cache version - increment to force cache invalidation on iOS PWA
const CACHE_VERSION = 'v2';

// Take control immediately
self.skipWaiting();
clientsClaim();

// Clean up old caches aggressively
cleanupOutdatedCaches();

// ==================== iOS PWA CACHE RECOVERY ====================

// Listen for messages from the main thread to clear caches
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    swLog.log('[SW] Received CLEAR_ALL_CACHES message');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            swLog.log('[SW] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        swLog.log('[SW] All caches cleared');
        // Notify all clients that caches are cleared
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHES_CLEARED' });
          });
        });
      })
    );
  }
});

// On activation, clear all old caches to prevent iOS PWA stale module issues
self.addEventListener('activate', (event) => {
  swLog.log('[SW] Activating new service worker version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Clear any cache that doesn't match our current version prefix
          if (!cacheName.includes(CACHE_VERSION)) {
            swLog.log('[SW] Deleting outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
});

// Precache static assets (VitePWA injects the manifest here)
precacheAndRoute(self.__WB_MANIFEST);

// ==================== RUNTIME CACHING ====================

// Google Fonts stylesheets
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Google Fonts files
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Images
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// JavaScript - NetworkFirst with very short cache to prevent iOS PWA stale module errors
registerRoute(
  /\.(?:js|mjs)$/i,
  new NetworkFirst({
    cacheName: `js-cache-${CACHE_VERSION}`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 4, // 4 hours (reduced from 1 day)
      }),
    ],
    networkTimeoutSeconds: 3,
  })
);

// HTML pages - Always fetch fresh to ensure latest code references
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: `pages-cache-${CACHE_VERSION}`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 25,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
    networkTimeoutSeconds: 3,
  })
);

// ==================== PUSH NOTIFICATIONS ====================

// Vibration patterns per notification type (in milliseconds)
const vibrationPatterns: Record<string, number[]> = {
  task_reminder: [100, 50, 100],              // Short gentle double pulse
  water_alert: [300, 100, 300, 100, 300],     // Urgent triple pulse
  weather_alert: [500, 200, 500, 200, 500],   // Very urgent extended pulse for severe weather
  health_alert: [400, 100, 400, 100, 400],    // Distinct pattern for health score alerts
  announcement: [200, 100, 200],               // Standard double pulse
  default: [200, 100, 200],
};

self.addEventListener('push', (event) => {
  swLog.log('[SW] Push event received');
  
  let data: Record<string, unknown> = { title: 'Ally', body: 'You have a new notification' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    swLog.error('[SW] Error parsing push data:', e);
  }
  
  const notificationType = (data.notificationType as string) || 'default';
  const vibrationPattern = vibrationPatterns[notificationType] || vibrationPatterns.default;
  const isSilent = data.silent === true;
  
  const options = {
    body: (data.body as string) || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/favicon.png',
    tag: (data.tag as string) || 'ally-notification',
    data: { 
      url: (data.url as string) || '/dashboard',
      notificationType,
      referenceId: data.referenceId
    },
    silent: isSilent,
    vibrate: isSilent ? undefined : vibrationPattern,
    requireInteraction: (data.requireInteraction as boolean) || false,
    renotify: (data.renotify as boolean) || false
  };
  
  event.waitUntil(
    self.registration.showNotification((data.title as string) || 'Ally', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  swLog.log('[SW] Notification clicked');
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/dashboard';
  
  // Handle action clicks
  if (event.action) {
    swLog.log('[SW] Action clicked:', event.action);
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            (client as WindowClient).navigate(url);
            return;
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Handle notification close (for analytics if needed)
self.addEventListener('notificationclose', (event) => {
  swLog.log('[SW] Notification closed without interaction');
});
