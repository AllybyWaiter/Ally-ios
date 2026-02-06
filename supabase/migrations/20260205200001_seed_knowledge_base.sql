-- Seed knowledge base with initial domain expertise content
-- Embeddings will be generated on first search or can be added via admin tool

-- ===== WATER CHEMISTRY =====

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('water_chemistry', 'nitrogen_cycle', 'Understanding the Nitrogen Cycle',
'The nitrogen cycle is the biological process that converts toxic ammonia from fish waste into less harmful nitrate. It occurs in three stages:

1. Ammonia (NH3/NH4+): Produced by fish waste, uneaten food, and decaying matter. Highly toxic at any level above 0 ppm. At pH above 7.0, more exists as toxic NH3.

2. Nitrite (NO2-): Nitrosomonas bacteria convert ammonia to nitrite. Still toxic, should be 0 ppm in cycled tanks. Can cause brown blood disease in fish.

3. Nitrate (NO3-): Nitrobacter bacteria convert nitrite to nitrate. Less toxic but should stay below 20 ppm for freshwater, 10 ppm for sensitive fish and reef tanks. Removed through water changes and plants.

Cycling a new tank takes 4-8 weeks. Monitor ammonia and nitrite daily during cycling. A tank is cycled when ammonia and nitrite are 0 and nitrate is present.',
ARRAY['nitrogen cycle', 'ammonia', 'nitrite', 'nitrate', 'cycling', 'beneficial bacteria'],
ARRAY['freshwater', 'saltwater', 'reef'],
ARRAY['beginner', 'intermediate', 'advanced']);

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('water_chemistry', 'ph', 'pH Management in Aquariums',
'pH measures water acidity/alkalinity on a 0-14 scale. Most freshwater fish thrive between 6.5-7.5, while saltwater requires 8.1-8.4.

Key points:
- Stability is more important than hitting exact numbers
- pH naturally drops over time as organic acids accumulate
- KH (carbonate hardness) buffers pH fluctuations
- Rapid pH changes (>0.3 in 24 hours) stress fish

To raise pH: Add crushed coral, aragonite substrate, or commercial buffers
To lower pH: Add driftwood, Indian almond leaves, or peat moss
To stabilize pH: Maintain KH above 4 dKH

Never chase a specific pH number if your fish are healthy. Most captive-bred fish adapt to a wide range. The exception is breeding sensitive species or keeping wild-caught fish.',
ARRAY['pH', 'acidity', 'alkalinity', 'KH', 'buffer', 'stable'],
ARRAY['freshwater', 'saltwater', 'reef'],
ARRAY['beginner', 'intermediate', 'advanced']);

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('water_chemistry', 'reef_parameters', 'Reef Tank Water Parameters',
'Reef tanks require precise and stable water chemistry for coral health:

Essential Parameters:
- Temperature: 76-80°F (24-27°C), stability critical
- Salinity: 1.024-1.026 SG (35 ppt)
- pH: 8.1-8.4 (stable)
- Alkalinity: 8-12 dKH (most critical parameter)
- Calcium: 400-450 ppm
- Magnesium: 1250-1350 ppm (enables calcium/alk balance)

The calcium-alkalinity-magnesium relationship:
Corals consume calcium and alkalinity to build skeletons. Magnesium prevents calcium carbonate precipitation. If mag is low, calcium and alk will be unstable.

Dosing order: Stabilize magnesium first, then balance calcium and alkalinity together. Many reefers dose in 1:1 ratio using 2-part solutions.

Test alkalinity 2-3x weekly, others weekly. Sudden alkalinity drops indicate coral growth or parameter crash.',
ARRAY['reef', 'coral', 'calcium', 'alkalinity', 'magnesium', 'dosing', 'parameters'],
ARRAY['reef', 'saltwater'],
ARRAY['intermediate', 'advanced']);

