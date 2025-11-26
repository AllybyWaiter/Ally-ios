import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-aquarium.jpg";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { useNavigate } from "react-router-dom";
const Hero = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const navigate = useNavigate();
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-cover bg-center z-0" style={{
      backgroundImage: `url(${heroImage})`
    }}>
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background/95" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6 border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Closed Beta • Limited Spots Available</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-water bg-clip-text text-transparent leading-tight">
          Crystal-Clear Water,<br />Effortlessly Maintained
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">Meet Ally by WA.I.TER  your AI powered water care assistant.
No expertise needed. Just smart, personalized care for your aquarium.<span className="font-semibold text-foreground">Ally by WA.I.TER</span> — your AI-powered water care assistant. 
          No expertise needed. Just smart, personalized care for your aquarium.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="hero" size="lg" className="text-lg px-8" onClick={() => setShowWaitlist(true)}>
            Join Beta Waitlist
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button variant="heroOutline" size="lg" className="text-lg px-8" onClick={() => navigate("/how-it-works")}>
            See How It Works
          </Button>
        </div>

        <WaitlistDialog open={showWaitlist} onOpenChange={setShowWaitlist} />

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">98%</div>
            <div className="text-sm text-muted-foreground">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">10k+</div>
            <div className="text-sm text-muted-foreground">Happy Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">AI Support</div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;