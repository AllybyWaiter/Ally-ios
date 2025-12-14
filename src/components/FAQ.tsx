import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background -z-10" />
      
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get answers to common questions about Ally's AI technology, compatibility, pricing, and security
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {/* AI Accuracy & Reliability */}
          <AccordionItem value="accuracy" className="border border-border/50 rounded-lg px-6 bg-card/30 backdrop-blur-sm">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="text-lg font-semibold">AI Accuracy & Reliability</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pt-2">
              <div>
                <p className="font-semibold text-foreground mb-2">What does the 98% accuracy rate mean?</p>
                <p>
                  Ally's AI achieves an average <strong>98% accuracy</strong> in interpreting water-test results when readings are entered correctly or photos are clear and well-lit. This measures how precisely Ally identifies key parameters for aquariums (pH, ammonia, nitrite, nitrate, hardness) and pools/spas (chlorine, bromine, alkalinity, cyanuric acid, salt) and how consistent its care plans are with professional water-care recommendations.
                </p>
              </div>
              
              <div>
                <p className="font-semibold text-foreground mb-2">Are there any limitations?</p>
                <p className="mb-2">Accuracy may be lower under these conditions:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Poor-quality or uneven lighting when scanning test results</li>
                  <li>Blurred or faded test strips that make color interpretation difficult</li>
                  <li>Manual data entry errors</li>
                  <li>Non-standard or proprietary test kits with unusual color ranges</li>
                </ul>
                <p className="mt-2">
                  In uncertain cases, Ally will flag results and prompt a retest or manual verification before creating a plan.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Compatible Test Kits */}
          <AccordionItem value="compatibility" className="border border-border/50 rounded-lg px-6 bg-card/30 backdrop-blur-sm">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="text-lg font-semibold">Compatible Test Kits</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pt-2">
              <div>
                <p className="font-semibold text-foreground mb-2">Which test kits work with Ally?</p>
                <p className="mb-2">
                  Ally supports both <strong>test strips</strong> and <strong>liquid reagent kits</strong> from any standard brand that follows conventional color ranges for freshwater, saltwater, pool, or spa parameters. Strips are faster to scan, while liquid kits often yield more precise readings.
                </p>
              </div>
              
              <div>
                <p className="font-semibold text-foreground mb-2">Recommended brands:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Aquariums:</strong> API Freshwater and Saltwater Master Kits, Tetra EasyStrips, Seachem MultiTest, Aquaforest and Salifert marine test kits</li>
                  <li><strong>Pools & Spas:</strong> Clorox, AquaChek, Taylor test strips and liquid kits, digital salt readers</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">What doesn't work with Ally?</p>
                <p>
                  Kits that use <strong>digital meters</strong> (except salt readers), <strong>single-reactive indicators</strong>, or <strong>unconventional color gradients</strong> may not provide compatible visuals for photo interpretation. In these cases, you can manually input readings into Ally to receive accurate treatment recommendations.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Supported Aquatic Spaces */}
          <AccordionItem value="spaces" className="border border-border/50 rounded-lg px-6 bg-card/30 backdrop-blur-sm">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="text-lg font-semibold">Supported Aquatic Spaces</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pt-2">
              <div>
                <p className="font-semibold text-foreground mb-2">What types of aquatic spaces does Ally support?</p>
                <p className="mb-2">Ally provides full support for:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Aquariums:</strong> Freshwater, saltwater (marine), and brackish tanks</li>
                  <li><strong>Ponds:</strong> Koi ponds and garden ponds</li>
                  <li><strong>Pools:</strong> Chlorine pools and saltwater pools</li>
                  <li><strong>Spas/Hot Tubs:</strong> Chlorine and bromine systems</li>
                </ul>
                <p className="mt-2">Each type has customized parameter ranges, ideal targets, and care recommendations tailored to that specific environment.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Pricing & Plans */}
          <AccordionItem value="pricing" className="border border-border/50 rounded-lg px-6 bg-card/30 backdrop-blur-sm">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="text-lg font-semibold">Pricing & Plans</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pt-2">
              <div>
                <p className="font-semibold text-foreground mb-2">What's included in the free version?</p>
                <p className="mb-2">The <strong>Free Plan</strong> allows you to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Create one aquatic space (aquarium, pool, spa, or pond)</li>
                  <li>Log and analyze up to 5 tests per month</li>
                  <li>Receive basic AI recommendations and care reminders</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold text-foreground mb-2">What are the subscription tiers?</p>
                <div className="space-y-3 mt-2">
                  <div>
                    <p className="font-medium text-foreground">Basic – $9.99/month</p>
                    <p>Core AI guidance, space tracking, and 14-day clarity plans</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Plus – $14.99/month</p>
                    <p>Smart scheduling, equipment tracking, and custom notifications</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Gold – $19.99/month</p>
                    <p>Multi-space management, AI habit learning, and early access to connected device integration</p>
                  </div>
                </div>
                <p className="mt-3 text-sm">Annual pricing and business partner options are also available.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Data Security & Privacy */}
          <AccordionItem value="security" className="border border-border/50 rounded-lg px-6 bg-card/30 backdrop-blur-sm">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="text-lg font-semibold">Data Security & Privacy</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pt-2">
              <div>
                <p className="font-semibold text-foreground mb-2">How is my data stored?</p>
                <p>
                  All user data is securely stored using encrypted databases with real-time APIs. Our infrastructure is built on <strong>Google Cloud Platform</strong> and follows <strong>SOC 2</strong>, <strong>GDPR</strong>, and <strong>ISO 27001</strong> security frameworks.
                </p>
              </div>
              
              <div>
                <p className="font-semibold text-foreground mb-2">What data do you collect?</p>
                <p className="mb-2">Ally collects only data necessary for your water care experience:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Test results (photo or manual input)</li>
                  <li>Aquatic space details (name, volume, water type, livestock notes)</li>
                  <li>Optional email for account management</li>
                </ul>
                <p className="mt-2">No unnecessary personal data, location tracking, or background collection occurs.</p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">Do you share or sell user data?</p>
                <p>
                  <strong>Absolutely not.</strong> Ally does not sell, share, or trade user data. Aggregated, anonymized data may be used internally to improve AI accuracy, but never in a way that identifies individual users.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* How Ally Works */}
          <AccordionItem value="how-it-works" className="border border-border/50 rounded-lg px-6 bg-card/30 backdrop-blur-sm">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="text-lg font-semibold">How Ally Works</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pt-2">
              <div>
                <p className="font-semibold text-foreground mb-2">Does Ally work offline?</p>
                <p>
                  Ally requires an <strong>active internet connection</strong> for AI processing and cloud syncing. Photo analysis, data storage, and personalized care plan generation are powered by secure online systems to ensure accuracy and reliability.
                </p>
              </div>
              
              <div>
                <p className="font-semibold text-foreground mb-2">How long does analysis take?</p>
                <p>
                  Most results are analyzed and processed in <strong>under 10 seconds</strong>. Ally uses lightweight inference models optimized for speed while maintaining precision.
                </p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">Can I manually enter test values?</p>
                <p>
                  Yes! You can either <strong>upload a photo</strong> of your test or <strong>manually enter readings</strong>. Ally's AI adapts to both workflows, producing the same clarity and dosing recommendations regardless of input method.
                </p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">Is my test history saved?</p>
                <p>
                  Yes. All test results are securely stored and viewable in the History section. You can track progress, compare changes over time, and export reports if desired.
                </p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">When will Ally be available?</p>
                <p>
                  Ally is currently in <strong>active development</strong> with early access rolling out through select aquatic partners and beta testers. The public app release is scheduled for <strong>early 2025</strong>, with ongoing updates and new features following shortly after launch.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Weather Features */}
          <AccordionItem value="weather" className="border border-border/50 rounded-lg px-6 bg-card/30 backdrop-blur-sm">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="text-lg font-semibold">Weather Integration</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pt-2">
              <div>
                <p className="font-semibold text-foreground mb-2">What weather features does Ally offer?</p>
                <p className="mb-2">Ally provides comprehensive weather integration to help you plan outdoor maintenance:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Current conditions:</strong> Temperature, feels like, humidity, wind speed, and UV index</li>
                  <li><strong>Hourly forecast:</strong> 24 hour temperature and conditions timeline</li>
                  <li><strong>5 day forecast:</strong> Daily highs, lows, and UV levels for planning ahead</li>
                  <li><strong>Dynamic dashboard:</strong> Weather aware backgrounds that change with conditions</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold text-foreground mb-2">How does weather help with water care?</p>
                <p>
                  Weather data is especially valuable for <strong>pool and spa owners</strong>. UV levels affect chlorine degradation, temperature impacts chemical balance, and knowing when rain is coming helps you plan shock treatments and water testing. Ally uses this data to provide smarter maintenance recommendations.
                </p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">Is location sharing required?</p>
                <p>
                  Weather features are <strong>completely optional</strong>. You can enable them in Settings by sharing your location. If you prefer not to share location, Ally works perfectly without weather data. Your location is used only to fetch local weather and is never stored or shared.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
