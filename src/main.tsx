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
      
      // Listen for cache cleared messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHES_CLEARED') {
          console.log('🔵 SW: Caches cleared confirmation received');
        }
      });
    } catch (e) {
      console.warn('⚠️ SW: Service worker ready check failed:', e);
    }
  }
};

// Cache-busting recovery for module-level errors (iOS PWA cold-start fix)
const handleModuleError = async () => {
  console.warn('🔄 Module error detected, clearing caches and reloading...');
  try {
    // Try to tell the service worker to clear its caches first
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ALL_CACHES' });
      // Wait a bit for the SW to process
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('🧹 Cleared', cacheNames.length, 'caches');
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('🧹 Unregistered', registrations.length, 'service workers');
    }
  } catch (e) {
    console.error('Cache clear failed:', e);
  }
  // Reload with cache-busting parameter
  const url = new URL(window.location.href);
  url.searchParams.set('_cb', Date.now().toString());
  window.location.replace(url.toString());
};

// Proactive iOS PWA startup validation - check for signs of stale cache
const validateStartupIntegrity = () => {
  // Check if we're in a PWA context on iOS
  const isIOSPWA = 
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  
  if (isIOSPWA) {
    console.log('🔵 Running in iOS PWA mode, performing startup validation...');
    
    // Check if there was a recent crash marker
    const crashMarker = sessionStorage.getItem('ally_crash_recovery');
    if (crashMarker) {
      const crashTime = parseInt(crashMarker, 10);
      const timeSinceCrash = Date.now() - crashTime;
      
      // If crashed within last 30 seconds, likely a cache loop - force full clear
      if (timeSinceCrash < 30000) {
        console.warn('🔄 Detected recent crash, forcing full cache clear...');
        sessionStorage.removeItem('ally_crash_recovery');
        handleModuleError();
        return false;
      }
    }
  }
  return true;
};

// Start the app and ensure service worker is fresh
ensureServiceWorkerFresh();

// Set a global error handler for uncaught errors (catches errors before React mounts)
window.addEventListener('error', (event) => {
  const errorMessage = event.message || '';
  const errorString = event.error?.toString() || '';
  
  // Detect React #310 and other iOS PWA stale module errors
  const isRecoverableError = 
    errorMessage.includes('#310') ||
    errorString.includes('#310') ||
    errorMessage.includes('Minified React error #310') ||
    errorMessage.includes('destructured') ||
    errorMessage.includes('Cannot destructure') ||
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('Importing a module script failed') ||
    errorMessage.includes('error loading dynamically imported module');
    
  if (isRecoverableError) {
    console.warn('🔄 Global error handler caught iOS PWA stale cache error');
    sessionStorage.setItem('ally_crash_recovery', Date.now().toString());
    event.preventDefault();
    handleModuleError();
  }
});

// Validate startup integrity before rendering
if (!validateStartupIntegrity()) {
  // validateStartupIntegrity will trigger recovery if needed
  console.log('🔵 Startup validation triggered recovery, waiting...');
} else {
  // Wrap render in try-catch to catch module-level errors before React mounts
  try {
    createRoot(document.getElementById("root")!).render(
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <App />
      </ThemeProvider>
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = error instanceof Error ? error.toString() : String(error);
    
    // Detect iOS PWA stale module errors including React #310
    const isRecoverableError = 
      errorMessage.includes('#310') ||
      errorString.includes('#310') ||
      errorMessage.includes('destructured') ||
      errorMessage.includes('Cannot destructure') ||
      errorMessage.includes('Importing binding') ||
      errorMessage.includes('Cannot resolve module') ||
      errorMessage.includes('Failed to fetch dynamically imported module');
      
    if (isRecoverableError) {
      sessionStorage.setItem('ally_crash_recovery', Date.now().toString());
      handleModuleError();
    } else {
      // Re-throw other errors
      throw error;
    }
  }
}
