import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle, Send, Sparkles, Lightbulb, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getErrorMessage } from "@/lib/errorUtils";

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

interface ReplyTemplate {
  title: string;
  content: string;
}

const SupportTickets = () => {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [suggestedReplies, setSuggestedReplies] = useState<ReplyTemplate[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const lastSuggestionFetchRef = useRef<number>(0);

  // Fetch tickets with React Query
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Ticket[];
    },
  });

  // Fetch messages for selected ticket
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['admin-ticket-messages', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket?.id) return [];
      
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', selectedTicket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Message[];
    },
    enabled: !!selectedTicket?.id,
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: Ticket['status'] }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ticket status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to update ticket status', { description: getErrorMessage(error) });
    },
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'admin',
          message,
          sender_user_id: user?.id
        });

      if (error) throw error;
      return { ticketId };
    },
    onSuccess: ({ ticketId }) => {
      toast.success('Reply sent successfully');
      setReplyMessage("");
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-messages', ticketId] });
      
      // Update ticket status to in_progress if it was open
      if (selectedTicket?.status === 'open') {
        updateStatusMutation.mutate({ ticketId, status: 'in_progress' });
      }
    },
    onError: (error: unknown) => {
      toast.error('Failed to send reply', { description: getErrorMessage(error) });
    },
  });

  // Debounced fetch for suggested replies using ref to avoid stale closure
  const fetchSuggestedReplies = useCallback(async (ticket: Ticket) => {
    const now = Date.now();
    const DEBOUNCE_MS = 2000; // 2 second cooldown between AI suggestion requests
    
    if (now - lastSuggestionFetchRef.current < DEBOUNCE_MS) {
      return;
    }
    
    lastSuggestionFetchRef.current = now;
    setIsLoadingSuggestions(true);
    setSuggestedReplies([]);
    
    try {
      const { data: messagesData } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      const initialMessage = messagesData?.[0]?.message || '';
      
      // Get auth token for authenticated request
      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData.session?.access_token;
      
      if (!authToken) {
        console.warn('No auth token available for ticket reply suggestions');
        return;
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-ticket-reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            ticketContent: initialMessage,
            priority: ticket.priority,
            messages: messagesData || []
          }),
        }
      );

      const { templates } = await response.json();
      setSuggestedReplies(templates || []);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []); // Empty deps since we use ref for mutable timestamp

  const handleTicketSelect = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchSuggestedReplies(ticket);
  }, [fetchSuggestedReplies]);

  const handleStatusChange = (status: Ticket['status']) => {
    if (selectedTicket) {
      updateStatusMutation.mutate({ ticketId: selectedTicket.id, status });
      setSelectedTicket({ ...selectedTicket, status });
    }
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    sendReplyMutation.mutate({ ticketId: selectedTicket.id, message: replyMessage });
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

  if (isLoadingTickets) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
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
                  onClick={() => handleTicketSelect(ticket)}
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
                onValueChange={(value) => handleStatusChange(value as Ticket['status'])}
                disabled={updateStatusMutation.isPending}
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
              {isLoadingMessages ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-3/4" />
                  ))}
                </div>
              ) : (
                messages.map((message) => (
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
                ))
              )}
            </div>

            {/* Reply Box */}
            <div className="space-y-2">
              {/* Suggested Replies */}
              {isLoadingSuggestions && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating AI reply suggestions...
                </div>
              )}
              
              {suggestedReplies.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    AI-Suggested Replies
                  </div>
                  <div className="grid gap-2">
                    {suggestedReplies.map((template) => (
                      <button
                        key={template.title}
                        onClick={() => setReplyMessage(template.content)}
                        className="text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-medium text-sm mb-1">{template.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {template.content}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                className="min-h-[100px]"
              />
              <Button 
                onClick={handleSendReply} 
                disabled={sendReplyMutation.isPending || !replyMessage.trim()}
              >
                {sendReplyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
