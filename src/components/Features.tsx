import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Camera, LineChart, Shield, Smartphone, CloudSun, ArrowRight, Mic, Bell, Image } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Brain,
    title: "Smart AI Assistant",
    description: "Ask anything about water care. Ally understands your setup and gives personalized advice.",
  },
  {
    icon: Mic,
    title: "Voice Enabled",
    description: "Talk to Ally hands-free. Ask questions, log results, and get spoken responses.",
  },
  {
    icon: Camera,
    title: "Photo Testing",
    description: "Snap a photo of your test strip. Ally reads it and tells you what to do next.",
  },
  {
    icon: Image,
    title: "Visual Journals",
    description: "Track your fish, corals, and plants with photo galleries. See changes over time.",
  },
  {
    icon: LineChart,
    title: "Trend Alerts",
    description: "Ally watches your water data and warns you before small issues become big problems.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Never miss a water change again. Get push notifications for tasks and alerts.",
  },
  {
    icon: CloudSun,
    title: "Weather Aware",
    description: "Pool and spa owners get maintenance tips based on real-time weather conditions.",
  },
  {
    icon: Shield,
    title: "Preventive Care",
    description: "Recurring tasks and smart suggestions keep your water perfect effortlessly.",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    description: "Install on any device. Works offline and feels like a native app.",
  },
];

const Features = () => {
  return (
    <section className="py-20 px-4 bg-gradient-hero">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need,<br />Nothing You Don't
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sophisticated technology, simple experience. For aquariums, pools, and spas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-2 hover:border-primary transition-all duration-300 hover:shadow-glow bg-card/50 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-water flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild className="group">
            <Link to="/features">
              View All Features
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Features;
