import { useState } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { CheckCircle, AlertCircle, XCircle, Clock, Activity, Server, Database, Cloud, Shield, HardDrive, RefreshCw, Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSystemStatus, type ServiceStatus, type SystemIncident, type ScheduledMaintenance } from "@/hooks/useSystemStatus";
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const getServiceIcon = (name: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'Database': Database,
    'Authentication': Shield,
    'File Storage': HardDrive,
    'Web Application': Cloud,
    'AI Services': Activity,
    'API': Server,
  };
  return iconMap[name] || Server;
};

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
      return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Degraded</Badge>;
    case "outage":
      return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Outage</Badge>;
    case "maintenance":
      return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">Maintenance</Badge>;
  }
};

const getIncidentStatusBadge = (status: SystemIncident["status"]) => {
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

const getSeverityBadge = (severity: SystemIncident["severity"]) => {
  switch (severity) {
    case "critical":
      return <Badge variant="destructive">Critical</Badge>;
    case "major":
      return <Badge className="bg-orange-500/10 text-orange-600">Major</Badge>;
    case "minor":
      return <Badge className="bg-yellow-500/10 text-yellow-600">Minor</Badge>;
  }
};

const getMaintenanceStatusBadge = (status: ScheduledMaintenance["status"]) => {
  switch (status) {
    case "scheduled":
      return <Badge className="bg-blue-500/10 text-blue-600">Scheduled</Badge>;
    case "in_progress":
      return <Badge className="bg-yellow-500/10 text-yellow-600">In Progress</Badge>;
    case "completed":
      return <Badge className="bg-green-500/10 text-green-600">Completed</Badge>;
    case "cancelled":
      return <Badge className="bg-muted text-muted-foreground">Cancelled</Badge>;
  }
};

const Status = () => {
  const { 
    services, 
    incidents, 
    scheduledMaintenance, 
    uptime, 
    lastUpdated, 
    isLoading, 
    refresh, 
    subscribeToUpdates 
  } = useSystemStatus();
  
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const allOperational = services.length > 0 && services.every((s) => s.status === "operational");
  const hasOutage = services.some((s) => s.status === "outage");
  const hasDegraded = services.some((s) => s.status === "degraded");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    const result = await subscribeToUpdates(email);
    setIsSubscribing(false);

    if (result.success) {
      toast.success(result.message);
      setEmail('');
    } else {
      toast.error(result.message);
    }
  };

  const formatUptime = (value: number) => {
    return value.toFixed(2);
  };

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
            hasOutage ? "bg-red-500/10" : hasDegraded ? "bg-yellow-500/10" : "bg-green-500/10"
          }`}>
            {hasOutage ? (
              <XCircle className="h-6 w-6 text-red-500" />
            ) : hasDegraded ? (
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-500" />
            )}
            <span className={`text-lg font-semibold ${
              hasOutage ? "text-red-600" : hasDegraded ? "text-yellow-600" : "text-green-600"
            }`}>
              {hasOutage ? "System Outage Detected" : hasDegraded ? "Some Systems Experiencing Issues" : "All Systems Operational"}
            </span>
          </div>

          {/* Last Updated & Refresh */}
          <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
            <span>Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refresh} 
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Services Status */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Services</h2>
          {isLoading && services.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service, index) => {
                const IconComponent = getServiceIcon(service.name);
                return (
                  <Card key={index}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {service.description}
                            {service.responseTime && (
                              <span className="ml-2 text-xs">({service.responseTime}ms)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(service.status)}
                        {getStatusIcon(service.status)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Uptime Stats */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Uptime</h2>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className={`text-3xl font-bold ${uptime.last24Hours >= 99 ? 'text-green-600' : uptime.last24Hours >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatUptime(uptime.last24Hours)}%
                </div>
                <div className="text-sm text-muted-foreground">Last 24 hours</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className={`text-3xl font-bold ${uptime.last7Days >= 99 ? 'text-green-600' : uptime.last7Days >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatUptime(uptime.last7Days)}%
                </div>
                <div className="text-sm text-muted-foreground">Last 7 days</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className={`text-3xl font-bold ${uptime.last30Days >= 99 ? 'text-green-600' : uptime.last30Days >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatUptime(uptime.last30Days)}%
                </div>
                <div className="text-sm text-muted-foreground">Last 30 days</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Scheduled Maintenance */}
        {scheduledMaintenance.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Scheduled Maintenance</h2>
            <div className="space-y-4">
              {scheduledMaintenance.map((maintenance) => (
                <Card key={maintenance.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{maintenance.title}</CardTitle>
                      {getMaintenanceStatusBadge(maintenance.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {maintenance.description && (
                      <p className="text-muted-foreground mb-4">{maintenance.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Start: </span>
                        <span className="font-medium">{format(new Date(maintenance.scheduled_start), 'PPp')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">End: </span>
                        <span className="font-medium">{format(new Date(maintenance.scheduled_end), 'PPp')}</span>
                      </div>
                    </div>
                    {maintenance.affected_services.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground">Affected: </span>
                        {maintenance.affected_services.map((service) => (
                          <Badge key={service} variant="outline">{service}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {scheduledMaintenance.length === 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Scheduled Maintenance</h2>
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No scheduled maintenance at this time.</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Incident History */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Incident History</h2>
          
          {incidents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No incidents reported in the last 90 days.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {incidents.map((incident) => (
                <Card key={incident.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                      <div className="flex gap-2">
                        {getSeverityBadge(incident.severity)}
                        {getIncidentStatusBadge(incident.status)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(incident.started_at), 'PPp')}
                      {incident.resolved_at && (
                        <span> — Resolved {format(new Date(incident.resolved_at), 'PPp')}</span>
                      )}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {incident.description && (
                      <p className="text-muted-foreground mb-4">{incident.description}</p>
                    )}
                    {incident.affected_services.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground">Affected: </span>
                        {incident.affected_services.map((service) => (
                          <Badge key={service} variant="outline">{service}</Badge>
                        ))}
                      </div>
                    )}
                    {incident.updates.length > 0 && (
                      <div className="border-l-2 border-border pl-4 space-y-4">
                        {incident.updates.map((update) => (
                          <div key={update.id}>
                            <span className="text-xs text-muted-foreground font-mono">
                              {format(new Date(update.created_at), 'HH:mm')} UTC
                            </span>
                            <p className="text-sm text-foreground">{update.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Subscribe */}
        <section className="text-center p-12 bg-primary/5 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Get Status Updates</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Subscribe to receive notifications about service disruptions and scheduled maintenance.
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={isSubscribing} className="gap-2">
              {isSubscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Subscribe
            </Button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Status;
