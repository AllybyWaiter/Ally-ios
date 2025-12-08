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

// Start the app and ensure service worker is fresh
ensureServiceWorkerFresh();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <App />
  </ThemeProvider>
);
