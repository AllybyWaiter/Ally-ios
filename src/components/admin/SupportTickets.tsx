import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle, Send, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  message: string;
  sender_type: string;
  created_at: string;
}

const SupportTickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } else {
      setTickets(data || []);
    }
    setIsLoading(false);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } else {
      setMessages(data || []);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', ticketId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Ticket status updated",
      });
      fetchTickets();
      if (selectedTicket) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setIsSending(true);
    const { error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: selectedTicket.id,
        sender_type: 'admin',
        message: replyMessage,
        sender_user_id: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
      setReplyMessage("");
      fetchMessages(selectedTicket.id);
      
      // Update ticket status to in_progress if it was open
      if (selectedTicket.status === 'open') {
        updateTicketStatus(selectedTicket.id, 'in_progress');
      }
    }
    setIsSending(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'closed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_progress':
        return 'default';
      case 'resolved':
        return 'secondary';
      case 'closed':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading tickets...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Support Tickets ({tickets.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            <Sparkles className="h-4 w-4 inline mr-1" />
            Priorities are automatically detected by AI based on message urgency and impact
          </p>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-muted-foreground">No support tickets yet.</p>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{ticket.subject}</h3>
                        <Badge variant={getStatusColor(ticket.status)}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">{ticket.status}</span>
                        </Badge>
                        <Badge variant={getPriorityColor(ticket.priority)}>
                          <Sparkles className="h-3 w-3 mr-1" />
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        From: {ticket.name} ({ticket.email})
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ticket.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Ticket: {selectedTicket?.subject}
              <Badge variant={getStatusColor(selectedTicket?.status || '')}>
                {selectedTicket?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              From: {selectedTicket?.name} ({selectedTicket?.email})
              <br />
              Created: {selectedTicket && format(new Date(selectedTicket.created_at), 'PPpp')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Update */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <Select
                value={selectedTicket?.status}
                onValueChange={(value) => selectedTicket && updateTicketStatus(selectedTicket.id, value as Ticket['status'])}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_for_user">Waiting for User</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Messages */}
            <div className="border rounded-lg p-4 space-y-4 max-h-[400px] overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender_type === 'admin'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {format(new Date(message.created_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            <div className="space-y-2">
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                className="min-h-[100px]"
              />
              <Button onClick={sendReply} disabled={isSending || !replyMessage.trim()}>
                {isSending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SupportTickets;
