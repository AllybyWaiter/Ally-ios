import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useHeroBackground } from "@/hooks/useHeroBackground";

const Hero = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const navigate = useNavigate();
  const { currentImage, previousImage, isTransitioning } = useHeroBackground();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dynamic Background with Crossfade */}
      <div className="absolute inset-0 z-0">
        {/* Previous image (fading out) */}
        <AnimatePresence>
          {isTransitioning && previousImage && (
            <motion.div
              key={previousImage}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${previousImage})` }}
            />
          )}
        </AnimatePresence>
        
        {/* Current image */}
        <motion.div
          key={currentImage}
          initial={{ opacity: isTransitioning ? 0 : 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${currentImage})` }}
        />
        
        {/* Gradient overlay - balanced for image visibility + text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
        {/* Subtle vignette for focus */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.3)_100%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8 border border-primary/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Closed Beta • Launching Q1 2025</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span className="bg-gradient-water bg-clip-text text-transparent">Crystal Clear Water,</span>
              <br />
              <span className="text-foreground">Effortlessly Maintained</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Meet <span className="font-semibold text-foreground">Ally</span>, your AI-powered water care assistant. 
              Smart, personalized care for aquariums, pools, and spas.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Button variant="hero" size="lg" className="text-lg px-8" onClick={() => setShowWaitlist(true)}>
                Join Beta Waitlist
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="heroOutline" size="lg" className="text-lg px-8" onClick={() => navigate("/how-it-works")}>
                See How It Works
              </Button>
            </motion.div>
          </motion.div>

          {/* Right: App Preview */}
          <motion.div 
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <div className="absolute inset-0 bg-gradient-water blur-3xl opacity-20 rounded-full scale-75" />
            <motion.img 
              alt="Ally AI Water Care Assistant" 
              className="relative w-full max-w-md mx-auto drop-shadow-2xl rounded-2xl"
              src="/images/ally-thinking-promo.png"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            />
          </motion.div>
        </div>

        {/* Stats - Authentic Beta Stats */}
        <motion.div 
          className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto lg:mx-0"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="text-center lg:text-left">
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">500+</div>
            <div className="text-sm text-muted-foreground">Beta Testers</div>
          </div>
          <div className="text-center lg:text-left">
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">98%</div>
            <div className="text-sm text-muted-foreground">Analysis Accuracy</div>
          </div>
          <div className="text-center lg:text-left">
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">24/7</div>
            <div className="text-sm text-muted-foreground">AI Support</div>
          </div>
        </motion.div>
      </div>

      <WaitlistDialog open={showWaitlist} onOpenChange={setShowWaitlist} />
    </section>
  );
};

export default Hero;
