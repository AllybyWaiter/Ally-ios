import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AllySupportChat from "@/components/AllySupportChat";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-text bg-clip-text text-transparent">
              About Ally
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We're on a mission to make aquarium care effortless for everyone, from beginners to seasoned aquarists.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold mb-6">Ally by WA.I.TER — Our Story</h2>
              <p className="text-muted-foreground mb-4">
                Ally started with a simple but frustrating truth: water care shouldn't be this complicated.
                Whether it's a home aquarium or a backyard pool, people were guessing, Googling, or paying someone else to handle what should be simple — keeping water healthy, balanced, and beautiful.
              </p>
              <p className="text-muted-foreground mb-4">
                Founded by Jacob Stephens, Ally was born from the belief that AI could make water care effortless, accurate, and empowering. Instead of replacing people, Ally was designed to act like a real partner — a digital water expert that always knows what's happening and what to do next.
              </p>
              <p className="text-muted-foreground mb-4">
                What began as a smart aquarium app is evolving into a full ecosystem — from auto-testers and dosers to intelligent insights that help homeowners, hobbyists, and businesses alike.
                Ally is pioneering "hands-free water care" — where clarity, chemistry, and confidence all flow together.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">Intelligence You Can Trust</h3>
                    <p className="text-muted-foreground">
                      Every insight Ally gives is grounded in data, accuracy, and transparency — not gimmicks or marketing fluff. Our AI is designed to earn trust, not just automate tasks.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">Effortless Clarity</h3>
                    <p className="text-muted-foreground">
                      Water care should feel simple, sleek, and intuitive. Every feature, from test logging to care plans, is built to remove friction — so users focus on enjoying their tanks or pools, not managing them.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">Precision Meets Design</h3>
                    <p className="text-muted-foreground">
                      Ally merges scientific precision with Tesla-level design — smart, minimal, and modern. We believe technology should look as good as it performs.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-3 flex justify-center gap-8">
                <div className="space-y-3 max-w-md">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-primary font-bold">4</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl mb-2">Partnership Over Product</h3>
                      <p className="text-muted-foreground">
                        Ally isn't just software — it's a water-care companion. We design every feature around how real people think, test, and maintain their water spaces.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 max-w-md">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-primary font-bold">5</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl mb-2">Sustainable by Default</h3>
                      <p className="text-muted-foreground">
                        Good water care protects more than tanks and pools — it protects the environment. Ally's dosing and guidance are optimized to reduce chemical waste and promote responsible stewardship.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Launch Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto bg-gradient-water rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Join Us on This Journey</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Ally is launching in early 2025. Be among the first to experience the future of aquarium care.
            </p>
            <Link 
              to="/" 
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Join the Waitlist
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <AllySupportChat />
    </div>
  );
};

export default About;
