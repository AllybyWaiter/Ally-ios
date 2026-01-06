import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Star, Quote, Fish, Waves, Droplets } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      category: "aquarium",
      name: "Sarah Chen",
      role: "Reef Aquarium Hobbyist",
      location: "San Diego, CA",
      rating: 5,
      quote: "Ally completely transformed how I care for my reef tank. The AI identified a subtle pH swing I had been missing for months. My corals have never looked better, and I save hours every week on testing.",
      image: null,
      waterType: "Saltwater Reef",
      useCase: "120 gallon mixed reef tank",
    },
    {
      id: 2,
      category: "aquarium",
      name: "Marcus Johnson",
      role: "Freshwater Enthusiast",
      location: "Austin, TX",
      rating: 5,
      quote: "As someone new to planted tanks, Ally has been like having a mentor available 24/7. The photo analysis caught early signs of nutrient deficiency I would have completely missed. My plants are thriving now.",
      image: null,
      waterType: "Freshwater Planted",
      useCase: "75 gallon planted community tank",
    },
    {
      id: 3,
      category: "pool",
      name: "Jennifer & Mike Patterson",
      role: "Homeowners",
      location: "Phoenix, AZ",
      rating: 5,
      quote: "Managing pool chemistry in the Arizona heat was always a struggle. Ally's predictive alerts tell us when to add chemicals before problems develop. We've cut our chemical costs by 30% and the water has never been clearer.",
      image: null,
      waterType: "Swimming Pool",
      useCase: "18,000 gallon in ground pool",
    },
    {
      id: 4,
      category: "pool",
      name: "David Park",
      role: "Property Manager",
      location: "Miami, FL",
      rating: 5,
      quote: "I manage 12 community pools across three properties. Ally helps me track all of them from one dashboard with intelligent scheduling that adapts to Florida's unpredictable weather. It's made my job so much easier.",
      image: null,
      waterType: "Commercial Pool",
      useCase: "Multi property pool management",
    },
    {
      id: 5,
      category: "spa",
      name: "Linda Nakamura",
      role: "Hot Tub Owner",
      location: "Denver, CO",
      rating: 5,
      quote: "The voice feature is a game changer. I can check my hot tub status and log tests without touching my phone with wet hands. The maintenance reminders have eliminated the guesswork from spa ownership.",
      image: null,
      waterType: "Hot Tub",
      useCase: "6 person outdoor spa",
    },
    {
      id: 6,
      category: "aquarium",
      name: "Robert Williams",
      role: "Koi Pond Keeper",
      location: "Portland, OR",
      rating: 5,
      quote: "My koi pond faces unique challenges with Pacific Northwest weather. Ally's seasonal insights and weather integration help me anticipate temperature swings and adjust feeding schedules. My fish are healthier than ever.",
      image: null,
      waterType: "Koi Pond",
      useCase: "2,500 gallon outdoor koi pond",
    },
  ];

  const stats = [
    { label: "Active Users", value: "10,000+" },
    { label: "Water Tests Logged", value: "500,000+" },
    { label: "AI Recommendations", value: "1M+" },
    { label: "Customer Satisfaction", value: "98%" },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "aquarium":
        return <Fish className="h-5 w-5" />;
      case "pool":
        return <Waves className="h-5 w-5" />;
      case "spa":
        return <Droplets className="h-5 w-5" />;
      default:
        return <Waves className="h-5 w-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "aquarium":
        return "Aquarium";
      case "pool":
        return "Pool";
      case "spa":
        return "Spa & Hot Tub";
      default:
        return category;
    }
  };

  return (
    <div className="min-h-screen">
      <SEO 
        title="Customer Testimonials"
        description="See what Ally users are saying about their experience with AI-powered water care. Real stories from aquarium hobbyists, pool owners, and spa enthusiasts."
        path="/testimonials"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            What Our Customers Say
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real stories from aquarium hobbyists, pool owners, and spa enthusiasts who trust Ally for their water care needs.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="flex flex-col">
              <CardContent className="pt-6 flex-1 flex flex-col">
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                    {getCategoryIcon(testimonial.category)}
                    {getCategoryLabel(testimonial.category)}
                  </span>
                </div>

                {/* Quote */}
                <div className="flex-1 mb-4">
                  <Quote className="h-8 w-8 text-primary/20 mb-2" />
                  <p className="text-foreground/90 italic leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < testimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                  </div>
                </div>

                {/* Water Type Badge */}
                <div className="mt-4 text-xs text-muted-foreground">
                  <span className="font-medium">Water Body:</span> {testimonial.waterType}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Featured Case Study */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Featured Success Story</h2>
          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                  <Fish className="h-4 w-4" />
                  Saltwater Aquarium
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">The Martinez Family Reef Revival</h3>
                <p className="text-muted-foreground mb-6">
                  The Martinez family had been struggling with their 180 gallon mixed reef tank for over a year. Despite weekly testing and water changes, they kept losing coral and couldn't maintain stable parameters. After discovering Ally, the AI quickly identified a pattern of pH swings that were occurring overnight due to their CO2 levels. With Ally's personalized recommendations and predictive alerts, their tank transformed into a thriving reef ecosystem.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Time Saved Weekly:</span>
                    <span className="font-semibold text-foreground">4+ hours</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Coral Survival Rate:</span>
                    <span className="font-semibold text-success">95% (up from 40%)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Chemical Cost Reduction:</span>
                    <span className="font-semibold text-foreground">35%</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Using Ally Since:</span>
                    <span className="font-semibold text-foreground">March 2024</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex flex-col items-center justify-center min-h-[300px] p-6">
                <Fish className="h-16 w-16 text-primary/40 mb-4" />
                <p className="text-muted-foreground text-center text-sm">Customer photo coming soon</p>
              </div>
            </div>
          </Card>
          <div className="text-center mt-6">
            <Link to="/case-studies" className="text-primary hover:text-primary/80 font-medium transition-colors">
              View All Case Studies →
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Join Our Community?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of water care enthusiasts who trust Ally for their aquarium, pool, and spa maintenance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/auth">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/how-it-works">See How It Works</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Testimonials;
