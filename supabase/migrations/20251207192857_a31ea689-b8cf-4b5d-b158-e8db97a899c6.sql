-- Add inquiry_type column to contacts table for categorizing submissions
ALTER TABLE public.contacts 
ADD COLUMN inquiry_type text DEFAULT 'general',
ADD COLUMN company text,
ADD COLUMN subject text;