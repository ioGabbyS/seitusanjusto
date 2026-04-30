
-- ACTUALIZACIÓN DE SCHEMA PARA VENTAS Y GASTOS
-- Ejecutar esto en el SQL Editor de Supabase para arreglar el problema de sincronización.

-- 1. Actualizar tabla de VENTAS (sales)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS is_fiscal BOOLEAN DEFAULT FALSE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS fiscal_data JSONB;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- 2. Actualizar tabla de GASTOS (expenses)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS saved_to_envelope BOOLEAN DEFAULT FALSE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS envelope_name TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 3. Asegurar permisos públicos (Barra libre para este proyecto)
DROP POLICY IF EXISTS "Public Access Sales" ON sales;
CREATE POLICY "Public Access Sales" ON sales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Expenses" ON expenses;
CREATE POLICY "Public Access Expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- 4. Actualizar tabla de LOGS DE STOCK (por si acaso)
ALTER TABLE public.stock_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.stock_logs ADD COLUMN IF NOT EXISTS previous_stock NUMERIC;
ALTER TABLE public.stock_logs ADD COLUMN IF NOT EXISTS new_stock NUMERIC;
