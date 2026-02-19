-- Test Kit Profiles: stores user's test kit information for smarter photo analysis
CREATE TABLE public.test_kit_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,                          -- user-friendly name, e.g. "My API Master Kit"
  brand TEXT NOT NULL,                         -- API, Tetra, Salifert, Hanna, Red Sea, Taylor, LaMotte, JBL, Seachem, AquaChek, Other
  model TEXT,                                  -- e.g. "Master Test Kit", "6-in-1 Strips", "HI-772 Checker"
  kit_type TEXT NOT NULL DEFAULT 'strip',      -- strip, liquid, digital
  parameters TEXT[] NOT NULL DEFAULT '{}',     -- which parameters this kit tests, e.g. {"pH","Ammonia","Nitrite","Nitrate","GH","KH"}
  reference_chart_url TEXT,                    -- stored photo of the color reference chart
  development_times JSONB DEFAULT '{}',        -- per-parameter dev time in seconds, e.g. {"Ammonia": 300, "Nitrate": 300, "pH": 60}
  pad_order TEXT[] DEFAULT '{}',               -- for strips: order of pads top-to-bottom, e.g. {"Nitrate","Nitrite","GH","Chlorine","KH","pH"}
  notes TEXT,                                  -- user notes about this kit
  is_default BOOLEAN DEFAULT false,            -- whether this is the user's default kit for quick access
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast lookup by user
CREATE INDEX idx_test_kit_profiles_user_id ON public.test_kit_profiles(user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_test_kit_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_test_kit_profiles_updated_at
  BEFORE UPDATE ON public.test_kit_profiles
  FOR EACH ROW EXECUTE FUNCTION update_test_kit_profiles_updated_at();

-- Ensure only one default kit per user
CREATE UNIQUE INDEX idx_test_kit_profiles_default
  ON public.test_kit_profiles(user_id)
  WHERE is_default = true;

-- RLS policies
ALTER TABLE public.test_kit_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own test kit profiles"
  ON public.test_kit_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own test kit profiles"
  ON public.test_kit_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test kit profiles"
  ON public.test_kit_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own test kit profiles"
  ON public.test_kit_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Computed view: per-user calibration offsets from photo_analysis_corrections
-- Aggregates correction history to find systematic biases per user+parameter
CREATE OR REPLACE VIEW public.user_calibration_offsets AS
SELECT
  user_id,
  parameter_name,
  COUNT(*) AS correction_count,
  AVG(correction_delta) AS avg_offset,
  STDDEV(correction_delta) AS offset_stddev,
  -- Only consider offsets reliable if we have 3+ corrections and low variance
  CASE
    WHEN COUNT(*) >= 3 AND COALESCE(STDDEV(correction_delta), 0) < ABS(AVG(correction_delta)) * 0.5
    THEN ROUND(AVG(correction_delta)::numeric, 2)
    ELSE 0
  END AS recommended_offset
FROM public.photo_analysis_corrections
GROUP BY user_id, parameter_name;

-- Seed common test kit templates that users can pick from
-- (These are not user-specific, just convenience templates)
CREATE TABLE public.test_kit_templates (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  kit_type TEXT NOT NULL,
  parameters TEXT[] NOT NULL,
  development_times JSONB DEFAULT '{}',
  pad_order TEXT[] DEFAULT '{}'
);

INSERT INTO public.test_kit_templates (id, brand, model, kit_type, parameters, development_times, pad_order) VALUES
  ('api-master', 'API', 'Freshwater Master Test Kit', 'liquid',
   '{"pH","Ammonia","Nitrite","Nitrate"}',
   '{"pH": 5, "Ammonia": 300, "Nitrite": 300, "Nitrate": 300}',
   '{}'),
  ('api-5in1', 'API', '5-in-1 Test Strips', 'strip',
   '{"Nitrate","Nitrite","GH","KH","pH"}',
   '{"Nitrate": 60, "Nitrite": 60, "GH": 60, "KH": 60, "pH": 60}',
   '{"Nitrate","Nitrite","GH","KH","pH"}'),
  ('api-5in1-ammonia', 'API', '5-in-1 + Ammonia Strips', 'strip',
   '{"Nitrate","Nitrite","GH","Chlorine","KH","pH","Ammonia"}',
   '{"Nitrate": 60, "Nitrite": 60, "GH": 60, "Chlorine": 60, "KH": 60, "pH": 60, "Ammonia": 60}',
   '{"Nitrate","Nitrite","GH","Chlorine","KH","pH","Ammonia"}'),
  ('tetra-6in1', 'Tetra', 'EasyStrips 6-in-1', 'strip',
   '{"Chlorine","Nitrite","Nitrate","GH","KH","pH"}',
   '{"Chlorine": 30, "Nitrite": 60, "Nitrate": 60, "GH": 30, "KH": 30, "pH": 30}',
   '{"Chlorine","Nitrite","Nitrate","GH","KH","pH"}'),
  ('salifert-reef', 'Salifert', 'Reef Test Kits', 'liquid',
   '{"Calcium","Alkalinity","Magnesium","Phosphate","Nitrate","pH"}',
   '{"Calcium": 120, "Alkalinity": 60, "Magnesium": 120, "Phosphate": 180, "Nitrate": 180, "pH": 30}',
   '{}'),
  ('hanna-alk', 'Hanna', 'HI-772 Alkalinity Checker', 'digital',
   '{"Alkalinity"}', '{"Alkalinity": 120}', '{}'),
  ('hanna-phosphate', 'Hanna', 'HI-736 Phosphate ULR Checker', 'digital',
   '{"Phosphate"}', '{"Phosphate": 180}', '{}'),
  ('hanna-calcium', 'Hanna', 'HI-758 Calcium Checker', 'digital',
   '{"Calcium"}', '{"Calcium": 60}', '{}'),
  ('red-sea-foundation', 'Red Sea', 'Foundation Pro Test Kit', 'liquid',
   '{"Calcium","Alkalinity","Magnesium"}',
   '{"Calcium": 60, "Alkalinity": 60, "Magnesium": 60}',
   '{}'),
  ('taylor-k2005', 'Taylor', 'K-2005 FAS-DPD', 'liquid',
   '{"Free Chlorine","Total Chlorine","pH","Alkalinity","Calcium Hardness","Cyanuric Acid"}',
   '{"Free Chlorine": 30, "Total Chlorine": 30, "pH": 15, "Alkalinity": 30, "Calcium Hardness": 30, "Cyanuric Acid": 60}',
   '{}'),
  ('aquachek-7way', 'AquaChek', 'Select 7-Way', 'strip',
   '{"Free Chlorine","Total Chlorine","pH","Alkalinity","Calcium Hardness","Cyanuric Acid","Total Bromine"}',
   '{"Free Chlorine": 15, "Total Chlorine": 15, "pH": 15, "Alkalinity": 15, "Calcium Hardness": 15, "Cyanuric Acid": 15, "Total Bromine": 15}',
   '{"Free Chlorine","Total Chlorine","pH","Alkalinity","Calcium Hardness","Cyanuric Acid","Total Bromine"}'),
  ('jbl-proscan', 'JBL', 'ProScan', 'strip',
   '{"pH","KH","GH","Nitrite","Nitrate","Chlorine","CO2"}',
   '{"pH": 60, "KH": 60, "GH": 60, "Nitrite": 60, "Nitrate": 60, "Chlorine": 60, "CO2": 60}',
   '{"pH","KH","GH","Nitrite","Nitrate","Chlorine","CO2"}');

-- RLS for templates (read-only for all authenticated users)
ALTER TABLE public.test_kit_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view test kit templates"
  ON public.test_kit_templates FOR SELECT
  TO authenticated
  USING (true);
