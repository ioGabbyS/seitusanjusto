-- =====================================================
-- FIX DE PERMISOS PARA PREMIOS (REWARDS)
-- =====================================================
-- Asegurar que la tabla rewards sea accesible públicamente
-- para evitar problemas de sincronización.
-- =====================================================

-- 1. Eliminar política actual (si existe)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON rewards;

-- 2. Crear nueva política totalmente pública
CREATE POLICY "Public Access Rewards" 
ON rewards 
FOR ALL 
USING (true);

-- 3. Confirmar que RLS está activo (es seguro porque la política permite acceso)
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
