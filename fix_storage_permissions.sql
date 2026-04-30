-- =====================================================
-- FIX DE PERMISOS PARA SUBIDA DE IMÁGENES (RLS)
-- =====================================================
-- Ejecuta este bloque para permitir la subida de imágenes
-- sin necesidad de estar logueado como usuario de Supabase
-- (Ya que usamos autenticación local en la App)
-- =====================================================

-- 1. Eliminar políticas restrictivas anteriores
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;

-- 2. Crear políitica permisiva para el bucket 'images'
CREATE POLICY "Public Insert" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'images' );

CREATE POLICY "Public Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'images' );

CREATE POLICY "Public Delete" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'images' );

-- 3. Verificar que el bucket sea público
UPDATE storage.buckets
SET public = true
WHERE id = 'images';
