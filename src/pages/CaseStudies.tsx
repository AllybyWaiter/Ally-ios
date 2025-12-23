import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Fish, Waves, TrendingUp, Clock, Award, Star, Users, Heart, CheckCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface CaseStudy {
  id: string;
  title: string;
  customer: string;
  category: string;
  waterType: "aquarium" | "pool";
  setup: string;
  challenge: string;
  howAllyHelped: string;
  featuresUsed: string[];
  results: { metric: string; value: string }[];
  quote: string;
  featured: boolean;
}

const CaseStudies = () => {
  const caseStudies: CaseStudy[] = [
    {
      id: "martinez-family-pool",
      title: "From Weekend Guesswork to Set It and Trust It Water in 30 Days",
      customer: "The Martinez Family",
      category: "Home Pool Owner",
      waterType: "pool",
      setup: "18,000 gallon outdoor chlorine pool (high sun exposure; heavy summer use)",
      challenge: "The pool was stuck in a reactive loop: water looked fine until it didn't. Testing was inconsistent, small imbalances got missed, and weekends turned into troubleshooting sessions with extra store trips, extra chemical spend, and wasted time.",
      howAllyHelped: "Ally shifted their maintenance from reactive fixes to proactive control. They established a consistent routine, caught drift early, and followed clear, step by step recommendations to correct issues before they became visible problems.",
      featuresUsed: [
        "Guided water checks (routine cadence + reminders)",
        "Alerts when readings drift",
        "Recommendations for corrective actions",
        "History + trends to prevent repeat issues"
      ],
      results: [
        { metric: "Time Saved", value: "4 hrs/week" },
        { metric: "In Range Days", value: "55% → 88%" },
        { metric: "Chemical Spend", value: "↓25%" },
      ],
      quote: "Before Ally, we were always behind—testing late and fixing problems after they showed up. Now it feels like the pool takes care of itself. We spend weekends using the pool, not fighting it.",
      featured: true,
    },
    {
      id: "bluewave-pool-care",
      title: "A Pool Service Company Reduced Rechecks and Scaled Without Adding Headcount",
      customer: "BlueWave Pool Care",
      category: "Pool Service Company",
      waterType: "pool",
      setup: "70 to 120 active accounts (seasonal range)",
      challenge: "Growth was being dragged down by rechecks and 'something's off' calls. Even when chemistry was right on service day, heat, weather, and customer usage caused drift between visits—costing time, labor, and customer confidence.",
      howAllyHelped: "Ally created an always on layer between visits. The team used monitoring, alerts, and standardized action steps to reduce follow ups, keep cleaner records, and maintain consistency across technicians.",
      featuresUsed: [
        "Multi-account monitoring (service workflow)",
        "Alerts + recommended actions",
        "Logbook + service notes (continuity across techs)",
        "Repeatable checklists (standardized routine)"
      ],
      results: [
        { metric: "Team Time Saved", value: "6 hrs/week" },
        { metric: "Recheck Visits", value: "↓18%" },
        { metric: "Capacity Gained", value: "+10 accounts" },
      ],
      quote: "Ally tightened up our whole operation. Less second guessing, fewer emergency stops, and better consistency across techs. It's like having a smart supervisor watching every pool between visits.",
      featured: false,
    },
    {
      id: "reef-enthusiast",
      title: "A Reef Tank Owner Stabilized Parameters and Stopped the Constant Tweaking Cycle",
      customer: "Marine Reef Enthusiast (40G Mixed Reef)",
      category: "Home Aquarium Hobbyist (Reef)",
      waterType: "aquarium",
      setup: "40 gallon mixed reef with sensitive coral + fish",
      challenge: "Despite frequent testing, the tank chemistry kept swinging. Small routine changes (feeding, evaporation, maintenance) compounded into instability, leading to constant tweaking and uncertainty about whether adjustments were helping or making things worse.",
      howAllyHelped: "Ally replaced reactive adjustments with consistent tracking and trend based decisions. The customer focused on the highest impact actions first, reduced overcorrection, and stabilized parameters over time.",
      featuresUsed: [
        "Guided testing cadence (consistency over guesswork)",
        "Trend tracking across key parameters",
        "Alerts + recommendations (priority order for fixes)",
        "Maintenance reminders (stability through routine)"
      ],
      results: [
        { metric: "Time Saved", value: "2.5 hrs/week" },
        { metric: "In Range Readings", value: "52% → 83%" },
        { metric: "Livestock Losses", value: "2 → 0" },
      ],
      quote: "I didn't need more testing—I needed better decisions. Ally helped me spot trends early and stop overcorrecting. My tank's more stable, and I'm not stressed every time I run a test.",
      featured: false,
    },
  ];

  const aggregateStats = [
    { icon: Clock, value: "4.2 hrs/week", label: "Average Time Saved" },
    { icon: TrendingUp, value: "+32%", label: "Water Stability Improvement" },
    { icon: Users, value: "18%", label: "Fewer Recheck Visits" },
    { icon: Heart, value: "2 → 0", label: "Livestock Losses (90 days)" },
    { icon: Star, value: "4.8/5", label: "Customer Satisfaction" },
  ];

  const getWaterTypeIcon = (type: CaseStudy["waterType"]) => {
    switch (type) {
      case "aquarium":
        return <Fish className="h-5 w-5" />;
      case "pool":
        return <Waves className="h-5 w-5" />;
    }
  };

  const getWaterTypeLabel = (type: CaseStudy["waterType"]) => {
    switch (type) {
      case "aquarium":
        return "Aquarium";
      case "pool":
        return "Pool";
    }
  };

  const featuredStudy = caseStudies.find((cs) => cs.featured);
  const otherStudies = caseStudies.filter((cs) => !cs.featured);

  return (
    <div className="min-h-screen">
      <SEO 
        title="Case Studies | Real Customer Success Stories"
        description="Discover how pool owners, service companies, and aquarium hobbyists use Ally to save time, improve water stability, and reduce costs. Real success stories with measurable results."
        path="/case-studies"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge className="mb-4">Success Stories</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Real Results from Real Customers
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how pool owners, service companies, and aquarium hobbyists are achieving better water quality, saving time, and reducing costs with Ally.
          </p>
        </motion.div>

        {/* Aggregate Stats */}
        <motion.section 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {aggregateStats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Featured Case Study */}
        {featuredStudy && (
          <motion.section 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Featured Story</h2>
            </div>
            <Card className="overflow-hidden">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 lg:p-12">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge variant="outline" className="gap-1">
                      {getWaterTypeIcon(featuredStudy.waterType)}
                      {getWaterTypeLabel(featuredStudy.waterType)}
                    </Badge>
                    <Badge variant="secondary">{featuredStudy.category}</Badge>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2 text-foreground">{featuredStudy.title}</h3>
                  <p className="text-lg text-muted-foreground mb-2">{featuredStudy.customer}</p>
                  <p className="text-sm text-muted-foreground mb-6">{featuredStudy.setup}</p>
                  
                  <div className="space-y-6 mb-8">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">The Challenge</h4>
                      <p className="text-muted-foreground">{featuredStudy.challenge}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">How Ally Helped</h4>
                      <p className="text-muted-foreground">{featuredStudy.howAllyHelped}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Features Used</h4>
                      <div className="flex flex-wrap gap-2">
                        {featuredStudy.featuresUsed.map((feature, index) => (
                          <Badge key={index} variant="outline" className="gap-1 text-xs">
                            <CheckCircle className="h-3 w-3" />
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {featuredStudy.results.map((result, index) => (
                      <div key={index} className="text-center p-4 bg-primary/5 rounded-lg">
                        <div className="text-xl font-bold text-primary">{result.value}</div>
                        <div className="text-xs text-muted-foreground">{result.metric}</div>
                      </div>
                    ))}
                  </div>

                  <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                    "{featuredStudy.quote}"
                    <footer className="mt-2 text-sm font-medium text-foreground not-italic">
                      — {featuredStudy.customer}
                    </footer>
                  </blockquote>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center min-h-[400px] p-8">
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <Waves className="h-16 w-16 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Clean wide pool shot (daytime)</p>
                    <p className="text-xs text-muted-foreground mt-1">Image placeholder</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.section>
        )}

        {/* Other Case Studies */}
        <motion.section 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-6 text-foreground">More Success Stories</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {otherStudies.map((study) => (
              <Card key={study.id} className="flex flex-col overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                      {getWaterTypeIcon(study.waterType)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {study.waterType === "pool" ? "Technician servicing pool" : "High quality reef tank photo"}
                    </p>
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline" className="gap-1">
                      {getWaterTypeIcon(study.waterType)}
                      {getWaterTypeLabel(study.waterType)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">{study.category}</Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight">{study.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{study.customer}</p>
                  <p className="text-xs text-muted-foreground">{study.setup}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-0">
                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-1">The Challenge</h4>
                      <p className="text-sm text-muted-foreground">{study.challenge}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-1">How Ally Helped</h4>
                      <p className="text-sm text-muted-foreground">{study.howAllyHelped}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-2">Features Used</h4>
                      <div className="flex flex-wrap gap-1">
                        {study.featuresUsed.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {feature.split('(')[0].trim()}
                          </Badge>
                        ))}
                        {study.featuresUsed.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{study.featuresUsed.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {study.results.map((result, index) => (
                      <div key={index} className="text-center p-3 bg-primary/5 rounded-lg">
                        <div className="text-lg font-bold text-primary">{result.value}</div>
                        <div className="text-xs text-muted-foreground">{result.metric}</div>
                      </div>
                    ))}
                  </div>

                  <blockquote className="border-l-4 border-primary pl-3 italic text-sm text-muted-foreground mt-auto">
                    "{study.quote}"
                    <footer className="mt-2 text-xs font-medium text-foreground not-italic">
                      — {study.customer}
                    </footer>
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section 
          className="text-center p-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold mb-4 text-foreground">Ready for water that stays right?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Reduce guesswork, catch problems early, and reclaim your time with Ally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="hero">
              <Link to="/pricing">
                Get Ally
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">
                Talk to an Expert
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/download">
                Download the App
              </Link>
            </Button>
          </div>
        </motion.section>
      </main>
      <Footer />
    </div>
  );
};

export default CaseStudies;
