-- SCRIPT DE CORRECCIÓN DE PERMISOS
-- Ejecuta esto en el SQL Editor de Supabase para permitir guardar datos.

-- 1. Asegurar que las políticas permitan escribir a TODOS (Anon)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON catalog;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON sales;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON rewards;

-- 2. Crear políticas PÚBLICAS (Lectura y Escritura total)
CREATE POLICY "Public Access Catalog" ON catalog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Rewards" ON rewards FOR ALL USING (true) WITH CHECK (true);

-- 3. Habilitar RLS (Es necesario que esté activo para que las políticas funcionen, o desactivarlo para barra libre)
-- Opción A: Barra libre controlada por políticas (Recomendado)
ALTER TABLE catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
