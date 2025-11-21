import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeWrapper } from "@/components/ThemeWrapper";
import { LanguageWrapper } from "@/components/LanguageWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { lazy, Suspense } from "react";
import { DashboardSkeleton, FormSkeleton } from "@/components/ui/loading-skeleton";

// Eager load public pages (better UX for first visit)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Auth from "./pages/Auth";

// Lazy load authenticated pages (code splitting)
const Admin = lazy(() => import("./pages/Admin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const WaterTests = lazy(() => import("./pages/WaterTests"));
const AquariumDetail = lazy(() => import("./pages/AquariumDetail"));
const TaskCalendar = lazy(() => import("./pages/TaskCalendar"));
const Settings = lazy(() => import("./pages/Settings"));
const AllyChat = lazy(() => import("./pages/AllyChat"));
const BlogEditor = lazy(() => import("./components/admin/BlogEditor"));

// Lazy load other public pages
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Features = lazy(() => import("./pages/Features"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorks"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));

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

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ThemeWrapper>
            <LanguageWrapper>
              <Toaster />
              <Sonner />
              <OfflineIndicator />
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<PageErrorBoundary pageName="Home" featureArea="general"><Index /></PageErrorBoundary>} />
                  <Route path="/about" element={<PageErrorBoundary pageName="About" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><About /></Suspense></PageErrorBoundary>} />
                  <Route path="/features" element={<PageErrorBoundary pageName="Features" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><Features /></Suspense></PageErrorBoundary>} />
                  <Route path="/how-it-works" element={<PageErrorBoundary pageName="How It Works" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><HowItWorksPage /></Suspense></PageErrorBoundary>} />
                  <Route path="/pricing" element={<PageErrorBoundary pageName="Pricing" featureArea="general"><Suspense fallback={<DashboardSkeleton />}><Pricing /></Suspense></PageErrorBoundary>} />
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
                          <Suspense fallback={<DashboardSkeleton />}>
                            <AquariumDetail />
                          </Suspense>
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
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
