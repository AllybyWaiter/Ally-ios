import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import { WaitlistDialog } from "@/components/WaitlistDialog";

const CTA = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-water p-12 md:p-16 text-center">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Ready for Crystal-Clear Water?
            </h2>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-10">
              Join thousands of aquarium owners who've made water care effortless with Ally.
              Get started today with our early access program.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                variant="heroOutline" 
                size="lg" 
                className="text-lg px-8 bg-white text-primary hover:bg-white/90 border-none"
                onClick={() => setShowWaitlist(true)}
              >
                <Mail className="mr-2 w-5 h-5" />
                Join Waitlist
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                className="text-lg px-8 text-primary-foreground hover:bg-white/10"
                onClick={() => scrollToSection("features")}
              >
                Learn More
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <WaitlistDialog open={showWaitlist} onOpenChange={setShowWaitlist} />

            <p className="mt-6 text-sm text-primary-foreground/70">
              No credit card required • Free for early adopters • Launch in 2025
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
