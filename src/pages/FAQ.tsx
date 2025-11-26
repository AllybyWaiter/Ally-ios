import { Link } from "react-router-dom";
import { useState } from "react";
import { Search, Sparkles, TestTube, Database, Shield, DollarSign, Settings, Calendar, Users, Rocket, HelpCircle, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AllySupportChat from "@/components/AllySupportChat";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const faqCategories = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Rocket,
      questions: [
        {
          q: "What is Ally?",
          a: "Ally is an AI-powered aquarium management platform that helps you maintain perfect water quality, track maintenance tasks, manage livestock and equipment, and receive personalized care recommendations. Whether you're a beginner or expert aquarist, Ally makes aquarium care effortless."
        },
        {
          q: "How do I create an account?",
          a: "During our closed beta, you'll need to join the waitlist first. Once you receive beta access, you can sign up with your email address. After creating your account, you'll go through a quick onboarding process where you'll set your preferences (units, language, theme) and create your first aquarium profile."
        },
        {
          q: "What aquarium types are supported?",
          a: "Ally supports freshwater, saltwater (marine), and brackish aquariums. We also support ponds. Each type has customized parameter ranges, livestock databases, and care recommendations tailored to that specific environment."
        },
        {
          q: "How do I set up my first aquarium?",
          a: "After account creation, you'll be guided through setting up your first aquarium. You'll enter basic details like name, type (freshwater/saltwater/brackish), volume, and setup date. You can also add notes about your setup. Once created, you can start logging water tests, adding equipment, tracking livestock, and scheduling maintenance tasks."
        }
      ]
    },
    {
      id: "ai-photo-analysis",
      title: "AI & Photo Analysis",
      icon: Sparkles,
      questions: [
        {
          q: "How accurate is the AI?",
          a: "Ally's AI achieves an average 98% accuracy in interpreting water test results when readings are entered correctly or photos are clear and well lit. Our AI has been trained on thousands of test kit images and is constantly improving. The AI excels at recognizing patterns, suggesting maintenance schedules, and providing personalized care recommendations based on your aquarium's history."
        },
        {
          q: "Which test kits work with photo analysis?",
          a: "Ally supports both test strips and liquid reagent kits from standard brands including API Master Test Kits, Tetra EasyStrips, Seachem MultiTest, Salifert marine kits, and Aquaforest test kits. Most conventional color based test kits will work. Digital meters or kits with unconventional color gradients may not be compatible for photo analysis, but you can always manually enter values."
        },
        {
          q: "What if my photo doesn't analyze correctly?",
          a: "If the AI confidence is low or results seem off, Ally will flag the reading and prompt you to retake the photo or manually verify the values. Common issues include poor lighting, blurry images, or faded test strips. You can always switch to manual entry mode to input values directly. Our AI learns from corrections to improve future accuracy."
        },
        {
          q: "How does Ally interpret water test results?",
          a: "Ally compares your test results against ideal ranges for your specific aquarium type (freshwater, saltwater, brackish). The AI considers your livestock, tank age, and historical trends to provide context aware recommendations. If parameters are out of range, Ally provides specific dosing instructions, water change recommendations, and explains what's happening in your aquarium."
        }
      ]
    },
    {
      id: "water-testing",
      title: "Water Testing",
      icon: TestTube,
      questions: [
        {
          q: "Which parameters does Ally track?",
          a: "Ally tracks all essential water parameters including pH, ammonia (NH3/NH4+), nitrite (NO2), nitrate (NO3), general hardness (GH), carbonate hardness (KH/alkalinity), temperature, salinity/specific gravity (for marine tanks), phosphate (PO4), and dissolved oxygen. You can also create custom parameters for specialized testing like copper, iron, or silicate."
        },
        {
          q: "How often should I test my water?",
          a: "For new aquariums (first 6-8 weeks), test every 2-3 days to monitor the nitrogen cycle. For established tanks, weekly testing is recommended for freshwater and 2-3 times weekly for saltwater. Ally's smart scheduling will remind you based on your tank's age, livestock load, and historical stability. After significant changes (new fish, medication, etc.), test daily for a few days."
        },
        {
          q: "Can I manually enter test results?",
          a: "Yes! You have complete flexibility to enter results manually, upload a photo for AI analysis, or use a combination of both. Manual entry is perfect for digital meters, complex test kits, or when you prefer direct control. Ally provides the same quality recommendations regardless of entry method."
        },
        {
          q: "What are ideal water parameters?",
          a: "Ideal parameters vary by aquarium type. For freshwater: pH 6.5-7.5, ammonia and nitrite at 0 ppm, nitrate under 20 ppm. For saltwater: pH 8.1-8.4, ammonia and nitrite at 0 ppm, nitrate under 10 ppm, salinity 1.025 specific gravity. Ally provides specific ideal ranges for your aquarium type and adjusts recommendations based on your livestock's needs."
        },
        {
          q: "How does the trend analysis work?",
          a: "Ally tracks all your test results over time and uses AI to identify patterns, trends, and potential issues before they become problems. You'll see visual charts showing parameter changes, receive alerts for concerning trends (like rising nitrates), and get predictive recommendations. The AI learns your tank's unique behavior to provide increasingly accurate forecasts."
        }
      ]
    },
    {
      id: "aquarium-management",
      title: "Aquarium Management",
      icon: Database,
      questions: [
        {
          q: "How many aquariums can I manage?",
          a: "The number of aquariums you can manage depends on your subscription plan. Free plan: 1 aquarium, Basic plan: 1 aquarium, Plus plan: 3 aquariums, Gold plan: 10 aquariums, Business plan: unlimited aquariums. Each aquarium has its own complete profile with water tests, equipment, livestock, plants, and maintenance schedules."
        },
        {
          q: "Can I track livestock and plants?",
          a: "Yes! Ally includes comprehensive livestock and plant management. For each fish, invertebrate, or coral, you can track species, quantity, date added, health status, and notes. For plants, track species, placement, condition, and care requirements. Ally uses this information to provide species-specific care recommendations and compatibility warnings."
        },
        {
          q: "What information is stored for each aquarium?",
          a: "Each aquarium profile stores: basic info (name, type, volume, setup date, status), complete water test history with trends and charts, all equipment with maintenance schedules, livestock and plant inventories with health tracking, maintenance task calendar, and any custom notes or observations. Everything is securely stored and accessible from any device."
        }
      ]
    },
    {
      id: "equipment-tracking",
      title: "Equipment Tracking",
      icon: Settings,
      questions: [
        {
          q: "What equipment can I track?",
          a: "Track all your aquarium equipment including filters (canister, HOB, sponge), heaters, lights, protein skimmers, UV sterilizers, wavemakers/pumps, air pumps, CO2 systems, auto-feeders, and controllers. For each piece, record brand, model, install date, warranty info, and maintenance schedules. This helps you stay on top of filter media changes, bulb replacements, and equipment servicing."
        },
        {
          q: "How do equipment maintenance reminders work?",
          a: "When you add equipment, set maintenance intervals (e.g., filter media every 4 weeks, light bulbs every 12 months). Ally automatically creates recurring tasks and sends notifications when maintenance is due. You can mark tasks complete, snooze them, or adjust intervals. The system learns from your patterns and can suggest optimal maintenance schedules."
        },
        {
          q: "Can I track filter media replacement schedules?",
          a: "Absolutely! Create detailed maintenance schedules for different filter media types (mechanical, chemical, biological). Set different intervals for each media type - for example, replace filter floss weekly, carbon monthly, and bio-media annually. Ally tracks last change dates and sends timely reminders so you never miss a critical maintenance task."
        }
      ]
    },
    {
      id: "maintenance-tasks",
      title: "Maintenance Tasks & Scheduling",
      icon: Calendar,
      questions: [
        {
          q: "How does smart scheduling work?",
          a: "Ally's AI learns your aquarium's patterns and your maintenance habits to create intelligent schedules. It considers factors like tank age, bioload, water test trends, and equipment maintenance to suggest optimal timing for water changes, cleaning, testing, and other tasks. The system adapts as your tank matures and your routine evolves."
        },
        {
          q: "Can Ally suggest maintenance tasks?",
          a: "Yes! Ally proactively suggests maintenance tasks based on your water test results, equipment schedules, and aquarium conditions. For example, if nitrates are rising, it'll suggest a water change. If algae growth is detected in your notes, it'll recommend glass cleaning and light schedule adjustments. You can accept, modify, or dismiss suggestions."
        },
        {
          q: "How do I set up recurring tasks?",
          a: "Create any task and set it to recur daily, weekly, bi-weekly, monthly, or custom intervals. Common recurring tasks include water changes, glass cleaning, filter maintenance, and testing. Once marked complete, the task automatically schedules the next occurrence. You can view all upcoming tasks in the calendar view or task list."
        },
        {
          q: "What notifications will I receive?",
          a: "Ally sends timely notifications for upcoming and overdue maintenance tasks, critical water parameter alerts (high ammonia, pH swings), equipment maintenance reminders, and important updates. You can customize notification preferences in settings - choose email, in-app, or both, and set quiet hours. Critical safety alerts always notify immediately."
        }
      ]
    },
    {
      id: "pricing-subscriptions",
      title: "Pricing & Subscriptions",
      icon: DollarSign,
      questions: [
        {
          q: "What's included in the free plan?",
          a: "The Free Plan includes 1 aquarium, up to 5 water tests per month, basic AI recommendations, simple maintenance reminders, and access to the Ally AI chat assistant. It's perfect for trying Ally or managing a single, stable aquarium. Upgrade anytime to unlock unlimited tests, multiple tanks, and advanced features."
        },
        {
          q: "What are the subscription tiers?",
          a: "Basic ($9.99/month): 1 aquarium, 10 tests/month, AI recommendations, basic scheduling. Plus ($14.99/month): 3 aquariums, unlimited tests, smart scheduling, equipment tracking, custom notifications. Gold ($19.99/month): 10 aquariums, multi-tank management, AI habit learning, connected devices (coming soon), data export. Business (custom pricing): Unlimited tanks, team dashboards, multi-location support, API access, dedicated support."
        },
        {
          q: "Is there a free trial?",
          a: "Yes! All paid plans include a 7-day free trial. During the trial, you have full access to all features of your selected plan. No credit card required during closed beta. Cancel anytime before the trial ends to avoid charges. If you love Ally (we think you will!), your subscription begins automatically after the trial."
        },
        {
          q: "Can I cancel anytime?",
          a: "Absolutely! Cancel your subscription anytime from the Settings page. Your access continues until the end of your current billing period, then reverts to the Free plan. No cancellation fees, no hassle. All your data remains safe and accessible on the Free plan (with Free plan limitations)."
        },
        {
          q: "Do you offer annual billing discounts?",
          a: "Yes! Save 20% with annual billing. Basic: $95.90/year (vs $119.88), Plus: $143.90/year (vs $179.88), Gold: $191.90/year (vs $239.88). Annual plans include the same 7-day trial and can be canceled within the first 30 days for a full refund. Annual subscriptions renew automatically each year."
        }
      ]
    },
    {
      id: "account-security",
      title: "Account & Security",
      icon: Shield,
      questions: [
        {
          q: "How is my data protected?",
          a: "Ally takes security seriously. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use secure authentication, regular security audits, and follow industry best practices. Our infrastructure is hosted on enterprise-grade cloud platforms with automatic backups, DDoS protection, and 99.9% uptime SLA. We're compliant with GDPR, SOC 2, and ISO 27001 standards."
        },
        {
          q: "Can I export my data?",
          a: "Yes! Gold and Business plan users can export all aquarium data including test history, equipment records, livestock info, and maintenance logs in PDF or CSV formats. Free and Plus plan users can view and screenshot their data. Exports are useful for sharing with aquarium professionals, backing up records, or if you decide to stop using Ally."
        },
        {
          q: "How do I delete my account?",
          a: "You can delete your account anytime from Settings > Account > Delete Account. This permanently removes all your data including aquariums, tests, photos, and settings within 30 days. Before deletion, we recommend exporting your data (Gold/Business plans). Account deletion cannot be undone. If you're having issues, contact support first - we're here to help!"
        },
        {
          q: "Is two-factor authentication available?",
          a: "Yes! Enable two-factor authentication (2FA) in Settings > Security for an extra layer of protection. We support authenticator apps (Google Authenticator, Authy) for 2FA. We strongly recommend enabling 2FA, especially if you manage multiple high-value aquariums or work in a business environment."
        }
      ]
    },
    {
      id: "privacy-data",
      title: "Privacy & Data",
      icon: Shield,
      questions: [
        {
          q: "What data does Ally collect?",
          a: "Ally collects only what's necessary: your email for account management, aquarium details (name, type, volume), water test results and photos, equipment and livestock information, and maintenance task data. We also collect anonymous usage analytics to improve the app. We never access your camera or location without explicit permission for specific features."
        },
        {
          q: "Do you share or sell my data?",
          a: "Never. Ally does not sell, rent, or trade your personal data. Period. We may use anonymized, aggregated data internally to improve AI accuracy and app features, but this data never identifies individual users. Third-party integrations (if you enable them) only receive data necessary for their function, with your explicit consent."
        },
        {
          q: "Where is my data stored?",
          a: "Your data is securely stored on enterprise cloud infrastructure (Google Cloud Platform and Supabase) with servers in the United States and Europe. Data is encrypted at rest and in transit. We maintain regular automated backups and can restore your data if needed. For enterprise customers, we can discuss specific data residency requirements."
        },
        {
          q: "What are my privacy rights?",
          a: "You have the right to access, correct, or delete your data at any time. Request a complete copy of your data, ask us to correct inaccuracies, or delete specific information. Under GDPR and CCPA, you have additional rights including data portability and the right to object to processing. Contact privacy@waiter.ai for any privacy requests or questions."
        }
      ]
    },
    {
      id: "technical-troubleshooting",
      title: "Technical & Troubleshooting",
      icon: HelpCircle,
      questions: [
        {
          q: "Does Ally work offline?",
          a: "Ally requires an internet connection for AI analysis, data syncing, and most features. However, you can view previously loaded data while offline. Manual data entry made offline will sync automatically when you reconnect. For critical offline functionality needs (e.g., remote locations), contact us about enterprise offline capabilities."
        },
        {
          q: "Which browsers are supported?",
          a: "Ally works best on modern browsers: Chrome, Firefox, Safari, and Edge (latest versions). We recommend keeping your browser updated for the best experience and security. The mobile web app is optimized for iOS Safari and Android Chrome. Native mobile apps (iOS/Android) are planned for 2025."
        },
        {
          q: "Why isn't my photo analyzing correctly?",
          a: "Common photo analysis issues: poor lighting (use natural light or bright white light), blurry images (hold steady, tap to focus), glare or reflections (avoid direct light), test strips too close or too far (fill the frame), or faded test strips (use fresh tests). Try retaking the photo or use manual entry. If issues persist, contact support with sample photos."
        },
        {
          q: "How do I report a bug?",
          a: "Found a bug? We want to know! Click the support chat icon, select \"Report a Bug,\" and describe what happened. Include what you were doing, what you expected, and what actually happened. Screenshots are helpful. Our team investigates all reports and will follow up with you. Serious bugs are prioritized and often fixed within 24-48 hours."
        }
      ]
    },
    {
      id: "beta-waitlist",
      title: "Beta Access & Waitlist",
      icon: Users,
      questions: [
        {
          q: "How does beta access work?",
          a: "Ally is currently in closed beta. Sign up for the waitlist on our homepage. Our admin team randomly grants beta access to waitlist members on a rolling basis. Once granted, you'll receive an email invitation with instructions to create your account. Beta testers help us refine Ally before the public launch and get early access to new features."
        },
        {
          q: "When will Ally launch publicly?",
          a: "Ally is scheduled for public launch in early 2025. During closed beta (now through Q1 2025), we're gathering feedback and perfecting the experience. Beta testers will be grandfathered into special early adopter pricing. Sign up for the waitlist to be notified when we launch publicly and to potentially receive early beta access."
        },
        {
          q: "How do I get early access?",
          a: "Join the waitlist for a chance at early beta access! Beta invitations are sent randomly to waitlist members. Want to increase your chances? Share Ally with friends in the aquarium community - we love enthusiastic aquarists who spread the word. Aquarium shop owners, breeders, and influencers can contact us directly for partnership opportunities and guaranteed access."
        }
      ]
    },
    {
      id: "future-features",
      title: "Future Features",
      icon: Zap,
      questions: [
        {
          q: "What features are coming?",
          a: "We're working on exciting features for 2025 and beyond: Native mobile apps (iOS/Android), connected device integration (smart monitors, auto-dosers), livestock-specific care guides, breeding tracking and fry management, aquarium marketplace integration, social features (share tanks, connect with other aquarists), aquascaping planning tools, expense tracking, and multi-user family accounts. Beta users get early access!"
        },
        {
          q: "Will there be device integrations?",
          a: "Yes! We're partnering with leading aquarium device manufacturers to integrate smart monitors, controllers, and auto-dosers. Imagine Ally automatically importing test readings from your WiFi monitor, adjusting equipment schedules based on AI recommendations, or triggering water changes when needed. Connected device integration launches late 2025 for Gold and Business plans."
        },
        {
          q: "Can I request features?",
          a: "Absolutely! We love hearing from users. Request features through the support chat, email feedback@waiter.ai, or join our community Discord. We review all suggestions and prioritize based on user demand and feasibility. Many current features came directly from beta tester feedback. The most requested features often get fast-tracked into development."
        }
      ]
    }
  ];

  // Filter questions based on search query
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-[linear-gradient(var(--gradient-hero))] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background -z-10" />
          <div className="container mx-auto max-w-7xl text-center">
            <Link to="/" className="inline-block text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
              ← Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-[linear-gradient(var(--gradient-water))] bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Everything you need to know about Ally - from AI features to pricing, security, and future plans
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">No questions found matching "{searchQuery}"</p>
                <p className="text-sm text-muted-foreground mt-2">Try a different search term or browse all categories</p>
              </div>
            ) : (
              <div className="space-y-12">
                {filteredCategories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <div key={category.id} className="scroll-mt-24" id={category.id}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold">{category.title}</h2>
                          <p className="text-sm text-muted-foreground">{category.questions.length} questions</p>
                        </div>
                      </div>

                      <Accordion type="single" collapsible className="space-y-4">
                        {category.questions.map((item, index) => (
                          <AccordionItem
                            key={index}
                            value={`${category.id}-${index}`}
                            className="border border-border rounded-xl px-6 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors"
                          >
                            <AccordionTrigger className="text-left hover:no-underline py-5">
                              <span className="text-lg font-semibold pr-4">{item.q}</span>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground pb-5 pt-2 leading-relaxed">
                              {item.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Still Have Questions CTA */}
        <section className="py-20 px-4 bg-muted/50">
          <div className="container mx-auto max-w-3xl text-center">
            <div className="p-3 rounded-2xl bg-primary/10 w-fit mx-auto mb-6">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Still have questions?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pricing" className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-8 py-4 text-lg font-semibold hover:bg-primary/90 transition-colors">
                View Pricing Plans
              </Link>
              <a href="#contact" className="inline-flex items-center justify-center rounded-xl border-2 border-primary text-primary px-8 py-4 text-lg font-semibold hover:bg-primary/10 transition-colors">
                Contact Support
              </a>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="bg-primary/10 text-primary">Closed Beta</Badge>
              <span>Join the waitlist for early access</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <AllySupportChat />
    </div>
  );
};

export default FAQ;
