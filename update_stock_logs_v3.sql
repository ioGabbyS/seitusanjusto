
-- ACTUALIZACIÓN FINAL DE TABLA STOCK_LOGS
-- Ejecutar esto en el SQL Editor de Supabase

-- Agregar columnas faltantes para la Matriz de Control
ALTER TABLE public.stock_logs ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.stock_logs ADD COLUMN IF NOT EXISTS product_id TEXT;

-- Asegurar permisos (Barra libre)
DROP POLICY IF EXISTS "Public Access Stock Logs" ON stock_logs;
CREATE POLICY "Public Access Stock Logs" ON stock_logs FOR ALL USING (true) WITH CHECK (true);

-- Notificar al usuario
COMMENT ON TABLE public.stock_logs IS 'Tabla de auditoría de stock actualizada con category y product_id';
