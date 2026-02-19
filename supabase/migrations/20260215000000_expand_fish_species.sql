-- Expand fish_species database from ~30 to 120+ species
-- Adds: African cichlids, more tetras, catfish, plecos, rainbowfish,
-- puffers, pond fish, brackish, saltwater reef fish, corals, cleanup crew

INSERT INTO public.fish_species (common_name, scientific_name, category, water_type, temperament, schooling, min_school_size, adult_size_inches, min_tank_gallons, temp_min_f, temp_max_f, ph_min, ph_max, hardness_min_dgh, hardness_max_dgh, fin_nipper, predator, territorial, bottom_dweller, mid_dweller, top_dweller, incompatible_categories, species_only_tank) VALUES

-- ========== FRESHWATER TETRAS ==========
('Rummy Nose Tetra', 'Hemigrammus rhodostomus', 'fish', 'freshwater', 'peaceful', true, 6, 2.0, 20, 75, 84, 5.5, 7.0, 2, 8, false, false, false, false, true, false, '{}', false),
('Black Skirt Tetra', 'Gymnocorymbus ternetzi', 'fish', 'freshwater', 'semi-aggressive', true, 5, 3.0, 15, 70, 82, 6.0, 7.5, 5, 19, true, false, false, false, true, false, '{}', false),
('Serpae Tetra', 'Hyphessobrycon eques', 'fish', 'freshwater', 'semi-aggressive', true, 6, 1.75, 10, 72, 79, 5.5, 7.5, 5, 25, true, false, false, false, true, false, '{}', false),
('Glowlight Tetra', 'Hemigrammus erythrozonus', 'fish', 'freshwater', 'peaceful', true, 6, 1.5, 10, 74, 82, 5.5, 7.0, 2, 15, false, false, false, false, true, false, '{}', false),
('Congo Tetra', 'Phenacogrammus interruptus', 'fish', 'freshwater', 'peaceful', true, 6, 3.5, 30, 73, 82, 6.0, 7.5, 3, 18, false, false, false, false, true, false, '{}', false),
('Diamond Tetra', 'Moenkhausia pittieri', 'fish', 'freshwater', 'peaceful', true, 6, 2.5, 15, 72, 82, 6.0, 7.5, 5, 12, false, false, false, false, true, false, '{}', false),
('Buenos Aires Tetra', 'Hyphessobrycon anisitsi', 'fish', 'freshwater', 'semi-aggressive', true, 6, 3.0, 20, 64, 82, 6.0, 8.0, 5, 25, true, false, false, false, true, false, '{}', false),
('Bleeding Heart Tetra', 'Hyphessobrycon erythrostigma', 'fish', 'freshwater', 'peaceful', true, 6, 2.5, 20, 73, 82, 5.5, 7.0, 2, 12, false, false, false, false, true, false, '{}', false),
('Green Neon Tetra', 'Paracheirodon simulans', 'fish', 'freshwater', 'peaceful', true, 8, 1.0, 10, 75, 85, 4.5, 6.5, 1, 8, false, false, false, false, true, false, '{}', false),
('Lemon Tetra', 'Hyphessobrycon pulchripinnis', 'fish', 'freshwater', 'peaceful', true, 6, 2.0, 15, 73, 82, 5.5, 7.5, 3, 15, false, false, false, false, true, false, '{}', false),

-- ========== FRESHWATER DANIOS & RASBORAS ==========
('Zebra Danio', 'Danio rerio', 'fish', 'freshwater', 'peaceful', true, 5, 2.0, 10, 65, 77, 6.5, 7.5, 5, 15, false, false, false, false, true, true, '{}', false),
('Giant Danio', 'Devario aequipinnatus', 'fish', 'freshwater', 'peaceful', true, 5, 4.0, 30, 72, 81, 6.0, 8.0, 5, 19, false, false, false, false, true, true, '{}', false),
('Chili Rasbora', 'Boraras brigittae', 'fish', 'freshwater', 'peaceful', true, 8, 0.7, 5, 68, 82, 4.0, 7.0, 1, 6, false, false, false, false, true, false, '{}', false),
('Scissortail Rasbora', 'Rasbora trilineata', 'fish', 'freshwater', 'peaceful', true, 6, 3.5, 20, 73, 78, 6.0, 7.0, 2, 15, false, false, false, false, true, false, '{}', false),

