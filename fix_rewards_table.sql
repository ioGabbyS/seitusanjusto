-- 1. Agregar columnas faltantes a 'rewards' (si no existen)
-- Esto solucionará que los puntos y stock se vuelvan a 0
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS point_cost NUMERIC DEFAULT 0;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS stock NUMERIC DEFAULT 0;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS image TEXT;

-- 2. Asegurar permisos (Borrar la vieja y crear una nueva full access)
-- Esto soluciona el error "policy already exists"
DROP POLICY IF EXISTS "Public Access Rewards" ON rewards;
CREATE POLICY "Public Access Rewards" ON rewards FOR ALL USING (true) WITH CHECK (true);

-- 3. Habilitar seguridad RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
