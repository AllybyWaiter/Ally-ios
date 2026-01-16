-- Step 1: Add content_creator to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'content_creator';