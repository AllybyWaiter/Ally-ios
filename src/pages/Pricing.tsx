import { useState } from "react";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AllySupportChat from "@/components/AllySupportChat";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  const plans = [
    {
      name: "Basic",
      monthlyPrice: 9.99,
      yearlyPrice: 95.90,
      description: "Perfect for single aquarium owners",
      features: [
        "1 aquatic space",
        "10 test logs per month",
        "AI recommendations",
        "Basic smart scheduling",
      ],
      popular: false,
    },
    {
      name: "Plus",
      monthlyPrice: 14.99,
      yearlyPrice: 143.90,
      description: "Most popular choice for hobbyists",
      features: [
        "3 aquatic spaces",
        "Unlimited test logs",
        "AI recommendations",
        "Smart scheduling",
        "Equipment tracking",
        "Custom notifications",
      ],
      popular: true,
    },
    {
      name: "Gold",
      monthlyPrice: 19.99,
      yearlyPrice: 191.90,
      description: "For serious aquarists",
      features: [
        "10 aquatic spaces",
        "Unlimited test logs",
        "AI recommendations",
        "Smart scheduling",
        "Equipment tracking",
        "Multi-tank management",
        "AI habit learning",
        "Connected device integration",
        "Export water history (PDF/CSV)",
      ],
      popular: false,
    },
  ];

  const comparisonFeatures = [
    {
      category: "Basics",
      features: [
        { name: "Aquatic spaces allowed", basic: "1", plus: "3", gold: "10", business: "Unlimited" },
        { name: "Test logs per month", basic: "10", plus: "Unlimited", gold: "Unlimited", business: "Unlimited" },
        { name: "AI recommendations", basic: true, plus: true, gold: true, business: true },
      ],
    },
    {
      category: "Scheduling & Tracking",
      features: [
        { name: "Smart scheduling", basic: "Basic", plus: true, gold: true, business: true },
        { name: "Equipment tracking", basic: false, plus: true, gold: true, business: true },
        { name: "Custom notifications", basic: false, plus: true, gold: true, business: true },
      ],
    },
    {
      category: "Advanced Features",
      features: [
        { name: "Multi-tank management", basic: false, plus: false, gold: true, business: true },
        { name: "AI habit learning", basic: false, plus: false, gold: true, business: true },
        { name: "Connected device integration", basic: false, plus: false, gold: "Coming Soon", business: true },
        { name: "Export water history", basic: false, plus: false, gold: true, business: true },
        { name: "Livestock-specific guidance", basic: false, plus: false, gold: "Coming Soon", business: "Coming Soon" },
      ],
    },
    {
      category: "Business Features",
      features: [
        { name: "Team dashboards", basic: false, plus: false, gold: false, business: true },
        { name: "Multi-location support", basic: false, plus: false, gold: false, business: true },
        { name: "API integrations", basic: false, plus: false, gold: false, business: true },
        { name: "Dedicated Ally rep", basic: false, plus: false, gold: false, business: true },
        { name: "Priority AI support", basic: false, plus: false, gold: false, business: true },
      ],
    },
  ];

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-5 w-5 text-primary mx-auto" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-[linear-gradient(var(--gradient-hero))]">
          <div className="container mx-auto max-w-7xl text-center">
            <Link to="/" className="inline-block text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
              ← Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-[linear-gradient(var(--gradient-water))] bg-clip-text text-transparent">
              Choose Your Plan
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Start your 7-day free trial. Cancel anytime. Launch early 2025.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
              <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Annual
              </span>
              {isAnnual && (
                <Badge className="bg-primary text-primary-foreground">Save 20%</Badge>
              )}
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative rounded-3xl ${
                    plan.popular
                      ? 'border-primary shadow-lg scale-105 lg:scale-110'
                      : 'border-border'
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        ${isAnnual ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">
                        /{isAnnual ? 'year' : 'month'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">
                            {feature}
                            {feature.includes("Connected device") && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Coming Soon
                              </Badge>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={plan.popular ? "hero" : "heroOutline"}
                      className="w-full"
                      onClick={() => setShowWaitlist(true)}
                    >
                      Join Waitlist
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {/* Business Plan Card */}
              <Card className="relative rounded-3xl border-border">
                <CardHeader>
                  <CardTitle className="text-2xl">Business</CardTitle>
                  <CardDescription>For teams and enterprises</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Custom</span>
                    <span className="text-muted-foreground">/pricing</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Unlimited aquatic spaces</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Everything in Gold, plus:</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Team dashboards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Multi-location support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">API integrations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Dedicated Ally rep</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Priority AI support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full" asChild>
                    <a href="#contact">Contact Sales</a>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Feature Comparison Matrix */}
        <section className="py-20 px-4 bg-muted/50">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Detailed Feature Comparison
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card rounded-xl overflow-hidden shadow-lg">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Basic</th>
                    <th className="text-center p-4 font-semibold">Plus</th>
                    <th className="text-center p-4 font-semibold">Gold</th>
                    <th className="text-center p-4 font-semibold">Business</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((section, sectionIndex) => (
                    <>
                      <tr key={`category-${sectionIndex}`} className="bg-muted/30">
                        <td colSpan={5} className="p-3 font-semibold text-sm uppercase tracking-wide">
                          {section.category}
                        </td>
                      </tr>
                      {section.features.map((feature, featureIndex) => (
                        <tr
                          key={`feature-${sectionIndex}-${featureIndex}`}
                          className="border-t border-border hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-4 text-sm">
                            {feature.name}
                            {feature.name.includes("Coming Soon") && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Coming Soon
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {renderFeatureValue(feature.basic)}
                          </td>
                          <td className="p-4 text-center">
                            {renderFeatureValue(feature.plus)}
                          </td>
                          <td className="p-4 text-center">
                            {renderFeatureValue(feature.gold)}
                          </td>
                          <td className="p-4 text-center">
                            {renderFeatureValue(feature.business)}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Link Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
            <p className="text-muted-foreground mb-8">
              Check out our frequently asked questions or contact our team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" asChild>
                <Link to="/faq">View FAQs</Link>
              </Button>
              <Button variant="heroOutline" asChild>
                <a href="#contact">Contact Us</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WaitlistDialog open={showWaitlist} onOpenChange={setShowWaitlist} />
      <AllySupportChat />
    </div>
  );
};

export default Pricing;
