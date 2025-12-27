import { Link, useNavigate } from 'react-router-dom';
import { Fish, Waves, Thermometer, Trees, Camera, Mic, Bell, Smartphone, Star, CheckCircle2, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SEO, StructuredData, generateFAQStructuredData } from '@/components/SEO';
import AllySupportChat from '@/components/AllySupportChat';
import { useDomainType, getAppUrl } from '@/hooks/useDomainType';

const waterBodyCards = [
  {
    icon: Fish,
    title: 'Aquariums',
    description: 'Freshwater, saltwater, and reef tanks. Track pH, ammonia, nitrite, nitrate, and more.',
    link: '/best-aquarium-app',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    borderColor: 'border-blue-500/20',
    iconColor: 'text-blue-500',
  },
  {
    icon: Waves,
    title: 'Pools',
    description: 'Chlorine and saltwater pools. Monitor chlorine, pH, alkalinity, and stabilizer.',
    link: '/best-pool-app',
    gradient: 'from-cyan-500/10 to-teal-500/10',
    borderColor: 'border-cyan-500/20',
    iconColor: 'text-cyan-500',
  },
  {
    icon: Thermometer,
    title: 'Spas & Hot Tubs',
    description: 'Bromine and chlorine spas. Track sanitizer, pH, temperature, and drain schedules.',
    link: '/best-spa-app',
    gradient: 'from-orange-500/10 to-red-500/10',
    borderColor: 'border-orange-500/20',
    iconColor: 'text-orange-500',
  },
  {
    icon: Trees,
    title: 'Ponds',
    description: 'Koi ponds, garden ponds, and water features. Weather-aware outdoor monitoring.',
    link: '/features',
    gradient: 'from-green-500/10 to-emerald-500/10',
    borderColor: 'border-green-500/20',
    iconColor: 'text-green-500',
  },
];

const universalFeatures = [
  {
    icon: Camera,
    title: 'AI Photo Analysis',
    description: 'Snap a photo of any test strip. Get instant, accurate readings with 98% accuracy across all water body types.',
  },
  {
    icon: Mic,
    title: 'Voice Commands',
    description: 'Hands-free operation for wet environments. Ask questions and log tests using natural speech.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'AI detects concerning trends before they become problems. Get proactive notifications.',
  },
  {
    icon: Smartphone,
    title: 'Works Everywhere',
    description: 'PWA app works on iPhone, Android, tablets, and desktop. Your data syncs across all devices.',
  },
];

const comparisonTable = [
  { feature: 'Water Test Entry', ally: 'Photo + Voice + Manual', others: 'Manual only' },
  { feature: 'Recommendations', ally: 'AI-personalized', others: 'Generic charts' },
  { feature: 'Voice Control', ally: 'Full support', others: 'None' },
  { feature: 'Multi-platform', ally: 'All devices (PWA)', others: 'Platform-specific' },
  { feature: 'Offline Mode', ally: 'Yes, with sync', others: 'Limited or none' },
  { feature: 'All Water Bodies', ally: 'One app for all', others: 'Separate apps' },
];

const faqs = [
  {
    question: 'What is the best water testing app?',
    answer: 'Ally by WA.I.TER is the best water testing app because it uses AI to analyze photos of your test strips with 98% accuracy. It supports aquariums, pools, spas, and ponds - all in one app. Unlike other apps that require manual entry, Ally makes testing effortless.',
  },
  {
    question: 'Can one app manage all my water bodies?',
    answer: 'Yes! Ally is designed to manage multiple water bodies of different types from a single app. Whether you have an aquarium at home, a pool in the backyard, and a hot tub on the deck, Ally handles them all with type-specific parameters and recommendations.',
  },
  {
    question: 'How is Ally different from other aquarium or pool apps?',
    answer: 'Ally stands out with AI-powered photo analysis, voice commands for hands-free operation, and proactive alerts that catch problems before they happen. It\'s also a cross-platform PWA that works on any device, unlike platform-specific competitors.',
  },
  {
    question: 'Is Ally free to use?',
    answer: 'Yes! Ally offers a free tier that includes one water body with manual test entry and basic maintenance reminders. Upgrade to Pro for unlimited water bodies, AI photo analysis, voice commands, and advanced features.',
  },
];

export default function BestAquaticApp() {
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
    <div className="min-h-screen bg-background">
      <SEO
        title="Best Water Care App 2025 - AI Testing for Aquariums, Pools & Spas | Ally"
        description="Ally is the #1 water care app for aquariums, pools, spas, and ponds. AI photo analysis, voice commands, and smart alerts. One app for all your water bodies."
        path="/best-aquatic-app"
      />
      <StructuredData type="SoftwareApplication" />
      <StructuredData
        type="FAQPage"
        data={{ questions: generateFAQStructuredData(faqs) }}
      />

      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">Best Water Care App</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                One App for{' '}
                <span className="text-primary">All Your Water</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Whether you have an aquarium, pool, spa, or pond, Ally's AI makes water testing 
                effortless with photo analysis, voice commands, and smart alerts.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button 
                  size="lg" 
                  className="text-lg px-8"
                  onClick={handleGetStarted}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8"
                  asChild
                >
                  <Link to="/features">
                    See All Features
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto">
                <div>
                  <div className="text-2xl md:text-4xl font-bold text-primary">98%</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl md:text-4xl font-bold text-primary">4</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Water Types</div>
                </div>
                <div>
                  <div className="text-2xl md:text-4xl font-bold text-primary">50+</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Test Kits</div>
                </div>
                <div>
                  <div className="text-2xl md:text-4xl font-bold text-primary">Free</div>
                  <div className="text-xs md:text-sm text-muted-foreground">To Start</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Water Body Types */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Choose Your Water Body
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Ally knows the unique requirements for every type of water body.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {waterBodyCards.map((card) => (
                <Link key={card.title} to={card.link} className="block group">
                  <Card className={`bg-gradient-to-br ${card.gradient} ${card.borderColor} h-full transition-transform group-hover:scale-105`}>
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg bg-background/50 flex items-center justify-center mb-4`}>
                        <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{card.description}</p>
                      <div className="flex items-center text-primary text-sm font-medium">
                        Learn more
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Universal Features */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Powerful Features for Every Water Body
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                These AI-powered features work across all water types.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {universalFeatures.map((feature) => (
                <Card key={feature.title} className="bg-card/50 backdrop-blur border-border/50">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Ally Beats the Alternatives
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                See how Ally compares to traditional water care apps.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 font-semibold">Feature</th>
                          <th className="text-left p-4 font-semibold text-primary">Ally</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Others</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonTable.map((row, index) => (
                          <tr key={row.feature} className={index < comparisonTable.length - 1 ? 'border-b border-border' : ''}>
                            <td className="p-4 font-medium">{row.feature}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                {row.ally}
                              </span>
                            </td>
                            <td className="p-4 text-muted-foreground">{row.others}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center mt-8">
                <Button variant="outline" asChild>
                  <Link to="/compare">
                    <Zap className="w-4 h-4 mr-2" />
                    See Detailed Comparison
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              {faqs.map((faq) => (
                <Card key={faq.question}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section className="py-12 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-muted-foreground">Explore by Water Type</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" asChild>
                <Link to="/best-aquarium-app">Aquariums</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/best-pool-app">Pools</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/best-spa-app">Spas & Hot Tubs</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/ai-water-testing">AI Technology</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Simplify Water Care?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of water care enthusiasts who trust Ally to keep their water bodies healthy.
              </p>
              <Button 
                size="lg" 
                className="text-lg px-8"
                onClick={handleGetStarted}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <AllySupportChat />
    </div>
  );
}
