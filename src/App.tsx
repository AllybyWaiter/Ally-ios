import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProviders } from "@/contexts";
import { useSessionMonitor } from "@/hooks/useSessionMonitor";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeWrapper } from "@/components/ThemeWrapper";
import { LanguageWrapper } from "@/components/LanguageWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import CookieConsent from "@/components/CookieConsent";
import { MobileBottomNav } from "@/components/MobileBottomNav";
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
import Accessibility from "./pages/Accessibility";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
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
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const Weather = lazyWithRetry(() => import("./pages/Weather"));
const HelpCenter = lazyWithRetry(() => import("./pages/HelpCenter"));
const Compare = lazyWithRetry(() => import("./pages/Compare"));
const BestAquariumApp = lazyWithRetry(() => import("./pages/BestAquariumApp"));
const BestPoolApp = lazyWithRetry(() => import("./pages/BestPoolApp"));
const BestSpaApp = lazyWithRetry(() => import("./pages/BestSpaApp"));
const BestAquaticApp = lazyWithRetry(() => import("./pages/BestAquaticApp"));
const AIWaterTesting = lazyWithRetry(() => import("./pages/AIWaterTesting"));
const Press = lazyWithRetry(() => import("./pages/Press"));
const CookiePolicy = lazyWithRetry(() => import("./pages/CookiePolicy"));
const Testimonials = lazyWithRetry(() => import("./pages/Testimonials"));
const Changelog = lazyWithRetry(() => import("./pages/Changelog"));
const Security = lazyWithRetry(() => import("./pages/Security"));
const BugBounty = lazyWithRetry(() => import("./pages/BugBounty"));
const Integrations = lazyWithRetry(() => import("./pages/Integrations"));
const Status = lazyWithRetry(() => import("./pages/Status"));
const CaseStudies = lazyWithRetry(() => import("./pages/CaseStudies"));
const Careers = lazyWithRetry(() => import("./pages/Careers"));
const Glossary = lazyWithRetry(() => import("./pages/Glossary"));
const Partners = lazyWithRetry(() => import("./pages/Partners"));
const PartnerApply = lazyWithRetry(() => import("./pages/PartnerApply"));
const TrustCenter = lazyWithRetry(() => import("./pages/TrustCenter"));
const Subprocessors = lazyWithRetry(() => import("./pages/Subprocessors"));
const AITransparency = lazyWithRetry(() => import("./pages/AITransparency"));
const DPA = lazyWithRetry(() => import("./pages/DPA"));
const SLA = lazyWithRetry(() => import("./pages/SLA"));
const PrivacyRights = lazyWithRetry(() => import("./pages/PrivacyRights"));
const DataBreachPolicy = lazyWithRetry(() => import("./pages/DataBreachPolicy"));
const CookiePreferences = lazyWithRetry(() => import("./pages/CookiePreferences"));

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
                  <ScrollToTop />
                  <CookieConsent />
                  <MobileBottomNav />
                  <main id="main-content">
                  <Routes>
                  <Route path="/" element={<PageErrorBoundary pageName="Home" featureArea="general"><Index /></PageErrorBoundary>} />
                  <Route path="/about" element={<PageErrorBoundary pageName="About" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><About /></Suspense></PageErrorBoundary>} />
                  <Route path="/features" element={<PageErrorBoundary pageName="Features" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><Features /></Suspense></PageErrorBoundary>} />
                  <Route path="/how-it-works" element={<PageErrorBoundary pageName="How It Works" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><HowItWorksPage /></Suspense></PageErrorBoundary>} />
                  <Route path="/pricing" element={<PageErrorBoundary pageName="Pricing" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><Pricing /></Suspense></PageErrorBoundary>} />
                  <Route path="/faq" element={<PageErrorBoundary pageName="FAQ" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><FAQ /></Suspense></PageErrorBoundary>} />
                  <Route path="/help" element={<PageErrorBoundary pageName="Help Center" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><HelpCenter /></Suspense></PageErrorBoundary>} />
                  <Route path="/compare" element={<PageErrorBoundary pageName="Compare" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><Compare /></Suspense></PageErrorBoundary>} />
                  <Route path="/best-aquarium-app" element={<PageErrorBoundary pageName="Best Aquarium App" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><BestAquariumApp /></Suspense></PageErrorBoundary>} />
                  <Route path="/best-pool-app" element={<PageErrorBoundary pageName="Best Pool App" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><BestPoolApp /></Suspense></PageErrorBoundary>} />
                  <Route path="/best-spa-app" element={<PageErrorBoundary pageName="Best Spa App" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><BestSpaApp /></Suspense></PageErrorBoundary>} />
                  <Route path="/best-aquatic-app" element={<PageErrorBoundary pageName="Best Aquatic App" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><BestAquaticApp /></Suspense></PageErrorBoundary>} />
                  <Route path="/ai-water-testing" element={<PageErrorBoundary pageName="AI Water Testing" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><AIWaterTesting /></Suspense></PageErrorBoundary>} />
                  <Route path="/press" element={<PageErrorBoundary pageName="Press" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><Press /></Suspense></PageErrorBoundary>} />
                  <Route path="/contact" element={<PageErrorBoundary pageName="Contact" featureArea="general"><Suspense fallback={<FormSkeleton />}><Contact /></Suspense></PageErrorBoundary>} />
                  <Route path="/privacy" element={<PageErrorBoundary pageName="Privacy Policy" featureArea="general"><PrivacyPolicy /></PageErrorBoundary>} />
                  <Route path="/terms" element={<PageErrorBoundary pageName="Terms of Service" featureArea="general"><TermsOfService /></PageErrorBoundary>} />
                  <Route path="/accessibility" element={<PageErrorBoundary pageName="Accessibility" featureArea="general"><Accessibility /></PageErrorBoundary>} />
                  <Route path="/cookies" element={<PageErrorBoundary pageName="Cookie Policy" featureArea="general"><Suspense fallback={<FormSkeleton />}><CookiePolicy /></Suspense></PageErrorBoundary>} />
                  <Route path="/testimonials" element={<PageErrorBoundary pageName="Testimonials" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><Testimonials /></Suspense></PageErrorBoundary>} />
                  <Route path="/changelog" element={<PageErrorBoundary pageName="Changelog" featureArea="general"><Suspense fallback={<FormSkeleton />}><Changelog /></Suspense></PageErrorBoundary>} />
                  <Route path="/security" element={<PageErrorBoundary pageName="Security" featureArea="general"><Suspense fallback={<FormSkeleton />}><Security /></Suspense></PageErrorBoundary>} />
                  <Route path="/security/bug-bounty" element={<PageErrorBoundary pageName="Bug Bounty" featureArea="general"><Suspense fallback={<FormSkeleton />}><BugBounty /></Suspense></PageErrorBoundary>} />
                  <Route path="/integrations" element={<PageErrorBoundary pageName="Integrations" featureArea="general"><Suspense fallback={<FormSkeleton />}><Integrations /></Suspense></PageErrorBoundary>} />
                  <Route path="/status" element={<PageErrorBoundary pageName="Status" featureArea="general"><Suspense fallback={<FormSkeleton />}><Status /></Suspense></PageErrorBoundary>} />
                  <Route path="/case-studies" element={<PageErrorBoundary pageName="Case Studies" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><CaseStudies /></Suspense></PageErrorBoundary>} />
                  <Route path="/careers" element={<PageErrorBoundary pageName="Careers" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><Careers /></Suspense></PageErrorBoundary>} />
                  <Route path="/glossary" element={<PageErrorBoundary pageName="Glossary" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><Glossary /></Suspense></PageErrorBoundary>} />
                  <Route path="/partners" element={<PageErrorBoundary pageName="Partners" featureArea="general"><Suspense fallback={<FormSkeleton />}><Partners /></Suspense></PageErrorBoundary>} />
                  <Route path="/partners/apply" element={<PageErrorBoundary pageName="Partner Application" featureArea="general"><Suspense fallback={<FormSkeleton />}><PartnerApply /></Suspense></PageErrorBoundary>} />
                  <Route path="/trust" element={<PageErrorBoundary pageName="Trust Center" featureArea="general"><Suspense fallback={<FormSkeleton />}><TrustCenter /></Suspense></PageErrorBoundary>} />
                  <Route path="/legal/subprocessors" element={<PageErrorBoundary pageName="Subprocessors" featureArea="general"><Suspense fallback={<FormSkeleton />}><Subprocessors /></Suspense></PageErrorBoundary>} />
                  <Route path="/legal/ai-transparency" element={<PageErrorBoundary pageName="AI Transparency" featureArea="general"><Suspense fallback={<FormSkeleton />}><AITransparency /></Suspense></PageErrorBoundary>} />
                  <Route path="/legal/dpa" element={<PageErrorBoundary pageName="DPA" featureArea="general"><Suspense fallback={<FormSkeleton />}><DPA /></Suspense></PageErrorBoundary>} />
                  <Route path="/legal/sla" element={<PageErrorBoundary pageName="SLA" featureArea="general"><Suspense fallback={<FormSkeleton />}><SLA /></Suspense></PageErrorBoundary>} />
                  <Route path="/legal/privacy-rights" element={<PageErrorBoundary pageName="Privacy Rights" featureArea="general"><Suspense fallback={<FormSkeleton />}><PrivacyRights /></Suspense></PageErrorBoundary>} />
                  <Route path="/legal/data-breach-policy" element={<PageErrorBoundary pageName="Data Breach Policy" featureArea="general"><Suspense fallback={<FormSkeleton />}><DataBreachPolicy /></Suspense></PageErrorBoundary>} />
                  <Route path="/legal/cookie-preferences" element={<PageErrorBoundary pageName="Cookie Preferences" featureArea="general"><Suspense fallback={<FormSkeleton />}><CookiePreferences /></Suspense></PageErrorBoundary>} />
                  <Route path="/auth" element={<PageErrorBoundary pageName="Authentication" featureArea="auth"><Auth /></PageErrorBoundary>} />
                  <Route path="/auth/reset-password" element={<PageErrorBoundary pageName="Reset Password" featureArea="auth"><ResetPassword /></PageErrorBoundary>} />
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
