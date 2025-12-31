import { useState } from "react";
import { Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AllySupportChat from "@/components/AllySupportChat";
import { SEO, StructuredData, generateBreadcrumbData } from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { useDomainType, getAppUrl } from "@/hooks/useDomainType";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PLAN_DEFINITIONS, getPaidPlans } from "@/lib/planConstants";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const domainType = useDomainType();

  // Build plans from constants
  const plans = getPaidPlans().map(({ tier, definition }) => ({
    name: definition.name,
    monthlyPrice: definition.pricing?.displayMonthly || 0,
    yearlyPrice: definition.pricing?.displayYearly || 0,
    description: definition.description,
    features: definition.marketingFeatures,
    popular: tier === 'plus',
  }));

  const comparisonFeatures = [
    {
      category: "Basics",
      features: [
        { name: "Water bodies (pools, spas, aquariums, ponds)", basic: "1", plus: "3", gold: "10", business: "Unlimited" },
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
        { name: "Ally Chat Memory", basic: false, plus: true, gold: true, business: true },
        { name: "Multi-system management", basic: false, plus: false, gold: true, business: true },
        { name: "AI habit learning", basic: false, plus: false, gold: true, business: true },
        { name: "Connected device integration", basic: false, plus: false, gold: "Coming Soon", business: true },
        { name: "Export water history", basic: false, plus: false, gold: true, business: true },
        { name: "Species-specific guidance", basic: false, plus: false, gold: "Coming Soon", business: "Coming Soon" },
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

  const handleGetStarted = () => {
    if (domainType === 'marketing') {
      window.location.href = getAppUrl('/auth');
    } else {
      navigate('/auth');
    }
  };

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!user) {
      handleGetStarted();
      return;
    }

    setIsLoading(plan.name);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plan_name: plan.name.toLowerCase(),
          billing_interval: isAnnual ? 'year' : 'month',
          success_url: `${window.location.origin}/checkout/success`,
          cancel_url: `${window.location.origin}/pricing?checkout=cancelled`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        // Track checkout initiated
        if (typeof window !== 'undefined') {
          // GA4 begin_checkout event
          if ((window as any).gtag) {
            (window as any).gtag('event', 'begin_checkout', {
              currency: 'USD',
              value: isAnnual ? plan.yearlyPrice : plan.monthlyPrice,
              items: [{ item_name: plan.name, price: isAnnual ? plan.yearlyPrice : plan.monthlyPrice }]
            });
          }
          // Meta Pixel InitiateCheckout event
          if ((window as any).fbq) {
            (window as any).fbq('track', 'InitiateCheckout', {
              currency: 'USD',
              value: isAnnual ? plan.yearlyPrice : plan.monthlyPrice,
              content_name: plan.name
            });
          }
        }
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Unable to start checkout. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

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
      <SEO
        title="Pricing Plans - Ally Water Care Assistant"
        description="Choose the perfect Ally plan for your needs. From free tier to business plans. Start with a 7-day free trial. AI-powered water care for aquariums, pools, and spas."
        path="/pricing"
      />
      <StructuredData
        type="BreadcrumbList"
        data={{ items: generateBreadcrumbData([{ name: 'Home', url: '/' }, { name: 'Pricing', url: '/pricing' }]) }}
      />
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-6 md:py-20 px-4 bg-[linear-gradient(var(--gradient-hero))]">
          <div className="container mx-auto max-w-7xl text-center">
            <Link to="/" className="inline-block text-sm text-muted-foreground hover:text-primary mb-4 md:mb-6 transition-colors">
              ← Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-[linear-gradient(var(--gradient-water))] bg-clip-text text-transparent">
              Choose Your Plan
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 md:mb-8">
              Start your 7-day free trial. Cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-4 md:mb-12">
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
        <section className="py-4 md:py-20 px-4">
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
                        ${(isAnnual ? plan.yearlyPrice : plan.monthlyPrice).toFixed(2)}
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
                      onClick={() => handleSubscribe(plan)}
                      disabled={isLoading === plan.name}
                    >
                      {isLoading === plan.name ? 'Loading...' : user ? 'Subscribe Now' : 'Get Started'}
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
                      <span className="text-sm">Unlimited water bodies</span>
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
                    <Link to="/contact">Contact Sales</Link>
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
      <AllySupportChat />
    </div>
  );
};

export default Pricing;