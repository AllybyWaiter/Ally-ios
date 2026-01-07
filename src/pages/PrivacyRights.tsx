import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Shield, Download, Trash2, Eye, Edit, Ban, Mail, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PrivacyRights = () => {
  const rights = [
    {
      icon: Eye,
      title: "Right to Access",
      description: "You have the right to request a copy of the personal data we hold about you. This includes your profile information, aquarium data, water test results, chat history, and any other data associated with your account.",
      action: "Request a copy of your data in your Settings under Account > Export Data.",
      gdpr: true,
      ccpa: true,
    },
    {
      icon: Edit,
      title: "Right to Rectification",
      description: "You have the right to request that we correct any inaccurate personal data or complete any incomplete data we hold about you.",
      action: "Update your information directly in Settings or contact us for assistance.",
      gdpr: true,
      ccpa: false,
    },
    {
      icon: Trash2,
      title: "Right to Erasure (Right to be Forgotten)",
      description: "You have the right to request that we delete your personal data. This includes your account, all aquariums, water tests, equipment, livestock records, and chat history.",
      action: "Delete your account in Settings under Account > Delete Account.",
      gdpr: true,
      ccpa: true,
    },
    {
      icon: Ban,
      title: "Right to Restrict Processing",
      description: "You have the right to request that we limit how we use your data while we verify its accuracy or assess a request.",
      action: "Contact our privacy team to request processing restrictions.",
      gdpr: true,
      ccpa: false,
    },
    {
      icon: Download,
      title: "Right to Data Portability",
      description: "You have the right to receive your data in a structured, commonly used, machine-readable format (JSON) and to transmit it to another service.",
      action: "Export your data in Settings under Account > Export Data.",
      gdpr: true,
      ccpa: true,
    },
    {
      icon: Shield,
      title: "Right to Object",
      description: "You have the right to object to our processing of your personal data for direct marketing purposes or when processing is based on legitimate interests.",
      action: "Manage your communication preferences in Settings or contact us.",
      gdpr: true,
      ccpa: false,
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Your Privacy Rights"
        description="Learn about your privacy rights under GDPR, CCPA, and other privacy regulations. Understand how to access, correct, delete, or export your personal data."
        path="/legal/privacy-rights"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Your Privacy Rights
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We believe you should have full control over your personal data. This page explains 
            your rights and how to exercise them.
          </p>
        </div>

        {/* Quick Actions */}
        <section className="mb-12">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button asChild>
                  <Link to="/settings">
                    <Download className="mr-2 h-4 w-4" />
                    Export My Data
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings">
                    <Edit className="mr-2 h-4 w-4" />
                    Update My Info
                  </Link>
                </Button>
                <Button asChild variant="destructive">
                  <Link to="/settings">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete My Account
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Rights Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Your Rights Explained</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {rights.map((right) => (
              <Card key={right.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <right.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span>{right.title}</span>
                      <div className="flex gap-2 mt-1">
                        {right.gdpr && (
                          <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">GDPR</span>
                        )}
                        {right.ccpa && (
                          <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">CCPA</span>
                        )}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm">{right.description}</p>
                  <p className="text-sm"><strong>How to exercise:</strong> {right.action}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* California Residents */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>California Residents (CCPA/CPRA)</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) 
                and the California Privacy Rights Act (CPRA):
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Right to Know:</strong> Request information about the categories and specific pieces of personal information we've collected about you.</li>
                <li><strong>Right to Delete:</strong> Request deletion of your personal information, subject to certain exceptions.</li>
                <li><strong>Right to Opt Out:</strong> Opt out of the "sale" or "sharing" of personal information. Note: Ally does not sell your personal information.</li>
                <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
                <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information.</li>
                <li><strong>Right to Limit Use of Sensitive Information:</strong> Limit the use of sensitive personal information to what is necessary.</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, visit our <Link to="/settings" className="text-primary hover:underline">Settings page</Link> or 
                contact us at <a href="mailto:privacy@allybywaiterapp.com" className="text-primary hover:underline">privacy@allybywaiterapp.com</a>.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* EU Residents */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>European Economic Area Residents (GDPR)</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have comprehensive 
                rights under the General Data Protection Regulation (GDPR):
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Lawful Basis:</strong> We process your data based on your consent, contract performance, or legitimate interests.</li>
                <li><strong>Data Protection Officer:</strong> You may contact our privacy team for any GDPR related inquiries.</li>
                <li><strong>Supervisory Authority:</strong> You have the right to lodge a complaint with your local data protection authority.</li>
                <li><strong>International Transfers:</strong> We use Standard Contractual Clauses for data transfers outside the EEA.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Response Times */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Response Times
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">GDPR Requests</h4>
                  <p>We will respond to your request within <strong>30 days</strong>. In complex cases, we may extend this by an additional 60 days, but we will inform you of any delay.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">CCPA Requests</h4>
                  <p>We will respond to your request within <strong>45 days</strong>. We may extend this by an additional 45 days if necessary, with notice to you.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Need Help Exercising Your Rights?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Our privacy team is here to help. Contact us for any questions about your privacy rights 
            or to submit a request that cannot be completed through your account settings.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <a href="mailto:privacy@allybywaiterapp.com">
                <Mail className="mr-2 h-4 w-4" />
                privacy@allybywaiterapp.com
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/privacy">
                View Full Privacy Policy
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyRights;
