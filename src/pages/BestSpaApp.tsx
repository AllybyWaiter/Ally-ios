import { Link } from 'react-router-dom';
import { Camera, Mic, Bell, Thermometer, Droplet, Smartphone, Star, CheckCircle2, ArrowRight, Sparkles, Timer, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SEO, StructuredData, generateFAQStructuredData } from '@/components/SEO';
import { WaitlistDialog } from '@/components/WaitlistDialog';
import { useState } from 'react';
import AllySupportChat from '@/components/AllySupportChat';
const features = [{
  icon: Camera,
  title: 'AI Photo Testing',
  description: 'Snap photos of AquaChek, Taylor, or other spa test strips. Get instant readings for bromine, chlorine, pH, and more.'
}, {
  icon: Mic,
  title: 'Voice Commands',
  description: '"What should my bromine be?" - Hands-free for wet environments. Ask questions and log tests with your voice.'
}, {
  icon: Thermometer,
  title: 'Temperature Monitoring',
  description: 'Track water temperature alongside chemical levels. Get alerts when conditions are outside optimal range.'
}, {
  icon: Timer,
  title: 'Drain & Fill Reminders',
  description: 'Automatic reminders for weekly or monthly spa draining. Never forget essential maintenance again.'
}, {
  icon: Bell,
  title: 'Chemical Balance Alerts',
  description: 'AI monitors your spa chemistry and alerts you before problems occur. Keep water safe and sanitized.'
}, {
  icon: Smartphone,
  title: 'Works Everywhere',
  description: 'PWA app works on iPhone, Android, tablets, and desktop. Access your spa data from anywhere.'
}];
const faqs = [{
  question: 'What is the best hot tub maintenance app?',
  answer: 'Ally by WA.I.TER is the best hot tub maintenance app because it uses AI to analyze photos of your test strips. Just snap a photo of your AquaChek or Taylor spa strip and get instant readings with dosage recommendations for bromine, chlorine, pH, and more.'
}, {
  question: 'Is there an app to track spa water chemistry?',
  answer: 'Yes! Ally tracks all spa water parameters including bromine/chlorine, pH, alkalinity, calcium hardness, and TDS. It stores your history, detects trends, and provides personalized recommendations for your specific hot tub.'
}, {
  question: 'How often should I test hot tub water?',
  answer: 'For regular use, test your hot tub water 2-3 times per week. Ally can remind you when to test and tracks your testing habits to ensure you never miss a check. After heavy use or adding chemicals, test again to verify levels.'
}, {
  question: 'Can Ally remind me to drain my spa?',
  answer: 'Absolutely! Ally creates automated drain and fill reminders based on your usage. Most spas should be drained every 3-4 months. Ally also reminds you about filter cleaning, cover care, and other essential maintenance.'
}, {
  question: 'Does Ally work with both bromine and chlorine spas?',
  answer: 'Yes! Ally fully supports both bromine and chlorine sanitizing systems. It knows the different target ranges for each and provides specific recommendations based on your spa setup.'
}];
export default function BestSpaApp() {
  const [showWaitlist, setShowWaitlist] = useState(false);
  return <div className="min-h-screen bg-background">
      <SEO title="Best Spa App 2025 - AI Hot Tub Water Testing & Maintenance" description="Ally is the #1 spa and hot tub app with AI water test photo analysis, chemical dosage calculator, and smart maintenance reminders. Works with bromine and chlorine spas." path="/best-spa-app" />
      <StructuredData type="SoftwareApplication" />
      <StructuredData type="FAQPage" data={{
      questions: generateFAQStructuredData(faqs)
    }} />

      <Navbar />
      <WaitlistDialog open={showWaitlist} onOpenChange={setShowWaitlist} />

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
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/10" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">Best Spa & Hot Tub App</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                The Best Spa App for{' '}
                <span className="text-primary">Hot Tub Care</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">Ally is an AI powered spa care app that reads test strips from photos, calculates exact chemical dosages, and reminds you when to drain, test, and maintain your hot tub.</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="text-lg px-8" onClick={() => setShowWaitlist(true)}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Try Ally Free
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
                  <div className="text-3xl md:text-4xl font-bold text-primary">8+</div>
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
                Why Ally is the Best Spa App
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Stop guessing with spa chemicals. Ally's AI tells you exactly what your hot tub needs.
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

        {/* Spa Parameters */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Complete Spa Water Testing
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Ally tracks all the parameters you need for safe, crystal-clear spa water.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Droplet className="w-8 h-8 text-orange-500" />
                    <h3 className="text-2xl font-bold">Bromine Spas</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Bromine (3-5 ppm target)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>pH (7.2-7.8 ideal range)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Total Alkalinity (80-120 ppm)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Calcium Hardness (150-250 ppm)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>TDS / Total Dissolved Solids</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Waves className="w-8 h-8 text-cyan-500" />
                    <h3 className="text-2xl font-bold">Chlorine Spas</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Free Chlorine (3-5 ppm target)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Combined Chlorine (shock indicator)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>pH Balance (critical for comfort)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Alkalinity Monitoring</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Temperature Tracking</span>
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
                <Link to="/best-pool-app">Best Pool App</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/best-aquarium-app">Best Aquarium App</Link>
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
                Ready to Try the Best Spa App?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join spa owners who use Ally to keep their hot tubs crystal clear with less effort.
              </p>
              <Button size="lg" className="text-lg px-8" onClick={() => setShowWaitlist(true)}>
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