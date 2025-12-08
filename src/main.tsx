import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import { initSentry } from "./lib/sentry";

// Initialize Sentry before rendering the app
initSentry();

// Hide splash screen once React is ready
const hideSplash = (window as unknown as { hideSplash?: () => void }).hideSplash;
if (hideSplash) {
  hideSplash();
}

// Force service worker update on app start to prevent stale cache issues on iOS PWA
const ensureServiceWorkerFresh = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // Force update check
      await registration.update();
      console.log('🔵 SW: Service worker update checked');
    } catch (e) {
      console.warn('⚠️ SW: Service worker ready check failed:', e);
    }
  }
};

// Cache-busting recovery for module-level errors (iOS PWA cold-start fix)
const handleModuleError = async () => {
  console.warn('🔄 Module error detected, clearing caches and reloading...');
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }
  } catch (e) {
    console.error('Cache clear failed:', e);
  }
  // Reload with cache-busting parameter
  window.location.href = window.location.pathname + '?_cb=' + Date.now();
};

// Start the app and ensure service worker is fresh
ensureServiceWorkerFresh();

// Wrap render in try-catch to catch module-level errors before React mounts
try {
  createRoot(document.getElementById("root")!).render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <App />
    </ThemeProvider>
  );
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  // Detect iOS PWA stale module errors
  if (errorMessage.includes('destructured') || 
      errorMessage.includes('Importing binding') ||
      errorMessage.includes('Cannot resolve module')) {
    handleModuleError();
  } else {
    // Re-throw other errors
    throw error;
  }
}
