import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDomainType, getAppUrl } from "@/hooks/useDomainType";

const CTA = () => {
  const navigate = useNavigate();
  const domainType = useDomainType();

  const handleGetStarted = () => {
    if (domainType === 'marketing') {
      window.location.href = getAppUrl('/auth');
    } else {
      navigate('/auth');
    }
  };
  
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div 
          className="relative overflow-hidden rounded-3xl bg-gradient-water p-12 md:p-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary-foreground/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-foreground/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 tracking-tight">
              Ready to Transform Your Water Care?
            </h2>
            <p className="text-lg text-primary-foreground/90 max-w-xl mx-auto mb-8">
              Join thousands of users who trust Ally for AI-powered water care for their aquariums, pools, and spas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                variant="secondary" 
                size="lg" 
                className="text-lg px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90" 
                onClick={handleGetStarted}
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Get Started Free
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                className="text-lg px-8 text-primary-foreground hover:bg-primary-foreground/10" 
                onClick={() => navigate("/how-it-works")}
              >
                Learn More
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <p className="mt-8 text-sm text-primary-foreground/70">
              Free tier available • No credit card required
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;