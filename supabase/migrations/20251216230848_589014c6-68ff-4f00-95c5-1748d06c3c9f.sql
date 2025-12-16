-- Add AI alert fields to water_test_alerts table
ALTER TABLE water_test_alerts 
  ADD COLUMN IF NOT EXISTS recommendation text,
  ADD COLUMN IF NOT EXISTS timeframe text,
  ADD COLUMN IF NOT EXISTS affected_inhabitants text[],
  ADD COLUMN IF NOT EXISTS confidence numeric,
  ADD COLUMN IF NOT EXISTS analysis_model text DEFAULT 'rule',
  ADD COLUMN IF NOT EXISTS predicted_impact text;

-- Add index for AI model filtering
CREATE INDEX IF NOT EXISTS idx_water_test_alerts_model 
  ON water_test_alerts(analysis_model);