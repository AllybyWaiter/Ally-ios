import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Star, Quote, Fish, Waves, Droplets } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Testimonials = () => {
  // Placeholder testimonials - replace with real customer stories
  const testimonials = [
    {
      id: 1,
      category: "aquarium",
      name: "[CUSTOMER NAME]",
      role: "[ROLE - e.g., Reef Aquarium Hobbyist]",
      location: "[CITY, STATE]",
      rating: 5,
      quote: "[PLACEHOLDER: Customer testimonial about their aquarium experience with Ally. Should be 2-3 sentences highlighting specific benefits.]",
      image: null, // Add customer photo URL when available
      waterType: "Saltwater Reef",
      useCase: "[USE CASE - e.g., 120-gallon mixed reef tank]",
    },
    {
      id: 2,
      category: "aquarium",
      name: "[CUSTOMER NAME]",
      role: "[ROLE - e.g., Freshwater Enthusiast]",
      location: "[CITY, STATE]",
      rating: 5,
      quote: "[PLACEHOLDER: Customer testimonial focusing on AI insights and time saved. Should mention specific features they love.]",
      image: null,
      waterType: "Freshwater Planted",
      useCase: "[USE CASE]",
    },
    {
      id: 3,
      category: "pool",
      name: "[CUSTOMER NAME]",
      role: "[ROLE - e.g., Pool Owner]",
      location: "[CITY, STATE]",
      rating: 5,
      quote: "[PLACEHOLDER: Pool owner testimonial about simplified maintenance and water chemistry management.]",
      image: null,
      waterType: "Swimming Pool",
      useCase: "[USE CASE - e.g., 20,000-gallon in-ground pool]",
    },
    {
      id: 4,
      category: "pool",
      name: "[CUSTOMER NAME]",
      role: "[ROLE - e.g., Property Manager]",
      location: "[CITY, STATE]",
      rating: 5,
      quote: "[PLACEHOLDER: Commercial pool testimonial about managing multiple pools efficiently.]",
      image: null,
      waterType: "Commercial Pool",
      useCase: "[USE CASE]",
    },
    {
      id: 5,
      category: "spa",
      name: "[CUSTOMER NAME]",
      role: "[ROLE - e.g., Hot Tub Owner]",
      location: "[CITY, STATE]",
      rating: 5,
      quote: "[PLACEHOLDER: Hot tub/spa owner testimonial about easy maintenance and clear water.]",
      image: null,
      waterType: "Hot Tub",
      useCase: "[USE CASE]",
    },
    {
      id: 6,
      category: "aquarium",
      name: "[CUSTOMER NAME]",
      role: "[ROLE - e.g., Koi Pond Keeper]",
      location: "[CITY, STATE]",
      rating: 5,
      quote: "[PLACEHOLDER: Pond keeper testimonial about outdoor water body management.]",
      image: null,
      waterType: "Koi Pond",
      useCase: "[USE CASE]",
    },
  ];

  const stats = [
    { label: "[STAT LABEL - e.g., Active Users]", value: "[VALUE]" },
    { label: "[STAT LABEL - e.g., Water Tests Logged]", value: "[VALUE]" },
    { label: "[STAT LABEL - e.g., AI Recommendations]", value: "[VALUE]" },
    { label: "[STAT LABEL - e.g., Customer Satisfaction]", value: "[VALUE]%" },
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
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mt-6 max-w-xl mx-auto">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Replace all testimonials with real customer quotes. Obtain written consent for each testimonial.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
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
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground">
                    {testimonial.name.charAt(0) === "[" ? "?" : testimonial.name.charAt(0)}
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

        {/* Featured Case Study Placeholder */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Featured Success Story</h2>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add a detailed case study with before/after metrics, customer interview, and photos.
            </p>
          </div>
          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">[CASE STUDY TITLE]</h3>
                <p className="text-muted-foreground mb-4">
                  [PLACEHOLDER: Detailed story about a customer's journey with Ally. Include their challenges before using the app, how they discovered Ally, and the results they achieved.]
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Saved:</span>
                    <span className="font-semibold text-foreground">[X hours/week]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Water Quality Improvement:</span>
                    <span className="font-semibold text-foreground">[X%]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Using Ally Since:</span>
                    <span className="font-semibold text-foreground">[DATE]</span>
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg flex items-center justify-center min-h-[200px]">
                <p className="text-muted-foreground">[CUSTOMER PHOTO OR AQUARIUM/POOL PHOTO]</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Video Testimonials Placeholder */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Video Testimonials</h2>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add embedded video testimonials when available. Consider YouTube or Vimeo embeds.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="aspect-video flex items-center justify-center bg-muted/30">
              <p className="text-muted-foreground">[VIDEO TESTIMONIAL 1]</p>
            </Card>
            <Card className="aspect-video flex items-center justify-center bg-muted/30">
              <p className="text-muted-foreground">[VIDEO TESTIMONIAL 2]</p>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Join Our Community?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of water care enthusiasts who trust Ally for their aquarium, pool, and spa maintenance.
          </p>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add CTA button linking to signup or app download.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Testimonials;
