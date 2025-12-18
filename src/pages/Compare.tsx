import { SEO, StructuredData } from "@/components/SEO";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AllySupportChat from "@/components/AllySupportChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Minus, Camera, Mic, WifiOff, Smartphone, Trophy, Star, Zap } from "lucide-react";
import { useState } from "react";
import { WaitlistDialog } from "@/components/WaitlistDialog";

const comparisonData = {
  categories: [
    {
      name: "Water Testing",
      features: [
        { name: "Photo test strip analysis", ally: true, traditional: false, poolApps: false },
        { name: "Manual parameter entry", ally: true, traditional: true, poolApps: true },
        { name: "Test history tracking", ally: true, traditional: true, poolApps: true },
        { name: "AI accuracy (98%+)", ally: true, traditional: false, poolApps: false },
        { name: "Multi-brand strip support", ally: true, traditional: false, poolApps: false },
      ],
    },
    {
      name: "AI & Recommendations",
      features: [
        { name: "AI-personalized advice", ally: true, traditional: false, poolApps: false },
        { name: "Proactive trend alerts", ally: true, traditional: false, poolApps: false },
        { name: "Species-specific care", ally: true, traditional: "partial", poolApps: false },
        { name: "Smart dosing calculations", ally: true, traditional: "partial", poolApps: true },
        { name: "Predictive maintenance", ally: true, traditional: false, poolApps: false },
      ],
    },
    {
      name: "User Experience",
      features: [
        { name: "Voice commands", ally: true, traditional: false, poolApps: false },
        { name: "Hands-free mode", ally: true, traditional: false, poolApps: false },
        { name: "Offline support", ally: true, traditional: "partial", poolApps: "partial" },
        { name: "Cross-platform (PWA)", ally: true, traditional: false, poolApps: false },
        { name: "Push notifications", ally: true, traditional: true, poolApps: true },
      ],
    },
    {
      name: "Water Body Support",
      features: [
        { name: "Freshwater aquariums", ally: true, traditional: true, poolApps: false },
        { name: "Saltwater/reef tanks", ally: true, traditional: true, poolApps: false },
        { name: "Swimming pools", ally: true, traditional: false, poolApps: true },
        { name: "Spas & hot tubs", ally: true, traditional: false, poolApps: true },
        { name: "Ponds", ally: true, traditional: "partial", poolApps: false },
      ],
    },
  ],
};

const useCases = [
  {
    title: "Best for Aquarium Beginners",
    description: "New to fishkeeping? Ally's AI guides you through the nitrogen cycle, explains parameters in plain English, and alerts you before problems happen.",
    icon: Star,
    link: "/best-aquarium-app",
    tags: ["Freshwater", "Beginner-Friendly", "AI Guidance"],
  },
  {
    title: "Best for Reef Tank Keepers",
    description: "Track calcium, alkalinity, magnesium, and 20+ parameters. Get coral-specific care recommendations and stability trend analysis.",
    icon: Trophy,
    link: "/best-aquarium-app",
    tags: ["Saltwater", "Reef", "Advanced"],
  },
  {
    title: "Best for Pool Owners",
    description: "Stop guessing with test strips. Snap a photo, get instant readings, and receive exact dosing instructions for your pool size.",
    icon: Zap,
    link: "/best-pool-app",
    tags: ["Pool", "Chlorine", "Saltwater Pool"],
  },
];

function FeatureIcon({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="h-5 w-5 text-green-500" />;
  }
  if (value === false) {
    return <X className="h-5 w-5 text-red-400" />;
  }
  return <Minus className="h-5 w-5 text-yellow-500" />;
}

