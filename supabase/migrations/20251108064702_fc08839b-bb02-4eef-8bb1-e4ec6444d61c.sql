-- Create custom parameter templates table
CREATE TABLE public.custom_parameter_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  aquarium_type TEXT NOT NULL,
  parameters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_parameter_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own templates" 
ON public.custom_parameter_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
ON public.custom_parameter_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.custom_parameter_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.custom_parameter_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_custom_templates_user_id ON public.custom_parameter_templates(user_id);
CREATE INDEX idx_custom_templates_aquarium_type ON public.custom_parameter_templates(aquarium_type);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_parameter_templates_updated_at
BEFORE UPDATE ON public.custom_parameter_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();