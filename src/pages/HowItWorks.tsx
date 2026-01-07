import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  Upload, 
  LineChart, 
  Bell, 
  Droplets, 
  Fish, 
  Clock, 
  ArrowRight,
  Mic,
  Brain,
  AlertTriangle,
  Image,
  Sun,
  Smartphone,
  RefreshCcw,
  Wifi,
  Volume2,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import AllySupportChat from "@/components/AllySupportChat";
import { SEO, StructuredData, generateBreadcrumbData } from "@/components/SEO";

const steps = [
  {
    icon: Camera,
    number: "01",
    title: "Test Your Water",
    description: "Use any standard test kit and snap a photo — or simply speak to Ally. Works with aquariums, pools, and spas.",
    details: [
      "Compatible with all major test kit brands",
      "AI-powered photo analysis reads results instantly",
      "Voice input for hands-free logging",
      "Manual entry always available"
    ]
  },
  {
    icon: Brain,
    number: "02",
    title: "AI Does the Work",
    description: "Ally analyzes your water chemistry in seconds. For complex questions, Thinking mode provides deeper reasoning.",
    details: [
      "Instant parameter detection with high accuracy",
      "Proactive trend alerts warn you before problems",
      "Personalized recommendations for your setup",
      "Advanced reasoning for challenging chemistry (Gold+)"
    ]
  },
  {
    icon: CheckCircle2,
    number: "03",
    title: "Follow the Plan",
    description: "Get clear, actionable steps with voice responses and push notifications. Truly hands-free water care.",
    details: [
      "Step-by-step guidance you can listen to",
      "Push notifications for tasks and alerts",
      "Recurring task scheduling",
      "Weather-aware maintenance suggestions"
    ]
  }
];

const aiFeatures = [
  {
    icon: Mic,
    title: "Voice Commands",
    description: "Talk to Ally hands-free with voice input and spoken responses"
  },
  {
    icon: Brain,
    title: "Thinking Mode",
    description: "Advanced reasoning for complex water chemistry problems"
  },
  {
    icon: AlertTriangle,
    title: "Proactive Alerts",
    description: "AI detects concerning trends before they become problems"
  },
  {
    icon: Zap,
    title: "Conversational Updates",
    description: "Update your data just by chatting with Ally"
  }
];

const features = [
  {
    icon: Camera,
    title: "Photo & Voice Input",
    description: "Snap a photo or speak your results — your choice"
  },
  {
    icon: LineChart,
    title: "Smart Analytics",
    description: "Track trends over time with visual charts and insights"
  },
  {
    icon: Bell,
    title: "Push Notifications",
    description: "Task reminders and water alerts sent to your device"
  },
  {
    icon: Droplets,
    title: "Parameter Tracking",
    description: "Monitor pH, chlorine, ammonia, and custom parameters"
  },
  {
    icon: Fish,
    title: "Multi-Space Support",
    description: "Manage aquariums, pools, and spas from one dashboard"
  },
  {
    icon: Image,
    title: "Photo Galleries",
    description: "Track livestock and plant health with visual journals"
  },
  {
    icon: Sun,
    title: "Weather-Aware",
    description: "Maintenance suggestions based on real-time weather"
  },
  {
    icon: Volume2,
    title: "Hands-Free Mode",
    description: "Voice input and spoken responses for effortless care"
  },
  {
    icon: AlertTriangle,
    title: "Proactive Alerts",
    description: "AI predicts issues before they become problems"
  },
  {
    icon: RefreshCcw,
    title: "Recurring Tasks",
    description: "Automated scheduling for regular maintenance"
  },
  {
    icon: Wifi,
    title: "Works Offline",
    description: "Access your data anytime, even without internet"
  },
  {
    icon: Smartphone,
    title: "Install Anywhere",
    description: "Add to home screen on iOS, Android, or desktop"
  }
];

const HowItWorksPage = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <SEO
        title="How Ally Works - AI Water Care in 3 Simple Steps"
        description="Discover how Ally makes aquarium, pool, and spa maintenance effortless. Test your water, let AI analyze it, and follow personalized care plans. Voice-enabled, works offline, with push notifications."
        path="/how-it-works"
      />
      <StructuredData
        type="BreadcrumbList"
        data={{ items: generateBreadcrumbData([{ name: 'Home', url: '/' }, { name: 'How It Works', url: '/how-it-works' }]) }}
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Voice-Enabled • Works Offline • Push Notifications
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-water bg-clip-text text-transparent">
              How Ally Works
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover how AI-powered water management makes aquarium, pool, and spa maintenance 
              simple and hands-free — from beginners to experts.
            </p>
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
              return (
                <Card key={step.number} className="relative overflow-hidden">
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
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className={index % 2 === 1 ? "md:order-1" : ""}>
                        <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-32 h-32 text-primary/30" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Advanced AI
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              AI That Understands You
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              More than just analysis — Ally learns your setup and communicates the way you prefer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-glow bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-water flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
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
              Comprehensive features designed to make water care effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border hover:border-primary/50 transition-colors">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-water">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary-foreground">
            Ready to Transform Your Water Care?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Join thousands of water body owners who trust Ally for perfect water quality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8" 
              onClick={() => setShowWaitlist(true)}
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/features">Explore Features</Link>
            </Button>
          </div>
        </div>
      </section>

      <WaitlistDialog open={showWaitlist} onOpenChange={setShowWaitlist} />
      <Footer />
      <AllySupportChat />
    </div>
  );
};

export default HowItWorksPage;