-- ========== FRESHWATER BARBS ==========
('Denison Barb', 'Sahyadria denisonii', 'fish', 'freshwater', 'peaceful', true, 6, 6.0, 55, 60, 77, 6.5, 7.8, 5, 25, false, false, false, false, true, false, '{}', false),
('Gold Barb', 'Barbodes semifasciolatus', 'fish', 'freshwater', 'peaceful', true, 5, 3.0, 20, 64, 75, 6.0, 8.0, 5, 15, false, false, false, false, true, false, '{}', false),
('Odessa Barb', 'Pethia padamya', 'fish', 'freshwater', 'peaceful', true, 5, 3.0, 20, 70, 79, 6.0, 7.0, 5, 15, false, false, false, false, true, false, '{}', false),
('Tinfoil Barb', 'Barbonymus schwanefeldii', 'fish', 'freshwater', 'semi-aggressive', true, 4, 14.0, 125, 72, 77, 6.5, 7.0, 2, 10, false, false, false, false, true, false, '{}', false),

-- ========== FRESHWATER GOURAMIS ==========
('Honey Gourami', 'Trichogaster chuna', 'fish', 'freshwater', 'peaceful', false, 1, 2.0, 10, 72, 82, 6.0, 7.5, 4, 15, false, false, false, false, true, true, '{}', false),
('Sparkling Gourami', 'Trichopsis pumila', 'fish', 'freshwater', 'peaceful', false, 1, 1.5, 10, 76, 82, 6.0, 7.5, 5, 18, false, false, false, false, true, true, '{}', false),
('Three Spot Gourami', 'Trichopodus trichopterus', 'fish', 'freshwater', 'semi-aggressive', false, 1, 6.0, 30, 72, 82, 6.0, 8.8, 5, 35, false, false, true, false, true, true, '{}', false),
('Kissing Gourami', 'Helostoma temminckii', 'fish', 'freshwater', 'semi-aggressive', false, 1, 12.0, 75, 72, 82, 6.8, 8.5, 5, 20, false, false, true, false, true, true, '{}', false),

-- ========== FRESHWATER RAINBOWFISH ==========
('Boesemani Rainbowfish', 'Melanotaenia boesemani', 'fish', 'freshwater', 'peaceful', true, 6, 4.0, 30, 72, 79, 7.0, 8.0, 10, 20, false, false, false, false, true, false, '{}', false),
('Dwarf Neon Rainbow', 'Melanotaenia praecox', 'fish', 'freshwater', 'peaceful', true, 6, 3.0, 20, 73, 82, 6.5, 7.5, 5, 15, false, false, false, false, true, false, '{}', false),
('Threadfin Rainbowfish', 'Iriatherina werneri', 'fish', 'freshwater', 'peaceful', true, 6, 2.0, 10, 75, 82, 5.5, 7.5, 5, 12, false, false, false, false, true, true, '{}', false),
('Turquoise Rainbowfish', 'Melanotaenia lacustris', 'fish', 'freshwater', 'peaceful', true, 6, 4.5, 30, 70, 79, 7.0, 8.5, 10, 20, false, false, false, false, true, false, '{}', false),

-- ========== AFRICAN CICHLIDS (Malawi) ==========
('Yellow Lab', 'Labidochromis caeruleus', 'fish', 'freshwater', 'semi-aggressive', false, 1, 4.0, 30, 72, 82, 7.8, 8.6, 10, 20, false, false, true, false, true, false, '{}', false),
('Red Zebra', 'Maylandia estherae', 'fish', 'freshwater', 'aggressive', false, 1, 5.0, 55, 72, 82, 7.8, 8.6, 10, 20, false, false, true, false, true, false, '{}', false),
('Demasoni', 'Pseudotropheus demasoni', 'fish', 'freshwater', 'aggressive', true, 12, 3.0, 55, 72, 82, 7.8, 8.6, 10, 20, false, false, true, false, true, false, '{}', false),
('Peacock Cichlid', 'Aulonocara stuartgranti', 'fish', 'freshwater', 'semi-aggressive', false, 1, 6.0, 55, 76, 82, 7.8, 8.6, 10, 20, false, false, true, false, true, false, '{}', false),
('Electric Blue Hap', 'Sciaenochromis fryeri', 'fish', 'freshwater', 'aggressive', false, 1, 7.0, 75, 72, 82, 7.8, 8.6, 10, 20, false, true, true, false, true, false, '{}', false),
('Frontosa', 'Cyphotilapia frontosa', 'fish', 'freshwater', 'semi-aggressive', true, 6, 14.0, 125, 72, 82, 7.8, 9.0, 10, 25, false, true, true, true, true, false, '{}', false),
('Mbuna Mixed', 'Pseudotropheus sp.', 'fish', 'freshwater', 'aggressive', false, 1, 5.0, 55, 72, 82, 7.8, 8.6, 10, 20, true, false, true, false, true, false, '{}', false),
('Venustus', 'Nimbochromis venustus', 'fish', 'freshwater', 'aggressive', false, 1, 10.0, 75, 72, 82, 7.8, 8.6, 10, 20, false, true, true, false, true, false, '{}', false),

