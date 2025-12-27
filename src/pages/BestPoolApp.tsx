import { Link, useNavigate } from 'react-router-dom';
import { Camera, Mic, Bell, Waves, Sun, Smartphone, Star, CheckCircle2, ArrowRight, Sparkles, CloudSun, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SEO, StructuredData, generateFAQStructuredData } from '@/components/SEO';
import AllySupportChat from '@/components/AllySupportChat';
import { useDomainType, getAppUrl } from '@/hooks/useDomainType';
const features = [{
  icon: Camera,
  title: 'AI Photo Testing',
  description: 'Take a photo of your AquaChek, Taylor, or other pool test strip. Get instant, accurate readings for chlorine, pH, and more.'
}, {
  icon: Mic,
  title: 'Voice Commands',
  description: '"What should my chlorine be?" - Ask questions and log tests with your voice. Hands-free for poolside use.'
}, {
  icon: Bell,
  title: 'Chemical Alerts',
  description: 'AI monitors your pool chemistry and alerts you before problems occur. Never let your pool turn green.'
}, {
  icon: Waves,
  title: 'Dosage Calculator',
  description: 'Enter your pool volume once. Ally calculates exact dosages for chlorine, pH adjusters, and other chemicals.'
}, {
  icon: CloudSun,
  title: 'Weather Integration',
  description: 'Get maintenance recommendations based on weather. High UV means more chlorine needed. Rain coming? Adjust your schedule.'
}, {
  icon: Smartphone,
  title: 'Works Everywhere',
  description: 'PWA app works on iPhone, Android, tablets, and desktop. Access your pool data from anywhere.'
}];
const faqs = [{
  question: 'What is the best pool water testing app?',
  answer: 'Ally by WA.I.TER is the best pool water testing app because it uses AI to analyze photos of your test strips. Just snap a photo of your AquaChek or Taylor test strip and get instant readings with dosage recommendations.'
}, {
  question: 'Is there an app that can read pool test strips?',
  answer: 'Yes! Ally uses AI computer vision to read pool test strips from AquaChek, Taylor, and other brands. Take a photo in good lighting and get accurate readings for chlorine, pH, alkalinity, and more.'
}, {
  question: 'What\'s the best app for tracking pool chemicals?',
  answer: 'Ally is the best app for tracking pool chemicals because it combines photo analysis, automatic dosage calculations, and trend monitoring. It tells you exactly how much chlorine, pH increaser, or other chemicals to add based on your pool volume.'
}, {
  question: 'Does Ally work with saltwater pools?',
  answer: 'Yes! Ally fully supports saltwater (salt chlorine generator) pools. It tracks salt levels (target 2700-3400 ppm), free chlorine, pH, and all other parameters specific to saltwater pools.'
}, {
  question: 'Can Ally help with pool maintenance scheduling?',
  answer: 'Absolutely. Ally creates automated maintenance reminders for testing, shocking, filter cleaning, and equipment maintenance. It adjusts recommendations based on weather and your pool usage.'
}];
export default function BestPoolApp() {
  const navigate = useNavigate();
  const domainType = useDomainType();

  const handleGetStarted = () => {
    if (domainType === 'marketing') {
      window.location.href = getAppUrl('/auth');
    } else {
      navigate('/auth');
    }
  };

  return <div className="min-h-screen bg-background">
      <SEO title="Best Pool App 2025 - AI Water Testing & Chemical Calculator" description="Ally is the #1 pool care app with AI water test photo analysis, chemical dosage calculator, and smart maintenance reminders. Works with chlorine and saltwater pools." path="/best-pool-app" />
      <StructuredData type="SoftwareApplication" />
      <StructuredData type="FAQPage" data={{
      questions: generateFAQStructuredData(faqs)
    }} />

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
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/10" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">Best Pool Care App</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                The Best Pool App for{' '}
                <span className="text-primary">Water Testing</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">Ally is an AI powered pool care app that reads test strips from photos, calculates exact chemical dosages, and reminds you when to test and maintain your pool.</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="text-lg px-8" onClick={handleGetStarted}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" asChild>
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
                  <div className="text-3xl md:text-4xl font-bold text-primary">10+</div>
                  <div className="text-sm text-muted-foreground">Parameters Tracked</div>
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
                Why Ally is the Best Pool App
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Stop guessing with pool chemicals. Ally's AI tells you exactly what your pool needs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map(feature => <Card key={feature.title} className="bg-card/50 backdrop-blur border-border/50">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </section>

        {/* Pool Parameters */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Complete Pool Water Testing
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Ally tracks all the parameters you need for crystal-clear pool water.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Waves className="w-8 h-8 text-cyan-500" />
                    <h3 className="text-2xl font-bold">Chlorine Pools</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Free Chlorine (1-3 ppm target)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Combined Chlorine and Chloramines</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>pH (7.2-7.6 ideal range)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Total Alkalinity (80-120 ppm)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Calcium Hardness (200-400 ppm)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Cyanuric Acid / Stabilizer (30-50 ppm)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border-teal-500/20">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Thermometer className="w-8 h-8 text-teal-500" />
                    <h3 className="text-2xl font-bold">Saltwater Pools</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Salt Level (2700-3400 ppm target)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Free Chlorine (generated by cell)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>pH Balance (critical for saltwater)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Alkalinity Monitoring</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Cell Cleaning Reminders</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Weather-Based Recommendations</span>
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
              {faqs.map(faq => <Card key={faq.question}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>)}
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
                <Link to="/best-aquarium-app">Best Aquarium App</Link>
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
                Ready to Try the Best Pool App?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join pool owners who use Ally to keep their pools crystal clear with less effort.
              </p>
              <Button size="lg" className="text-lg px-8" onClick={handleGetStarted}>
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <AllySupportChat />
    </div>;
}