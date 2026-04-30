
-- Add columns to catalog for granular points and redemption cost
ALTER TABLE catalog 
ADD COLUMN IF NOT EXISTS points_earned_ratio numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS point_cost numeric DEFAULT 0;

-- Update existing rows to have defaults if null (just in case)
UPDATE catalog SET points_earned_ratio = 1 WHERE points_earned_ratio IS NULL;
UPDATE catalog SET point_cost = 0 WHERE point_cost IS NULL;
