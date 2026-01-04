-- Create fish_species table for compatibility data
CREATE TABLE public.fish_species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'fish', -- 'fish', 'invertebrate', 'coral'
  water_type TEXT NOT NULL, -- 'freshwater', 'saltwater', 'brackish'
  
  -- Temperament
  temperament TEXT NOT NULL DEFAULT 'peaceful', -- 'peaceful', 'semi-aggressive', 'aggressive'
  schooling BOOLEAN DEFAULT false,
  min_school_size INTEGER DEFAULT 1,
  
  -- Size
  adult_size_inches NUMERIC NOT NULL,
  min_tank_gallons INTEGER NOT NULL,
  
  -- Water Parameters
  temp_min_f NUMERIC,
  temp_max_f NUMERIC,
  ph_min NUMERIC,
  ph_max NUMERIC,
  hardness_min_dgh NUMERIC,
  hardness_max_dgh NUMERIC,
  
  -- Compatibility flags
  fin_nipper BOOLEAN DEFAULT false,
  predator BOOLEAN DEFAULT false,
  territorial BOOLEAN DEFAULT false,
  bottom_dweller BOOLEAN DEFAULT false,
  top_dweller BOOLEAN DEFAULT false,
  mid_dweller BOOLEAN DEFAULT true,
  
  -- Specific incompatibilities
  incompatible_categories TEXT[] DEFAULT '{}',
  species_only_tank BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for search
CREATE INDEX idx_fish_species_common_name ON public.fish_species USING gin(to_tsvector('english', common_name));
CREATE INDEX idx_fish_species_scientific_name ON public.fish_species USING gin(to_tsvector('english', scientific_name));
CREATE INDEX idx_fish_species_water_type ON public.fish_species(water_type);

-- Enable RLS
ALTER TABLE public.fish_species ENABLE ROW LEVEL SECURITY;

-- Everyone can read fish species data
CREATE POLICY "Anyone can view fish species"
ON public.fish_species FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage fish species"
ON public.fish_species FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_fish_species_updated_at
BEFORE UPDATE ON public.fish_species
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with popular freshwater species
INSERT INTO public.fish_species (common_name, scientific_name, category, water_type, temperament, schooling, min_school_size, adult_size_inches, min_tank_gallons, temp_min_f, temp_max_f, ph_min, ph_max, fin_nipper, predator, territorial, bottom_dweller, mid_dweller, top_dweller, species_only_tank) VALUES
-- Peaceful community fish
('Neon Tetra', 'Paracheirodon innesi', 'fish', 'freshwater', 'peaceful', true, 6, 1.5, 10, 70, 81, 6.0, 7.0, false, false, false, false, true, false, false),
('Cardinal Tetra', 'Paracheirodon axelrodi', 'fish', 'freshwater', 'peaceful', true, 6, 2.0, 10, 73, 81, 5.0, 7.0, false, false, false, false, true, false, false),
('Guppy', 'Poecilia reticulata', 'fish', 'freshwater', 'peaceful', false, 1, 2.0, 5, 72, 82, 6.8, 7.8, false, false, false, false, true, true, false),
('Platy', 'Xiphophorus maculatus', 'fish', 'freshwater', 'peaceful', false, 1, 2.5, 10, 70, 80, 7.0, 8.0, false, false, false, false, true, true, false),
('Molly', 'Poecilia sphenops', 'fish', 'freshwater', 'peaceful', false, 1, 4.0, 20, 72, 82, 7.0, 8.5, false, false, false, false, true, true, false),
('Swordtail', 'Xiphophorus hellerii', 'fish', 'freshwater', 'peaceful', false, 1, 5.0, 20, 72, 82, 7.0, 8.4, false, false, false, false, true, true, false),
('Corydoras Catfish', 'Corydoras paleatus', 'fish', 'freshwater', 'peaceful', true, 4, 2.5, 10, 72, 78, 6.0, 8.0, false, false, false, true, false, false, false),
('Otocinclus', 'Otocinclus vittatus', 'fish', 'freshwater', 'peaceful', true, 4, 2.0, 10, 72, 79, 6.0, 7.5, false, false, false, true, false, false, false),
('Bristlenose Pleco', 'Ancistrus cirrhosus', 'fish', 'freshwater', 'peaceful', false, 1, 5.0, 20, 73, 81, 6.5, 7.5, false, false, true, true, false, false, false),
('Harlequin Rasbora', 'Trigonostigma heteromorpha', 'fish', 'freshwater', 'peaceful', true, 6, 2.0, 10, 72, 81, 6.0, 7.5, false, false, false, false, true, false, false),
('Cherry Barb', 'Puntius titteya', 'fish', 'freshwater', 'peaceful', true, 5, 2.0, 10, 73, 81, 6.0, 8.0, false, false, false, false, true, false, false),
('White Cloud Mountain Minnow', 'Tanichthys albonubes', 'fish', 'freshwater', 'peaceful', true, 6, 1.5, 10, 64, 72, 6.0, 8.0, false, false, false, false, true, true, false),
('Endler Livebearer', 'Poecilia wingei', 'fish', 'freshwater', 'peaceful', false, 1, 1.5, 5, 75, 86, 7.0, 8.5, false, false, false, false, true, true, false),
('Ember Tetra', 'Hyphessobrycon amandae', 'fish', 'freshwater', 'peaceful', true, 6, 0.8, 5, 73, 84, 5.5, 7.0, false, false, false, false, true, false, false),
('Celestial Pearl Danio', 'Danio margaritatus', 'fish', 'freshwater', 'peaceful', true, 6, 1.0, 10, 73, 79, 6.5, 7.5, false, false, false, false, true, false, false),

