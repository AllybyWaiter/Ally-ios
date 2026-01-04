import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Shield, Lock, Server, Eye, CheckCircle, Mail, Users, Bot, Globe, Award, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Security = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "Data Encryption",
      description: "All data is encrypted using TLS 1.3 in transit and AES-256 at rest. Your information is secured using the highest industry-standard cryptographic protocols.",
    },
    {
      icon: Server,
      title: "Secure Infrastructure",
      description: "Hosted on enterprise-grade cloud infrastructure with automatic backups, DDoS protection, and high availability to keep your data safe and accessible.",
    },
    {
      icon: Eye,
      title: "Privacy First",
      description: "We collect only essential data needed to provide our service. No selling of personal information, no invasive tracking. Export or delete your data anytime.",
    },
    {
      icon: Users,
      title: "Access Controls",
      description: "Strict access controls ensure you only see your own data. Role-based permissions protect sensitive operations and prevent unauthorized access.",
    },
  ];

  const complianceItems = [
    {
      name: "GDPR Compliant",
      description: "Full compliance with EU data protection regulations including data export and deletion rights.",
    },
    {
      name: "CCPA Ready",
      description: "California Consumer Privacy Act compliance with full data access and deletion capabilities.",
    },
    {
      name: "SOC 2 Type II",
      description: "Enterprise-grade security controls with planned SOC 2 Type II certification.",
      status: "In Progress",
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Security"
        description="Learn about Ally's commitment to security. Discover our encryption standards, compliance certifications, and data protection practices."
        path="/security"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Security at Ally
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your data security is our top priority. We use industry-leading practices to protect your information.
          </p>
        </div>

        {/* Security Features Grid */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">How We Protect Your Data</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {securityFeatures.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Ally AI Security Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Ally AI Security</h2>
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                How We Protect Your AI Interactions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Data Processing</h4>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>AI processes only data you explicitly share</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Conversations encrypted in transit and at rest</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Your data is never used to train AI models</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Your Controls</h4>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Delete conversation history anytime</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Manage AI memory preferences in settings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Full data export available on request</span>
                    </li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pt-4 border-t">
                For complete details on AI data handling, see our{" "}
                <Link to="/legal/ai-transparency" className="text-primary hover:underline">
                  AI Transparency page
                </Link>.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Security Practices */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Our Security Practices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-muted/30 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Encryption Standards
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>In Transit:</strong> TLS 1.3 for all connections</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>At Rest:</strong> AES-256 encryption for stored data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>Keys:</strong> Secure key management with regular rotation</span>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-muted/30 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Authentication
              </h3>
              <p className="text-muted-foreground">
                Secure login with email verification and session management. Your account is protected 
                with modern authentication protocols and secure password handling using industry-standard hashing.
              </p>
            </div>

            <div className="p-6 bg-muted/30 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Data Residency
              </h3>
              <p className="text-muted-foreground">
                Your data is stored in secure cloud infrastructure located in the United States with 
                automatic geo-redundant backups. For enterprise customers requiring specific data 
                residency, please <Link to="/contact" className="text-primary hover:underline">contact us</Link>.
              </p>
            </div>

            <div className="p-6 bg-muted/30 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Infrastructure
              </h3>
              <p className="text-muted-foreground">
                Enterprise-grade cloud hosting with automatic backups, DDoS protection, and 24/7 
                monitoring. Our infrastructure is designed for high availability with 99.9% uptime target.
              </p>
            </div>
          </div>
        </section>

        {/* Compliance & Certifications */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Compliance & Certifications</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {complianceItems.map((item) => (
              <Card key={item.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {item.status ? (
                      <Clock className="h-5 w-5 text-amber-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                  </div>
                  {item.status && (
                    <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full w-fit">
                      {item.status}
                    </span>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-6 text-center">
            For detailed compliance documentation, visit our{" "}
            <Link to="/trust" className="text-primary hover:underline">Trust Center</Link>.
          </p>
        </section>

        {/* Bug Bounty / Responsible Disclosure */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Security Research Program</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Bug Bounty Program</h3>
                    <p className="text-muted-foreground">
                      We take security vulnerabilities seriously and reward researchers who help keep 
                      our users safe. Join our security research program to earn rewards for responsible disclosures.
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      <span><strong>48 hour</strong> response</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="h-4 w-4 text-primary" />
                      <span><strong>Safe harbor</strong> guarantee</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="h-4 w-4 text-primary" />
                      <span><strong>Up to $2,000</strong> rewards</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button asChild>
                      <Link to="/security/bug-bounty">
                        View Full Program Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Security Contact */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Have Security Questions?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our team is here to help. Contact us with any questions about our security practices or your data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <a href="mailto:security@allybywaiterapp.com">
                <Shield className="mr-2 h-4 w-4" />
                Security Inquiries
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:info@allybywaiterapp.com">
                <Mail className="mr-2 h-4 w-4" />
                General Questions
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            For more details on how we handle your data, see our{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Security;