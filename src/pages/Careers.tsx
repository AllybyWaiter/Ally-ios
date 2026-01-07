import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Briefcase, MapPin, Clock, Heart, Zap, Users, GraduationCap, Coffee, Globe, ArrowRight, Sparkles, Target, MessageSquare, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Careers = () => {
  const benefits = [
    {
      icon: Globe,
      title: "Remote-First Culture",
      description: "Work from anywhere in the world. We believe great talent isn't confined to one location. Flexible hours that respect your time zone, async communication tools, and quarterly virtual team gatherings.",
    },
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive medical, dental, and vision coverage for you and your family. Mental health support through therapy stipends, wellness app subscriptions, and monthly wellness days off.",
    },
    {
      icon: GraduationCap,
      title: "Learning & Development",
      description: "$2,000 annual learning budget for courses, conferences, and certifications. Regular lunch & learns, mentorship programs, and opportunities to attend industry events.",
    },
    {
      icon: Zap,
      title: "Competitive Compensation",
      description: "Salary benchmarked to top-tier companies. Equity options for all employees so you share in our success. Annual performance bonuses and regular compensation reviews.",
    },
    {
      icon: Coffee,
      title: "Work-Life Balance",
      description: "Unlimited PTO with a minimum 3-week requirement to ensure you actually rest. Flexible hours, no weekend expectations, and a 4-day workweek pilot program.",
    },
    {
      icon: Users,
      title: "Team Retreats",
      description: "Annual all-hands retreat in a new location each year. Regional team meetups, virtual game nights, and budget for local coworking when you want company.",
    },
  ];

  const openPositions = [
    {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Remote (US/Europe)",
      type: "Full-time",
      description: "Build beautiful, performant React interfaces that help users manage their aquariums, pools, and spas.",
    },
    {
      title: "Machine Learning Engineer",
      department: "AI & Data",
      location: "Remote (Global)",
      type: "Full-time",
      description: "Develop AI models for water test photo analysis and predictive maintenance recommendations.",
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote (US/Canada)",
      type: "Full-time",
      description: "Design intuitive experiences that make complex water chemistry simple and accessible for everyone.",
    },
    {
      title: "Customer Success Manager",
      department: "Customer Support",
      location: "Remote (US)",
      type: "Full-time",
      description: "Help users get the most out of Ally while gathering insights to improve our product.",
    },
    {
      title: "Content Marketing Manager",
      department: "Marketing",
      location: "Remote (Global)",
      type: "Full-time",
      description: "Create educational content that establishes Ally as the authority in water care technology.",
    },
  ];

  const values = [
    {
      icon: Target,
      title: "User-Obsessed",
      description: "Every decision starts with our users. We talk to aquarium hobbyists, pool owners, and spa enthusiasts daily. Their challenges drive our roadmap, and their success is our success.",
    },
    {
      icon: Sparkles,
      title: "Continuous Learning",
      description: "We're building technology in a niche space, which means we're all constantly learning—about water chemistry, AI, and each other. Curiosity is celebrated, and there are no \"dumb questions.\"",
    },
    {
      icon: MessageSquare,
      title: "Radical Transparency",
      description: "Open salaries, shared metrics, and honest feedback. We share company financials monthly and encourage direct, respectful communication at all levels.",
    },
    {
      icon: Rocket,
      title: "Move Fast & Ship",
      description: "We prefer shipping a good solution today over a perfect one next month. We iterate based on real user feedback, celebrate experiments (even failed ones), and learn quickly.",
    },
  ];

  const hiringSteps = [
    { 
      step: "1", 
      title: "Apply", 
      description: "Submit your resume and a brief note about why you're excited about water care technology. We review every application within 5 business days." 
    },
    { 
      step: "2", 
      title: "Screen", 
      description: "A 30-minute call with our recruiting team to learn about your background, answer your questions, and ensure mutual fit." 
    },
    { 
      step: "3", 
      title: "Interview", 
      description: "2-3 focused interviews with team members. Technical roles include a practical exercise; all roles include a culture conversation." 
    },
    { 
      step: "4", 
      title: "Offer", 
      description: "We move fast on decisions. Expect an offer within a week of final interviews, with transparent compensation and a smooth onboarding experience." 
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
            Help us build the future of water care technology. We're looking for passionate people to join our mission of making water management simple, smart, and accessible to everyone.
          </p>
        </div>

        {/* Mission Statement */}
        <section className="mb-16">
          <div className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 text-center">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Our Mission</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We're on a mission to help millions of aquarium hobbyists, pool owners, and spa enthusiasts maintain healthier water with less effort. Using AI and smart technology, we're transforming how people care for their aquatic environments—saving time, reducing waste, and keeping fish, swimmers, and soakers happy.
            </p>
          </div>
        </section>

        {/* Why Work at Ally */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Why Work at Ally?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title}>
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
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Our Culture & Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => (
              <div key={value.title} className="p-6 bg-muted/30 rounded-lg border flex gap-4">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <value.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Open Positions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Open Positions</h2>
          <div className="space-y-4">
            {openPositions.map((position) => (
              <Card key={position.title} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{position.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{position.description}</p>
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
                    <Button className="shrink-0" asChild>
                      <Link to="/contact?subject=careers">
                        Apply Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Application Process */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Our Hiring Process</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {hiringSteps.map((item) => (
              <div key={item.step} className="text-center">
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
            We're always looking for talented people. Send us your resume and tell us how you can contribute to our mission of making water care smarter and simpler.
          </p>
          <Button size="lg" asChild>
            <Link to="/contact?subject=careers">
              Send General Application
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
