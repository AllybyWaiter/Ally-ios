import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Plug, Zap, Clock, Code, Smartphone, Cloud, Wifi, Bell, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
      name: "Push Notifications",
      description: "Get real time alerts for water quality issues, maintenance reminders, and important updates.",
      icon: Bell,
      status: "available",
      category: "Notifications",
    },
    {
      name: "Calendar Sync",
      description: "Sync maintenance tasks with your preferred calendar app.",
      icon: Clock,
      status: "coming-soon",
      category: "Productivity",
    },
    {
      name: "Mobile App",
      description: "Full featured progressive web app for iOS and Android devices.",
      icon: Smartphone,
      status: "available",
      category: "Mobile",
    },
    {
      name: "Smart Home Integration",
      description: "Connect with popular smart home platforms like Alexa and Google Home.",
      icon: Cloud,
      status: "coming-soon",
      category: "Smart Home",
    },
    {
      name: "IoT Sensor Support",
      description: "Connect compatible aquarium sensors for automatic parameter monitoring.",
      icon: Wifi,
      status: "coming-soon",
      category: "Hardware",
    },
    {
      name: "Developer API",
      description: "Build custom integrations with our RESTful API.",
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

        {/* Featured Integration */}
        <section className="mb-16">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 flex flex-col justify-center">
                <Badge className="w-fit mb-4">Featured</Badge>
                <h2 className="text-2xl font-bold mb-4 text-foreground">Push Notifications</h2>
                <p className="text-muted-foreground mb-6">
                  Stay informed with real time push notifications. Get alerts for critical water quality changes, 
                  maintenance reminders, and personalized recommendations directly on your device.
                </p>
                <Button asChild className="w-fit">
                  <Link to="/settings">
                    Configure Notifications
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="bg-muted/30 flex items-center justify-center min-h-[250px]">
                <div className="text-center p-8">
                  <Bell className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Real time alerts for your water care</p>
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
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're working with leading aquarium hardware manufacturers to bring you seamless integration 
            with popular sensors and controllers. Stay tuned for announcements.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {["Neptune Systems", "GHL", "Seneye", "CoralVue"].map((partner, i) => (
              <Card key={i} className="aspect-video flex items-center justify-center bg-muted/30">
                <div className="text-center p-4">
                  <p className="text-muted-foreground text-sm font-medium">{partner}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
                </div>
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
                <p className="text-muted-foreground mb-4">
                  Our developer API allows you to build custom integrations for your specific needs. 
                  Connect Ally with your existing systems and automate your water care workflow.
                </p>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                    <span><strong>REST API</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                    <span><strong>Webhooks</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                    <span><strong>SDKs</strong></span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  API access will be available on Pro plans and above.
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
          <Button asChild>
            <Link to="/contact?type=feature">
              Request an Integration
            </Link>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Integrations;