-- ========== AFRICAN CICHLIDS (Tanganyika) ==========
('Neolamprologus Brichardi', 'Neolamprologus brichardi', 'fish', 'freshwater', 'semi-aggressive', false, 1, 4.0, 30, 72, 82, 7.8, 9.0, 10, 25, false, false, true, true, true, false, '{}', false),
('Shell Dweller', 'Neolamprologus multifasciatus', 'fish', 'freshwater', 'semi-aggressive', false, 1, 2.0, 10, 72, 82, 7.8, 9.0, 10, 25, false, false, true, true, false, false, '{}', false),
('Tropheus Moorii', 'Tropheus moorii', 'fish', 'freshwater', 'aggressive', true, 12, 6.0, 75, 72, 82, 7.8, 9.0, 10, 25, false, false, true, false, true, false, '{}', false),

-- ========== SOUTH/CENTRAL AMERICAN CICHLIDS ==========
('Firemouth Cichlid', 'Thorichthys meeki', 'fish', 'freshwater', 'semi-aggressive', false, 1, 7.0, 30, 75, 86, 6.5, 8.0, 8, 15, false, false, true, true, true, false, '{}', false),
('Convict Cichlid', 'Amatitlania nigrofasciata', 'fish', 'freshwater', 'aggressive', false, 1, 6.0, 30, 68, 80, 6.5, 8.0, 5, 20, false, false, true, true, true, false, '{}', false),
('Blood Parrot Cichlid', 'Hybrid cichlid', 'fish', 'freshwater', 'semi-aggressive', false, 1, 8.0, 55, 76, 80, 6.5, 7.5, 5, 18, false, false, true, false, true, false, '{}', false),
('Severum', 'Heros efasciatus', 'fish', 'freshwater', 'semi-aggressive', false, 1, 10.0, 55, 73, 84, 6.0, 7.5, 5, 15, false, false, true, false, true, false, '{}', false),
('Blue Acara', 'Andinoacara pulcher', 'fish', 'freshwater', 'semi-aggressive', false, 1, 7.0, 30, 68, 82, 6.5, 8.0, 6, 20, false, false, true, true, true, false, '{}', false),
('Geophagus', 'Geophagus sveni', 'fish', 'freshwater', 'semi-aggressive', true, 5, 10.0, 75, 78, 86, 5.5, 7.5, 2, 12, false, false, false, true, true, false, '{}', false),
('Texas Cichlid', 'Herichthys cyanoguttatus', 'fish', 'freshwater', 'aggressive', false, 1, 12.0, 75, 68, 82, 6.5, 8.0, 5, 20, false, true, true, false, true, false, '{}', false),
('Pike Cichlid', 'Crenicichla saxatilis', 'fish', 'freshwater', 'aggressive', false, 1, 12.0, 75, 72, 82, 6.0, 7.5, 5, 15, false, true, true, false, true, false, '{}', false),

