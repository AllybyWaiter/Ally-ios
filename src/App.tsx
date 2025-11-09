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
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import WaterTests from "./pages/WaterTests";
import AquariumDetail from "./pages/AquariumDetail";
import TaskCalendar from "./pages/TaskCalendar";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Features from "./pages/Features";
import Settings from "./pages/Settings";
import HowItWorksPage from "./pages/HowItWorks";
import AllyChat from "./pages/AllyChat";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ThemeWrapper>
            <LanguageWrapper>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<PageErrorBoundary pageName="Home"><Index /></PageErrorBoundary>} />
                  <Route path="/about" element={<PageErrorBoundary pageName="About"><About /></PageErrorBoundary>} />
                  <Route path="/features" element={<PageErrorBoundary pageName="Features"><Features /></PageErrorBoundary>} />
                  <Route path="/how-it-works" element={<PageErrorBoundary pageName="How It Works"><HowItWorksPage /></PageErrorBoundary>} />
                  <Route path="/pricing" element={<PageErrorBoundary pageName="Pricing"><Pricing /></PageErrorBoundary>} />
                  <Route path="/privacy" element={<PageErrorBoundary pageName="Privacy Policy"><PrivacyPolicy /></PageErrorBoundary>} />
                  <Route path="/terms" element={<PageErrorBoundary pageName="Terms of Service"><TermsOfService /></PageErrorBoundary>} />
                  <Route path="/auth" element={<PageErrorBoundary pageName="Authentication"><Auth /></PageErrorBoundary>} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Dashboard">
                          <Dashboard />
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/water-tests" 
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Water Tests">
                          <WaterTests />
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/aquarium/:id" 
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Aquarium Details">
                          <AquariumDetail />
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/calendar" 
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Calendar">
                          <TaskCalendar />
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Settings">
                          <Settings />
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/chat" 
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Chat">
                          <AllyChat />
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <PageErrorBoundary pageName="Admin">
                          <Admin />
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<PageErrorBoundary><NotFound /></PageErrorBoundary>} />
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