-- ===== FISH DISEASES =====

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('disease', 'ich', 'Ich (White Spot Disease) Treatment Guide',
'Ichthyophthirius multifiliis (ich) is the most common aquarium parasite, appearing as white salt-like spots on fish.

Life Cycle (important for treatment):
1. Trophont: Feeding stage under skin (white spots), protected from medication
2. Tomont: Falls off fish, forms cyst on substrate
3. Theront: Free-swimming, vulnerable to treatment

Treatment Options (Freshwater):
1. Heat treatment: Raise to 86°F (30°C) for 10-14 days. Speeds life cycle, many strains die at high temps.
2. Salt: 1-3 ppt for 10-14 days. Disrupts parasite osmotically.
3. Medication: Malachite green, formalin, or copper-based (no copper with invertebrates)

Marine Ich (Cryptocaryon irritans):
Different parasite, longer life cycle (4-6 weeks). Requires 72+ days fallow period or copper treatment in quarantine. Reef-safe: Transfer fish to quarantine, leave display fallow.

Critical: Treat entire tank, not just sick fish. Continue treatment 3-4 days after last visible spot.',
ARRAY['ich', 'white spot', 'parasite', 'treatment', 'quarantine', 'copper'],
ARRAY['freshwater', 'saltwater'],
ARRAY['beginner', 'intermediate', 'advanced']);

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('disease', 'fin_rot', 'Fin Rot Diagnosis and Treatment',
'Fin rot is a bacterial infection causing fin deterioration. Often secondary to stress or poor water quality.

Symptoms progression:
1. Early: Milky white edges on fins
2. Moderate: Fraying, ragged edges, redness at base
3. Severe: Fins eroding to body, red streaking, possible body rot

Causes:
- Poor water quality (most common)
- Aggression/fin nipping
- Stress from overcrowding
- Temperature fluctuations
- Compromised immune system

Treatment Protocol:
1. Test water immediately - fix any quality issues first
2. Perform 25-50% water change
3. Mild cases: Clean water alone often sufficient
4. Moderate: Salt treatment (1 tbsp per 5 gallons) for 10 days
5. Severe: Antibiotics (kanamycin, API Fin & Body Cure, or Maracyn)

Prevention: Maintain pristine water quality, avoid overcrowding, remove aggressive tankmates.',
ARRAY['fin rot', 'bacterial', 'infection', 'frayed fins', 'treatment'],
ARRAY['freshwater', 'saltwater'],
ARRAY['beginner', 'intermediate']);

