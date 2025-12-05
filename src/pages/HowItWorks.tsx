import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Camera, Sparkles, CheckCircle2, Upload, LineChart, Bell, Droplets, Fish, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import AllySupportChat from "@/components/AllySupportChat";
const steps = [{
  icon: Camera,
  number: "01",
  title: "Test Your Water",
  description: "Use any standard test kit and snap a photo of your results. Ally supports all major test kit brands.",
  details: ["Compatible with API, Tetra, Seachem test kits", "Automatic result reading", "Manual entry option available"]
}, {
  icon: Sparkles,
  number: "02",
  title: "AI Does the Work",
  description: "Ally analyzes your water chemistry in seconds using advanced AI technology.",
  details: ["Instant parameter detection", "Cross-reference with ideal ranges", "Historical trend analysis"]
}, {
  icon: CheckCircle2,
  number: "03",
  title: "Follow the Plan",
  description: "Get clear, actionable steps to achieve and maintain perfect water quality.",
  details: ["Personalized recommendations", "Step-by-step instructions", "Track progress over time"]
}];
const features = [{
  icon: Upload,
  title: "Easy Upload",
  description: "Simply take a photo of your test results or enter values manually"
}, {
  icon: LineChart,
  title: "Smart Analytics",
  description: "Track trends over time and get insights about your water quality"
}, {
  icon: Bell,
  title: "Maintenance Reminders",
  description: "Never miss a water change or equipment maintenance task"
}, {
  icon: Droplets,
  title: "Parameter Tracking",
  description: "Monitor pH, ammonia, nitrite, nitrate, and custom parameters"
}, {
  icon: Fish,
  title: "Multi-Tank Support",
  description: "Manage multiple aquariums from a single dashboard"
}, {
  icon: Clock,
  title: "24/7 Access",
  description: "Check your aquarium health anytime, anywhere from any device"
}];
const HowItWorksPage = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);
  return <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-water bg-clip-text text-transparent">
              How Ally Works
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Discover how AI powered water testing makes aquarium maintenance simple, accurate, and effortless for everyone from beginners to experts.</p>
          </div>
        </div>
      </section>

      {/* Main Steps Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Three Simple Steps to Perfect Water
            </h2>
            <p className="text-lg text-muted-foreground">
              No chemistry degree required. Just smart, automated care.
            </p>
          </div>

          <div className="space-y-12">
            {steps.map((step, index) => {
            const Icon = step.icon;
            return <Card key={index} className="relative overflow-hidden">
                  <CardContent className="p-8 md:p-12">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className={index % 2 === 1 ? "md:order-2" : ""}>
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-20 h-20 rounded-full bg-gradient-water flex items-center justify-center">
                            <Icon className="w-10 h-10 text-primary-foreground" />
                          </div>
                          <div className="text-7xl font-bold text-muted/10">
                            {step.number}
                          </div>
                        </div>
                        <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                        <p className="text-lg text-muted-foreground mb-6">
                          {step.description}
                        </p>
                        <ul className="space-y-3">
                          {step.details.map((detail, i) => <li key={i} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{detail}</span>
                            </li>)}
                        </ul>
                      </div>
                      <div className={index % 2 === 1 ? "md:order-1" : ""}>
                        <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-32 h-32 text-primary/30" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground">
              Comprehensive features designed to make aquarium care effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
            const Icon = feature.icon;
            return <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-water">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary-foreground">
            Ready to Transform Your Aquarium Care?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Join thousands of aquarium enthusiasts who trust Ally for perfect water quality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => setShowWaitlist(true)}>
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link to="/features">Explore Features</Link>
            </Button>
          </div>
        </div>
      </section>

      <WaitlistDialog open={showWaitlist} onOpenChange={setShowWaitlist} />
      <Footer />
      <AllySupportChat />
    </div>;
};
export default HowItWorksPage;