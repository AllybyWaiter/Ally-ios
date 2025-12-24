import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Users, Mail, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Subprocessors = () => {
  const subprocessors = [
    {
      category: "Cloud Infrastructure",
      name: "Supabase",
      purpose: "Application hosting, PostgreSQL database, authentication, and file storage",
      dataProcessed: "All user data, application data, authentication credentials",
      location: "United States (AWS)",
      privacyUrl: "https://supabase.com/privacy",
    },
    {
      category: "AI Processing",
      name: "Google Cloud (Gemini)",
      purpose: "AI powered water analysis, chat assistance, and image recognition",
      dataProcessed: "User messages, water test data, aquarium context, uploaded images",
      location: "United States",
      privacyUrl: "https://policies.google.com/privacy",
    },
    {
      category: "AI Processing",
      name: "OpenAI",
      purpose: "Alternative AI provider for chat and analysis features",
      dataProcessed: "User messages, water test data, aquarium context",
      location: "United States",
      privacyUrl: "https://openai.com/privacy",
    },
    {
      category: "Error Monitoring",
      name: "Sentry",
      purpose: "Application error tracking, performance monitoring, and debugging",
      dataProcessed: "Error logs, performance metrics, anonymized user context",
      location: "United States",
      privacyUrl: "https://sentry.io/privacy",
    },
    {
      category: "Email Services",
      name: "Resend",
      purpose: "Transactional emails, notifications, and password reset emails",
      dataProcessed: "Email addresses, notification content, email metadata",
      location: "United States",
      privacyUrl: "https://resend.com/legal/privacy-policy",
    },
    {
      category: "Weather Data",
      name: "Open-Meteo",
      purpose: "Weather forecasts and environmental data for aquarium recommendations",
      dataProcessed: "Location coordinates (latitude/longitude)",
      location: "European Union",
      privacyUrl: "https://open-meteo.com/en/terms",
    },
  ];

  const lastUpdated = "December 24, 2025";

  return (
    <div className="min-h-screen">
      <SEO 
        title="Subprocessors"
        description="List of third party subprocessors that Ally uses to provide our services. Learn about the categories of data each processor handles."
        path="/legal/subprocessors"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Subprocessors
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We work with trusted third party service providers to deliver our services. 
            This page lists the subprocessors that may process your data.
          </p>
        </div>

        {/* Last Updated */}
        <div className="flex items-center justify-center gap-2 mb-8 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Last updated: {lastUpdated}</span>
        </div>

        {/* Overview */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>What is a Subprocessor?</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                A subprocessor is a third party data processor engaged by Ally to process personal data 
                on behalf of our customers. These processors are contractually bound to maintain the 
                confidentiality and security of the data they process.
              </p>
              <p>
                All subprocessors are subject to our vendor security assessment process and are required 
                to meet our data protection standards. We maintain data processing agreements with each 
                subprocessor to ensure compliance with applicable data protection laws including GDPR and CCPA.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Subprocessors Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Current Subprocessors</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">Category</TableHead>
                      <TableHead className="w-[120px]">Provider</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Data Processed</TableHead>
                      <TableHead className="w-[120px]">Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subprocessors.map((processor, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{processor.category}</TableCell>
                        <TableCell>
                          <a 
                            href={processor.privacyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {processor.name}
                          </a>
                        </TableCell>
                        <TableCell>{processor.purpose}</TableCell>
                        <TableCell className="text-muted-foreground">{processor.dataProcessed}</TableCell>
                        <TableCell className="text-muted-foreground">{processor.location}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Data Transfer */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                Some of our subprocessors are located outside the European Economic Area (EEA). 
                When we transfer personal data to these subprocessors, we ensure appropriate safeguards 
                are in place, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>Binding Corporate Rules where applicable</li>
                <li>Adequacy decisions by the European Commission</li>
                <li>EU-US Data Privacy Framework certification where applicable</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Changes Notification */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Notification of Changes</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                We will update this page when we add or remove subprocessors. For customers with 
                Data Processing Agreements (DPAs), we will provide at least 30 days advance notice 
                of any new subprocessors before they begin processing personal data.
              </p>
              <p>
                If you would like to receive email notifications when this list is updated, 
                please contact us at the email address below.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Contact */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Questions About Our Subprocessors?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Contact our privacy team for more information about our subprocessors, to request a copy of our 
            Data Processing Agreement, or to subscribe to update notifications.
          </p>
          <Button asChild>
            <a href="mailto:privacy@allybywaiterapp.com">
              <Mail className="mr-2 h-4 w-4" />
              Contact Privacy Team
            </a>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Subprocessors;
