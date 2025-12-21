import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { CheckCircle, AlertCircle, XCircle, Clock, Activity, Server, Database, Cloud, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ServiceStatus = "operational" | "degraded" | "outage" | "maintenance";

interface Service {
  name: string;
  status: ServiceStatus;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Incident {
  date: string;
  title: string;
  status: "resolved" | "monitoring" | "investigating" | "identified";
  description: string;
  updates: { time: string; message: string }[];
}

const Status = () => {
  // Placeholder data - replace with real-time status monitoring
  const services: Service[] = [
    {
      name: "Web Application",
      status: "operational",
      description: "Main web application and dashboard",
      icon: Cloud,
    },
    {
      name: "Mobile Apps",
      status: "operational",
      description: "iOS and Android applications",
      icon: Smartphone,
    },
    {
      name: "API",
      status: "operational",
      description: "REST API and webhooks",
      icon: Server,
    },
    {
      name: "Database",
      status: "operational",
      description: "Data storage and retrieval",
      icon: Database,
    },
    {
      name: "AI Services",
      status: "operational",
      description: "AI-powered recommendations and analysis",
      icon: Activity,
    },
  ];

  const incidents: Incident[] = [
    {
      date: "[YYYY-MM-DD]",
      title: "[PLACEHOLDER: Incident Title]",
      status: "resolved",
      description: "[PLACEHOLDER: Brief description of what happened]",
      updates: [
        { time: "[HH:MM UTC]", message: "[PLACEHOLDER: Incident resolved. All services operating normally.]" },
        { time: "[HH:MM UTC]", message: "[PLACEHOLDER: Fix deployed. Monitoring for stability.]" },
        { time: "[HH:MM UTC]", message: "[PLACEHOLDER: Issue identified. Working on a fix.]" },
        { time: "[HH:MM UTC]", message: "[PLACEHOLDER: Investigating reports of slow performance.]" },
      ],
    },
  ];

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "outage":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "maintenance":
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Operational</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Degraded Performance</Badge>;
      case "outage":
        return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Outage</Badge>;
      case "maintenance":
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">Maintenance</Badge>;
    }
  };

  const getIncidentStatusBadge = (status: Incident["status"]) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-500/10 text-green-600">Resolved</Badge>;
      case "monitoring":
        return <Badge className="bg-blue-500/10 text-blue-600">Monitoring</Badge>;
      case "investigating":
        return <Badge className="bg-yellow-500/10 text-yellow-600">Investigating</Badge>;
      case "identified":
        return <Badge className="bg-orange-500/10 text-orange-600">Identified</Badge>;
    }
  };

  const allOperational = services.every((s) => s.status === "operational");

  return (
    <div className="min-h-screen">
      <SEO 
        title="System Status"
        description="Check the current status of Ally services. View real-time system health, scheduled maintenance, and incident history."
        path="/status"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">System Status</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Real-time status of Ally services and infrastructure.
          </p>
          
          {/* Overall Status Banner */}
          <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-full ${
            allOperational ? "bg-green-500/10" : "bg-yellow-500/10"
          }`}>
            {allOperational ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            )}
            <span className={`text-lg font-semibold ${
              allOperational ? "text-green-600" : "text-yellow-600"
            }`}>
              {allOperational ? "All Systems Operational" : "Some Systems Experiencing Issues"}
            </span>
          </div>
        </div>

        {/* Placeholder Notice */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-8">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>PLACEHOLDER:</strong> This is a static status page. For production, integrate with a status monitoring service like Statuspage, Instatus, or custom monitoring. Replace all placeholder content with real-time data.
          </p>
        </div>

        {/* Services Status */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Services</h2>
          <div className="space-y-4">
            {services.map((service, index) => (
              <Card key={index}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <service.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(service.status)}
                    {getStatusIcon(service.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Uptime Stats */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Uptime</h2>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add real uptime statistics from your monitoring service.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-foreground">[XX.XX]%</div>
                <div className="text-sm text-muted-foreground">Last 24 hours</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-foreground">[XX.XX]%</div>
                <div className="text-sm text-muted-foreground">Last 7 days</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-foreground">[XX.XX]%</div>
                <div className="text-sm text-muted-foreground">Last 30 days</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Incident History */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Incident History</h2>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Replace with actual incident history. Remove if no incidents have occurred.
            </p>
          </div>
          
          {incidents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No incidents reported in the last 90 days.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {incidents.map((incident, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                      {getIncidentStatusBadge(incident.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{incident.date}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{incident.description}</p>
                    <div className="border-l-2 border-border pl-4 space-y-4">
                      {incident.updates.map((update, updateIndex) => (
                        <div key={updateIndex}>
                          <span className="text-xs text-muted-foreground font-mono">{update.time}</span>
                          <p className="text-sm text-foreground">{update.message}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Scheduled Maintenance */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Scheduled Maintenance</h2>
          <Card>
            <CardContent className="py-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No scheduled maintenance at this time.</p>
              <p className="text-sm text-muted-foreground mt-2">
                [PLACEHOLDER: Add any upcoming maintenance windows here]
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Subscribe */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Get Status Updates</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Subscribe to receive notifications about service disruptions and scheduled maintenance.
          </p>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>PLACEHOLDER:</strong> Add email subscription form or link to status page subscription.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Status;
