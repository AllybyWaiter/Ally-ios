import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Target, Users } from "lucide-react";

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
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                Ally was born from a simple observation: aquarium care shouldn't be complicated. Too many passionate aquarists struggle with water testing, maintenance schedules, and knowing when something is wrong with their aquatic ecosystem.
              </p>
              <p className="text-muted-foreground mb-4">
                We combined cutting-edge AI technology with decades of aquarium expertise to create an intelligent companion that helps you maintain pristine water conditions. Whether you're caring for a single betta or managing multiple reef tanks, Ally adapts to your needs and grows smarter with every interaction.
              </p>
              <p className="text-muted-foreground">
                Our team at WA.I.TER is dedicated to revolutionizing aquarium care through innovation, making it accessible, predictive, and stress-free for hobbyists worldwide.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Care First</h3>
                <p className="text-muted-foreground">
                  We prioritize the health and wellbeing of your aquatic life above everything else.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Precision</h3>
                <p className="text-muted-foreground">
                  AI-powered insights that give you accurate, actionable recommendations every time.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Community</h3>
                <p className="text-muted-foreground">
                  Building a supportive community where aquarists of all levels can thrive together.
                </p>
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
    </div>
  );
};

export default About;
