// Push notification service worker
// Handles incoming push events and notification clicks

self.addEventListener('push', (event) => {
  console.log('[SW Push] Push event received');
  
  let data = { title: 'Ally', body: 'You have a new notification' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('[SW Push] Error parsing push data:', e);
  }
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/favicon.png',
    tag: data.tag || 'ally-notification',
    data: { 
      url: data.url || '/dashboard',
      notificationType: data.notificationType,
      referenceId: data.referenceId
    },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    renotify: data.renotify || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Ally', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW Push] Notification clicked');
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/dashboard';
  
  // Handle action clicks
  if (event.action) {
    console.log('[SW Push] Action clicked:', event.action);
    // Could handle specific actions here (e.g., 'dismiss', 'snooze')
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle notification close (for analytics if needed)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW Push] Notification closed without interaction');
});
