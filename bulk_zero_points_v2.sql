
-- Force update to 0 ensuring we catch accents and variations
-- We update based on matching strings regardless of case/accents if possible, 
-- or just cover common variations explicitly.

UPDATE catalog 
SET points_earned_ratio = 0 
WHERE category ILIKE '%cafeter%' 
   OR category ILIKE '%promo%' 
   OR category ILIKE '%pizza%' 
   OR category ILIKE '%bebida%';

-- Explicit check for possible accent issues or exact matches
UPDATE catalog SET points_earned_ratio = 0 WHERE category = 'Cafeteria';
UPDATE catalog SET points_earned_ratio = 0 WHERE category = 'Cafetería';
UPDATE catalog SET points_earned_ratio = 0 WHERE category = 'Promos';
UPDATE catalog SET points_earned_ratio = 0 WHERE category = 'Pizzas';
UPDATE catalog SET points_earned_ratio = 0 WHERE category = 'Bebidas';
