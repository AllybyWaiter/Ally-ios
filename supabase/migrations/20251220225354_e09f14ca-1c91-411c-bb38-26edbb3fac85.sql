-- Add index on chat_messages for efficient user queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);

-- Add index on ai_feedback for user queries
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON public.ai_feedback(user_id);

-- Add index on user_memories for admin queries
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON public.user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_memory_key ON public.user_memories(memory_key);

-- Create ai_annotations table for training data annotations
CREATE TABLE public.ai_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  annotation_type TEXT NOT NULL CHECK (annotation_type IN ('correct', 'needs_improvement', 'spam', 'golden')),
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_annotations
ALTER TABLE public.ai_annotations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage annotations
CREATE POLICY "Admins can manage annotations"
  ON public.ai_annotations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create ai_alerts table for monitoring alerts
CREATE TABLE public.ai_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('error_rate', 'traffic_spike', 'negative_feedback', 'latency', 'system')),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  details JSONB,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_alerts
ALTER TABLE public.ai_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage alerts
CREATE POLICY "Admins can manage ai_alerts"
  ON public.ai_alerts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert alerts (for edge functions)
CREATE POLICY "Service role can insert ai_alerts"
  ON public.ai_alerts
  FOR INSERT
  WITH CHECK (true);

-- Add last_ai_interaction column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_ai_interaction TIMESTAMP WITH TIME ZONE;

-- Create trigger for ai_annotations updated_at
CREATE TRIGGER update_ai_annotations_updated_at
  BEFORE UPDATE ON public.ai_annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();