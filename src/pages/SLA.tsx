import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Clock, CheckCircle, AlertTriangle, ExternalLink, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SLA = () => {
  const uptimeCommitments = [
    { service: "Web Application", target: "99.9%", description: "Core application availability" },
    { service: "API Services", target: "99.9%", description: "Backend API endpoints" },
    { service: "AI Features", target: "99.5%", description: "Ally AI chat and analysis" },
    { service: "Data Storage", target: "99.99%", description: "Database and file storage" },
  ];

  const creditSchedule = [
    { uptime: "99.0% to 99.9%", credit: "10%" },
    { uptime: "95.0% to 99.0%", credit: "25%" },
    { uptime: "Below 95.0%", credit: "50%" },
  ];

  const exclusions = [
    "Scheduled maintenance (announced at least 24 hours in advance)",
    "Force majeure events (natural disasters, war, etc.)",
    "Issues caused by third party services outside our control",
    "Attacks or intrusions on our infrastructure",
    "Issues resulting from customer actions or configurations",
    "Beta or preview features explicitly marked as such",
  ];

  return (
    <div className="min-h-screen">
      <SEO 
        title="Service Level Agreement"
        description="Ally's Service Level Agreement (SLA) detailing our uptime commitments, credit policies, and service reliability guarantees."
        path="/legal/sla"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Service Level Agreement
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our commitment to reliability and availability. This SLA describes our uptime 
            targets and what happens if we don't meet them.
          </p>
        </div>

        {/* Current Status Link */}
        <section className="mb-12">
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-foreground">All Systems Operational</p>
                    <p className="text-sm text-muted-foreground">Check our status page for real time updates</p>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/status">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Status
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Uptime Commitments */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Uptime Commitments</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Monthly Target</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uptimeCommitments.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.service}</TableCell>
                      <TableCell>
                        <span className="font-mono text-green-600">{item.target}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground mt-4">
            Uptime is calculated as a monthly percentage: (Total minutes in month − Downtime minutes) ÷ Total minutes in month × 100
          </p>
        </section>

        {/* How We Measure */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">How We Measure Uptime</h2>
          <Card>
            <CardContent className="pt-6 space-y-4 text-muted-foreground">
              <p>
                We use multiple monitoring systems to track service availability from various 
                geographic locations. Downtime is measured as the total number of minutes 
                during which the service was unavailable.
              </p>
              <p>
                A service is considered "unavailable" when users are unable to access core 
                functionality due to issues within our control. Brief interruptions (under 5 
                consecutive minutes) are generally not counted as downtime.
              </p>
              <p>
                Our monitoring data is the authoritative source for uptime calculations.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Service Credits */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Service Credits</h2>
          <Card>
            <CardHeader>
              <CardTitle>Credit Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Monthly Uptime Percentage</TableHead>
                    <TableHead>Service Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditSchedule.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.uptime}</TableCell>
                      <TableCell className="text-primary font-semibold">{item.credit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>
              Service credits are calculated as a percentage of your monthly subscription fee 
              and applied to future invoices. Credits do not expire but cannot be redeemed for cash.
            </p>
            <p>
              To request a service credit, contact support within 30 days of the incident with 
              details of the downtime experienced.
            </p>
          </div>
        </section>

        {/* Exclusions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Exclusions</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                What's Not Covered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The following situations are excluded from uptime calculations and service credit eligibility:
              </p>
              <ul className="space-y-2">
                {exclusions.map((exclusion, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-muted-foreground/60">•</span>
                    {exclusion}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Scheduled Maintenance */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Scheduled Maintenance</h2>
          <Card>
            <CardContent className="pt-6 text-muted-foreground space-y-4">
              <p>
                We perform scheduled maintenance during low usage periods (typically weekdays 
                between 2:00 AM and 6:00 AM UTC) when possible. We aim to complete most 
                maintenance without service interruption.
              </p>
              <p>
                For maintenance that may cause downtime, we provide at least 24 hours advance 
                notice via email and our status page. Emergency maintenance for critical 
                security issues may be performed with shorter notice.
              </p>
              <p>
                Subscribe to status updates on our{" "}
                <Link to="/status" className="text-primary hover:underline">
                  status page
                </Link>
                {" "}to receive maintenance notifications.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Support Response Times */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Support Response Times</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                  <p className="font-semibold text-red-600 mb-1">Critical</p>
                  <p className="text-2xl font-bold text-foreground mb-2">4 hours</p>
                  <p className="text-xs text-muted-foreground">Service completely unavailable</p>
                </div>
                <div className="text-center p-4 bg-amber-500/10 rounded-lg">
                  <p className="font-semibold text-amber-600 mb-1">High</p>
                  <p className="text-2xl font-bold text-foreground mb-2">8 hours</p>
                  <p className="text-xs text-muted-foreground">Major feature impacted</p>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                  <p className="font-semibold text-blue-600 mb-1">Normal</p>
                  <p className="text-2xl font-bold text-foreground mb-2">24 hours</p>
                  <p className="text-xs text-muted-foreground">General questions and issues</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Response times are measured during business hours (Monday through Friday, 9 AM to 6 PM EST)
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Contact */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Need Help?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            If you've experienced downtime or have questions about our SLA, our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <a href="mailto:support@allybywaiterapp.com">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/status">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Status Page
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SLA;
