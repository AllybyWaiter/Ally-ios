-- Create partner_applications table
CREATE TABLE public.partner_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  partnership_type TEXT NOT NULL,
  business_type TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  role_title TEXT,
  website_url TEXT,
  timezone TEXT,
  channels TEXT[] NOT NULL,
  primary_channel_link TEXT NOT NULL,
  additional_links TEXT,
  audience_focus TEXT[] NOT NULL,
  total_followers INTEGER,
  avg_views INTEGER,
  monthly_visitors INTEGER,
  newsletter_subscribers INTEGER,
  promotion_plan TEXT,
  payout_method TEXT NOT NULL,
  paypal_email TEXT,
  referral_source TEXT,
  referral_code TEXT,
  agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
  agreed_to_ftc BOOLEAN NOT NULL DEFAULT false,
  confirmed_accuracy BOOLEAN NOT NULL DEFAULT false,
  
  CONSTRAINT valid_partnership_type CHECK (partnership_type IN ('affiliate', 'content', 'retail', 'technology')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT valid_payout_method CHECK (payout_method IN ('paypal', 'bank', 'venmo', 'other')),
  CONSTRAINT terms_must_be_accepted CHECK (agreed_to_terms = true),
  CONSTRAINT ftc_must_be_accepted CHECK (agreed_to_ftc = true),
  CONSTRAINT accuracy_must_be_confirmed CHECK (confirmed_accuracy = true)
);

-- Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (application form is public)
CREATE POLICY "Anyone can submit partner applications"
ON public.partner_applications
FOR INSERT
WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "Admins can view partner applications"
ON public.partner_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update applications
CREATE POLICY "Admins can update partner applications"
ON public.partner_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny anonymous access for other operations
CREATE POLICY "Deny anonymous delete"
ON public.partner_applications
FOR DELETE
USING (false);