-- ===== POOL CARE =====

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('pool', 'chlorine_basics', 'Pool Chlorine Management',
'Chlorine is the primary sanitizer for pools, killing bacteria and algae.

Key Measurements:
- Free Chlorine (FC): Active sanitizer, ideal 2-4 ppm
- Combined Chlorine (CC): Used up chlorine bound to contaminants, should be <0.5 ppm
- Total Chlorine: FC + CC

Chlorine and pH relationship:
At pH 7.2: ~63% active hypochlorous acid (effective)
At pH 7.8: ~32% active hypochlorous acid
At pH 8.0: ~21% active (chlorine becomes ineffective)

Keep pH between 7.2-7.6 for optimal chlorine effectiveness.

Cyanuric Acid (CYA/Stabilizer):
- Protects chlorine from UV degradation
- Ideal: 30-50 ppm for standard pools, 70-80 for salt pools
- Too high: Reduces chlorine effectiveness (chlorine lock)
- Only way to reduce: Dilution (partial drain/refill)

Shock treatment: Raise FC to 10x CC level to break chloramines. Do weekly or when CC exceeds 0.5 ppm.',
ARRAY['chlorine', 'free chlorine', 'combined chlorine', 'CYA', 'stabilizer', 'shock', 'sanitizer'],
ARRAY['pool'],
ARRAY['beginner', 'intermediate', 'advanced']);

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('pool', 'algae_treatment', 'Pool Algae Prevention and Treatment',
'Algae types and treatments:

Green Algae (most common):
- Cause: Low chlorine, poor circulation, phosphates
- Treatment: Shock to 30 ppm FC, brush walls, run filter 24/7
- Clear in 24-48 hours with proper treatment

Yellow/Mustard Algae:
- Chlorine resistant, returns repeatedly
- Treatment: Triple shock (30+ ppm), brush thoroughly, add algaecide
- Sanitize all pool equipment that contacted water

Black Algae:
- Deep-rooted in plaster/grout, extremely difficult
- Treatment: Brush with stainless steel brush, apply chlorine tabs directly, shock heavily
- May require repeated treatments over weeks

Prevention Protocol:
1. Maintain FC at 2-4 ppm consistently
2. Run pump 8-12 hours daily for circulation
3. Brush walls weekly
4. Keep phosphates below 100 ppb
5. Clean filter regularly
6. Shock after heavy use or rain',
ARRAY['algae', 'green algae', 'mustard algae', 'black algae', 'shock', 'prevention'],
ARRAY['pool'],
ARRAY['beginner', 'intermediate']);

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('pool', 'salt_pool', 'Salt Water Pool Maintenance',
'Salt chlorine generators (SWG) convert salt to chlorine through electrolysis.

Ideal Salt Level: 2700-3400 ppm (varies by manufacturer)
- Too low: Generator won''t produce enough chlorine
- Too high: Can damage equipment and cause scaling

Unique Considerations:
1. pH rises constantly - SWGs produce high-pH chlorine
   - Check pH twice weekly, add muriatic acid as needed
   - May need pH lock products or automatic acid feeders

2. Calcium buildup on cell - Inspect monthly, clean with diluted muriatic acid when scaled

3. Higher CYA needed - Target 70-80 ppm due to constant chlorine production

4. Salt doesn''t evaporate - Only add salt after splash-out, backwash, or dilution
   - Calculate: Pool gallons × (target ppm - current ppm) ÷ 120,000 = lbs salt needed

Winterization: Turn off generator when water drops below 60°F to prevent cell damage.',
ARRAY['salt pool', 'salt water', 'chlorine generator', 'SWG', 'cell', 'electrolysis'],
ARRAY['pool'],
ARRAY['intermediate', 'advanced']);

-- ===== SPA CARE =====

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('spa', 'spa_chemistry', 'Hot Tub Water Chemistry Basics',
'Hot tubs require more attention than pools due to high temperatures and bather load per gallon.

Ideal Parameters:
- pH: 7.2-7.8 (7.4-7.6 optimal)
- Alkalinity: 80-120 ppm
- Sanitizer: Chlorine 3-5 ppm OR Bromine 3-5 ppm
- Calcium Hardness: 150-250 ppm

Chlorine vs Bromine:
- Chlorine: Less expensive, strong odor, less stable at high temps
- Bromine: More stable at high temps, less odor, reactivates with shock
- Bromine preferred for most spas due to heat stability

Maintenance Schedule:
Daily: Test sanitizer, adjust if needed
Weekly: Test pH/alkalinity, shock treatment
Monthly: Test calcium, clean filter
Quarterly: Drain and refill completely

Why spas need frequent draining:
TDS (Total Dissolved Solids) accumulates rapidly. Rule of thumb: Drain when TDS exceeds 1500 ppm over source water, or use formula: gallons ÷ bathers per day ÷ 3 = days between drains.',
ARRAY['hot tub', 'spa', 'bromine', 'chlorine', 'pH', 'alkalinity', 'drain'],
ARRAY['spa'],
ARRAY['beginner', 'intermediate']);

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('spa', 'spa_foam', 'Spa Foam Causes and Solutions',
'Foam in hot tubs indicates contaminated water or chemical imbalance.

Common Causes:
1. Body oils, lotions, cosmetics - Most common cause
2. Soap/detergent residue on swimwear
3. Low calcium hardness - Soft water foams easily
4. High TDS - Time to drain
5. Biofilm buildup in plumbing
6. Cheap chemicals or wrong products

Immediate Fixes:
- Anti-foam product (temporary solution only)
- Remove and clean filter
- Shock treatment

Permanent Solutions:
1. Shower before entering (biggest impact)
2. Wash swimwear without detergent
3. Maintain calcium 150-250 ppm
4. Drain and refill if TDS is high
5. Use enzyme products weekly to break down oils
6. Purge plumbing with flush product before draining

Prevention: Enzyme treatment weekly, require showers, maintain proper chemistry.',
ARRAY['foam', 'foamy', 'bubbles', 'hot tub', 'spa', 'oils', 'TDS'],
ARRAY['spa'],
ARRAY['beginner', 'intermediate']);

