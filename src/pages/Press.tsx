import { SEO, StructuredData } from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Image as ImageIcon, 
  FileText, 
  User, 
  Building2, 
  Calendar, 
  Mail,
  ExternalLink,
  Smartphone,
  Droplets,
  Camera,
  Mic,
  Bell,
  Cloud
} from "lucide-react";

const Press = () => {
  const productFacts = [
    { label: "Product Name", value: "Ally by WA.I.TER" },
    { label: "Category", value: "AI-Powered Water Care Assistant" },
    { label: "Platform", value: "Progressive Web App (PWA)" },
    { label: "Supported Water Bodies", value: "Aquariums, Pools, Spas, Hot Tubs, Ponds, Koi Ponds" },
    { label: "Pricing", value: "Free tier available, Premium from $4.99/month" },
    { label: "Founded", value: "2024" },
    { label: "Website", value: "https://ally.waiter.is" },
  ];

  const keyFeatures = [
    { icon: Camera, title: "AI Photo Analysis", description: "Instant water test results from photos of test strips" },
    { icon: Mic, title: "Voice Commands", description: "Hands-free operation for when your hands are wet" },
    { icon: Bell, title: "Smart Alerts", description: "Proactive notifications for water quality issues" },
    { icon: Cloud, title: "Weather Integration", description: "Outdoor water care recommendations based on forecast" },
    { icon: Smartphone, title: "Offline Mode", description: "Full functionality without internet connection" },
    { icon: Droplets, title: "Multi-Tank Support", description: "Manage multiple water bodies from one app" },
  ];

  const pressAssets = [
    { 
      name: "App Logo (PNG)", 
      description: "Primary logo for light and dark backgrounds",
      url: "/favicon.png",
      type: "Logo"
    },
    { 
      name: "App Icon (512x512)", 
      description: "High-resolution app icon",
      url: "/icon-512.png",
      type: "Icon"
    },
    { 
      name: "App Screenshot - Wide", 
      description: "Desktop/tablet screenshot",
      url: "/screenshot-wide.png",
      type: "Screenshot"
    },
    { 
      name: "App Screenshot - Mobile", 
      description: "Mobile screenshot",
      url: "/screenshot-narrow.png",
      type: "Screenshot"
    },
    { 
      name: "Promo Image", 
      description: "Marketing promotional image",
      url: "/images/ally-thinking-promo.png",
      type: "Promo"
    },
    { 
      name: "Open Graph Image", 
      description: "Social media sharing image",
      url: "/og-image.png",
      type: "Social"
    },
  ];

  const founderInfo = {
    name: "Cody Hawkins",
    title: "Founder & CEO",
    bio: "Cody Hawkins is the founder of WA.I.TER (Water AI Technology for Ecosystem Regulation), the company behind Ally. With a passion for combining artificial intelligence with practical everyday applications, Cody created Ally to simplify water care for aquarium enthusiasts, pool owners, and spa maintainers worldwide. His vision is to make crystal-clear, healthy water accessible to everyone through the power of AI.",
    email: "cody@waiter.is",
  };

  const companyInfo = {
    name: "WA.I.TER",
    fullName: "Water AI Technology for Ecosystem Regulation",
    founded: "2024",
    headquarters: "United States",
    mission: "To revolutionize water care through artificial intelligence, making pristine water quality achievable for everyone from first-time aquarium owners to professional pool managers.",
    website: "https://ally.waiter.is",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <SEO 
        title="Press & Media Kit - Ally by WA.I.TER"
        description="Download press assets, logos, screenshots, and learn about Ally, the AI-powered water care assistant. Media resources for journalists and content creators."
        path="/press"
      />
      <StructuredData type="Organization" />
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Media Kit</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Press & Media Resources
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything journalists, bloggers, and content creators need to cover Ally by WA.I.TER
            </p>
          </div>

          {/* Quick Contact */}
          <Card className="mb-12 border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">Press Inquiries</p>
                  <p className="text-muted-foreground">press@waiter.is</p>
                </div>
              </div>
              <Button asChild>
                <a href="mailto:press@waiter.is">
                  Contact Press Team
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Product Facts */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Product Facts</h2>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {productFacts.map((fact) => (
                    <div key={fact.label} className="flex justify-between items-start py-2 border-b border-border/50 last:border-0">
                      <span className="font-medium text-muted-foreground">{fact.label}</span>
                      <span className="text-right font-semibold">{fact.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Key Features */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Smartphone className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Key Features</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {keyFeatures.map((feature) => (
                <Card key={feature.title} className="hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Downloadable Assets */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Logos & Screenshots</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pressAssets.map((asset) => (
                <Card key={asset.name} className="overflow-hidden hover:border-primary/30 transition-colors">
                  <div className="aspect-video bg-muted/50 flex items-center justify-center border-b">
                    <img 
                      src={asset.url} 
                      alt={asset.name}
                      className="max-h-full max-w-full object-contain p-4"
                      loading="lazy"
                    />
                  </div>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="secondary" className="mb-2">{asset.type}</Badge>
                        <h3 className="font-semibold">{asset.name}</h3>
                        <p className="text-sm text-muted-foreground">{asset.description}</p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={asset.url} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Founder Info */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Founder</h2>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold">
                      {founderInfo.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{founderInfo.name}</h3>
                    <p className="text-primary font-medium mb-4">{founderInfo.title}</p>
                    <p className="text-muted-foreground mb-4">{founderInfo.bio}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${founderInfo.email}`} className="text-primary hover:underline">
                        {founderInfo.email}
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Company Info */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">About WA.I.TER</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{companyInfo.fullName}</h3>
                  <p className="text-muted-foreground">{companyInfo.mission}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Founded</p>
                      <p className="font-semibold">{companyInfo.founded}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Headquarters</p>
                      <p className="font-semibold">{companyInfo.headquarters}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a href={companyInfo.website} className="font-semibold text-primary hover:underline">
                        ally.waiter.is
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Boilerplate */}
          <section className="mb-16">
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Boilerplate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">
                  "Ally by WA.I.TER is an AI-powered water care assistant that transforms how people maintain their aquariums, pools, spas, and ponds. Using advanced artificial intelligence, Ally provides instant water test analysis from photos, personalized care recommendations, and proactive alerts to ensure crystal-clear, healthy water. Available as a progressive web app, Ally works across all devices with full offline functionality. Founded in 2024, WA.I.TER (Water AI Technology for Ecosystem Regulation) is committed to making professional-grade water care accessible to everyone."
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Usage Guidelines */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Brand Usage Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Please use "Ally by WA.I.TER" or "Ally" when referring to the product</p>
                <p>• WA.I.TER stands for "Water AI Technology for Ecosystem Regulation"</p>
                <p>• Do not alter, rotate, or modify the logos in any way</p>
                <p>• Maintain adequate spacing around logos when used in layouts</p>
                <p>• For questions about brand usage, contact press@waiter.is</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Press;
