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

const Index = () => {
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
    </div>
  );
};

export default Index;
