-- Crear tabla de configuración global
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    configuration JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar seguridad
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Permitir acceso público (lectura y escritura)
DROP POLICY IF EXISTS "Public Access Settings" ON settings;
CREATE POLICY "Public Access Settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Insertar configuración por defecto si no existe
INSERT INTO settings (id, configuration) 
VALUES ('global', '{"pesosPerPoint": 100}'::jsonb)
ON CONFLICT (id) DO NOTHING;
