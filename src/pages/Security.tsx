import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Shield, Lock, Server, Eye, CheckCircle, Mail, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Security = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "Data Encryption",
      description: "All data is protected with enterprise-grade encryption in transit and at rest. Your information is secured using industry-standard cryptographic protocols.",
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
      name: "Data Encrypted",
      description: "All connections and stored data are encrypted using industry-standard protocols.",
    },
    {
      name: "Regular Security Reviews",
      description: "We continuously monitor and improve our security practices to protect your data.",
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
            {securityFeatures.map((feature, index) => (
              <Card key={index}>
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

        {/* Security Practices */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Our Security Practices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-muted/30 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Encryption
              </h3>
              <p className="text-muted-foreground">
                Industry-standard encryption protects all data transmitted between your device and our servers, 
                as well as data stored in our databases. Your sensitive information is always protected.
              </p>
            </div>

            <div className="p-6 bg-muted/30 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Authentication
              </h3>
              <p className="text-muted-foreground">
                Secure login with email verification and session management. Your account is protected 
                with modern authentication protocols and secure password handling.
              </p>
            </div>

            <div className="p-6 bg-muted/30 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Infrastructure
              </h3>
              <p className="text-muted-foreground">
                Enterprise-grade cloud hosting with automatic backups ensures your data is safe and 
                recoverable. Our infrastructure is monitored around the clock for any issues.
              </p>
            </div>

            <div className="p-6 bg-muted/30 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Data Handling
              </h3>
              <p className="text-muted-foreground">
                We practice data minimization—collecting only what's necessary. You have full control 
                over your data with the ability to export or permanently delete it at any time.
              </p>
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Compliance</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {complianceItems.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Responsible Disclosure */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Responsible Disclosure</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Report a Security Vulnerability</h3>
                  <p className="text-muted-foreground mb-4">
                    We take security vulnerabilities seriously. If you discover a potential security issue, 
                    please report it responsibly. We appreciate the security research community's efforts 
                    in helping keep our users safe.
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-4">
                    <li className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span><strong>Email:</strong>{" "}
                        <a href="mailto:security@allybywaiterapp.com" className="text-primary hover:underline">
                          security@allybywaiterapp.com
                        </a>
                      </span>
                    </li>
                    <li>• We respond to security reports promptly</li>
                    <li>• Safe harbor for good-faith security researchers</li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    Please do not publicly disclose vulnerabilities until we've had a chance to address them.
                  </p>
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
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Security;
