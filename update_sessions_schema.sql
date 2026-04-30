-- Add JSONB columns to sessions table for rich data storage
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS cash_breakdown JSONB DEFAULT '{}'::jsonb;

-- Ensure RLS is enabled
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access Sessions" ON sessions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON sessions;

-- Allow public access (simple mode for this app)
CREATE POLICY "Public Access Sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