-- Semi-aggressive fish
('Betta', 'Betta splendens', 'fish', 'freshwater', 'semi-aggressive', false, 1, 3.0, 5, 76, 82, 6.5, 7.5, true, false, true, false, true, true, true),
('Tiger Barb', 'Puntigrus tetrazona', 'fish', 'freshwater', 'semi-aggressive', true, 6, 3.0, 20, 74, 79, 6.0, 8.0, true, false, false, false, true, false, false),
('Angelfish', 'Pterophyllum scalare', 'fish', 'freshwater', 'semi-aggressive', false, 1, 6.0, 30, 76, 84, 6.0, 7.5, false, true, true, false, true, false, false),
('Dwarf Gourami', 'Trichogaster lalius', 'fish', 'freshwater', 'semi-aggressive', false, 1, 3.5, 10, 72, 82, 6.0, 7.5, false, false, true, false, true, true, false),
('Pearl Gourami', 'Trichopodus leerii', 'fish', 'freshwater', 'semi-aggressive', false, 1, 4.5, 30, 77, 82, 6.5, 8.0, false, false, true, false, true, true, false),
('Ram Cichlid', 'Mikrogeophagus ramirezi', 'fish', 'freshwater', 'semi-aggressive', false, 1, 3.0, 20, 78, 85, 5.0, 7.0, false, false, true, true, true, false, false),
('Apistogramma', 'Apistogramma cacatuoides', 'fish', 'freshwater', 'semi-aggressive', false, 1, 3.0, 20, 72, 86, 6.0, 7.5, false, false, true, true, true, false, false),
('Rainbow Shark', 'Epalzeorhynchos frenatum', 'fish', 'freshwater', 'semi-aggressive', false, 1, 6.0, 50, 72, 79, 6.5, 7.5, false, false, true, true, true, false, false),
('Siamese Algae Eater', 'Crossocheilus oblongus', 'fish', 'freshwater', 'semi-aggressive', false, 1, 6.0, 30, 75, 79, 6.5, 8.0, false, false, false, true, true, false, false),
('Rosy Barb', 'Pethia conchonius', 'fish', 'freshwater', 'semi-aggressive', true, 5, 4.0, 30, 64, 72, 6.5, 7.0, true, false, false, false, true, false, false),

-- Aggressive fish
('Oscar', 'Astronotus ocellatus', 'fish', 'freshwater', 'aggressive', false, 1, 14.0, 75, 74, 81, 6.0, 8.0, false, true, true, false, true, false, false),
('Jack Dempsey', 'Rocio octofasciata', 'fish', 'freshwater', 'aggressive', false, 1, 10.0, 55, 72, 86, 6.5, 7.0, false, true, true, true, true, false, false),
('Green Terror', 'Andinoacara rivulatus', 'fish', 'freshwater', 'aggressive', false, 1, 12.0, 75, 68, 77, 6.5, 8.0, false, true, true, false, true, false, false),
('Red Devil Cichlid', 'Amphilophus labiatus', 'fish', 'freshwater', 'aggressive', false, 1, 15.0, 125, 75, 79, 6.5, 7.5, false, true, true, false, true, false, false),
('Flowerhorn', 'Hybrid cichlid', 'fish', 'freshwater', 'aggressive', false, 1, 16.0, 125, 80, 89, 7.0, 8.0, false, true, true, false, true, false, true),
('Arowana', 'Osteoglossum bicirrhosum', 'fish', 'freshwater', 'aggressive', false, 1, 36.0, 250, 75, 86, 6.0, 7.5, false, true, false, false, false, true, false),

