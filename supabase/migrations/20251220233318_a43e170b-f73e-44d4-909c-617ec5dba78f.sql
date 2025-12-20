-- Allow admins to view all user memories
CREATE POLICY "Admins can view all memories"
  ON user_memories
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all chat conversations
CREATE POLICY "Admins can view all conversations"
  ON chat_conversations
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all chat messages
CREATE POLICY "Admins can view all messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));