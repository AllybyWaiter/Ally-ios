import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import AppShowcase from "@/components/AppShowcase";
import CTA from "@/components/CTA";
import FAQ from "@/components/FAQ";
import { ContactForm } from "@/components/ContactForm";
import Footer from "@/components/Footer";
import AllySupportChat from "@/components/AllySupportChat";
import InstallPromptBanner from "@/components/InstallPromptBanner";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <AppShowcase />
        <CTA />
        <FAQ />
        <ContactForm />
      </main>
      <Footer />
      <AllySupportChat />
      <InstallPromptBanner />
    </div>
  );
};

export default Index;