-- Bottom dwellers
('Clown Loach', 'Chromobotia macracanthus', 'fish', 'freshwater', 'peaceful', true, 5, 12.0, 100, 77, 86, 6.0, 7.5, false, false, false, true, false, false, false),
('Kuhli Loach', 'Pangio kuhlii', 'fish', 'freshwater', 'peaceful', true, 4, 4.0, 20, 73, 86, 5.5, 6.5, false, false, false, true, false, false, false),
('Yoyo Loach', 'Botia almorhae', 'fish', 'freshwater', 'semi-aggressive', true, 3, 5.0, 40, 75, 86, 6.5, 7.5, false, false, false, true, false, false, false),

-- Goldfish
('Common Goldfish', 'Carassius auratus', 'fish', 'freshwater', 'peaceful', false, 1, 12.0, 50, 65, 72, 7.0, 8.4, false, false, false, false, true, false, false),
('Fancy Goldfish', 'Carassius auratus', 'fish', 'freshwater', 'peaceful', false, 1, 8.0, 20, 65, 72, 7.0, 8.4, false, false, false, false, true, false, false),

-- Invertebrates
('Cherry Shrimp', 'Neocaridina davidi', 'invertebrate', 'freshwater', 'peaceful', true, 6, 1.0, 5, 65, 80, 6.5, 8.0, false, false, false, true, false, false, false),
('Amano Shrimp', 'Caridina multidentata', 'invertebrate', 'freshwater', 'peaceful', true, 4, 2.0, 10, 70, 80, 6.5, 7.5, false, false, false, true, false, false, false),
('Ghost Shrimp', 'Palaemonetes paludosus', 'invertebrate', 'freshwater', 'peaceful', true, 4, 1.5, 5, 65, 80, 7.0, 8.0, false, false, false, true, false, false, false),
('Nerite Snail', 'Neritina natalensis', 'invertebrate', 'freshwater', 'peaceful', false, 1, 1.0, 5, 72, 78, 7.0, 8.5, false, false, false, true, false, false, false),
('Mystery Snail', 'Pomacea bridgesii', 'invertebrate', 'freshwater', 'peaceful', false, 1, 2.0, 5, 68, 82, 7.0, 7.5, false, false, false, true, false, false, false),

-- Popular saltwater fish
('Clownfish', 'Amphiprion ocellaris', 'fish', 'saltwater', 'peaceful', false, 1, 4.0, 20, 75, 82, 8.0, 8.4, false, false, true, false, true, false, false),
('Royal Blue Tang', 'Paracanthurus hepatus', 'fish', 'saltwater', 'semi-aggressive', false, 1, 12.0, 100, 75, 82, 8.1, 8.4, false, false, true, false, true, false, false),
('Yellow Tang', 'Zebrasoma flavescens', 'fish', 'saltwater', 'semi-aggressive', false, 1, 8.0, 75, 75, 82, 8.1, 8.4, false, false, true, false, true, false, false),
('Damselfish', 'Chromis viridis', 'fish', 'saltwater', 'semi-aggressive', true, 5, 3.0, 30, 75, 82, 8.1, 8.4, false, false, true, false, true, false, false),
('Mandarin Dragonet', 'Synchiropus splendidus', 'fish', 'saltwater', 'peaceful', false, 1, 4.0, 30, 75, 82, 8.1, 8.4, false, false, false, true, true, false, false),
('Coral Beauty Angelfish', 'Centropyge bispinosa', 'fish', 'saltwater', 'semi-aggressive', false, 1, 4.0, 70, 72, 82, 8.1, 8.4, false, false, true, false, true, false, false),
('Six Line Wrasse', 'Pseudocheilinus hexataenia', 'fish', 'saltwater', 'semi-aggressive', false, 1, 3.0, 30, 75, 82, 8.1, 8.4, false, false, true, false, true, false, false),
('Cleaner Shrimp', 'Lysmata amboinensis', 'invertebrate', 'saltwater', 'peaceful', false, 1, 3.0, 20, 75, 82, 8.1, 8.4, false, false, false, true, false, false, false),
('Flame Angelfish', 'Centropyge loricula', 'fish', 'saltwater', 'semi-aggressive', false, 1, 4.0, 70, 75, 82, 8.1, 8.4, false, false, true, false, true, false, false);