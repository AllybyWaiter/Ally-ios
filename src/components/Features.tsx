import { Card, CardContent } from "@/components/ui/card";
import { Brain, Droplets, LineChart, Shield, Smartphone, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced algorithms understand your water chemistry and provide instant recommendations.",
  },
  {
    icon: Droplets,
    title: "Simple Testing",
    description: "Just snap a photo of your test results. Ally handles the complex analysis.",
  },
  {
    icon: LineChart,
    title: "Smart Tracking",
    description: "Monitor water parameters over time with beautiful, easy-to-read charts.",
  },
  {
    icon: Zap,
    title: "Instant Care Plans",
    description: "Get personalized, step-by-step instructions to fix any water issue.",
  },
  {
    icon: Shield,
    title: "Preventive Care",
    description: "Proactive alerts help you maintain perfect water before problems arise.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Manage your aquarium from anywhere with our sleek mobile app.",
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
            Sophisticated technology, simple experience. That's the Ally difference.
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
      </div>
    </section>
  );
};

export default Features;
