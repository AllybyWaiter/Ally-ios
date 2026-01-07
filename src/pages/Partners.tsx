import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { 
  Handshake, 
  Users, 
  Code, 
  Store, 
  Megaphone, 
  ArrowRight, 
  CheckCircle2,
  TrendingUp,
  Target,
  Heart,
  FileText,
  Clock,
  DollarSign,
  Link as LinkIcon,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Partners = () => {
  const navigate = useNavigate();

  const partnershipTypes = [
    {
      icon: Users,
      title: "Affiliate Partners",
      tagline: "Earn recurring commissions by referring customers to Ally.",
      description: "You introduce Ally to your audience. We handle the product, onboarding, and retention. You earn recurring revenue as customers stay active.",
      benefits: [
        "15% recurring commission on eligible subscription revenue (standard tier)",
        "Tracking + attribution (links and/or codes) with clear reporting",
        "Partner kit with creative assets, messaging angles, and launch templates",
      ],
      cta: "Become an Affiliate",
      ctaAction: () => navigate("/partners/apply"),
    },
    {
      icon: Code,
      title: "Technology Partners",
      tagline: "Build with Ally (select partners).",
      description: "If you run a platform, hardware, or service that touches water care, we're open to integration pilots and co-built workflows that reduce churn and support tickets.",
      benefits: [
        "Integration planning + implementation support (pilot-based)",
        "Early visibility into roadmap + partner feedback loop",
        "Co-marketing opportunities for successful launches",
      ],
      cta: "Explore Integrations",
      ctaAction: () => navigate("/partners/apply"),
    },
    {
      icon: Store,
      title: "Retail Partners",
      tagline: "Bring Ally into your store.",
      description: "Give customers a modern, guided path to better water outcomes—and reduce the cycle of confusion, returns, and 'what do I buy?' conversations.",
      benefits: [
        "Wholesale pricing with partner-friendly margin structure",
        "Staff training + quick-start playbooks to drive repeat business",
        "Retail marketing support (in-store assets, QR flows, promos)",
      ],
      cta: "Become a Retail Partner",
      ctaAction: () => navigate("/partners/apply"),
    },
    {
      icon: Megaphone,
      title: "Content Partners",
      tagline: "Creators who teach water care, win with Ally.",
      description: "If you educate pool/spa/aquarium owners, Ally gives you a cleaner way to monetize trust—without pushing junk.",
      benefits: [
        "Premium access for content creation and demos",
        "Revenue share via links/codes with reliable attribution",
        "Collabs, giveaways, and launch opportunities (case-by-case)",
      ],
      cta: "Partner as a Creator",
      ctaAction: () => navigate("/partners/apply"),
    },
  ];

  const whyPartner = [
    {
      icon: Target,
      title: "Huge installed base with recurring needs",
      description: "In the U.S. alone, there are 10.4M residential pools, 309K public pools, and 7.3M hot tubs in operation—water care is ongoing, not one-time.",
    },
    {
      icon: TrendingUp,
      title: "The category is growing",
      description: "Mordor Intelligence estimates the global swimming pool market at $5.90B in 2025, projected to reach $8.24B by 2030 (CAGR 6.91%).",
    },
    {
      icon: Heart,
      title: "Partners win when outcomes improve",
      description: "Ally is built to drive fewer failures, less confusion, and stronger retention—so partners benefit from long-term customer value, not just one-off transactions.",
    },
  ];

  const affiliateSteps = [
    {
      step: "1",
      title: "Apply and get approved",
      description: "Submit your application with details about your audience and reach.",
    },
    {
      step: "2",
      title: "Receive your partner kit",
      description: "Get your unique link and/or code plus creative assets and launch templates.",
    },
    {
      step: "3",
      title: "Promote Ally",
      description: "Share Ally with your audience using the messaging angles that work for you.",
    },
    {
      step: "4",
      title: "Earn recurring commissions",
      description: "Track conversions in real-time and receive monthly payouts for qualified subscriptions.",
    },
  ];

  const whatToSubmit = [
    "Your primary channels (site/social/YouTube, etc.)",
    "Audience focus (pool / spa / aquarium / service pro)",
    "Basic reach metrics + how you plan to promote",
    "Payout details (method and required tax info where applicable)",
  ];

  const commissionDetails = [
    { label: "Standard", value: "15%", sublabel: "recurring (up to 12 months)" },
    { label: "Premium Tier", value: "20%", sublabel: "by invitation" },
    { label: "Cookie Duration", value: "30", sublabel: "days" },
  ];

  const faqs = [
    {
      question: "Who can apply?",
      answer: "Creators, service pros, retailers, and operators with an audience or customer base aligned to water ownership.",
    },
    {
      question: "Do you allow discount codes?",
      answer: "Yes—approved partners may receive unique codes depending on tier and campaign.",
    },
    {
      question: "When do I get paid?",
      answer: "Monthly, once you hit the $50 minimum threshold (Net 30).",
    },
    {
      question: "How is attribution handled?",
      answer: "Via unique links and/or codes with a 30-day cookie window.",
    },
    {
      question: "Can I run paid ads?",
      answer: "Paid advertising is allowed only with written approval and must follow brand guidelines (to avoid brand bidding conflicts and low-quality traffic).",
    },
    {
      question: "What if a customer cancels?",
      answer: "Commissions are paid on eligible subscription revenue while the customer remains active (up to 12 months per referred customer).",
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Partners"
        description="Build the future of water care with Ally. Explore affiliate, technology, retail, and content partnership opportunities with competitive commissions and dedicated support."
        path="/partners"
      />
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Handshake className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
                Build the future of water care with Ally.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Ally is building a smarter, simpler way to keep water dialed in—without the guesswork. If you serve pool, spa, or aquarium owners, let's grow together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="hero"
                  onClick={() => navigate("/partners/apply")}
                >
                  Apply to Partner
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="heroOutline"
                  onClick={() => navigate("/contact")}
                >
                  Contact Us
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Partnership Types */}
        <section className="py-16 md:py-24 container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Partnership Types</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the partnership model that fits your business.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {partnershipTypes.map((type, idx) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <type.icon className="h-5 w-5 text-primary" />
                      </div>
                      {type.title}
                    </CardTitle>
                    <p className="text-sm font-medium text-primary mt-2">{type.tagline}</p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-muted-foreground mb-4">{type.description}</p>
                    <p className="text-sm font-semibold text-foreground mb-2">What you get</p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {type.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="outline" 
                      className="w-full mt-auto"
                      onClick={type.ctaAction}
                    >
                      {type.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why Partner With Ally */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Why Partner With Ally?</h2>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {whyPartner.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="p-6 bg-background rounded-xl border text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Affiliate Program Details */}
        <section className="py-16 md:py-24 container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Affiliate Program</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              How it works
            </p>
          </motion.div>

          {/* Steps */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {affiliateSteps.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Application Details */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Approval Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Most applications are reviewed within 2–3 business days.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    What You'll Submit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {whatToSubmit.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Commission Structure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Commission Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 text-center mb-6">
                  {commissionDetails.map((item, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <p className="text-3xl font-bold text-primary mb-1">
                        {item.value}{item.label !== "Cookie Duration" ? "%" : " days"}
                      </p>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 text-sm text-muted-foreground border-t pt-4">
                  <p>
                    <strong className="text-foreground">Payout schedule:</strong> Monthly payouts, $50 minimum threshold, Net 30
                  </p>
                  <p className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Eligibility note:</strong> Commissions apply to eligible subscription revenue, excluding taxes, refunds, chargebacks, and fraudulent transactions.
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <LinkIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Disclosure note:</strong> Partners must clearly disclose material connections (e.g., commissions, free access) in line with FTC guidance.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* FAQs */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">FAQs</h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`faq-${index}`}
                    className="bg-background border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-left font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* Partner Spotlight */}
        <section className="py-16 md:py-24 container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Partner Spotlight</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're working with a small set of early partners to validate outcomes and scale responsibly. Full partner spotlights coming soon.
            </p>
          </motion.div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24 bg-primary/5">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Ready to partner?</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                If you help people own water with confidence, Ally is built for your audience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="hero"
                  onClick={() => navigate("/partners/apply")}
                >
                  Apply to Partner
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="heroOutline"
                  onClick={() => navigate("/contact")}
                >
                  Contact Us
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Partners;
