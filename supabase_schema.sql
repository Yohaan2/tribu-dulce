-- SUPABASE SCHEMA FOR TRIBU DULCE
-- Base de Datos de Gestión de Ventas y Cuentas por Cobrar

-- Habilitar extensión para UUIDs si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. TABLA: profiles
-- =========================================================================
-- En Supabase, vinculada a auth.users para extender la información del usuario.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CONSTRAINT chk_profile_role CHECK (role IN ('ADMIN', 'EMPLOYEE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas para profiles
CREATE POLICY "Permitir lectura de perfiles a usuarios autenticados" 
    ON public.profiles FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualización del propio perfil" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- =========================================================================
-- 2. TABLA: clients
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de clientes a usuarios autenticados" 
    ON public.clients FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserción/edición de clientes a usuarios autenticados" 
    ON public.clients FOR ALL 
    USING (auth.role() = 'authenticated');

-- =========================================================================
-- 3. TABLA: products
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price_usd NUMERIC(10, 2) NOT NULL CONSTRAINT chk_product_price CHECK (price_usd >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de productos a usuarios autenticados" 
    ON public.products FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir gestión de productos solo a administradores" 
    ON public.products FOR ALL 
    USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    );

-- Si un usuario es de tipo EMPLOYEE también podría querer editar/crear productos en algunas configs.
-- Por defecto, dejamos permisos completos a autenticados para que puedan trabajar flexiblemente
DROP POLICY IF EXISTS "Permitir gestión de productos solo a administradores" ON public.products;
CREATE POLICY "Permitir gestión de productos a usuarios autenticados"
    ON public.products FOR ALL
    USING (auth.role() = 'authenticated');

-- =========================================================================
-- 4. TABLA: sales
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    total_usd NUMERIC(10, 2) NOT NULL CONSTRAINT chk_sale_total_usd CHECK (total_usd >= 0),
    total_bs NUMERIC(12, 2) NOT NULL CONSTRAINT chk_sale_total_bs CHECK (total_bs >= 0),
    status TEXT NOT NULL CONSTRAINT chk_sale_status CHECK (status IN ('PAID', 'PENDING', 'PARTIAL')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios autenticados en sales" 
    ON public.sales FOR ALL 
    USING (auth.role() = 'authenticated');

-- Indices para optimizar búsquedas por cliente y creador
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON public.sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON public.sales(created_by);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);

-- =========================================================================
-- 5. TABLA: sale_items
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CONSTRAINT chk_item_quantity CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CONSTRAINT chk_item_price CHECK (unit_price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CONSTRAINT chk_item_subtotal CHECK (subtotal >= 0)
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios autenticados en sale_items" 
    ON public.sale_items FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_items_product_id ON public.sale_items(product_id);

-- =========================================================================
-- 6. TABLA: payments
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    amount_usd NUMERIC(10, 2) NOT NULL CONSTRAINT chk_payment_amount_usd CHECK (amount_usd >= 0),
    amount_bs NUMERIC(12, 2) NOT NULL CONSTRAINT chk_payment_amount_bs CHECK (amount_bs >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios autenticados en payments" 
    ON public.payments FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON public.payments(sale_id);

-- =========================================================================
-- 7. TABLA: exchange_rates
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate NUMERIC(10, 2) NOT NULL CONSTRAINT chk_rate_positive CHECK (rate > 0),
    source TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de tasa de cambio a usuarios autenticados" 
    ON public.exchange_rates FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserción de tasa de cambio a usuarios autenticados" 
    ON public.exchange_rates FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Indexar fecha de creación para traer rápidamente la última tasa registrada
CREATE INDEX IF NOT EXISTS idx_exchange_rates_created_at ON public.exchange_rates(created_at DESC);
