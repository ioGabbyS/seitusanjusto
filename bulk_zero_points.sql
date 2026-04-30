
-- Set points ratio to 0 (No points) for specific categories
-- Using ILIKE for case-insensitive matching

UPDATE catalog 
SET points_earned_ratio = 0 
WHERE category ILIKE '%cafeter%' 
   OR category ILIKE '%promo%' 
   OR category ILIKE '%pizza%' 
   OR category ILIKE '%bebida%';

-- Verify the changes (Optional, will show count of affected rows in dashboard)
-- SELECT count(*) FROM catalog WHERE points_earned_ratio = 0;
