import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Zap, CheckCircle2, ArrowRight, Sparkles, ScanLine, Target, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SEO, StructuredData, generateFAQStructuredData } from '@/components/SEO';
import { WaitlistDialog } from '@/components/WaitlistDialog';
import { useState } from 'react';
import AllySupportChat from '@/components/AllySupportChat';

const supportedBrands = [
  'API Freshwater Master Test Kit',
  'API Saltwater Master Test Kit',
  'Tetra EasyStrips 6-in-1',
  'Seachem MultiTest',
  'AquaChek Pool & Spa',
  'Taylor K-2006',
  'Salifert Reef Kits',
  'Red Sea Pro Test Kits',
  'JNW Direct Strips',
  'Hach Test Strips',
];

const howItWorks = [
  {
    step: 1,
    title: 'Dip Your Test',
    description: 'Use any supported test strip or kit as normal. Dip in your water and wait the specified time.',
    icon: Clock,
  },
  {
    step: 2,
    title: 'Snap a Photo',
    description: 'Open Ally and take a photo of your test strip. Good lighting helps accuracy.',
    icon: Camera,
  },
  {
    step: 3,
    title: 'AI Analyzes Colors',
    description: 'Our AI identifies the test brand and reads each color pad with 98% accuracy.',
    icon: ScanLine,
  },
  {
    step: 4,
    title: 'Get Recommendations',
    description: 'Review your results and get personalized recommendations for your water body.',
    icon: Target,
  },
];

const faqs = [
  {
    question: 'How does AI water testing work?',
    answer: 'AI water testing uses computer vision to analyze photos of water test strips and test kits. The AI identifies the test brand, reads the color values on each pad, and converts them to numerical readings. This eliminates the guesswork of manually matching colors to a chart.',
  },
  {
    question: 'Is AI water testing accurate?',
    answer: 'Yes! Ally\'s AI achieves 98% accuracy when photos are taken with good lighting. The AI is trained on thousands of test strip images across multiple brands and conditions. You can always manually adjust readings if needed.',
  },
  {
    question: 'What test strips work with AI analysis?',
    answer: 'Ally supports all major test strip and kit brands including API, Tetra, Seachem, AquaChek, Taylor, Salifert, Red Sea, and more. Both aquarium and pool test kits are supported.',
  },
  {
    question: 'Can AI analyze liquid test kits?',
    answer: 'Yes! Ally can analyze color readings from liquid test kits like the API Master Test Kit and Taylor K-2006 pool kit. Just take a photo of the test vials against a white background.',
  },
  {
    question: 'Does it work in low light?',
    answer: 'For best results, use natural daylight or good indoor lighting. Ally will let you know if the photo quality affects accuracy and suggest retaking in better conditions.',
  },
];

export default function AIWaterTesting() {
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI Water Testing - Instant Test Strip Analysis | Ally"
        description="AI-powered water testing that reads test strips from photos. 98% accurate analysis for aquariums, pools, and spas. Supports API, Tetra, AquaChek, and more."
        path="/ai-water-testing"
      />
      <StructuredData type="SoftwareApplication" />
      <StructuredData
        type="FAQPage"
        data={{ questions: generateFAQStructuredData(faqs) }}
      />


      <Navbar />
      <WaitlistDialog open={showWaitlist} onOpenChange={setShowWaitlist} />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">AI-Powered Technology</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                AI Water Testing:{' '}
                <span className="text-primary">Photo to Results in Seconds</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Stop squinting at color charts. Ally's AI reads your water test strips 
                and test kits from photos with 98% accuracy.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button 
                  size="lg" 
                  className="text-lg px-8"
                  onClick={() => setShowWaitlist(true)}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Try AI Water Testing
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8"
                  asChild
                >
                  <Link to="/features">
                    All Features
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">&lt;3s</div>
                  <div className="text-sm text-muted-foreground">Analysis Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Test Kits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">Free</div>
                  <div className="text-sm text-muted-foreground">To Start</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How AI Water Testing Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                From photo to results in under 3 seconds.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {howItWorks.map((step) => (
                <div key={step.step} className="relative">
                  <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                        {step.step}
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <step.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm">{step.description}</p>
                    </CardContent>
                  </Card>
                  {step.step < 4 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRight className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Supported Brands */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Supports Your Test Kit
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Ally's AI recognizes test strips and kits from all major brands.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {supportedBrands.map((brand) => (
                <Card key={brand} className="bg-card/50">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium">{brand}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why AI Water Testing */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why AI Water Testing?
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">More Accurate</h3>
                  <p className="text-muted-foreground">
                    No more guessing between similar colors on the chart. 
                    AI reads exact color values for precise measurements.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Faster Results</h3>
                  <p className="text-muted-foreground">
                    Get all parameters in seconds instead of comparing 
                    each pad one by one. More time enjoying, less testing.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Consistent Tracking</h3>
                  <p className="text-muted-foreground">
                    Every test is logged automatically with timestamp and photo. 
                    Track trends over time to catch problems early.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                AI Water Testing FAQ
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

        {/* CTA Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Try AI Water Testing?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join the future of water care. Test smarter, not harder.
              </p>
              <Button 
                size="lg" 
                className="text-lg px-8"
                onClick={() => setShowWaitlist(true)}
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
