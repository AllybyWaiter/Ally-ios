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
                <p className="font-semibold text-foreground mb-2">What is Ally 1.0 Thinking?</p>
                <p>
                  Ally 1.0 Thinking is our premium AI model that uses advanced reasoning for complex questions. It provides deeper analysis and more thorough explanations for challenging water chemistry problems. Available for Gold, Business, and Enterprise tier users.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Voice & Hands-Free */}
          <AccordionItem value="voice" className="border border-border/50 rounded-lg px-6 bg-card/30 backdrop-blur-sm">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="text-lg font-semibold">Voice & Hands-Free Mode</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pt-2">
              <div>
                <p className="font-semibold text-foreground mb-2">Can I talk to Ally using my voice?</p>
                <p>
                  Yes! Ally supports full voice interaction. Tap the microphone to speak your question, and Ally will transcribe it using advanced speech recognition. You can also have Ally speak responses aloud using natural text-to-speech.
                </p>
              </div>
              
              <div>
                <p className="font-semibold text-foreground mb-2">What is hands-free mode?</p>
                <p>
                  Hands-free mode enables a fully voice-driven conversation. When enabled, your spoken messages are automatically sent after transcription, and Ally's responses are automatically spoken aloud. Perfect for when your hands are wet or busy with maintenance.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Photo Galleries */}
          <AccordionItem value="photos" className="border border-border/50 rounded-lg px-6 bg-card/30 backdrop-blur-sm">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="text-lg font-semibold">Photo Galleries</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pt-2">
              <div>
                <p className="font-semibold text-foreground mb-2">Can I take photos of my fish and plants?</p>
                <p>
                  Yes! Ally includes photo galleries for both livestock and plants. Create a visual journal of your fish, invertebrates, corals, and plants over time. Add captions, dates, and set primary profile photos for each.
                </p>
              </div>
              
              <div>
                <p className="font-semibold text-foreground mb-2">How do I track health changes visually?</p>
                <p>
                  Each livestock and plant entry has a dedicated Photos tab. Upload photos over time to create a timeline that helps you track growth, color changes, and health. This visual history is invaluable for identifying gradual changes or diagnosing issues.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Push Notifications */}
          <AccordionItem value="notifications" className="border border-border/50 rounded-lg px-6 bg-card/30 backdrop-blur-sm">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="text-lg font-semibold">Push Notifications</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pt-2">
              <div>
                <p className="font-semibold text-foreground mb-2">What notifications does Ally send?</p>
                <p>
                  Ally sends three types of push notifications: task reminders (upcoming and overdue maintenance), water alerts (critical parameter warnings and trend alerts), and announcements (app updates and tips). Each type has distinct vibration patterns so you can tell them apart.
                </p>
              </div>
              
              <div>
                <p className="font-semibold text-foreground mb-2">Can I customize notifications?</p>
                <p>
                  Yes! In Settings you can toggle each notification type on/off, set reminder timing (24h, 12h, 6h, or 1h before tasks), configure quiet hours, and enable/disable sounds for each category. You're in complete control.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* PWA & Installation */}
          <AccordionItem value="pwa" className="border border-border/50 rounded-lg px-6 bg-card/30 backdrop-blur-sm">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="text-lg font-semibold">Installation & Offline</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pt-2">
              <div>
                <p className="font-semibold text-foreground mb-2">Can I install Ally on my phone?</p>
                <p>
                  Yes! Ally is a Progressive Web App (PWA) that can be installed on any device. On iOS, tap Share then "Add to Home Screen". On Android, you'll see an install prompt automatically. Once installed, it works like a native app with its own icon.
                </p>
              </div>
              
              <div>
                <p className="font-semibold text-foreground mb-2">Does Ally work offline?</p>
                <p>
                  Ally caches your data locally so you can view your aquatic spaces, test history, and tasks even without internet. AI features and syncing require a connection, but previously loaded data remains accessible offline.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Proactive Alerts */}
          <AccordionItem value="alerts" className="border border-border/50 rounded-lg px-6 bg-card/30 backdrop-blur-sm">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="text-lg font-semibold">Proactive AI Alerts</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4 pt-2">
              <div>
                <p className="font-semibold text-foreground mb-2">What are proactive alerts?</p>
                <p>
                  Ally's AI analyzes your water test history to detect concerning patterns before they become problems. Rising nitrates, falling pH, unstable parameters - Ally spots these trends and alerts you with specific recommendations, timeframes, and which inhabitants might be affected.
                </p>
              </div>
              
              <div>
                <p className="font-semibold text-foreground mb-2">Who gets AI-powered alerts?</p>
                <p>
                  AI-powered trend analysis is available to Plus, Gold, Business, and Enterprise tier users. Free and Basic tier users receive rule-based alerts. Both tiers get alerted to critical issues - the AI tier provides earlier, more predictive warnings.
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
                  <li><strong>Weather-aware suggestions:</strong> AI maintenance recommendations based on UV, rain, and temperature</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
