import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Briefcase, MapPin, Clock, Heart, Zap, Users, GraduationCap, Coffee, Globe, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Careers = () => {
  const benefits = [
    {
      icon: Globe,
      title: "Remote-First Culture",
      description: "[PLACEHOLDER: Describe remote work policies, flexibility, and time zone considerations]",
    },
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "[PLACEHOLDER: Describe health insurance, mental health support, wellness programs]",
    },
    {
      icon: GraduationCap,
      title: "Learning & Development",
      description: "[PLACEHOLDER: Describe training budget, conference attendance, skill development programs]",
    },
    {
      icon: Zap,
      title: "Competitive Compensation",
      description: "[PLACEHOLDER: Describe salary, equity options, bonuses, and benefits package]",
    },
    {
      icon: Coffee,
      title: "Work-Life Balance",
      description: "[PLACEHOLDER: Describe PTO policy, flexible hours, sabbatical options]",
    },
    {
      icon: Users,
      title: "Team Retreats",
      description: "[PLACEHOLDER: Describe company retreats, team bonding activities, social events]",
    },
  ];

  const openPositions = [
    {
      title: "[POSITION TITLE 1 - e.g., Senior Frontend Developer]",
      department: "[DEPARTMENT - e.g., Engineering]",
      location: "[LOCATION - e.g., Remote (US)]",
      type: "[TYPE - e.g., Full-time]",
    },
    {
      title: "[POSITION TITLE 2 - e.g., Product Designer]",
      department: "[DEPARTMENT - e.g., Design]",
      location: "[LOCATION]",
      type: "[TYPE]",
    },
    {
      title: "[POSITION TITLE 3 - e.g., Customer Success Manager]",
      department: "[DEPARTMENT - e.g., Customer Support]",
      location: "[LOCATION]",
      type: "[TYPE]",
    },
  ];

  const values = [
    {
      title: "User-Obsessed",
      description: "[PLACEHOLDER: Describe focus on user needs and customer satisfaction]",
    },
    {
      title: "Continuous Learning",
      description: "[PLACEHOLDER: Describe growth mindset and learning culture]",
    },
    {
      title: "Radical Transparency",
      description: "[PLACEHOLDER: Describe open communication and honest feedback]",
    },
    {
      title: "Move Fast & Ship",
      description: "[PLACEHOLDER: Describe agile approach and shipping mentality]",
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Careers"
        description="Join the Ally team and help revolutionize water care. Explore open positions, benefits, and our company culture."
        path="/careers"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Join Our Team
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Help us build the future of water care technology. We're looking for passionate people to join our mission.
          </p>
        </div>

        {/* Placeholder Notice */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-12">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>PLACEHOLDER:</strong> All job listings, benefits, and company information should be reviewed and updated by HR and leadership before publishing.
          </p>
        </div>

        {/* Why Work at Ally */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Why Work at Ally?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Our Culture */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Our Culture & Values</h2>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Define your actual company values and culture pillars.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <div key={index} className="p-6 bg-muted/30 rounded-lg border">
                <h3 className="text-xl font-semibold mb-2 text-foreground">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Open Positions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Open Positions</h2>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add actual job listings with full descriptions, requirements, and application links.
            </p>
          </div>
          <div className="space-y-4">
            {openPositions.map((position, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{position.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{position.department}</Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {position.location}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {position.type}
                        </Badge>
                      </div>
                    </div>
                    <Button className="shrink-0">
                      View Position
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Application Process */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Our Hiring Process</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Apply", description: "[PLACEHOLDER: Describe application review process]" },
              { step: "2", title: "Screen", description: "[PLACEHOLDER: Describe initial screening call]" },
              { step: "3", title: "Interview", description: "[PLACEHOLDER: Describe interview rounds]" },
              { step: "4", title: "Offer", description: "[PLACEHOLDER: Describe offer and onboarding]" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Don't See the Right Role?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            We're always looking for talented people. Send us your resume and tell us how you can contribute to our mission.
          </p>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add careers email or link to general application form.
            </p>
          </div>
          <Button size="lg">
            Send General Application
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
