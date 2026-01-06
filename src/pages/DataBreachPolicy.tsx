import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ShieldAlert, Clock, Mail, Bell, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DataBreachPolicy = () => {
  const notificationSteps = [
    {
      icon: Clock,
      title: "Immediate Response",
      time: "0-24 hours",
      description: "Upon discovering a potential data breach, our security team immediately initiates our incident response procedure, containing the breach and beginning investigation.",
    },
    {
      icon: FileText,
      title: "Assessment & Documentation",
      time: "24-48 hours",
      description: "We assess the scope, impact, and nature of the breach, document all findings, and determine which users and data may be affected.",
    },
    {
      icon: Bell,
      title: "Regulatory Notification",
      time: "Within 72 hours",
      description: "For breaches affecting EU residents, we notify the relevant supervisory authority within 72 hours as required by GDPR, unless the breach is unlikely to result in risk to individuals.",
    },
    {
      icon: Users,
      title: "User Notification",
      time: "Without undue delay",
      description: "If the breach is likely to result in high risk to your rights and freedoms, we notify affected users directly via email with details about the breach and recommended protective actions.",
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Data Breach Notification Policy"
        description="Learn how Ally handles data security incidents and how we notify users in the event of a data breach. Our commitment to transparency and rapid response."
        path="/legal/data-breach-policy"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Data Breach Notification Policy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our commitment to transparency and rapid response in the event of a security incident. 
            We take the protection of your data seriously.
          </p>
        </div>

        {/* Overview */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Our Commitment</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                At Ally, we implement comprehensive security measures to protect your personal data. However, 
                we recognize that no system is completely immune to security threats. This policy outlines 
                how we respond to and communicate about data security incidents.
              </p>
              <p>
                We are committed to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Promptly detecting and responding to any security incidents</li>
                <li>Containing breaches and minimizing impact as quickly as possible</li>
                <li>Transparently communicating with affected users</li>
                <li>Complying with all applicable data breach notification laws</li>
                <li>Learning from incidents to continuously improve our security</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Timeline */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Notification Timeline</h2>
          <div className="space-y-6">
            {notificationSteps.map((step) => (
              <Card key={step.title}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                        <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                          {step.time}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* What We'll Tell You */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>What You'll Be Notified About</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-4">
                If we determine that a breach requires notification, we will provide you with the following information:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Nature of the Breach</h4>
                  <p className="text-sm">What happened, when it occurred, and how we discovered it.</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Data Affected</h4>
                  <p className="text-sm">The categories of personal data that were or may have been compromised.</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Actions Taken</h4>
                  <p className="text-sm">Steps we've taken to contain the breach and prevent future incidents.</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Your Next Steps</h4>
                  <p className="text-sm">Recommended actions you can take to protect yourself.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* How We Notify */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>How We Will Contact You</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                In the event of a data breach affecting your account, we will contact you through:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Email:</strong> Direct notification to the email address associated with your account</li>
                <li><strong>In-App Notification:</strong> A prominent notice when you log into Ally</li>
                <li><strong>Status Page:</strong> Updates on our <Link to="/status" className="text-primary hover:underline">system status page</Link></li>
              </ul>
              <p className="mt-4">
                For widespread incidents, we may also post updates on our website and social media channels.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Legal Requirements */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Legal Compliance</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                Our breach notification procedures comply with applicable data protection laws, including:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">GDPR (EU/EEA)</h4>
                  <p className="text-sm">Notification to supervisory authorities within 72 hours. Notification to affected individuals without undue delay when high risk exists.</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">CCPA/CPRA (California)</h4>
                  <p className="text-sm">Notification to affected California residents in the most expedient time possible and without unreasonable delay.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Prevention */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Prevention Measures</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                We continuously work to prevent security incidents through:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>End-to-end encryption for data in transit and at rest</li>
                <li>Regular security audits and penetration testing</li>
                <li>Employee security training and awareness programs</li>
                <li>Multi-factor authentication for administrative access</li>
                <li>24/7 monitoring and intrusion detection systems</li>
                <li>Regular software updates and security patches</li>
                <li>Strict access controls and the principle of least privilege</li>
              </ul>
              <p className="mt-4">
                For more details about our security practices, visit our <Link to="/security" className="text-primary hover:underline">Security page</Link> and <Link to="/trust" className="text-primary hover:underline">Trust Center</Link>.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Contact */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Report a Security Concern</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            If you believe you've discovered a security vulnerability or have concerns about your account security, 
            please contact us immediately.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <a href="mailto:security@allybywaiterapp.com">
                <Mail className="mr-2 h-4 w-4" />
                security@allybywaiterapp.com
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/security/bug-bounty">
                Bug Bounty Program
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DataBreachPolicy;