-- ========== FRESHWATER CATFISH & PLECOS ==========
('Panda Corydoras', 'Corydoras panda', 'fish', 'freshwater', 'peaceful', true, 4, 2.0, 10, 68, 77, 6.0, 7.5, 2, 12, false, false, false, true, false, false, '{}', false),
('Sterbai Corydoras', 'Corydoras sterbai', 'fish', 'freshwater', 'peaceful', true, 4, 2.5, 10, 75, 82, 6.0, 7.5, 2, 15, false, false, false, true, false, false, '{}', false),
('Pygmy Corydoras', 'Corydoras pygmaeus', 'fish', 'freshwater', 'peaceful', true, 6, 1.0, 10, 72, 79, 6.4, 7.4, 2, 12, false, false, false, true, true, false, '{}', false),
('Bronze Corydoras', 'Corydoras aeneus', 'fish', 'freshwater', 'peaceful', true, 4, 2.5, 10, 72, 79, 6.0, 7.5, 5, 18, false, false, false, true, false, false, '{}', false),
('Common Pleco', 'Hypostomus plecostomus', 'fish', 'freshwater', 'peaceful', false, 1, 24.0, 150, 72, 86, 6.5, 7.5, 5, 19, false, false, true, true, false, false, '{}', false),
('Rubber Lip Pleco', 'Chaetostoma milesi', 'fish', 'freshwater', 'peaceful', false, 1, 5.0, 20, 72, 80, 6.5, 8.0, 6, 15, false, false, false, true, false, false, '{}', false),
('Zebra Pleco', 'Hypancistrus zebra', 'fish', 'freshwater', 'peaceful', false, 1, 3.5, 20, 79, 86, 6.0, 7.0, 2, 10, false, false, true, true, false, false, '{}', false),
('Royal Pleco', 'Panaque nigrolineatus', 'fish', 'freshwater', 'peaceful', false, 1, 17.0, 120, 72, 82, 6.5, 7.5, 5, 15, false, false, true, true, false, false, '{}', false),
('Pictus Catfish', 'Pimelodus pictus', 'fish', 'freshwater', 'semi-aggressive', true, 3, 5.0, 55, 72, 77, 5.8, 6.8, 5, 15, false, true, false, true, true, false, ARRAY['invertebrate'], false),
('Synodontis Catfish', 'Synodontis eupterus', 'fish', 'freshwater', 'peaceful', false, 1, 8.0, 50, 72, 82, 6.5, 8.0, 5, 20, false, false, false, true, false, false, '{}', false),
('Raphael Catfish', 'Platydoras armatulus', 'fish', 'freshwater', 'peaceful', false, 1, 9.0, 55, 75, 82, 6.0, 8.0, 5, 20, false, false, false, true, false, false, '{}', false),
('Hillstream Loach', 'Sewellia lineolata', 'fish', 'freshwater', 'peaceful', false, 1, 3.0, 20, 68, 75, 6.5, 7.5, 2, 12, false, false, false, true, false, false, '{}', false),
('Dojo Loach', 'Misgurnus anguillicaudatus', 'fish', 'freshwater', 'peaceful', false, 1, 10.0, 55, 50, 77, 6.0, 8.0, 5, 12, false, false, false, true, false, false, '{}', false),

-- ========== FRESHWATER PUFFERS ==========
('Pea Puffer', 'Carinotetraodon travancoricus', 'fish', 'freshwater', 'aggressive', false, 1, 1.0, 5, 74, 82, 6.5, 7.5, 5, 15, true, false, true, false, true, false, ARRAY['invertebrate'], false),
('Amazon Puffer', 'Colomesus asellus', 'fish', 'freshwater', 'semi-aggressive', false, 1, 3.0, 30, 72, 82, 6.0, 7.5, 5, 20, true, false, false, false, true, false, ARRAY['invertebrate'], false),

-- ========== FRESHWATER LIVEBEARERS ==========
('Least Killifish', 'Heterandria formosa', 'fish', 'freshwater', 'peaceful', true, 6, 1.0, 5, 68, 78, 7.0, 8.0, 5, 20, false, false, false, false, true, true, '{}', false),

