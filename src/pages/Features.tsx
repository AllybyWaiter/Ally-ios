import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { Link } from "react-router-dom";
import {
  Camera,
  Calendar,
  Bell,
  Sparkles,
  Cpu,
  Brain,
  Target,
  Clock,
  Activity,
  Wrench,
  Beaker,
  Fish,
  Box,
  Settings,
  Zap,
  CheckCircle,
} from "lucide-react";

const coreDifferentiators = [
  {
    icon: Camera,
    title: "AI Water Test Interpretation",
    description: "Instantly reads photos or manual values from any test kit with near-lab accuracy. No more guessing — just snap and know.",
  },
  {
    icon: Calendar,
    title: "14-Day Clarity Plans",
    description: "Automatically generates a personalized recovery plan to restore and maintain crystal-clear water, step by step.",
  },
  {
    icon: Bell,
    title: "Smart Scheduling & Equipment Tracking",
    description: "Reminds you when to test, clean, or replace equipment — no guessing, no forgotten maintenance.",
  },
  {
    icon: Sparkles,
    title: "Space-Aware Intelligence",
    description: "Every recommendation adapts to your unique aquatic space — type, size, and livestock all considered.",
  },
  {
    icon: Cpu,
    title: "Future Hardware Integration",
    description: "Designed to sync with Ally's upcoming auto-tester and auto-doser, completing the hands-free water care loop.",
    comingSoon: true,
  },
];

const testingFeatures = [
  {
    icon: Camera,
    title: "Photo Scan or Manual Entry",
    description: "Test your way — snap a photo of test strips or enter values manually.",
  },
  {
    icon: Brain,
    title: "AI Parameter Detection",
    description: "Advanced AI analyzes your results with professional-level precision.",
  },
  {
    icon: Target,
    title: "Accuracy Tracking",
    description: "Monitor test reliability over time with smart accuracy metrics.",
  },
];

const monitoringFeatures = [
  {
    icon: Clock,
    title: "Smart Reminders",
    description: "Never miss a test or maintenance task with intelligent notifications.",
  },
  {
    icon: Activity,
    title: "Space-Specific Thresholds",
    description: "Custom alerts based on your unique water parameters and goals.",
  },
  {
    icon: Wrench,
    title: "Equipment Maintenance Alerts",
    description: "Track filter changes, cleaning schedules, and equipment lifespan.",
  },
];

const insightFeatures = [
  {
    icon: Calendar,
    title: "14-Day Clarity Plans",
    description: "Get a complete recovery roadmap when water quality drops.",
  },
  {
    icon: Beaker,
    title: "Dosing Guidance",
    description: "Precise chemical dosing recommendations to fix issues safely.",
  },
  {
    icon: Fish,
    title: "Livestock-Aware Recommendations",
    description: "Coming soon: Care plans that consider your fish and plants.",
    comingSoon: true,
  },
];

const hardwareFeatures = [
  {
    icon: Box,
    title: "Auto-Tester",
    description: "Automatic water testing on your schedule — hands-free accuracy.",
    comingSoon: true,
  },
  {
    icon: Settings,
    title: "Auto-Doser",
    description: "Precise chemical dosing based on real-time water analysis.",
    comingSoon: true,
  },
];

const trustMetrics = [
  {
    icon: Zap,
    value: "< 10 sec",
    label: "Analysis Speed",
  },
  {
    icon: CheckCircle,
    value: "98%",
    label: "Accuracy Match Rate",
  },
  {
    icon: Target,
    value: "Any Kit",
    label: "Test Kit Compatible",
  },
];

const Features = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Your Water. Perfected.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4">
            App-first intelligence that understands your water like an expert — and scales from home tanks to full pools and commercial systems.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ally combines cutting-edge AI with aquatic science to give you instant, personalized water care guidance.
          </p>
        </div>
      </section>

      {/* Core Differentiators */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Makes Ally Different
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Five core capabilities that transform how you care for your water.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {coreDifferentiators.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="border-2 hover:border-primary transition-all duration-300 hover:shadow-glow bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:scale-105"
                >
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-xl bg-gradient-water flex items-center justify-center mb-6">
                      <Icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-2xl font-bold">{feature.title}</h3>
                      {feature.comingSoon && (
                        <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testing & Analysis */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-gradient-water flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Testing & Analysis
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional-grade water testing made simple and instant.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testingFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="border hover:border-primary transition-all duration-300 hover:shadow-glow bg-card/50 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-water flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Monitoring & Alerts */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-gradient-water flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Monitoring & Alerts
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stay ahead of problems with intelligent monitoring and timely reminders.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {monitoringFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="border hover:border-primary transition-all duration-300 hover:shadow-glow bg-card/50 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-water flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Actionable Insights */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-gradient-water flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Actionable Insights
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Turn data into action with personalized, step-by-step guidance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {insightFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="border hover:border-primary transition-all duration-300 hover:shadow-glow bg-card/50 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-water flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                      {feature.comingSoon && (
                        <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Hardware Integration */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-gradient-water flex items-center justify-center mx-auto mb-4">
              <Cpu className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Hardware Integration
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The future of hands-free water care is coming — designed to work seamlessly with Ally's intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {hardwareFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="border-2 border-dashed border-primary/50 hover:border-primary transition-all duration-300 hover:shadow-glow bg-card/30 backdrop-blur-sm"
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-xl bg-gradient-water flex items-center justify-center mx-auto mb-6">
                      <Icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <Badge variant="secondary" className="mb-4">Coming Soon</Badge>
                    <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground text-lg">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Proof */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Backed by Science, Built for Real People
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            {trustMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <Card key={index} className="border-2 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <Icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <div className="text-4xl font-bold mb-2">{metric.value}</div>
                    <div className="text-muted-foreground">{metric.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center max-w-2xl mx-auto">
            <p className="text-lg text-muted-foreground">
              Built and trained by aquatics experts and AI engineers. Every feature is designed around how real people test, think, and care for their water spaces.
            </p>
          </div>

          {/* Placeholder for future testimonials */}
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground italic">
              Beta testimonials coming soon from aquarium hobbyists and partner stores.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Experience Perfect Water?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of aquarium owners who trust Ally to keep their water crystal clear.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="hero" 
              size="lg"
              onClick={() => setShowWaitlist(true)}
              className="text-lg px-8"
            >
              Join the Waitlist
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              asChild
              className="text-lg px-8"
            >
              <Link to="/pricing">See Pricing</Link>
            </Button>
          </div>

          {/* Optional: Watch Demo button (disabled for now) */}
          <div className="mt-6">
            <Button 
              variant="ghost" 
              size="lg"
              disabled
              className="text-lg px-8 opacity-50"
            >
              Watch Demo (Coming Soon)
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <WaitlistDialog open={showWaitlist} onOpenChange={setShowWaitlist} />
    </div>
  );
};

export default Features;
