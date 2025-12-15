/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// Take control immediately
self.skipWaiting();
clientsClaim();

// Clean up old caches
cleanupOutdatedCaches();

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

// JavaScript - NetworkFirst to prevent iOS PWA stale module errors
registerRoute(
  /\.(?:js|mjs)$/i,
  new NetworkFirst({
    cacheName: 'js-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 1 day
      }),
    ],
    networkTimeoutSeconds: 2,
  })
);

// ==================== PUSH NOTIFICATIONS ====================

self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  let data = { title: 'Ally', body: 'You have a new notification' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/favicon.png',
    tag: (data as any).tag || 'ally-notification',
    data: { 
      url: (data as any).url || '/dashboard',
      notificationType: (data as any).notificationType,
      referenceId: (data as any).referenceId
    },
    vibrate: [200, 100, 200],
    requireInteraction: (data as any).requireInteraction || false,
    renotify: (data as any).renotify || false
  };
  
  event.waitUntil(
    self.registration.showNotification((data as any).title || 'Ally', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/dashboard';
  
  // Handle action clicks
  if (event.action) {
    console.log('[SW] Action clicked:', event.action);
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
  console.log('[SW] Notification closed without interaction');
});
