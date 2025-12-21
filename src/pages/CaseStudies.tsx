import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ArrowRight, Fish, Waves, Droplets, TrendingUp, Clock, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface CaseStudy {
  id: string;
  title: string;
  customer: string;
  industry: string;
  waterType: "aquarium" | "pool" | "spa";
  challenge: string;
  solution: string;
  results: { metric: string; value: string }[];
  quote: string;
  image: string | null;
  featured: boolean;
}

const CaseStudies = () => {
  // Placeholder case studies - replace with real customer stories
  const caseStudies: CaseStudy[] = [
    {
      id: "case-study-1",
      title: "[CASE STUDY TITLE 1]",
      customer: "[CUSTOMER NAME / COMPANY]",
      industry: "[INDUSTRY - e.g., Home Aquarium Hobbyist]",
      waterType: "aquarium",
      challenge: "[PLACEHOLDER: Describe the customer's challenge before using Ally. What problems were they facing? What was their pain point?]",
      solution: "[PLACEHOLDER: How did Ally help solve their problem? What features did they use?]",
      results: [
        { metric: "[METRIC 1 - e.g., Time Saved]", value: "[VALUE - e.g., 5 hours/week]" },
        { metric: "[METRIC 2 - e.g., Fish Survival Rate]", value: "[VALUE - e.g., 95%]" },
        { metric: "[METRIC 3 - e.g., Cost Reduction]", value: "[VALUE - e.g., 40%]" },
      ],
      quote: "[PLACEHOLDER: Customer testimonial quote about their experience with Ally]",
      image: null,
      featured: true,
    },
    {
      id: "case-study-2",
      title: "[CASE STUDY TITLE 2]",
      customer: "[CUSTOMER NAME / COMPANY]",
      industry: "[INDUSTRY - e.g., Pool Service Company]",
      waterType: "pool",
      challenge: "[PLACEHOLDER: Customer challenge description]",
      solution: "[PLACEHOLDER: How Ally helped]",
      results: [
        { metric: "[METRIC 1]", value: "[VALUE]" },
        { metric: "[METRIC 2]", value: "[VALUE]" },
      ],
      quote: "[PLACEHOLDER: Customer quote]",
      image: null,
      featured: false,
    },
    {
      id: "case-study-3",
      title: "[CASE STUDY TITLE 3]",
      customer: "[CUSTOMER NAME / COMPANY]",
      industry: "[INDUSTRY - e.g., Resort & Spa]",
      waterType: "spa",
      challenge: "[PLACEHOLDER: Customer challenge description]",
      solution: "[PLACEHOLDER: How Ally helped]",
      results: [
        { metric: "[METRIC 1]", value: "[VALUE]" },
        { metric: "[METRIC 2]", value: "[VALUE]" },
      ],
      quote: "[PLACEHOLDER: Customer quote]",
      image: null,
      featured: false,
    },
  ];

  const getWaterTypeIcon = (type: CaseStudy["waterType"]) => {
    switch (type) {
      case "aquarium":
        return <Fish className="h-5 w-5" />;
      case "pool":
        return <Waves className="h-5 w-5" />;
      case "spa":
        return <Droplets className="h-5 w-5" />;
    }
  };

  const getWaterTypeLabel = (type: CaseStudy["waterType"]) => {
    switch (type) {
      case "aquarium":
        return "Aquarium";
      case "pool":
        return "Pool";
      case "spa":
        return "Spa & Hot Tub";
    }
  };

  const featuredStudy = caseStudies.find((cs) => cs.featured);
  const otherStudies = caseStudies.filter((cs) => !cs.featured);

  return (
    <div className="min-h-screen">
      <SEO 
        title="Case Studies"
        description="Discover how aquarium hobbyists, pool owners, and spa operators use Ally to transform their water care routine. Real success stories with measurable results."
        path="/case-studies"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4">Success Stories</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Case Studies
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how real customers are achieving better water quality, saving time, and reducing costs with Ally.
          </p>
        </div>

        {/* Placeholder Notice */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-12">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>PLACEHOLDER:</strong> Replace all case studies with real customer stories. Obtain written permission from customers before publishing. Include actual metrics and verifiable results.
          </p>
        </div>

        {/* Featured Case Study */}
        {featuredStudy && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Featured Story</h2>
            <Card className="overflow-hidden">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 lg:p-12">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="gap-1">
                      {getWaterTypeIcon(featuredStudy.waterType)}
                      {getWaterTypeLabel(featuredStudy.waterType)}
                    </Badge>
                    <Badge variant="secondary">{featuredStudy.industry}</Badge>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2 text-foreground">{featuredStudy.title}</h3>
                  <p className="text-muted-foreground mb-6">{featuredStudy.customer}</p>
                  
                  <div className="space-y-4 mb-8">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">The Challenge</h4>
                      <p className="text-muted-foreground">{featuredStudy.challenge}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">The Solution</h4>
                      <p className="text-muted-foreground">{featuredStudy.solution}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {featuredStudy.results.map((result, index) => (
                      <div key={index} className="text-center p-4 bg-primary/5 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{result.value}</div>
                        <div className="text-xs text-muted-foreground">{result.metric}</div>
                      </div>
                    ))}
                  </div>

                  <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                    "{featuredStudy.quote}"
                  </blockquote>
                </div>
                <div className="bg-muted/30 flex items-center justify-center min-h-[400px]">
                  <div className="text-center p-8">
                    <Award className="h-16 w-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">[CUSTOMER PHOTO OR SETUP IMAGE]</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Other Case Studies */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-foreground">More Success Stories</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {otherStudies.map((study) => (
              <Card key={study.id} className="flex flex-col">
                <div className="h-48 bg-muted/30 flex items-center justify-center">
                  <div className="text-center p-4">
                    {getWaterTypeIcon(study.waterType)}
                    <p className="text-muted-foreground mt-2">[CUSTOMER IMAGE]</p>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="gap-1">
                      {getWaterTypeIcon(study.waterType)}
                      {getWaterTypeLabel(study.waterType)}
                    </Badge>
                  </div>
                  <CardTitle>{study.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{study.customer}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-muted-foreground mb-4 flex-1">{study.challenge}</p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {study.results.slice(0, 2).map((result, index) => (
                      <div key={index} className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-foreground">{result.value}</div>
                        <div className="text-xs text-muted-foreground">{result.metric}</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      <strong>PLACEHOLDER:</strong> Add link to full case study page.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Results Summary */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-foreground text-center">Aggregate Results</h2>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
              <strong>PLACEHOLDER:</strong> Add verified aggregate statistics across all customers.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">[X]%</div>
                <div className="text-sm text-muted-foreground">Average Time Saved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">[X]%</div>
                <div className="text-sm text-muted-foreground">Improvement in Water Quality</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Fish className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">[X]%</div>
                <div className="text-sm text-muted-foreground">Healthier Inhabitants</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">[X]%</div>
                <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Write Your Success Story?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of water care enthusiasts who are achieving better results with less effort.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>PLACEHOLDER:</strong> Add CTA buttons for signup and contact.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CaseStudies;
