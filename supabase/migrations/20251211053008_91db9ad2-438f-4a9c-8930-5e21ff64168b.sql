-- Create ai_feedback table for collecting user feedback on AI responses
CREATE TABLE public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature TEXT NOT NULL CHECK (feature IN ('chat', 'photo_analysis', 'task_suggestions', 'ticket_reply')),
  message_id UUID, -- Reference to chat_messages if applicable
  water_test_id UUID, -- Reference to water_tests if applicable
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  feedback_text TEXT, -- Optional written feedback
  context JSONB, -- Snapshot of what was shown to user
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- Users can create their own feedback
CREATE POLICY "Users can create their own feedback"
ON public.ai_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.ai_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all feedback for analysis
CREATE POLICY "Admins can view all feedback"
ON public.ai_feedback
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for efficient querying
CREATE INDEX idx_ai_feedback_user_id ON public.ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_feature ON public.ai_feedback(feature);
CREATE INDEX idx_ai_feedback_created_at ON public.ai_feedback(created_at DESC);