-- =====================================================
-- BLINDAJE DE SEGURIDAD (RLS LOCKDOWN) - v2
-- =====================================================
-- Ejecutar una sola vez para cerrar el acceso público
-- =====================================================

-- 1. Eliminar políticas antiguas (demasiado permisivas)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON catalog;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON sales;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON purchases;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON rewards;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON expenses;

-- 2. Crear NUEVAS políticas estrictas

-- CATALOG: Solo Admin (a menos que quieras mostrar precios en la web, por ahora cerramos)
CREATE POLICY "Admin Access Only" ON catalog FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SALES: Solo Admin (Privado)
CREATE POLICY "Admin Access Only" ON sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PURCHASES: Solo Admin (Privado)
CREATE POLICY "Admin Access Only" ON purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CUSTOMERS: Solo Admin (Privado - La web usa API segura)
CREATE POLICY "Admin Access Only" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SESSIONS: Solo Admin (Privado)
CREATE POLICY "Admin Access Only" ON sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- EXPENSES: Solo Admin (Privado)
CREATE POLICY "Admin Access Only" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- REWARDS: PÚBLICO para LEER (Landing Page), Solo Admin para EDITAR
CREATE POLICY "Public Read Rewards" ON rewards FOR SELECT USING (true);
CREATE POLICY "Admin Manage Rewards" ON rewards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin Update Rewards" ON rewards FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin Delete Rewards" ON rewards FOR DELETE TO authenticated USING (true);


-- 3. STORAGE (Imágenes)
BEGIN;
  -- Borrar props viejas si existen
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
  DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
  DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;

  -- Crear nuevas
  -- VER: Público
  CREATE POLICY "Public View Images" ON storage.objects FOR SELECT USING ( bucket_id = 'images' );
  
  -- EDITAR: Solo Admin
  CREATE POLICY "Admin Upload Images" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'images' );
  CREATE POLICY "Admin Manage Images" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'images' );
  CREATE POLICY "Admin Delete Images" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'images' );
COMMIT;
