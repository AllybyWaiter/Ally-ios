-- Fix support tickets RLS policy vulnerability
-- Remove the insecure policy that allows unauthenticated users to view tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;

-- Create secure policy that only allows authenticated users who own the ticket
CREATE POLICY "Users can view their own tickets"
ON support_tickets
FOR SELECT
USING (auth.uid() = user_id);

-- Admin policy remains secure
-- "Admins can view all tickets" policy is already secure using has_role check