-- ===== PLANTED TANKS =====

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('plants', 'co2_injection', 'CO2 Injection for Planted Tanks',
'CO2 is often the limiting factor in planted tank growth. Injection can dramatically improve plant health and reduce algae.

Methods (low to high):
1. Liquid carbon (Excel/Easy Carbo): Slight boost, good for low-tech
2. DIY yeast: Inconsistent, good for learning
3. Pressurized CO2: Most effective, requires regulator setup

Target Levels:
- Low tech (no CO2): 3-5 ppm (ambient)
- Medium tech: 15-20 ppm
- High tech: 25-35 ppm

Setting up pressurized CO2:
1. CO2 cylinder (5-20 lb)
2. Regulator with solenoid
3. Needle valve for fine adjustment
4. Diffuser or reactor for dissolution
5. Drop checker for monitoring (should be green/light green)

Critical safety:
- CO2 drops pH - monitor carefully
- Turn off at night (plants don''t use CO2, can suffocate fish)
- Use solenoid on timer, start 1-2 hours before lights
- Never exceed 35 ppm - fish stress/death risk',
ARRAY['CO2', 'carbon dioxide', 'planted tank', 'injection', 'diffuser', 'regulator'],
ARRAY['freshwater'],
ARRAY['intermediate', 'advanced']);

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('plants', 'plant_deficiencies', 'Identifying Plant Nutrient Deficiencies',
'Plant problems often stem from nutrient deficiencies. Symptoms location helps diagnosis:

Old Leaves Affected First (Mobile Nutrients):
- Nitrogen (N): Yellowing from tips, stunted growth
- Phosphorus (P): Dark leaves, purple/red tints, holes
- Potassium (K): Pinholes, yellowing edges, weak stems
- Magnesium (Mg): Yellowing between veins

New Leaves Affected First (Immobile Nutrients):
- Iron (Fe): Pale/white new growth, green veins
- Calcium (Ca): Twisted, deformed new growth
- Manganese (Mn): Yellowing between veins (like Mg but new leaves)
- Boron (B): Stunted, twisted tips

Common Solutions:
1. All-in-one fertilizer handles most cases
2. Iron specifically for pale new growth
3. Potassium for hole/edge problems
4. Root tabs for heavy root feeders (swords, crypts)

Important: Fix one deficiency at a time. Excess nutrients can cause algae or toxicity. Start with half-recommended doses.',
ARRAY['deficiency', 'nutrients', 'fertilizer', 'yellowing', 'holes', 'planted tank', 'iron'],
ARRAY['freshwater'],
ARRAY['intermediate', 'advanced']);