-- ========== FRESHWATER OTHER ==========
('Paradise Fish', 'Macropodus opercularis', 'fish', 'freshwater', 'aggressive', false, 1, 4.0, 20, 61, 79, 6.0, 8.0, 5, 30, true, false, true, false, true, true, '{}', false),
('African Butterfly Fish', 'Pantodon buchholzi', 'fish', 'freshwater', 'semi-aggressive', false, 1, 5.0, 30, 73, 86, 6.0, 7.5, 5, 12, false, true, false, false, false, true, '{}', false),
('Silver Dollar', 'Metynnis hypsauchen', 'fish', 'freshwater', 'peaceful', true, 5, 6.0, 55, 75, 82, 5.0, 7.0, 4, 18, false, false, false, false, true, false, '{}', false),
('Hatchetfish', 'Carnegiella strigata', 'fish', 'freshwater', 'peaceful', true, 6, 1.5, 15, 75, 82, 5.5, 7.0, 2, 12, false, false, false, false, false, true, '{}', false),
('Glass Catfish', 'Kryptopterus vitreolus', 'fish', 'freshwater', 'peaceful', true, 5, 3.0, 30, 75, 80, 6.5, 7.0, 5, 12, false, false, false, false, true, false, '{}', false),
('Elephant Nose Fish', 'Gnathonemus petersii', 'fish', 'freshwater', 'peaceful', false, 1, 9.0, 50, 73, 82, 6.0, 7.5, 5, 15, false, false, true, true, true, false, '{}', false),
('Discus', 'Symphysodon aequifasciatus', 'fish', 'freshwater', 'peaceful', true, 5, 8.0, 55, 82, 88, 5.5, 7.0, 1, 8, false, false, false, false, true, false, '{}', false),
('Black Ghost Knife', 'Apteronotus albifrons', 'fish', 'freshwater', 'semi-aggressive', false, 1, 20.0, 100, 73, 82, 6.0, 8.0, 5, 15, false, true, true, true, true, false, '{}', false),

-- ========== POND / COLDWATER ==========
('Koi', 'Cyprinus rubrofuscus', 'fish', 'freshwater', 'peaceful', false, 1, 36.0, 250, 35, 85, 7.0, 8.5, 5, 20, false, false, false, false, true, false, '{}', false),
('Shubunkin', 'Carassius auratus', 'fish', 'freshwater', 'peaceful', false, 1, 14.0, 75, 60, 72, 7.0, 8.4, 5, 19, false, false, false, false, true, false, '{}', false),
('Comet Goldfish', 'Carassius auratus', 'fish', 'freshwater', 'peaceful', false, 1, 14.0, 75, 60, 72, 7.0, 8.4, 5, 19, false, false, false, false, true, false, '{}', false),

-- ========== BRACKISH ==========
('Figure Eight Puffer', 'Dichotomyctere ocellatus', 'fish', 'brackish', 'aggressive', false, 1, 3.0, 20, 72, 79, 7.5, 8.5, 10, 20, true, false, true, false, true, false, ARRAY['invertebrate'], false),
('Bumblebee Goby', 'Brachygobius doriae', 'fish', 'brackish', 'peaceful', false, 1, 1.5, 10, 72, 84, 7.0, 8.5, 10, 20, false, false, true, true, false, false, '{}', false),
('Indian Glassfish', 'Parambassis ranga', 'fish', 'brackish', 'peaceful', true, 6, 3.0, 20, 68, 86, 7.0, 8.0, 8, 20, false, false, false, false, true, false, '{}', false),

-- ========== FRESHWATER INVERTEBRATES ==========
('Crystal Red Shrimp', 'Caridina cantonensis', 'invertebrate', 'freshwater', 'peaceful', true, 6, 1.0, 5, 68, 78, 5.8, 7.4, 3, 6, false, false, false, true, false, false, '{}', false),
('Blue Velvet Shrimp', 'Neocaridina davidi', 'invertebrate', 'freshwater', 'peaceful', true, 6, 1.0, 5, 65, 80, 6.5, 8.0, 4, 14, false, false, false, true, false, false, '{}', false),
('Bamboo Shrimp', 'Atyopsis moluccensis', 'invertebrate', 'freshwater', 'peaceful', false, 1, 3.0, 20, 68, 82, 6.5, 7.5, 3, 10, false, false, false, true, false, false, '{}', false),
('Vampire Shrimp', 'Atya gabonensis', 'invertebrate', 'freshwater', 'peaceful', false, 1, 6.0, 20, 74, 84, 6.5, 7.5, 3, 10, false, false, false, true, false, false, '{}', false),
('Ramshorn Snail', 'Planorbella duryi', 'invertebrate', 'freshwater', 'peaceful', false, 1, 1.0, 5, 70, 80, 7.0, 8.0, 5, 15, false, false, false, true, false, false, '{}', false),
('Assassin Snail', 'Clea helena', 'invertebrate', 'freshwater', 'peaceful', false, 1, 1.0, 5, 68, 82, 6.5, 8.0, 5, 15, false, true, false, true, false, false, '{}', false),
('Malaysian Trumpet Snail', 'Melanoides tuberculata', 'invertebrate', 'freshwater', 'peaceful', false, 1, 1.0, 5, 65, 86, 6.5, 8.5, 5, 25, false, false, false, true, false, false, '{}', false),
('Japanese Trapdoor Snail', 'Cipangopaludina japonica', 'invertebrate', 'freshwater', 'peaceful', false, 1, 2.0, 10, 60, 80, 6.5, 8.5, 5, 20, false, false, false, true, false, false, '{}', false),
('Mexican Dwarf Crayfish', 'Cambarellus patzcuarensis', 'invertebrate', 'freshwater', 'semi-aggressive', false, 1, 2.0, 5, 65, 80, 6.5, 8.0, 5, 15, false, false, true, true, false, false, '{}', false),

