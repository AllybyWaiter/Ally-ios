import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Shield, Lock, Server, Eye, FileCheck, AlertTriangle, Users, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Security = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "[PLACEHOLDER: Describe encryption methods used - TLS 1.3, AES-256, etc.]",
    },
    {
      icon: Server,
      title: "Secure Infrastructure",
      description: "[PLACEHOLDER: Describe cloud provider, data center certifications, redundancy]",
    },
    {
      icon: Eye,
      title: "Privacy by Design",
      description: "[PLACEHOLDER: Describe privacy-first approach, data minimization]",
    },
    {
      icon: Users,
      title: "Access Controls",
      description: "[PLACEHOLDER: Describe RBAC, MFA, session management]",
    },
  ];

  const certifications = [
    {
      name: "[CERTIFICATION 1 - e.g., SOC 2 Type II]",
      status: "[STATUS - e.g., In Progress / Certified]",
      description: "[PLACEHOLDER: Description of certification and what it covers]",
    },
    {
      name: "[CERTIFICATION 2 - e.g., ISO 27001]",
      status: "[STATUS]",
      description: "[PLACEHOLDER: Description]",
    },
    {
      name: "[CERTIFICATION 3 - e.g., GDPR Compliant]",
      status: "[STATUS]",
      description: "[PLACEHOLDER: Description]",
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
            Your data security is our top priority. Learn about the measures we take to protect your information.
          </p>
        </div>

        {/* Placeholder Notice */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-12">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>PLACEHOLDER:</strong> All security claims must be verified by your security team and legal counsel before publishing. Update certifications and compliance status as appropriate.
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

        {/* Detailed Security Practices */}
        <section className="mb-16 space-y-8">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Security Practices</h2>
          
          <div className="space-y-6">
            <div className="p-6 bg-muted/30 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Data Encryption
              </h3>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>PLACEHOLDER:</strong> Verify all encryption claims with your technical team.
                </p>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong>In Transit:</strong> [DESCRIBE: TLS version, certificate management]</li>
                <li>• <strong>At Rest:</strong> [DESCRIBE: Encryption algorithm, key management]</li>
                <li>• <strong>Database:</strong> [DESCRIBE: Database encryption methods]</li>
                <li>• <strong>Backups:</strong> [DESCRIBE: Backup encryption and storage]</li>
              </ul>
            </div>

            <div className="p-6 bg-muted/30 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Authentication & Access
              </h3>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>PLACEHOLDER:</strong> Document actual authentication methods used.
                </p>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong>Password Security:</strong> [DESCRIBE: Hashing algorithm, requirements]</li>
                <li>• <strong>Multi-Factor Authentication:</strong> [DESCRIBE: MFA options available]</li>
                <li>• <strong>Session Management:</strong> [DESCRIBE: Session timeout, token handling]</li>
                <li>• <strong>Role-Based Access:</strong> [DESCRIBE: RBAC implementation]</li>
              </ul>
            </div>

            <div className="p-6 bg-muted/30 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Infrastructure Security
              </h3>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>PLACEHOLDER:</strong> Verify infrastructure details with your DevOps team.
                </p>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong>Cloud Provider:</strong> [PROVIDER - e.g., AWS, GCP, Azure] with [CERTIFICATIONS]</li>
                <li>• <strong>Network Security:</strong> [DESCRIBE: Firewalls, VPCs, DDoS protection]</li>
                <li>• <strong>Monitoring:</strong> [DESCRIBE: 24/7 monitoring, intrusion detection]</li>
                <li>• <strong>Disaster Recovery:</strong> [DESCRIBE: Backup frequency, RTO, RPO]</li>
              </ul>
            </div>

            <div className="p-6 bg-muted/30 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Data Handling & Retention
              </h3>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>PLACEHOLDER:</strong> Align with your Privacy Policy and legal requirements.
                </p>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong>Data Location:</strong> [DESCRIBE: Where data is stored geographically]</li>
                <li>• <strong>Retention Period:</strong> [DESCRIBE: How long data is kept]</li>
                <li>• <strong>Data Deletion:</strong> [DESCRIBE: Process for permanent deletion]</li>
                <li>• <strong>Third-Party Sharing:</strong> [DESCRIBE: Data sharing policies]</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Certifications & Compliance */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Certifications & Compliance</h2>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Only list certifications you actually hold or are actively pursuing. Include dates obtained.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <FileCheck className="h-8 w-8 text-primary" />
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {cert.status}
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-4">{cert.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{cert.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Vulnerability Disclosure */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Responsible Disclosure</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Report a Security Vulnerability</h3>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      <strong>PLACEHOLDER:</strong> Set up a security email and/or bug bounty program.
                    </p>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    We take security vulnerabilities seriously. If you discover a potential security issue, please report it responsibly.
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• <strong>Email:</strong> <a href="mailto:security@allybywaiter.com" className="text-primary hover:underline">[SECURITY EMAIL]</a></li>
                    <li>• <strong>Response Time:</strong> We aim to respond within [X] business days</li>
                    <li>• <strong>Bug Bounty:</strong> [IF APPLICABLE: Link to bug bounty program]</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4">
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
            Our security team is here to help. Contact us with any questions about our security practices.
          </p>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add security contact email and/or link to contact form.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Security;