-- ===== FISH CARE =====

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('fish_care', 'betta_care', 'Betta Fish Complete Care Guide',
'Betta splendens require more space and care than commonly believed.

Minimum Requirements:
- Tank size: 5 gallons minimum (10+ preferred)
- Heater: 78-82°F required (tropical fish!)
- Filter: Gentle flow (baffled if needed)
- No tankmates with long fins or bright colors

Water Parameters:
- pH: 6.5-7.5
- Ammonia/Nitrite: 0 ppm
- Nitrate: Under 20 ppm
- Hardness: Soft to moderate

Common Health Issues:
1. Fin rot - Usually from poor water quality
2. Swim bladder - Often from overfeeding, try fasting
3. Velvet - Gold dust appearance, treat with heat/darkness/salt
4. Columnaris - White patches, bacterial, needs antibiotics

Feeding:
- High-quality betta pellets as staple
- Fast one day per week
- 2-3 pellets twice daily
- Occasional treats: frozen bloodworms, brine shrimp

Signs of stress: Clamped fins, color fading, lethargy, vertical stripes (stress stripes)',
ARRAY['betta', 'siamese fighting fish', 'care', 'tank size', 'heater', 'fin rot'],
ARRAY['freshwater'],
ARRAY['beginner', 'intermediate']);

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('fish_care', 'quarantine', 'Fish Quarantine Protocol',
'Quarantine prevents disease introduction and is essential for healthy tanks.

Setup Requirements:
- 10-20 gallon tank minimum
- Sponge filter (seeded from main tank)
- Heater
- Minimal decor (easy to sterilize)
- Separate equipment (nets, siphon)

Basic Quarantine (2-4 weeks):
1. Observe for disease symptoms
2. Feed high-quality food to build strength
3. Perform regular water changes
4. Treat visible problems as they appear

Prophylactic Treatment Protocol:
Week 1: Praziquantel for internal parasites
Week 2: General Cure or Paraguard for external parasites
Week 3-4: Observation

Marine Fish Quarantine:
- Minimum 72 days for ich (Cryptocaryon) to clear
- Copper treatment at 2.0-2.5 ppm therapeutic level
- Or tank transfer method every 72 hours

Never add fish directly to display tank. Even healthy-looking fish carry parasites and diseases.',
ARRAY['quarantine', 'QT', 'new fish', 'disease prevention', 'copper', 'praziquantel'],
ARRAY['freshwater', 'saltwater'],
ARRAY['intermediate', 'advanced']);

-- ===== EQUIPMENT =====

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('equipment', 'filter_types', 'Aquarium Filter Types Comparison',
'Choosing the right filter depends on tank size, bioload, and maintenance preferences.

Hang-on-Back (HOB):
- Best for: Beginners, small-medium tanks
- Pros: Easy maintenance, good flow
- Cons: Can be noisy, limited media space
- Examples: AquaClear, Seachem Tidal

Canister Filters:
- Best for: Medium-large tanks, planted tanks
- Pros: Large media capacity, quiet, versatile
- Cons: Harder to maintain, more expensive
- Examples: Fluval FX, Eheim Classic

Sponge Filters:
- Best for: Breeding tanks, shrimp, hospital tanks
- Pros: Cheap, gentle flow, excellent bio-filtration
- Cons: Not for heavy bioload, needs air pump
- Use with: Breeding fry, quarantine, backup

Sumps:
- Best for: Large tanks, reef tanks
- Pros: Hides equipment, huge media capacity, stable parameters
- Cons: Complex setup, requires drilling or overflow

Filter sizing: Aim for 4-10x tank volume per hour turnover. Higher for heavy bioload.',
ARRAY['filter', 'HOB', 'canister', 'sponge filter', 'sump', 'filtration'],
ARRAY['freshwater', 'saltwater', 'reef'],
ARRAY['beginner', 'intermediate', 'advanced']);

INSERT INTO knowledge_base (category, subcategory, title, content, keywords, water_types, skill_levels) VALUES
('equipment', 'heater_sizing', 'Aquarium Heater Selection and Safety',
'Proper heater sizing prevents temperature swings and equipment failure.

Sizing Guide (watts per gallon):
- 2.5-5 W/gal: Typical heated room
- 5 W/gal: Cold room or basement
- Consider two smaller heaters for large tanks (redundancy)

Heater Types:
1. Submersible glass: Common, affordable, position horizontally
2. Titanium: Unbreakable, often with external controller
3. Inline: Installs in filter tubing, hides equipment
4. Substrate/cable: For planted tanks, promotes root growth

Safety Practices:
- Always unplug when water level drops (burns out)
- Wait 15-30 min after unplugging before removing (thermal shock)
- Use heater guard with large/aggressive fish
- Position horizontally near flow for even distribution
- Consider external temperature controller for precision/safety

Temperature Stability:
- Fluctuations >2°F daily stress fish
- Avoid direct sunlight on tank
- Consider tank chiller in hot climates',
ARRAY['heater', 'temperature', 'watts', 'titanium', 'controller', 'sizing'],
ARRAY['freshwater', 'saltwater', 'reef'],
ARRAY['beginner', 'intermediate']);
