import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { 
  Shield, 
  Lock, 
  FileText, 
  Users, 
  Bot, 
  Scale, 
  CheckCircle,
  ExternalLink,
  Mail
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TrustCenter = () => {
  const policyLinks = [
    {
      icon: FileText,
      title: "Privacy Policy",
      description: "How we collect, use, and protect your personal data",
      href: "/privacy",
    },
    {
      icon: Scale,
      title: "Terms of Service",
      description: "The legal agreement between you and Ally",
      href: "/terms",
    },
    {
      icon: Shield,
      title: "Security",
      description: "Our security practices and infrastructure",
      href: "/security",
    },
    {
      icon: Bot,
      title: "AI Transparency",
      description: "How Ally AI works and handles your data",
      href: "/legal/ai-transparency",
    },
    {
      icon: Users,
      title: "Subprocessors",
      description: "Third parties that process data on our behalf",
      href: "/legal/subprocessors",
    },
    {
      icon: FileText,
      title: "Data Processing Agreement",
      description: "DPA for business and enterprise customers",
      href: "/legal/dpa",
    },
  ];

  const complianceItems = [
    {
      name: "GDPR",
      status: "Compliant",
      description: "Full compliance with EU General Data Protection Regulation",
    },
    {
      name: "CCPA",
      status: "Compliant",
      description: "Compliant with California Consumer Privacy Act requirements",
    },
    {
      name: "SOC 2 Type II",
      status: "Planned",
      description: "Security audit certification in progress",
    },
    {
      name: "ISO 27001",
      status: "Planned",
      description: "Information security management certification planned",
    },
  ];

  const securityHighlights = [
    {
      icon: Lock,
      title: "Encryption",
      description: "TLS 1.3 in transit, AES 256 at rest",
    },
    {
      icon: Shield,
      title: "Access Controls",
      description: "Role based permissions with audit logging",
    },
    {
      icon: Users,
      title: "Authentication",
      description: "Secure login with session management",
    },
    {
      icon: Bot,
      title: "AI Security",
      description: "Your data is never used to train models",
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Trust Center"
        description="Ally's Trust Center. Learn about our security practices, compliance certifications, privacy policies, and commitment to protecting your data."
        path="/trust"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Trust Center
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transparency and security are at the core of everything we do. 
            Learn how we protect your data and maintain your trust.
          </p>
        </div>

        {/* Quick Links Grid */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Policies & Documentation</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policyLinks.map((link, index) => (
              <Link key={index} to={link.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <link.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="group-hover:text-primary transition-colors">{link.title}</span>
                      <ExternalLink className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{link.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Security Highlights */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Security Highlights</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityHighlights.map((item, index) => (
              <div key={index} className="p-6 bg-muted/30 rounded-lg border text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Compliance */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Compliance & Certifications</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {complianceItems.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-5 w-5 ${item.status === 'Compliant' ? 'text-green-500' : 'text-amber-500'}`} />
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      item.status === 'Compliant' 
                        ? 'bg-green-500/10 text-green-600' 
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center mt-6">
            {/* [Legal review recommended] */}
            Certifications in progress are actively being pursued. Contact us for current status.
          </p>
        </section>

        {/* Data Protection Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Data Protection</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Your Rights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Access your personal data
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Export your data in standard formats
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Request correction of inaccurate data
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Delete your account and data
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Opt out of marketing communications
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Our Commitments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Never sell your personal data
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Minimal data collection practices
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Transparent about data usage
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Regular security assessments
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Prompt breach notification
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Questions About Trust & Security?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our team is here to help with any questions about our security practices, compliance, or data handling.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <a href="mailto:security@allybywaiterapp.com">
                <Shield className="mr-2 h-4 w-4" />
                Security Inquiries
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:legal@allybywaiterapp.com">
                <Mail className="mr-2 h-4 w-4" />
                Legal Questions
              </a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrustCenter;
