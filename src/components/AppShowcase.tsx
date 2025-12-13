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
            <p className="text-xl text-muted-foreground mb-8">Our sleek, intuitive app puts professional grade water analysis at your fingertips. Designed for simplicity, powered by cutting edge AI.</p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Real Time Monitoring</h4>
                  <p className="text-muted-foreground">Track all parameters in one beautiful dashboard</p>
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
                  <p className="text-muted-foreground">Never miss a maintenance task or water issue</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Historical Insights</h4>
                  <p className="text-muted-foreground">Understand trends and optimize your care routine</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-water blur-3xl opacity-20 rounded-full" />
            <img alt="Ally App Interface" className="relative w-full max-w-md mx-auto drop-shadow-2xl" src="/lovable-uploads/71e85e7c-168f-4a25-8650-7e3bd25859d4.png" />
          </div>
        </div>
      </div>
    </section>;
};
export default AppShowcase;