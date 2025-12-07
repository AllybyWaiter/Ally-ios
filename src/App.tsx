import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useSessionMonitor } from "@/hooks/useSessionMonitor";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeWrapper } from "@/components/ThemeWrapper";
import { LanguageWrapper } from "@/components/LanguageWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import CookieConsent from "@/components/CookieConsent";
import { lazy, Suspense, ComponentType, useEffect } from "react";
import { DashboardSkeleton, FormSkeleton } from "@/components/ui/loading-skeleton";
import { FeatureArea } from "@/lib/sentry";

// Force service worker update check on app load
const checkForServiceWorkerUpdate = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update().catch(() => {});
    }).catch(() => {});
  }
};

// Lazy loader with retry logic and cache clearing for mobile network issues
const lazyWithRetry = <T extends ComponentType<unknown>>(
  componentImport: () => Promise<{ default: T }>
) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

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
            console.error('Failed to clear cache:', e);
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

// Eager load public pages (better UX for first visit)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Auth from "./pages/Auth";
import AquariumDetail from "./pages/AquariumDetail"; // Eagerly loaded to prevent iOS PWA module resolution errors

// Lazy load authenticated pages with retry logic (code splitting)
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const WaterTests = lazyWithRetry(() => import("./pages/WaterTests"));
const TaskCalendar = lazyWithRetry(() => import("./pages/TaskCalendar"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));
const AllyChat = lazyWithRetry(() => import("./pages/AllyChat"));
const BlogEditor = lazyWithRetry(() => import("./components/admin/BlogEditor"));

// Lazy load other public pages with retry logic
const Pricing = lazyWithRetry(() => import("./pages/Pricing"));
const About = lazyWithRetry(() => import("./pages/About"));
const Features = lazyWithRetry(() => import("./pages/Features"));
const HowItWorksPage = lazyWithRetry(() => import("./pages/HowItWorks"));
const Blog = lazyWithRetry(() => import("./pages/Blog"));
const BlogPost = lazyWithRetry(() => import("./pages/BlogPost"));
const FAQ = lazyWithRetry(() => import("./pages/FAQ"));

// Configure React Query with optimized caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes (formerly cacheTime)
      retry: 1, // Retry failed queries once
      refetchOnWindowFocus: false, // Don't refetch on window focus to reduce API calls
      refetchOnReconnect: true, // Refetch when coming back online
    },
  },
});

// Session monitor wrapper component
const SessionWrapper = ({ children }: { children: React.ReactNode }) => {
  useSessionMonitor();
  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary featureArea={FeatureArea.GENERAL}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionWrapper>
          <TooltipProvider>
            <ThemeWrapper>
              <LanguageWrapper>
                <Toaster />
                <Sonner />
                <OfflineIndicator />
                <CookieConsent />
                <BrowserRouter>
                  <ScrollToTop />
                  <Routes>
                  <Route path="/" element={<PageErrorBoundary pageName="Home" featureArea="general"><Index /></PageErrorBoundary>} />
                  <Route path="/about" element={<PageErrorBoundary pageName="About" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><About /></Suspense></PageErrorBoundary>} />
                  <Route path="/features" element={<PageErrorBoundary pageName="Features" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><Features /></Suspense></PageErrorBoundary>} />
                  <Route path="/how-it-works" element={<PageErrorBoundary pageName="How It Works" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><HowItWorksPage /></Suspense></PageErrorBoundary>} />
                  <Route path="/pricing" element={<PageErrorBoundary pageName="Pricing" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><Pricing /></Suspense></PageErrorBoundary>} />
                  <Route path="/faq" element={<PageErrorBoundary pageName="FAQ" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><FAQ /></Suspense></PageErrorBoundary>} />
                  <Route path="/privacy" element={<PageErrorBoundary pageName="Privacy Policy" featureArea="general"><PrivacyPolicy /></PageErrorBoundary>} />
                  <Route path="/terms" element={<PageErrorBoundary pageName="Terms of Service" featureArea="general"><TermsOfService /></PageErrorBoundary>} />
                  <Route path="/auth" element={<PageErrorBoundary pageName="Authentication" featureArea="auth"><Auth /></PageErrorBoundary>} />
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
                    path="/chat" 
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Chat" featureArea="chat">
                          <Suspense fallback={<DashboardSkeleton />}>
                            <AllyChat />
                          </Suspense>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <PageErrorBoundary pageName="Admin" featureArea="admin">
                          <Suspense fallback={<DashboardSkeleton />}>
                            <Admin />
                          </Suspense>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/blog/new"
                    element={
                      <ProtectedRoute requireAdmin>
                        <PageErrorBoundary pageName="Blog Editor" featureArea="admin">
                          <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
                            <Suspense fallback={<FormSkeleton />}>
                              <BlogEditor />
                            </Suspense>
                          </div>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/blog/edit/:id"
                    element={
                      <ProtectedRoute requireAdmin>
                        <PageErrorBoundary pageName="Blog Editor" featureArea="admin">
                          <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
                            <Suspense fallback={<FormSkeleton />}>
                              <BlogEditor />
                            </Suspense>
                          </div>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/blog" element={<PageErrorBoundary pageName="Blog" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><Blog /></Suspense></PageErrorBoundary>} />
                  <Route path="/blog/:slug" element={<PageErrorBoundary pageName="Blog Post" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><BlogPost /></Suspense></PageErrorBoundary>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<PageErrorBoundary featureArea="general"><NotFound /></PageErrorBoundary>} />
                  </Routes>
                </BrowserRouter>
              </LanguageWrapper>
            </ThemeWrapper>
          </TooltipProvider>
        </SessionWrapper>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
