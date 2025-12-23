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
  // [Legal review recommended] - Update with actual subprocessors
  const subprocessors = [
    {
      category: "Cloud Infrastructure",
      name: "Primary Cloud Provider",
      purpose: "Application hosting, database, and file storage",
      dataProcessed: "All user data, application data",
      location: "United States, European Union",
    },
    {
      category: "Authentication",
      name: "Identity Services",
      purpose: "User authentication and session management",
      dataProcessed: "Email addresses, authentication tokens",
      location: "United States",
    },
    {
      category: "AI Processing",
      name: "Cloud AI Infrastructure",
      purpose: "AI powered water analysis and chat assistance",
      dataProcessed: "User messages, water test data, aquarium context",
      location: "United States",
    },
    {
      category: "Analytics",
      name: "Error Monitoring Service",
      purpose: "Application error tracking and performance monitoring",
      dataProcessed: "Error logs, performance metrics (anonymized)",
      location: "United States",
    },
    {
      category: "Communications",
      name: "Email Service Provider",
      purpose: "Transactional and notification emails",
      dataProcessed: "Email addresses, notification content",
      location: "United States",
    },
  ];

  const lastUpdated = "December 2024";

  return (
    <div className="min-h-screen">
      <SEO 
        title="Subprocessors"
        description="List of third-party subprocessors that Ally uses to provide our services. Learn about the categories of data each processor handles."
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
                subprocessor to ensure compliance with applicable data protection laws.
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
                      <TableHead className="w-[150px]">Category</TableHead>
                      <TableHead>Service Provider</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Data Processed</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subprocessors.map((processor, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{processor.category}</TableCell>
                        <TableCell>{processor.name}</TableCell>
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

        {/* Changes Notification */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Notification of Changes</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                We will update this page when we add or remove subprocessors. For customers with 
                Data Processing Agreements (DPAs), we will provide advance notice of any changes 
                as required by the agreement.
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
            Contact our privacy team for more information about our subprocessors or to subscribe 
            to update notifications.
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
