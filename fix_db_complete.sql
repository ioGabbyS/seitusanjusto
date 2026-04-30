-- =====================================================
-- SCRIPT DE REPARACIÓN TOTAL (Tablas + Permisos)
-- Ejecuta ESTO para arreglar el error "relation does not exist"
-- =====================================================

-- 1. CREAR TABLAS FALTANTES (Si no existen, las crea)
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
    bonus_points NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Puntos',
    point_cost NUMERIC NOT NULL,
    stock NUMERIC DEFAULT 0,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    method TEXT,
    is_automatic BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    date TEXT,
    invoice_number TEXT,
    items JSONB NOT NULL,
    is_historical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. LIMPIAR POLÍTICAS VIEJAS (Para evitar errores de duplicados)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON catalog;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON sales;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON rewards;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON purchases;

DROP POLICY IF EXISTS "Public Access Catalog" ON catalog;
DROP POLICY IF EXISTS "Public Access Customers" ON customers;
DROP POLICY IF EXISTS "Public Access Sessions" ON sessions;
DROP POLICY IF EXISTS "Public Access Sales" ON sales;
DROP POLICY IF EXISTS "Public Access Expenses" ON expenses;
DROP POLICY IF EXISTS "Public Access Rewards" ON rewards;
DROP POLICY IF EXISTS "Public Access Purchases" ON purchases;

-- 3. HABILITAR RLS (Seguridad a nivel de fila)
ALTER TABLE catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- 4. CREAR NUEVAS POLÍTICAS PÚBLICAS (Permitir todo a todos)
CREATE POLICY "Public Access Catalog" ON catalog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Rewards" ON rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Purchases" ON purchases FOR ALL USING (true) WITH CHECK (true);

-- 5. CREAR BUCKET DE IMÁGENES (Si falta)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access Images" ON storage.objects;
CREATE POLICY "Public Access Images" ON storage.objects FOR ALL USING ( bucket_id = 'images' ) WITH CHECK ( bucket_id = 'images' );
