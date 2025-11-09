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
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogEditor from "./components/admin/BlogEditor";

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
                  <Route path="/" element={<PageErrorBoundary pageName="Home" featureArea="general"><Index /></PageErrorBoundary>} />
                  <Route path="/about" element={<PageErrorBoundary pageName="About" featureArea="general"><About /></PageErrorBoundary>} />
                  <Route path="/features" element={<PageErrorBoundary pageName="Features" featureArea="general"><Features /></PageErrorBoundary>} />
                  <Route path="/how-it-works" element={<PageErrorBoundary pageName="How It Works" featureArea="general"><HowItWorksPage /></PageErrorBoundary>} />
                  <Route path="/pricing" element={<PageErrorBoundary pageName="Pricing" featureArea="general"><Pricing /></PageErrorBoundary>} />
                  <Route path="/privacy" element={<PageErrorBoundary pageName="Privacy Policy" featureArea="general"><PrivacyPolicy /></PageErrorBoundary>} />
                  <Route path="/terms" element={<PageErrorBoundary pageName="Terms of Service" featureArea="general"><TermsOfService /></PageErrorBoundary>} />
                  <Route path="/auth" element={<PageErrorBoundary pageName="Authentication" featureArea="auth"><Auth /></PageErrorBoundary>} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Dashboard" featureArea="aquarium">
                          <Dashboard />
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/water-tests" 
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Water Tests" featureArea="water-tests">
                          <WaterTests />
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
                          <TaskCalendar />
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Settings" featureArea="settings">
                          <Settings />
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/chat" 
                    element={
                      <ProtectedRoute>
                        <PageErrorBoundary pageName="Chat" featureArea="chat">
                          <AllyChat />
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <PageErrorBoundary pageName="Admin" featureArea="admin">
                          <Admin />
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
                            <BlogEditor />
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
                            <BlogEditor />
                          </div>
                        </PageErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/blog" element={<PageErrorBoundary pageName="Blog" featureArea="general"><Blog /></PageErrorBoundary>} />
                  <Route path="/blog/:slug" element={<PageErrorBoundary pageName="Blog Post" featureArea="general"><BlogPost /></PageErrorBoundary>} />
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
