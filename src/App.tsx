import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from "@/contexts";
import { useSessionMonitor } from "@/hooks/useSessionMonitor";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeWrapper } from "@/components/ThemeWrapper";
import { LanguageWrapper } from "@/components/LanguageWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ToastNavigationCleanup } from "@/components/ToastNavigationCleanup";
import { lazy, Suspense, ComponentType } from "react";
import { DashboardSkeleton, FormSkeleton } from "@/components/ui/loading-skeleton";
import { SkipToContent } from "@/components/SkipToContent";
import { FeatureArea } from "@/lib/sentry";

import { logger } from '@/lib/logger';

// Force service worker update check on app load
const checkForServiceWorkerUpdate = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update().catch((error) => {
        logger.debug('Service worker update check failed:', error);
      });
    }).catch((error) => {
      logger.debug('Service worker not ready:', error);
    });
  }
};

// Preload core authenticated pages to avoid first-navigation blank fallbacks on mobile.
const preloadCoreRoutes = (loaders: Array<() => Promise<unknown>>) => {
  if (typeof window === 'undefined') return;

  window.setTimeout(() => {
    loaders.forEach((load) => {
      load().catch((error) => {
        logger.debug('Route preload skipped:', error);
      });
    });
  }, 0);
};

// Lazy loader with retry logic and cache clearing for mobile network issues
const lazyWithRetry = <T extends ComponentType<unknown>>(
  componentImport: () => Promise<{ default: T }>
) =>
  lazy(async () => {
    let pageHasAlreadyBeenForceRefreshed = false;
    try {
      pageHasAlreadyBeenForceRefreshed = JSON.parse(
        sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
      );
    } catch {
      // Corrupted sessionStorage value — treat as not refreshed
    }

    try {
      const component = await componentImport();
      sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Clear JS cache before reload to fix module resolution errors
        if ('caches' in window) {
          try {
            const keys = await caches.keys();
            const jsCache = keys.find(k => k.includes('js-cache'));
            if (jsCache) await caches.delete(jsCache);
          } catch (e) {
            logger.error('Failed to clear cache:', e);
          }
        }
        sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
      }
      throw error;
    }
  });

// Trigger service worker update check
checkForServiceWorkerUpdate();

// Eager load essential pages
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AquariumDetail from "./pages/AquariumDetail"; // Eagerly loaded to prevent iOS PWA module resolution errors

const loadAdmin = () => import("./pages/Admin");
const loadDashboard = () => import("./pages/Dashboard");
const loadWaterTests = () => import("./pages/WaterTests");
const loadTaskCalendar = () => import("./pages/TaskCalendar");
const loadSettings = () => import("./pages/Settings");
const loadPricing = () => import("./pages/Pricing");
const loadAllyChat = () => import("./pages/AllyChat");
const loadWeather = () => import("./pages/Weather");
const loadPrivacyPolicy = () => import("./pages/PrivacyPolicy");
const loadTermsOfService = () => import("./pages/TermsOfService");

// Lazy load authenticated pages with retry logic (code splitting)
const Admin = lazyWithRetry(loadAdmin);
const Dashboard = lazyWithRetry(loadDashboard);
const WaterTests = lazyWithRetry(loadWaterTests);
const TaskCalendar = lazyWithRetry(loadTaskCalendar);
const Settings = lazyWithRetry(loadSettings);
const Pricing = lazyWithRetry(loadPricing);
const AllyChat = lazyWithRetry(loadAllyChat);
const Weather = lazyWithRetry(loadWeather);
const PrivacyPolicy = lazyWithRetry(loadPrivacyPolicy);
const TermsOfService = lazyWithRetry(loadTermsOfService);

// Trigger route preloads for bottom-nav experiences right after app boot.
preloadCoreRoutes([
  loadWaterTests,
  loadTaskCalendar,
  loadWeather,
  loadAllyChat,
  loadSettings,
  loadPricing,
]);

// Configure React Query with optimized caching
import { defaultQueryOptions } from "@/lib/queryConfig";

const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

// Session monitor wrapper component
const SessionWrapper = ({ children }: { children: React.ReactNode }) => {
  useSessionMonitor();
  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary featureArea={FeatureArea.GENERAL}>
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <SessionWrapper>
          <TooltipProvider>
            <ThemeWrapper>
              <LanguageWrapper>
                <Toaster />
                <Sonner />
                <OfflineIndicator />
                <BrowserRouter>
                  <SkipToContent />
                  <ScrollToTop />
                  <ToastNavigationCleanup />
                  <MobileBottomNav />
                  <main id="main-content">
                  <Routes>
                  {/* Redirect root to dashboard or auth */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />

                  {/* Auth routes */}
                  <Route path="/auth" element={<PageErrorBoundary pageName="Authentication" featureArea="auth"><Auth /></PageErrorBoundary>} />
                  <Route path="/auth/reset-password" element={<PageErrorBoundary pageName="Reset Password" featureArea="auth"><ResetPassword /></PageErrorBoundary>} />

                  {/* Protected app routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Dashboard" featureArea="aquarium">
                          <Suspense fallback={<DashboardSkeleton />}>
                            <Dashboard />
                          </Suspense>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/water-tests"
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Water Tests" featureArea="water-tests">
                          <Suspense fallback={<FormSkeleton />}>
                            <WaterTests />
                          </Suspense>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/aquarium/:id"
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Aquarium Details" featureArea="aquarium">
                          <AquariumDetail />
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calendar"
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Calendar" featureArea="maintenance">
                          <Suspense fallback={<DashboardSkeleton />}>
                            <TaskCalendar />
                          </Suspense>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Settings" featureArea="settings">
                          <Suspense fallback={<FormSkeleton />}>
                            <Settings />
                          </Suspense>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pricing"
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Pricing" featureArea="settings">
                          <Suspense fallback={<DashboardSkeleton />}>
                            <Pricing />
                          </Suspense>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ally"
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Ally Chat" featureArea="chat">
                          <Suspense fallback={<DashboardSkeleton />}>
                            <AllyChat />
                          </Suspense>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Ally Chat" featureArea="chat">
                          <Suspense fallback={<DashboardSkeleton />}>
                            <AllyChat />
                          </Suspense>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/weather"
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Weather" featureArea="general">
                          <Suspense fallback={<DashboardSkeleton />}>
                            <Weather />
                          </Suspense>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAnyRole={['admin', 'super_admin']}>
                        <PageErrorBoundary pageName="Admin" featureArea="admin">
                          <Suspense fallback={<DashboardSkeleton />}>
                            <Admin />
                          </Suspense>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    }
                  />

                  {/* Legal pages - accessible without auth */}
                  <Route
                    path="/privacy"
                    element={
                      <PageErrorBoundary pageName="Privacy Policy" featureArea="general">
                        <Suspense fallback={<FormSkeleton />}>
                          <PrivacyPolicy />
                        </Suspense>
                      </PageErrorBoundary>
                    }
                  />
                  <Route
                    path="/terms"
                    element={
                      <PageErrorBoundary pageName="Terms of Service" featureArea="general">
                        <Suspense fallback={<FormSkeleton />}>
                          <TermsOfService />
                        </Suspense>
                      </PageErrorBoundary>
                    }
                  />

                  {/* Catch-all route */}
                  <Route path="*" element={<PageErrorBoundary featureArea="general"><NotFound /></PageErrorBoundary>} />
                  </Routes>
                  </main>
                </BrowserRouter>
              </LanguageWrapper>
            </ThemeWrapper>
          </TooltipProvider>
        </SessionWrapper>
      </AppProviders>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
