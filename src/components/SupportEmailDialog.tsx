import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Input validation schema for support form
const supportFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  message: z.string().trim().min(1, "Message is required").max(5000, "Message must be less than 5000 characters"),
});

interface SupportEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupportEmailDialog = ({ open, onOpenChange }: SupportEmailDialogProps) => {
  const { toast } = useToast();
  const { user, userName } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: userName || "",
    email: user?.email || "",
    message: "",
  });

  // Reset form when dialog opens/closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFormData({ name: userName || "", email: user?.email || "", message: "" });
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data with zod schema
    const validationResult = supportFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError?.message || "Please check your input.",
        variant: "destructive",
      });
      return;
    }

    const validatedData = validationResult.data;
    setIsSubmitting(true);

    try {
      // Get current session for authenticated requests
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      // Analyze message priority using AI (works for both authenticated and guest users)
      const priorityResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-ticket-priority`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ message: validatedData.message }),
        }
      );

      const { priority } = priorityResponse.ok
        ? await priorityResponse.json()
        : { priority: 'medium' };

      // Create support ticket with AI-determined priority
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id || null,
          email: validatedData.email,
          name: validatedData.name,
          subject: "Support Request",
          status: 'open',
          priority: priority || 'medium'
        })
        .select()
        .maybeSingle();

      if (ticketError || !ticket) throw ticketError || new Error('Failed to create ticket');

      // Add initial message to ticket
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_type: 'user',
          message: validatedData.message,
          sender_user_id: user?.id || null
        });

      if (messageError) throw messageError;

      // Send confirmation email (non-blocking)
      try {
        await supabase.functions.invoke('send-ticket-confirmation', {
          body: {
            name: validatedData.name,
            email: validatedData.email,
            ticketId: ticket.id,
            priority: priority || 'medium',
            messagePreview: validatedData.message.slice(0, 500), // Limit preview length
          },
        });
      } catch {
        // Email sending failed - don't fail the ticket creation
      }
      
      toast({
        title: "Ticket Created!",
        description: `We've sent a confirmation to ${validatedData.email}. Priority: ${(priority || 'medium').toUpperCase()}.`,
      });
      
      onOpenChange(false);
      setFormData({ name: userName || "", email: user?.email || "", message: "" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Send us a message and we'll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="How can we help you?"
              className="min-h-[120px]"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
