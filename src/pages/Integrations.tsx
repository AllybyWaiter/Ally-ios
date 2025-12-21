import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Plug, Zap, Clock, Code, Smartphone, Cloud, Wifi, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type IntegrationStatus = "available" | "coming-soon" | "beta";

interface Integration {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: IntegrationStatus;
  category: string;
}

const Integrations = () => {
  const integrations: Integration[] = [
    {
      name: "[INTEGRATION 1 - e.g., Google Calendar]",
      description: "[PLACEHOLDER: Sync maintenance tasks with your calendar]",
      icon: Clock,
      status: "available",
      category: "Productivity",
    },
    {
      name: "[INTEGRATION 2 - e.g., Apple Health]",
      description: "[PLACEHOLDER: Track your aquarium care habits]",
      icon: Smartphone,
      status: "coming-soon",
      category: "Mobile",
    },
    {
      name: "[INTEGRATION 3 - e.g., Smart Home Hub]",
      description: "[PLACEHOLDER: Connect with Alexa, Google Home, HomeKit]",
      icon: Cloud,
      status: "coming-soon",
      category: "Smart Home",
    },
    {
      name: "[INTEGRATION 4 - e.g., IoT Sensors]",
      description: "[PLACEHOLDER: Connect Neptune, GHL, Seneye sensors]",
      icon: Wifi,
      status: "coming-soon",
      category: "Hardware",
    },
    {
      name: "[INTEGRATION 5 - e.g., Push Notifications]",
      description: "[PLACEHOLDER: Real-time alerts via Slack, Discord, SMS]",
      icon: Bell,
      status: "available",
      category: "Notifications",
    },
    {
      name: "[INTEGRATION 6 - e.g., REST API]",
      description: "[PLACEHOLDER: Build custom integrations with our API]",
      icon: Code,
      status: "coming-soon",
      category: "Developer",
    },
  ];

  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Available</Badge>;
      case "coming-soon":
        return <Badge variant="secondary">Coming Soon</Badge>;
      case "beta":
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">Beta</Badge>;
    }
  };

  const categories = [...new Set(integrations.map(i => i.category))];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Integrations"
        description="Connect Ally with your favorite tools and devices. Explore our integrations with smart home systems, IoT sensors, calendars, and more."
        path="/integrations"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Plug className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Integrations
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect Ally with your favorite tools, devices, and platforms to create a seamless water care experience.
          </p>
        </div>

        {/* Placeholder Notice */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-12">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>PLACEHOLDER:</strong> Replace with actual integrations. Only list integrations that are available or have a confirmed roadmap. Include partner logos when available.
          </p>
        </div>

        {/* Featured Integration */}
        <section className="mb-16">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 flex flex-col justify-center">
                <Badge className="w-fit mb-4">Featured</Badge>
                <h2 className="text-2xl font-bold mb-4 text-foreground">[FEATURED INTEGRATION NAME]</h2>
                <p className="text-muted-foreground mb-6">
                  [PLACEHOLDER: Describe your most important or popular integration in detail. Explain the benefits and use cases.]
                </p>
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>PLACEHOLDER:</strong> Add CTA button to set up integration or learn more.
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 flex items-center justify-center min-h-[250px]">
                <div className="text-center p-8">
                  <Zap className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">[INTEGRATION SCREENSHOT OR DIAGRAM]</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Integrations by Category */}
        {categories.map((category) => (
          <section key={category} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">{category}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations
                .filter((i) => i.category === category)
                .map((integration, index) => (
                  <Card key={index} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <integration.icon className="h-5 w-5 text-primary" />
                        </div>
                        {getStatusBadge(integration.status)}
                      </div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        ))}

        {/* Hardware Partners */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Hardware Partners</h2>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add logos and descriptions of hardware partners. Get permission before using partner logos.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="aspect-video flex items-center justify-center bg-muted/30">
                <p className="text-muted-foreground text-sm text-center p-4">[PARTNER {i} LOGO]</p>
              </Card>
            ))}
          </div>
        </section>

        {/* API Section */}
        <section className="mb-16">
          <Card className="p-8">
            <div className="flex items-start gap-6">
              <div className="p-4 rounded-lg bg-primary/10 shrink-0">
                <Code className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4 text-foreground">Build Custom Integrations</h2>
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>PLACEHOLDER:</strong> Update with actual API availability and documentation links.
                  </p>
                </div>
                <p className="text-muted-foreground mb-4">
                  [PLACEHOLDER: Describe your API offering for developers and businesses who want to build custom integrations.]
                </p>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li>• <strong>REST API:</strong> [STATUS - Available / Coming Soon]</li>
                  <li>• <strong>Webhooks:</strong> [STATUS - Available / Coming Soon]</li>
                  <li>• <strong>SDKs:</strong> [STATUS - Available / Coming Soon]</li>
                  <li>• <strong>Documentation:</strong> [LINK TO API DOCS]</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  API access is available on [TIER] plans and above.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Request Integration */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Don't See What You Need?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            We're always expanding our integration ecosystem. Let us know what tools you'd like us to integrate with.
          </p>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add button linking to contact form or feature request page.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Integrations;
