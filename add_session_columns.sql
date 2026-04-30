-- Add missing columns to sessions table to track differences and expected cash
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS difference NUMERIC,
ADD COLUMN IF NOT EXISTS expected_cash NUMERIC;

-- Refresh cache for the table if necessary (not usually needed in Supabase)
-- Update existing records if possible (optional)
-- UPDATE sessions SET difference = (declared_total - initial_cash) WHERE difference IS NULL AND declared_total IS NOT NULL;