-- ========== SALTWATER FISH ==========
('Bicolor Blenny', 'Ecsenius bicolor', 'fish', 'saltwater', 'peaceful', false, 1, 4.0, 30, 72, 82, 8.1, 8.4, null, null, false, false, true, true, true, false, '{}', false),
('Lawnmower Blenny', 'Salarias fasciatus', 'fish', 'saltwater', 'peaceful', false, 1, 5.0, 30, 72, 82, 8.1, 8.4, null, null, false, false, true, true, true, false, '{}', false),
('Firefish Goby', 'Nemateleotris magnifica', 'fish', 'saltwater', 'peaceful', false, 1, 3.0, 20, 72, 82, 8.1, 8.4, null, null, false, false, false, true, true, false, '{}', false),
('Watchman Goby', 'Cryptocentrus cinctus', 'fish', 'saltwater', 'peaceful', false, 1, 3.5, 20, 72, 82, 8.1, 8.4, null, null, false, false, true, true, false, false, '{}', false),
('Royal Gramma', 'Gramma loreto', 'fish', 'saltwater', 'semi-aggressive', false, 1, 3.0, 30, 72, 82, 8.1, 8.4, null, null, false, false, true, false, true, false, '{}', false),
('Banggai Cardinalfish', 'Pterapogon kauderni', 'fish', 'saltwater', 'peaceful', false, 1, 3.0, 20, 72, 82, 8.1, 8.4, null, null, false, false, false, false, true, false, '{}', false),
('Pajama Cardinalfish', 'Sphaeramia nematoptera', 'fish', 'saltwater', 'peaceful', true, 3, 3.5, 20, 72, 82, 8.1, 8.4, null, null, false, false, false, false, true, false, '{}', false),
('Scopas Tang', 'Zebrasoma scopas', 'fish', 'saltwater', 'semi-aggressive', false, 1, 8.0, 75, 72, 82, 8.1, 8.4, null, null, false, false, true, false, true, false, '{}', false),
('Kole Tang', 'Ctenochaetus strigosus', 'fish', 'saltwater', 'peaceful', false, 1, 7.0, 70, 72, 82, 8.1, 8.4, null, null, false, false, false, false, true, false, '{}', false),
('Foxface Rabbitfish', 'Siganus vulpinus', 'fish', 'saltwater', 'peaceful', false, 1, 9.0, 75, 72, 82, 8.1, 8.4, null, null, false, false, false, false, true, false, '{}', false),
('Maroon Clownfish', 'Premnas biaculeatus', 'fish', 'saltwater', 'aggressive', false, 1, 6.0, 30, 75, 82, 8.0, 8.4, null, null, false, false, true, false, true, false, '{}', false),
('Longnose Hawkfish', 'Oxycirrhites typus', 'fish', 'saltwater', 'semi-aggressive', false, 1, 5.0, 30, 72, 82, 8.1, 8.4, null, null, false, true, true, false, true, false, ARRAY['invertebrate'], false),
('Diamond Goby', 'Valenciennea puellaris', 'fish', 'saltwater', 'peaceful', false, 1, 6.0, 55, 72, 82, 8.1, 8.4, null, null, false, false, true, true, false, false, '{}', false),
('Neon Goby', 'Elacatinus oceanops', 'fish', 'saltwater', 'peaceful', false, 1, 2.0, 10, 72, 82, 8.1, 8.4, null, null, false, false, false, true, true, false, '{}', false),
('Copperband Butterfly', 'Chelmon rostratus', 'fish', 'saltwater', 'peaceful', false, 1, 8.0, 75, 72, 82, 8.1, 8.4, null, null, false, false, false, false, true, false, '{}', false),
('Emperor Angelfish', 'Pomacanthus imperator', 'fish', 'saltwater', 'semi-aggressive', false, 1, 15.0, 180, 72, 82, 8.1, 8.4, null, null, false, false, true, false, true, false, '{}', false),