export default function Compare() {
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <SEO
        title="Compare Ally vs Other Apps - Best Aquarium & Pool App 2025"
        description="See how Ally compares to traditional aquarium apps and pool care apps. AI water testing, voice commands, and cross-platform support set Ally apart."
        path="/compare"
      />
      <StructuredData
        type="WebApplication"
        data={{
          name: "Ally by WA.I.TER",
          alternateName: ["Ally App", "WA.I.TER App", "Ally Aquarium App", "Ally Pool App"],
          applicationCategory: "LifestyleApplication",
          applicationSubCategory: ["Aquarium Management", "Pool Care", "Water Testing", "Pet Care"],
          operatingSystem: "Web, iOS, Android",
          browserRequirements: "Requires a modern web browser with JavaScript enabled",
          softwareVersion: "1.0",
          releaseNotes: "https://allybywaiter.com/blog",
          screenshot: [
            "https://allybywaiter.com/screenshot-wide.png",
            "https://allybywaiter.com/screenshot-narrow.png",
          ],
          featureList: [
            "AI water test photo analysis with 98% accuracy",
            "Voice commands and hands-free mode",
            "Smart maintenance scheduling",
            "Proactive water quality alerts",
            "Livestock and plant tracking with photo galleries",
            "Cross-platform PWA for iOS, Android, and desktop",
            "Offline mode with automatic sync",
            "Weather integration for outdoor water bodies",
          ],
          offers: {
            "@type": "AggregateOffer",
            lowPrice: "0",
            highPrice: "24.99",
            priceCurrency: "USD",
            offerCount: "3",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "150",
            bestRating: "5",
            worstRating: "1",
          },
        }}
      />

      <Navbar />

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">Compare Apps</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Why Choose Ally?
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            See how Ally stacks up against traditional aquarium apps and pool care apps. 
            Our AI-powered approach delivers features that manual-entry apps simply can't match.
          </p>
        </section>

        {/* Key Differentiators */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <Card className="text-center p-6">
            <Camera className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Photo Testing</h3>
            <p className="text-sm text-muted-foreground">Snap & analyze instantly</p>
          </Card>
          <Card className="text-center p-6">
            <Mic className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Voice Control</h3>
            <p className="text-sm text-muted-foreground">Hands-free operation</p>
          </Card>
          <Card className="text-center p-6">
            <Smartphone className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Cross-Platform</h3>
            <p className="text-sm text-muted-foreground">Works everywhere</p>
          </Card>
          <Card className="text-center p-6">
            <WifiOff className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Offline Ready</h3>
            <p className="text-sm text-muted-foreground">No internet required</p>
          </Card>
        </section>

        {/* Comparison Table */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Feature Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold">
                    <div className="flex flex-col items-center">
                      <span className="text-primary">Ally</span>
                      <Badge variant="default" className="mt-1 text-xs">Recommended</Badge>
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-muted-foreground">
                    Traditional Aquarium Apps
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-muted-foreground">
                    Pool Care Apps
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.categories.map((category) => (
                  <>
                    <tr key={category.name} className="bg-muted/50">
                      <td colSpan={4} className="py-3 px-4 font-semibold text-sm uppercase tracking-wide">
                        {category.name}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">{feature.name}</td>
                        <td className="text-center py-3 px-4">
                          <div className="flex justify-center">
                            <FeatureIcon value={feature.ally} />
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex justify-center">
                            <FeatureIcon value={feature.traditional} />
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex justify-center">
                            <FeatureIcon value={feature.poolApps} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Full Support</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-yellow-500" />
              <span>Partial/Limited</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-400" />
              <span>Not Available</span>
            </div>
          </div>
        </section>

        {/* Use Case Cards */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Best For Your Needs</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <Link key={useCase.title} to={useCase.link}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <useCase.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{useCase.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{useCase.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {useCase.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Try Ally?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of aquarists and pool owners who've switched to AI-powered water care. 
            Start with our free tier—no credit card required.
          </p>
          <Button size="lg" onClick={() => setShowWaitlist(true)} className="font-semibold">
            Join the Beta Waitlist
          </Button>
        </section>
      </main>

      <Footer />
      <AllySupportChat />
      <WaitlistDialog open={showWaitlist} onOpenChange={setShowWaitlist} />
    </div>
  );
}
