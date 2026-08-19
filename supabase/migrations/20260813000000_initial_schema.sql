-- =========================================================
-- BAR DO ACANTO PDV & CARDÁPIO DIGITAL - SUPABASE SQL SCHEMA
-- Execute este script no SQL Editor do Supabase para criar as tabelas
-- =========================================================

-- 1. Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Produtos
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    category_id TEXT,
    image TEXT,
    available BOOLEAN DEFAULT TRUE,
    code TEXT,
    extra_group_ids JSONB DEFAULT '[]'::jsonb,
    custom_extras JSONB DEFAULT '[]'::jsonb,
    removable_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address JSONB,
    total_spent NUMERIC(10,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pedidos (Delivery, Retirada, PDV, Mesa)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    customer JSONB,
    table_number INTEGER,
    comanda_number TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10,2) DEFAULT 0.00,
    delivery_fee NUMERIC(10,2) DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pago',
    notes TEXT,
    waiter_name TEXT,
    delivery_driver_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Mesas
CREATE TABLE IF NOT EXISTS public.tables (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 4,
    status TEXT NOT NULL DEFAULT 'livre',
    current_order_ids JSONB DEFAULT '[]'::jsonb,
    opened_at TEXT,
    waiter_name TEXT,
    customer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Comandas
CREATE TABLE IF NOT EXISTS public.comandas (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    table_number INTEGER,
    status TEXT NOT NULL DEFAULT 'aberta',
    items JSONB DEFAULT '[]'::jsonb,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Garçons
CREATE TABLE IF NOT EXISTS public.waiters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'ativo',
    active_tables INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Entregadores
CREATE TABLE IF NOT EXISTS public.drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'disponivel',
    completed_today INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Configurações da Loja
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    data JSONB,
    name TEXT,
    slogan TEXT,
    phone TEXT,
    whatsapp_phone TEXT,
    address TEXT,
    cnpj TEXT,
    pix_key TEXT,
    pix_name TEXT,
    pix_city TEXT,
    delivery_fee_default NUMERIC(10,2) DEFAULT 0.00,
    is_open BOOLEAN DEFAULT TRUE,
    is_store_active BOOLEAN DEFAULT TRUE,
    allow_orders_when_closed BOOLEAN DEFAULT FALSE,
    store_timezone TEXT DEFAULT 'America/Sao_Paulo',
    weekly_schedule JSONB,
    operating_hours TEXT,
    logo_url TEXT,
    auto_send_whatsapp BOOLEAN DEFAULT TRUE,
    enable_whatsapp_bot BOOLEAN DEFAULT FALSE,
    welcome_whatsapp_msg TEXT,
    order_confirmed_msg TEXT,
    order_dispatched_msg TEXT,
    order_ready_msg TEXT,
    pix_request_msg TEXT,
    thermal_paper_width TEXT DEFAULT '80mm',
    menu_slug TEXT,
    custom_domain TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Usuários do Sistema (Administradores, Gerentes e Garçons)
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'garcom',
    pin TEXT NOT NULL DEFAULT '1234',
    status TEXT NOT NULL DEFAULT 'ativo',
    phone TEXT,
    avatar_emoji TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuração de Row Level Security (RLS) para acesso anônimo no PDV & Cardápio
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público (Permite Leitura e Gravação para o PDV e Cardápio Digital)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Full Access Categories" ON public.categories;
    CREATE POLICY "Public Full Access Categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Products" ON public.products;
    CREATE POLICY "Public Full Access Products" ON public.products FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Customers" ON public.customers;
    CREATE POLICY "Public Full Access Customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Orders" ON public.orders;
    CREATE POLICY "Public Full Access Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Tables" ON public.tables;
    CREATE POLICY "Public Full Access Tables" ON public.tables FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Comandas" ON public.comandas;
    CREATE POLICY "Public Full Access Comandas" ON public.comandas FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Waiters" ON public.waiters;
    CREATE POLICY "Public Full Access Waiters" ON public.waiters FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Drivers" ON public.drivers;
    CREATE POLICY "Public Full Access Drivers" ON public.drivers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access StoreSettings" ON public.store_settings;
    CREATE POLICY "Public Full Access StoreSettings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access AppUsers" ON public.app_users;
    CREATE POLICY "Public Full Access AppUsers" ON public.app_users FOR ALL USING (true) WITH CHECK (true);
END $$;
