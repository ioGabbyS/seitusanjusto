-- =====================================================
-- SCRIPT SQL PARA SUPABASE - SISTEMA SEITU CASTILLO
-- =====================================================
-- Ejecutar este script en el SQL Editor de Supabase
-- para crear todas las tablas necesarias
-- =====================================================

-- 1. TABLA DE CATÁLOGO (Productos)
CREATE TABLE IF NOT EXISTS catalog (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC DEFAULT 0,
    quantity NUMERIC DEFAULT 0,
    min_stock NUMERIC DEFAULT 5,
    cc NUMERIC DEFAULT 0,
    pack_units NUMERIC DEFAULT 1,
    barcode TEXT,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE VENTAS
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    order_number INTEGER,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT,
    customer_id TEXT,
    points_redeemed NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE COMPRAS
CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    date TEXT,
    invoice_number TEXT,
    items JSONB NOT NULL,
    is_historical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE CLIENTES (Ya existe, pero la recreamos por si acaso)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    dni TEXT,
    phone TEXT,
    email TEXT,
    points NUMERIC DEFAULT 0,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE PREMIOS/RECOMPENSAS (Ya existe, pero la recreamos)
CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Puntos',
    point_cost NUMERIC NOT NULL,
    stock NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA DE SESIONES DE CAJA
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    cashier TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    initial_cash NUMERIC DEFAULT 0,
    final_cash NUMERIC DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    declared_total NUMERIC DEFAULT 0,
    last_order_number INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA DE GASTOS
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    method TEXT,
    is_automatic BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA MEJORAR PERFORMANCE
-- =====================================================

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_catalog_category ON catalog(category);
CREATE INDEX IF NOT EXISTS idx_catalog_name ON catalog(name);
CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_timestamp ON purchases(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_customers_dni ON customers(dni);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_timestamp ON expenses(timestamp DESC);

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Políticas: Permitir TODO para usuarios autenticados
-- (Más adelante puedes agregar autenticación más específica)

-- CATALOG
CREATE POLICY "Enable all for authenticated users" ON catalog
    FOR ALL USING (true);

-- SALES
CREATE POLICY "Enable all for authenticated users" ON sales
    FOR ALL USING (true);

-- PURCHASES
CREATE POLICY "Enable all for authenticated users" ON purchases
    FOR ALL USING (true);

-- CUSTOMERS
CREATE POLICY "Enable all for authenticated users" ON customers
    FOR ALL USING (true);

-- REWARDS
CREATE POLICY "Enable all for authenticated users" ON rewards
    FOR ALL USING (true);

-- SESSIONS
CREATE POLICY "Enable all for authenticated users" ON sessions
    FOR ALL USING (true);

-- EXPENSES
CREATE POLICY "Enable all for authenticated users" ON expenses
    FOR ALL USING (true);

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- =====================================================

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_catalog_updated_at BEFORE UPDATE ON catalog
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('catalog', 'sales', 'purchases', 'customers', 'rewards', 'sessions', 'expenses')
ORDER BY table_name;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Este script crea todas las tablas necesarias
-- 2. Las políticas RLS permiten acceso total (ajustar según necesidad)
-- 3. Los índices mejoran el rendimiento de búsquedas
-- 4. Los triggers actualizan automáticamente updated_at
-- =====================================================

-- =====================================================
-- MIGRACIÓN: Loyalty Program Enhancements
-- =====================================================
 ALTER TABLE catalog ADD COLUMN IF NOT EXISTS bonus_points NUMERIC DEFAULT 0;
 ALTER TABLE rewards ADD COLUMN IF NOT EXISTS image TEXT;


-- =====================================================
-- STORAGE: Configuración de Imágenes (Buckets)
-- =====================================================
-- 1. Crear el bucket 'images' (si no existe, desde SQL a veces requiere insert directo)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Seguridad (RLS) para Storage
-- Permitir acceso público para VER imágenes
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'images' );

-- Permitir a usuarios autenticados SUBIR imágenes
CREATE POLICY "Auth Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );

-- Permitir a usuarios autenticados ACTUALIZAR/BORRAR
CREATE POLICY "Auth Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'images' AND auth.role() = 'authenticated' );

CREATE POLICY "Auth Delete" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'images' AND auth.role() = 'authenticated' );