-- ========== SALTWATER INVERTEBRATES ==========
('Peppermint Shrimp', 'Lysmata wurdemanni', 'invertebrate', 'saltwater', 'peaceful', false, 1, 2.0, 10, 72, 82, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Fire Shrimp', 'Lysmata debelius', 'invertebrate', 'saltwater', 'peaceful', false, 1, 2.0, 20, 72, 82, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Blue Leg Hermit Crab', 'Clibanarius tricolor', 'invertebrate', 'saltwater', 'peaceful', false, 1, 1.0, 5, 72, 82, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Emerald Crab', 'Mithraculus sculptus', 'invertebrate', 'saltwater', 'peaceful', false, 1, 2.0, 20, 72, 82, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Turbo Snail', 'Turbo fluctuosa', 'invertebrate', 'saltwater', 'peaceful', false, 1, 2.0, 10, 72, 82, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Nassarius Snail', 'Nassarius vibex', 'invertebrate', 'saltwater', 'peaceful', false, 1, 1.0, 5, 72, 82, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Trochus Snail', 'Trochus niloticus', 'invertebrate', 'saltwater', 'peaceful', false, 1, 1.5, 10, 72, 82, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Tuxedo Urchin', 'Mespilia globulus', 'invertebrate', 'saltwater', 'peaceful', false, 1, 3.0, 20, 72, 82, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Coral Banded Shrimp', 'Stenopus hispidus', 'invertebrate', 'saltwater', 'semi-aggressive', false, 1, 3.0, 30, 72, 82, 8.1, 8.4, null, null, false, false, true, true, false, false, '{}', false),

-- ========== CORALS (for reef tanks) ==========
('Green Star Polyp', 'Pachyclavularia violacea', 'coral', 'saltwater', 'peaceful', false, 1, 12.0, 10, 75, 82, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Zoanthid', 'Zoanthus sp.', 'coral', 'saltwater', 'peaceful', false, 1, 6.0, 10, 75, 82, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Hammer Coral', 'Euphyllia ancora', 'coral', 'saltwater', 'semi-aggressive', false, 1, 12.0, 30, 75, 82, 8.1, 8.4, null, null, false, false, true, true, false, false, '{}', false),
('Torch Coral', 'Euphyllia glabrescens', 'coral', 'saltwater', 'semi-aggressive', false, 1, 12.0, 30, 75, 82, 8.1, 8.4, null, null, false, false, true, true, false, false, '{}', false),
('Frogspawn Coral', 'Euphyllia divisa', 'coral', 'saltwater', 'semi-aggressive', false, 1, 12.0, 30, 75, 82, 8.1, 8.4, null, null, false, false, true, true, false, false, '{}', false),
('Mushroom Coral', 'Discosoma sp.', 'coral', 'saltwater', 'peaceful', false, 1, 6.0, 10, 75, 82, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Duncan Coral', 'Duncanopsammia axifuga', 'coral', 'saltwater', 'peaceful', false, 1, 8.0, 20, 75, 82, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Acropora', 'Acropora millepora', 'coral', 'saltwater', 'peaceful', false, 1, 12.0, 30, 75, 80, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Montipora', 'Montipora capricornis', 'coral', 'saltwater', 'peaceful', false, 1, 12.0, 20, 75, 80, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Leather Coral', 'Sarcophyton sp.', 'coral', 'saltwater', 'peaceful', false, 1, 12.0, 30, 75, 82, 8.1, 8.4, null, null, false, false, false, true, false, false, '{}', false),
('Bubble Tip Anemone', 'Entacmaea quadricolor', 'coral', 'saltwater', 'semi-aggressive', false, 1, 12.0, 30, 75, 82, 8.1, 8.4, null, null, false, false, true, true, false, false, '{}', false);
