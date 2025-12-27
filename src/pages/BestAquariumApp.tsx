import { Link, useNavigate } from 'react-router-dom';
import { Camera, Mic, Bell, Fish, Droplet, Smartphone, Star, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SEO, StructuredData, generateFAQStructuredData } from '@/components/SEO';
import AllySupportChat from '@/components/AllySupportChat';
import { useDomainType, getAppUrl } from '@/hooks/useDomainType';

const features = [
  {
    icon: Camera,
    title: 'AI Photo Water Testing',
    description: 'Snap a photo of any test strip and get instant, accurate readings with 98% accuracy. Supports API, Tetra, Seachem, and more.',
  },
  {
    icon: Mic,
    title: 'Voice Commands',
    description: 'Ask questions and log tests with your voice. Hands free mode perfect for when your hands are wet.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'AI detects rising ammonia, falling pH, and other concerning trends before they become problems.',
  },
  {
    icon: Fish,
    title: 'Livestock Tracking',
    description: 'Track all your fish, corals, and invertebrates with photo galleries and health monitoring.',
  },
  {
    icon: Droplet,
    title: 'All Tank Types',
    description: 'Freshwater, saltwater, reef tanks, planted tanks. Ally knows the ideal parameters for each.',
  },
  {
    icon: Smartphone,
    title: 'Works Everywhere',
    description: 'PWA app works on iPhone, Android, tablets, and desktop. Install once, use anywhere.',
  },
];

const faqs = [
  {
    question: 'What is the best aquarium app for beginners?',
    answer: 'Ally by WA.I.TER is the best aquarium app for beginners because it uses AI to analyze water test photos and provides plain language explanations and recommendations. You don\'t need to understand complex water chemistry. Ally tells you exactly what to do.',
  },
  {
    question: 'Is there an app that can read aquarium test strips?',
    answer: 'Yes! Ally uses AI to read aquarium test strips from popular brands like API, Tetra, Seachem, and more. Just take a photo and get instant, accurate readings with 98% accuracy.',
  },
  {
    question: 'What\'s the best app for tracking aquarium water parameters?',
    answer: 'Ally is the best app for tracking aquarium water parameters because it combines photo analysis, manual entry, and voice commands. It tracks your history, detects trends, and alerts you to problems before they harm your fish.',
  },
  {
    question: 'Is there a free aquarium app?',
    answer: 'Yes, Ally offers a free tier that includes one aquarium with manual water test entry and basic maintenance reminders. Upgrade to Pro for unlimited aquariums and AI photo analysis.',
  },
];

export default function BestAquariumApp() {
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
        title="Best Aquarium App 2025 - AI Water Testing & Fish Tank Tracker"
        description="Ally is the #1 aquarium app for water testing, fish tracking, and tank maintenance. AI-powered photo analysis, voice commands, and smart alerts. Free to try."
        path="/best-aquarium-app"
      />
      <StructuredData type="SoftwareApplication" />
      <StructuredData
        type="FAQPage"
        data={{ questions: generateFAQStructuredData(faqs) }}
      />

      <Navbar />

      <main className="pt-20">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 pt-4">
          <nav className="text-sm text-muted-foreground">
            <Link to="/best-aquatic-app" className="hover:text-primary transition-colors">
              ← All Water Bodies
            </Link>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">#1 Rated Aquarium App</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                The Best Aquarium App for{' '}
                <span className="text-primary">Water Testing</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Ally is an AI powered aquarium app that reads water test strips from photos, 
                tracks your fish and corals, and alerts you to problems before they happen.
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
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Test Accuracy</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Test Kits Supported</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-primary">Free</div>
                  <div className="text-sm text-muted-foreground">To Get Started</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Ally is the Best */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Ally is the Best Aquarium App
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Unlike other aquarium apps that require manual data entry, 
                Ally uses AI to make water testing effortless.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature) => (
                <Card key={feature.title} className="bg-card/50 backdrop-blur border-border/50">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Best For Different Users */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Best Aquarium App For Every Hobbyist
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-4">Best for Beginners</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Plain language explanations of water chemistry</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Step by step guidance for fixing problems</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Automatic reminders so you never forget maintenance</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Learn as you go with AI powered tips</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-4">Best for Reef Keepers</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Track alkalinity, calcium, magnesium for corals</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Photo galleries for coral growth documentation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Trend analysis catches parameter swings early</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Supports Salifert, Red Sea, and reef test kits</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-muted/30">
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
              <h3 className="text-xl font-semibold text-muted-foreground">Explore More</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" asChild>
                <Link to="/best-aquatic-app">Why Ally</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/best-pool-app">Best Pool App</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/best-spa-app">Best Spa App</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/ai-water-testing">AI Water Testing</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Try the Best Aquarium App?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of aquarium hobbyists who use Ally to keep their tanks healthy.
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
