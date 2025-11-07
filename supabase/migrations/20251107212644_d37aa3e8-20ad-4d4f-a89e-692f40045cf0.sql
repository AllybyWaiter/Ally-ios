-- Create waitlist table
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert their email (for public waitlist)
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist
FOR INSERT
TO anon
WITH CHECK (true);

-- Create policy to prevent reading waitlist data (privacy)
CREATE POLICY "Only authenticated admins can view waitlist"
ON public.waitlist
FOR SELECT
TO authenticated
USING (false);

-- Create index on email for faster lookups
CREATE INDEX idx_waitlist_email ON public.waitlist(email);

-- Create index on created_at for sorting
CREATE INDEX idx_waitlist_created_at ON public.waitlist(created_at DESC);