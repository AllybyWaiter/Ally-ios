import appMockup from "@/assets/app-mockup.png";
import { Badge } from "@/components/ui/badge";
const AppShowcase = () => {
  return <section className="py-20 px-4 bg-gradient-hero">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Coming Soon to iOS & Android
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              The Tesla of Water Care in Your Pocket
            </h2>
            <p className="text-xl text-muted-foreground mb-8">Professional water care for aquariums, pools, and spas. Designed for simplicity, powered by intelligent AI.</p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Voice & Photo Input</h4>
                  <p className="text-muted-foreground">Talk to Ally or snap a photo. No typing required.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Smart Notifications</h4>
                  <p className="text-muted-foreground">Push alerts for tasks, trends, and maintenance reminders.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Trend Detection</h4>
                  <p className="text-muted-foreground">AI spots issues before they become problems.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-water blur-3xl opacity-20 rounded-full" />
            <img alt="Ally 1.0 Thinking - AI Chat Interface" className="relative w-full max-w-md mx-auto drop-shadow-2xl rounded-2xl" src="/images/ally-thinking-promo.png" />
          </div>
        </div>
      </div>
    </section>;
};
export default AppShowcase;