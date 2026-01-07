-- Add fields to chat_conversations table for enhanced sidebar
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

-- Create index for pinned conversations
CREATE INDEX IF NOT EXISTS idx_chat_conversations_pinned 
ON public.chat_conversations(user_id, is_pinned) 
WHERE is_pinned = true;

-- Create function to update conversation metadata when messages are added
CREATE OR REPLACE FUNCTION public.update_conversation_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations
  SET 
    message_count = (
      SELECT COUNT(*) FROM public.chat_messages 
      WHERE conversation_id = NEW.conversation_id
    ),
    last_message_preview = CASE 
      WHEN NEW.role = 'assistant' THEN LEFT(NEW.content, 100)
      ELSE (
        SELECT LEFT(content, 100) 
        FROM public.chat_messages 
        WHERE conversation_id = NEW.conversation_id 
        ORDER BY created_at DESC 
        LIMIT 1
      )
    END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update metadata
DROP TRIGGER IF EXISTS on_chat_message_insert ON public.chat_messages;
CREATE TRIGGER on_chat_message_insert
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_metadata();

-- Backfill existing conversations with message counts and previews
UPDATE public.chat_conversations c
SET 
  message_count = (
    SELECT COUNT(*) FROM public.chat_messages m WHERE m.conversation_id = c.id
  ),
  last_message_preview = (
    SELECT LEFT(content, 100) 
    FROM public.chat_messages m 
    WHERE m.conversation_id = c.id 
    ORDER BY created_at DESC 
    LIMIT 1
  )
WHERE message_count IS NULL OR message_count = 0;