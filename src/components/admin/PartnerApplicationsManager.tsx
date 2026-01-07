import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Search, 
  Eye, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Filter,
  Handshake,
  Users,
  ExternalLink,
  Mail
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/formatters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface PartnerApplication {
  id: string;
  full_name: string;
  email: string;
  country: string;
  company_name: string | null;
  phone: string | null;
  role_title: string | null;
  website_url: string | null;
  timezone: string | null;
  partnership_type: string;
  business_type: string | null;
  channels: string[];
  primary_channel_link: string;
  additional_links: string | null;
  audience_focus: string[];
  total_followers: number | null;
  avg_views: number | null;
  monthly_visitors: number | null;
  newsletter_subscribers: number | null;
  promotion_plan: string | null;
  payout_method: string;
  paypal_email: string | null;
  referral_source: string | null;
  referral_code: string | null;
  agreed_to_terms: boolean;
  agreed_to_ftc: boolean;
  confirmed_accuracy: boolean;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

const partnershipTypeColors: Record<string, string> = {
  affiliate: 'bg-blue-500',
  content: 'bg-purple-500',
  retail: 'bg-orange-500',
  technology: 'bg-cyan-500',
};

export function PartnerApplicationsManager() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<PartnerApplication[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    let filtered = applications;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(a =>
        a.full_name.toLowerCase().includes(searchLower) ||
        a.email.toLowerCase().includes(searchLower) ||
        a.company_name?.toLowerCase().includes(searchLower) ||
        a.primary_channel_link.toLowerCase().includes(searchLower)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(a => a.partnership_type === typeFilter);
    }
    
    setFilteredApplications(filtered);
  }, [search, statusFilter, typeFilter, applications]);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('partner_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch applications',
        variant: 'destructive',
      });
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('partner_applications')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Status updated' });
      fetchApplications();
    }
  };

  const openViewDialog = (application: PartnerApplication) => {
    setSelectedApplication(application);
    setViewDialogOpen(true);
  };

  const formatNumber = (num: number | null): string => {
    if (num === null) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTotalReach = (app: PartnerApplication): number => {
    return (app.total_followers || 0) + (app.monthly_visitors || 0) + (app.newsletter_subscribers || 0);
  };

  const exportToCSV = () => {
    const headers = ['Full Name', 'Email', 'Company', 'Country', 'Partnership Type', 'Status', 'Channels', 'Audience Focus', 'Total Followers', 'Applied Date'];
    const csvContent = [
      headers.join(','),
      ...filteredApplications.map(a => [
        a.full_name,
        a.email,
        a.company_name || '',
        a.country,
        a.partnership_type,
        a.status,
        a.channels.join('; '),
        a.audience_focus.join('; '),
        a.total_followers || '',
        formatDate(a.created_at, 'PP')
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partner-applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Handshake className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Partner Applications</CardTitle>
              <CardDescription>Review and manage partnership applications</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <Handshake className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="affiliate">Affiliate</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Reach</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow key={app.id} className="cursor-pointer" onClick={() => openViewDialog(app)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.full_name}</p>
                        <p className="text-sm text-muted-foreground">{app.email}</p>
                        {app.company_name && (
                          <p className="text-xs text-muted-foreground">{app.company_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={partnershipTypeColors[app.partnership_type] || 'bg-gray-500'}>
                        {app.partnership_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {app.channels.slice(0, 2).map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                        {app.channels.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{app.channels.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formatNumber(getTotalReach(app))}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[app.status] || 'bg-gray-500'}>
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(app.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openViewDialog(app)} aria-label="View application details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Select
                          value={app.status}
                          onValueChange={(value) => updateStatus(app.id, value)}
                        >
                          <SelectTrigger className="w-[100px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Partner Application Details</DialogTitle>
            <DialogDescription>
              Application from {selectedApplication?.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Full Name</Label>
                      <p>{selectedApplication.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p>{selectedApplication.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Country</Label>
                      <p>{selectedApplication.country}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Company</Label>
                      <p>{selectedApplication.company_name || 'N/A'}</p>
                    </div>
                    {selectedApplication.phone && (
                      <div>
                        <Label className="text-muted-foreground">Phone</Label>
                        <p>{selectedApplication.phone}</p>
                      </div>
                    )}
                    {selectedApplication.role_title && (
                      <div>
                        <Label className="text-muted-foreground">Role</Label>
                        <p>{selectedApplication.role_title}</p>
                      </div>
                    )}
                    {selectedApplication.website_url && (
                      <div>
                        <Label className="text-muted-foreground">Website</Label>
                        <a 
                          href={selectedApplication.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {selectedApplication.website_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {selectedApplication.timezone && (
                      <div>
                        <Label className="text-muted-foreground">Timezone</Label>
                        <p>{selectedApplication.timezone}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Partnership Details */}
                <div>
                  <h3 className="font-semibold mb-3">Partnership Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Partnership Type</Label>
                      <Badge className={partnershipTypeColors[selectedApplication.partnership_type] || 'bg-gray-500'}>
                        {selectedApplication.partnership_type}
                      </Badge>
                    </div>
                    {selectedApplication.business_type && (
                      <div>
                        <Label className="text-muted-foreground">Business Type</Label>
                        <p className="capitalize">{selectedApplication.business_type.replace('_', ' ')}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Channels & Links */}
                <div>
                  <h3 className="font-semibold mb-3">Channels & Links</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">Active Channels</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedApplication.channels.map((channel) => (
                          <Badge key={channel} variant="outline">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Primary Channel Link</Label>
                      <a 
                        href={selectedApplication.primary_channel_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {selectedApplication.primary_channel_link}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {selectedApplication.additional_links && (
                      <div>
                        <Label className="text-muted-foreground">Additional Links</Label>
                        <p className="text-sm whitespace-pre-wrap">{selectedApplication.additional_links}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Audience */}
                <div>
                  <h3 className="font-semibold mb-3">Audience Focus</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.audience_focus.map((focus) => (
                      <Badge key={focus} variant="secondary">
                        {focus}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Reach Metrics */}
                <div>
                  <h3 className="font-semibold mb-3">Reach Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{formatNumber(selectedApplication.total_followers)}</p>
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{formatNumber(selectedApplication.avg_views)}</p>
                      <p className="text-xs text-muted-foreground">Avg Views</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{formatNumber(selectedApplication.monthly_visitors)}</p>
                      <p className="text-xs text-muted-foreground">Monthly Visitors</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{formatNumber(selectedApplication.newsletter_subscribers)}</p>
                      <p className="text-xs text-muted-foreground">Subscribers</p>
                    </div>
                  </div>
                </div>

                {selectedApplication.promotion_plan && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3">Promotion Plan</h3>
                      <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                        {selectedApplication.promotion_plan}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Payout Info */}
                <div>
                  <h3 className="font-semibold mb-3">Payout Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Payout Method</Label>
                      <p className="capitalize">{selectedApplication.payout_method}</p>
                    </div>
                    {selectedApplication.paypal_email && (
                      <div>
                        <Label className="text-muted-foreground">PayPal Email</Label>
                        <p>{selectedApplication.paypal_email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedApplication.referral_source || selectedApplication.referral_code) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3">Attribution</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedApplication.referral_source && (
                          <div>
                            <Label className="text-muted-foreground">How They Found Us</Label>
                            <p className="capitalize">{selectedApplication.referral_source.replace('_', ' ')}</p>
                          </div>
                        )}
                        {selectedApplication.referral_code && (
                          <div>
                            <Label className="text-muted-foreground">Referral Code</Label>
                            <p>{selectedApplication.referral_code}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Legal Confirmations */}
                <div>
                  <h3 className="font-semibold mb-3">Legal Confirmations</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {selectedApplication.agreed_to_terms ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Agreed to Terms & Conditions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedApplication.agreed_to_ftc ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Agreed to FTC Guidelines</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedApplication.confirmed_accuracy ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Confirmed Information Accuracy</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Timestamps */}
                <div>
                  <Label className="text-muted-foreground">Applied on</Label>
                  <p>{formatDate(selectedApplication.created_at, 'PPpp')}</p>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedApplication) {
                  window.open(`mailto:${selectedApplication.email}?subject=Partner Application`, '_blank');
                }
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
            {selectedApplication?.status !== 'approved' && (
              <Button
                onClick={() => {
                  if (selectedApplication) {
                    updateStatus(selectedApplication.id, 'approved');
                    setViewDialogOpen(false);
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </Button>
            )}
            {selectedApplication?.status !== 'rejected' && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedApplication) {
                    updateStatus(selectedApplication.id, 'rejected');
                    setViewDialogOpen(false);
                  }
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
