import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import DemoVideoModal from "@/components/DemoVideoModal";
import AnimatedCounter from "@/components/AnimatedCounter";
import appMockup from "@/assets/app-mockup.png";
import AllySupportChat from "@/components/AllySupportChat";
import { SEO, StructuredData, generateBreadcrumbData } from "@/components/SEO";
import { Camera, Calendar, Bell, Sparkles, Cpu, Brain, Target, Clock, Activity, Wrench, Beaker, Fish, Box, Settings, Zap, CheckCircle, PlayCircle, Star, Mic, Volume2, ImageIcon, TrendingUp, Download, Leaf, AlertTriangle, Repeat } from "lucide-react";
const coreDifferentiators = [{
  icon: Camera,
  title: "AI Water Test Interpretation",
  description: "Instantly reads photos or manual values from any test kit with near lab accuracy. No more guessing, just snap and know."
}, {
  icon: Calendar,
  title: "14-Day Clarity Plans",
  description: "Automatically generates a personalized recovery plan to restore and maintain crystal clear water, step by step."
}, {
  icon: Bell,
  title: "Smart Scheduling & Equipment Tracking",
  description: "Reminds you when to test, clean, or replace equipment. No guessing, no forgotten maintenance."
}, {
  icon: Sparkles,
  title: "Space-Aware Intelligence",
  description: "Every recommendation adapts to your unique aquatic space. Type, size, and livestock all considered."
}, {
  icon: Cpu,
  title: "Future Hardware Integration",
  description: "Designed to sync with Ally's upcoming auto tester and auto doser, completing the hands free water care loop.",
  comingSoon: true
}];
const aiCapabilities = [{
  icon: Brain,
  title: "Ally 1.0 Standard",
  description: "Fast, accurate AI responses to everyday water care questions."
}, {
  icon: Sparkles,
  title: "Ally 1.0 Thinking",
  description: "Advanced reasoning for complex chemistry analysis. Deep thinking for your toughest questions.",
  badge: "Gold+"
}, {
  icon: Mic,
  title: "Voice Input",
  description: "Speak naturally with voice recognition. Perfect for hands-free operation."
}, {
  icon: Volume2,
  title: "Voice Output",
  description: "Natural voice synthesis brings Ally's responses to life with spoken audio."
}, {
  icon: Zap,
  title: "Hands-Free Mode",
  description: "Auto-send and auto-speak for fully voice-driven conversations. Just talk and listen."
}, {
  icon: Target,
  title: "Context-Aware Suggestions",
  description: "Quick actions and follow-up questions based on your conversation and aquarium state."
}];
const photoGalleryFeatures = [{
  icon: Fish,
  title: "Livestock Photo Journals",
  description: "Create visual timelines for each fish, invertebrate, or coral. Track health and growth over time."
}, {
  icon: Leaf,
  title: "Plant Growth Tracking",
  description: "Document your planted tank journey with photos showing growth progression and placement changes."
}, {
  icon: ImageIcon,
  title: "Primary Profile Photos",
  description: "Set a primary photo for each inhabitant that displays on cards for quick visual identification."
}, {
  icon: Camera,
  title: "Caption & Date Tracking",
  description: "Add captions and dates to photos. Build a complete visual history of your aquatic space."
}];
const proactiveAlertFeatures = [{
  icon: TrendingUp,
  title: "Rising & Falling Trends",
  description: "AI detects consecutive increases or decreases in parameters and alerts you before they become problems."
}, {
  icon: AlertTriangle,
  title: "Predictive Recommendations",
  description: "Get specific action steps, timeframes, and which inhabitants might be affected by parameter changes."
}, {
  icon: Activity,
  title: "Instability Detection",
  description: "High variance in readings triggers alerts to help you stabilize your water chemistry."
}, {
  icon: Bell,
  title: "Push Alert Delivery",
  description: "Critical alerts sent directly to your device with customizable vibration patterns and sounds."
}];
const testingFeatures = [{
  icon: Camera,
  title: "Photo Scan or Manual Entry",
  description: "Test your way. Snap a photo of test strips or enter values manually."
}, {
  icon: Brain,
  title: "AI Parameter Detection",
  description: "Advanced AI analyzes your results with professional level precision."
}, {
  icon: Target,
  title: "Accuracy Tracking",
  description: "Monitor test reliability over time with smart accuracy metrics."
}];
const monitoringFeatures = [{
  icon: Clock,
  title: "Smart Reminders",
  description: "Never miss a test or maintenance task with intelligent push notifications."
}, {
  icon: Repeat,
  title: "Recurring Tasks",
  description: "Set tasks to repeat daily, weekly, monthly, or custom intervals. Next occurrence auto-creates on completion."
}, {
  icon: Wrench,
  title: "Equipment Maintenance Alerts",
  description: "Track filter changes, cleaning schedules, and equipment lifespan."
}];
const insightFeatures = [{
  icon: Calendar,
  title: "14-Day Clarity Plans",
  description: "Get a complete recovery roadmap when water quality drops."
}, {
  icon: Beaker,
  title: "Dosing Guidance",
  description: "Precise chemical dosing recommendations to fix issues safely."
}, {
  icon: Fish,
  title: "Livestock Aware Recommendations",
  description: "Coming soon: Care plans that consider your fish and plants.",
  comingSoon: true
}];
const hardwareFeatures = [{
  icon: Box,
  title: "Auto Tester",
  description: "Automatic water testing on your schedule. Hands free accuracy.",
  comingSoon: true
}, {
  icon: Settings,
  title: "Auto Doser",
  description: "Precise chemical dosing based on real time water analysis.",
  comingSoon: true
}];
const pwaFeatures = [{
  icon: Download,
  title: "Install on Any Device",
  description: "Add Ally to your home screen on iOS, Android, or desktop. Works like a native app."
}, {
  icon: Bell,
  title: "Push Notifications",
  description: "Receive task reminders, water alerts, and announcements even when the app isn't open."
}, {
  icon: Zap,
  title: "Offline Access",
  description: "View your aquatic spaces, test history, and tasks even without internet connection."
}];
const trustMetrics = [{
  icon: Zap,
  value: "< 10 sec",
  label: "Analysis Speed"
}, {
  icon: CheckCircle,
  value: "98%",
  label: "Accuracy Match Rate"
}, {
  icon: Target,
  value: "Any Kit",
  label: "Test Kit Compatible"
}];
const Features = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [isDemoVideoOpen, setIsDemoVideoOpen] = useState(false);
  return <div className="min-h-screen">
      <SEO title="Features - AI Water Testing, Voice Commands & Smart Scheduling" description="Discover Ally's AI-powered features: instant photo water test analysis, voice commands, proactive alerts, photo galleries, push notifications, and smart maintenance scheduling for aquariums, pools, and spas." path="/features" />
      <StructuredData type="BreadcrumbList" data={{
      items: generateBreadcrumbData([{
        name: 'Home',
        url: '/'
      }, {
        name: 'Features',
        url: '/features'
      }])
    }} />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            Complete Feature Overview
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            The Complete Ally<br />Experience
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From intelligent water testing to voice powered conversations, discover how Ally makes aquatic care effortless.
          </p>
        </div>
      </section>

      {/* App Mockup Showcase */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" variant="outline">
                Mobile First Design
              </Badge>
              <h2 className="text-4xl font-bold mb-6">
                Your Aquarium Assistant,<br />In Your Pocket
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Instant Test Analysis</h3>
                    <p>Snap a photo of your test strip and get results in seconds</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Voice Commands</h3>
                    <p>Talk to Ally hands-free with voice input and spoken responses</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Push Notifications</h3>
                    <p>Never miss a task or water alert with smart push notifications</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Works Offline</h3>
                    <p>Access your data anytime, even without internet connection</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-water opacity-20 blur-3xl"></div>
              <img alt="Ally mobile app interface" className="relative z-10 w-full max-w-sm mx-auto drop-shadow-2xl" loading="lazy" src="/lovable-uploads/b6f38787-f468-42d9-b19c-c7789ce15020.png" />
            </div>
          </div>
        </div>
      </section>

      {/* AI Capabilities - NEW SECTION */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">
              Powered by Advanced AI
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              AI Capabilities
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Multiple AI models, voice interaction, and intelligent suggestions make Ally your smartest water care companion.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {aiCapabilities.map((feature, index) => {
            const Icon = feature.icon;
            return <Card key={index} className="border hover:border-primary transition-all duration-300 hover:shadow-glow bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-water flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                      {feature.badge && <Badge variant="secondary" className="ml-2 text-xs">{feature.badge}</Badge>}
                    </div>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* Photo Galleries - NEW SECTION */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-gradient-water flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Photo Galleries
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create visual journals for your livestock and plants. Track growth, health, and changes over time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {photoGalleryFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return <Card key={index} className="border hover:border-primary transition-all duration-300 hover:shadow-glow bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-water flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* Proactive Alerts - NEW SECTION */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">
              AI-Powered Prevention
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Proactive Alerts
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI analyzes your water test history to detect concerning trends before they become problems.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {proactiveAlertFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return <Card key={index} className="border hover:border-primary transition-all duration-300 hover:shadow-glow bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-water flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>;
          })}
          </div>
          
          <div className="text-center mt-8">
            <Badge variant="outline" className="text-sm">
              AI-powered alerts available for Plus, Gold, Business & Enterprise tiers
            </Badge>
          </div>
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
            return <Card key={index} className="border-2 hover:border-primary transition-all duration-300 hover:shadow-glow bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:scale-105">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-xl bg-gradient-water flex items-center justify-center mb-6">
                      <Icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-2xl font-bold">{feature.title}</h3>
                      {feature.comingSoon && <Badge variant="secondary" className="ml-2">Coming Soon</Badge>}
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* Testing & Analysis */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">
              Smart Testing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Testing Made Simple
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No more guessing or manual calculations. Just snap, analyze, and act.
            </p>
          </div>

          {/* Before/After Comparison */}
          <div className="mb-16 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-6">
              See The Difference
            </h3>
            <BeforeAfterSlider beforeImage="https://images.unsplash.com/photo-1520990378085-483217737dce?w=800&q=80" afterImage="https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=800&q=80" beforeLabel="Manual Testing" afterLabel="With Ally" />
            <p className="text-center text-muted-foreground mt-4">
              Drag the slider to see how Ally transforms water care from chaos to clarity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testingFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return <Card key={index} className="border hover:border-primary transition-all duration-300 hover:shadow-glow bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-water flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>;
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
              Stay ahead of problems with intelligent monitoring, recurring tasks, and push notifications.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {monitoringFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return <Card key={index} className="border hover:border-primary transition-all duration-300 hover:shadow-glow bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-water flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* PWA Features - NEW SECTION */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">
              Progressive Web App
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Install Anywhere
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ally works on any device with the power of a native app. Install it once, use it everywhere.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pwaFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return <Card key={index} className="border hover:border-primary transition-all duration-300 hover:shadow-glow bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-water flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* Actionable Insights */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-gradient-water flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Actionable Insights
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Turn data into action with personalized, step by step guidance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {insightFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return <Card key={index} className="border hover:border-primary transition-all duration-300 hover:shadow-glow bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-water flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                      {feature.comingSoon && <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>}
                    </div>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* Hardware Integration */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-gradient-water flex items-center justify-center mx-auto mb-4">
              <Cpu className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Hardware Integration
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The future of hands free water care is coming. Designed to work seamlessly with Ally's intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {hardwareFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return <Card key={index} className="border-2 border-dashed border-primary/50 hover:border-primary transition-all duration-300 hover:shadow-glow bg-card/30 backdrop-blur-sm">
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
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* Trust & Proof */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">
              Trusted by Aquarium Enthusiasts
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Results That Speak
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands who've already transformed their aquarium care with Ally.
            </p>
          </div>

          {/* Trust Metrics with Animation */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {trustMetrics.map((metric, index) => {
            const Icon = metric.icon;
            const numericValue = metric.value === "< 10 sec" ? 10 : metric.value === "Any Kit" ? 0 : parseInt(metric.value.replace(/[^0-9]/g, ''));
            const suffix = metric.value === "< 10 sec" ? " sec" : metric.value.includes('%') ? '%' : '';
            const prefix = metric.value === "< 10 sec" ? '< ' : '';
            return <Card key={index} className="bg-card/50 backdrop-blur-sm border-2">
                  <CardContent className="p-6 text-center">
                    <Icon className="w-8 h-8 text-primary mx-auto mb-4" />
                    <div className="text-4xl font-bold mb-2">
                      {numericValue > 0 ? <AnimatedCounter end={numericValue} suffix={suffix} prefix={prefix} /> : metric.value}
                    </div>
                    <p className="text-muted-foreground">{metric.label}</p>
                  </CardContent>
                </Card>;
          })}
          </div>

          {/* Enhanced Testimonials Placeholder */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map(i => <Card key={i} className="bg-card/50 backdrop-blur-sm border-2">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-primary text-primary" />)}
                  </div>
                  <p className="text-muted-foreground italic mb-4">
                    "Beta testimonial coming soon from our amazing users who are testing Ally."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-water"></div>
                    <div>
                      <div className="font-semibold">Beta User</div>
                      <div className="text-sm text-muted-foreground">Aquarium Enthusiast</div>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-2 p-8">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">More Stories Coming Soon</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're working with our beta users to collect real stories of how Ally has transformed their aquarium care.
                Check back soon for detailed case studies and success stories.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <Card className="bg-gradient-water p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Ready to Transform Your Aquarium Care?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Join the waitlist today and be among the first to experience the future of water care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="heroOutline" onClick={() => setShowWaitlist(true)} className="bg-background text-foreground hover:bg-background/90">
                Join the Waitlist
              </Button>
              <Button size="lg" variant="heroOutline" onClick={() => setIsDemoVideoOpen(true)} className="bg-background/10 text-primary-foreground hover:bg-background/20">
                <PlayCircle className="mr-2" />
                Watch Demo
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
      <WaitlistDialog open={showWaitlist} onOpenChange={setShowWaitlist} />
      <DemoVideoModal isOpen={isDemoVideoOpen} onClose={() => setIsDemoVideoOpen(false)} title="Ally Product Demo" />
      <AllySupportChat />
    </div>;
};
export default Features;