-- Create livestock table for tracking fish, invertebrates, corals, etc.
CREATE TABLE public.livestock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aquarium_id UUID NOT NULL REFERENCES public.aquariums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fish', 'invertebrate', 'coral', 'other')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  date_added DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  health_status TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'sick', 'quarantine')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plants table for tracking aquatic plants
CREATE TABLE public.plants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aquarium_id UUID NOT NULL REFERENCES public.aquariums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  date_added DATE NOT NULL DEFAULT CURRENT_DATE,
  placement TEXT NOT NULL DEFAULT 'midground' CHECK (placement IN ('foreground', 'midground', 'background', 'floating')),
  notes TEXT,
  condition TEXT NOT NULL DEFAULT 'growing' CHECK (condition IN ('thriving', 'growing', 'struggling')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for livestock
CREATE POLICY "Users can view their own livestock"
  ON public.livestock FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own livestock"
  ON public.livestock FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own livestock"
  ON public.livestock FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own livestock"
  ON public.livestock FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for plants
CREATE POLICY "Users can view their own plants"
  ON public.plants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plants"
  ON public.plants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plants"
  ON public.plants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plants"
  ON public.plants FOR DELETE
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_livestock_updated_at
  BEFORE UPDATE ON public.livestock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plants_updated_at
  BEFORE UPDATE ON public.plants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();