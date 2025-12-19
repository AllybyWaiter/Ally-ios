// Environment validation MUST run first, before any imports that use env vars
import { validateEnv, logEnvWarnings } from "./lib/envValidation";
import { EnvErrorScreen } from "./components/EnvErrorScreen";
import { createRoot } from "react-dom/client";

// Validate environment variables immediately
const envValidation = validateEnv();

if (!envValidation.isValid) {
  // Render error screen and stop - don't initialize anything else
  createRoot(document.getElementById("root")!).render(
    <EnvErrorScreen
      missingRequired={envValidation.missingRequired}
      missingRecommended={envValidation.missingRecommended}
    />
  );
} else {
  // Log warnings for missing recommended vars
  logEnvWarnings(envValidation);

  // Now safe to import modules that depend on env vars
  Promise.all([
    import("next-themes"),
    import("./App.tsx"),
    import("./index.css"),
    import("./i18n/config"),
    import("./lib/sentry"),
  ]).then(([{ ThemeProvider }, { default: App }, , , { initSentry }]) => {
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
          await registration.update();
          console.log('🔵 SW: Service worker update checked');
          
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
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ALL_CACHES' });
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
      const url = new URL(window.location.href);
      url.searchParams.set('_cb', Date.now().toString());
      window.location.replace(url.toString());
    };

    // Proactive iOS PWA startup validation
    const validateStartupIntegrity = () => {
      const isIOSPWA = 
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;
      
      if (isIOSPWA) {
        console.log('🔵 Running in iOS PWA mode, performing startup validation...');
        
        const crashMarker = sessionStorage.getItem('ally_crash_recovery');
        if (crashMarker) {
          const crashTime = parseInt(crashMarker, 10);
          const timeSinceCrash = Date.now() - crashTime;
          
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

    ensureServiceWorkerFresh();

    // Global error handler for uncaught errors
    window.addEventListener('error', (event) => {
      const errorMessage = event.message || '';
      const errorString = event.error?.toString() || '';
      
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

    if (!validateStartupIntegrity()) {
      console.log('🔵 Startup validation triggered recovery, waiting...');
    } else {
      try {
        createRoot(document.getElementById("root")!).render(
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <App />
          </ThemeProvider>
        );
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorString = error instanceof Error ? error.toString() : String(error);
        
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
          throw error;
        }
      }
    }
  });
}
