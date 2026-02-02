-- PASO 1: CONFIGURACIÓN DE BASE DE DATOS Y SEGURIDAD (Supabase)
-- Versión Idempotente (Segura para ejecutar múltiples veces)

-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- 1. TABLA: PROFILES (Extiende la tabla auth.users)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  role text default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABLA: PRODUCTS (Camisetas base)
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  base_price numeric not null,
  image_url text not null, -- URL de la camiseta base (blanca, negra, etc.)
  colors text[] not null, -- Array de colores disponibles ej: ['white', 'black', 'navy']
  sizes text[] not null, -- Array de tallas ej: ['S', 'M', 'L', 'XL']
  stock integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABLA: ORDERS (Pedidos)
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  status text default 'pending' check (status in ('pending', 'paid', 'shipped', 'cancelled')),
  total_amount numeric not null,
  shipping_address text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABLA: ORDER_ITEMS (Items del pedido)
create table if not exists public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer default 1,
  size text not null,
  color text not null,
  custom_print_url text, -- URL del diseño generado por IA o subido
  price_at_purchase numeric not null
);

-- --- FIX AVANZADO: REPARAR CLAVES FORÁNEAS (CASCADE DELETE) ---
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'order_items'
          AND ccu.table_name = 'products'
    LOOP
        EXECUTE 'ALTER TABLE public.order_items DROP CONSTRAINT "' || r.constraint_name || '"';
    END LOOP;
END $$;

ALTER TABLE public.order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id)
ON DELETE CASCADE;
-- -------------------------------------------------------------

-- HABILITAR ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- POLÍTICAS DE SEGURIDAD (POLICIES)

-- Profiles:
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Products:
drop policy if exists "Products are viewable by everyone" on public.products;
create policy "Products are viewable by everyone" on public.products for select using (true);

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products" on public.products for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products" on public.products for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products" on public.products for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Orders:
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);

drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders" on public.orders for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Users can create orders" on public.orders;
create policy "Users can create orders" on public.orders for insert with check (auth.uid() = user_id);

-- NUEVA POLÍTICA IMPORTANTE: Permitir al usuario actualizar su pedido (para marcarlo como pagado)
drop policy if exists "Users can update own orders" on public.orders;
create policy "Users can update own orders" on public.orders for update using (auth.uid() = user_id);

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders" on public.orders for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders" on public.orders for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Order Items:
drop policy if exists "Users can view own order items" on public.order_items;
create policy "Users can view own order items" on public.order_items for select using (
  exists ( select 1 from public.orders where public.orders.id = public.order_items.order_id and public.orders.user_id = auth.uid() )
);

drop policy if exists "Admins can view all order items" on public.order_items;
create policy "Admins can view all order items" on public.order_items for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Users can insert order items" on public.order_items;
create policy "Users can insert order items" on public.order_items for insert with check (
  exists ( select 1 from public.orders where public.orders.id = public.order_items.order_id and public.orders.user_id = auth.uid() )
);

drop policy if exists "Admins can delete order items" on public.order_items;
create policy "Admins can delete order items" on public.order_items for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- STORAGE SETUP
insert into storage.buckets (id, name, public) values ('products', 'products', true) ON CONFLICT DO NOTHING;
insert into storage.buckets (id, name, public) values ('designs', 'designs', true) ON CONFLICT DO NOTHING;

-- Storage Policies
drop policy if exists "Public Access Products" on storage.objects;
create policy "Public Access Products" on storage.objects for select using ( bucket_id = 'products' );

drop policy if exists "Public Access Designs" on storage.objects;
create policy "Public Access Designs" on storage.objects for select using ( bucket_id = 'designs' );

drop policy if exists "Auth Users Upload Designs" on storage.objects;
create policy "Auth Users Upload Designs" on storage.objects for insert with check (
  bucket_id = 'designs' and auth.role() = 'authenticated'
);

-- TRIGGER PARA CREAR PERFIL AUTOMATICAMENTE
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url', 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
--  NUEVAS FUNCIONALIDADES (AGREGADOS PARA COMPLETAR EL E-COMMERCE)
-- ==============================================================================

-- 5. TABLA: CATEGORÍAS
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique,
  parent_id uuid references public.categories(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Actualizar Products para incluir Categoría
alter table public.products add column if not exists category_id uuid references public.categories(id);

-- 6. TABLA: DIRECCIONES (ADDRESSES)
-- Permite al usuario guardar múltiples direcciones
create table if not exists public.addresses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  country text default 'Argentina',
  state text,
  city text,
  zip_code text,
  address_line text not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. TABLA: RESEÑAS (REVIEWS)
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  product_id uuid references public.products(id) on delete cascade not null,
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. TABLA: CUPONES (COUPONS)
create table if not exists public.coupons (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  discount_type text check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null,
  expires_at timestamp with time zone,
  usage_limit integer,
  used_count integer default 0,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. TABLA: ENVÍOS (SHIPMENTS)
-- Para seguimiento detallado fuera de la tabla orders
create table if not exists public.shipments (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  carrier text, -- Ej: Correo Argentino, Andreani
  tracking_number text,
  status text default 'processing',
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. TABLA: NOTIFICACIONES
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  link text, -- Url opcional a donde ir al hacer click
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. TABLA: LOGS DE INVENTARIO
create table if not exists public.inventory_logs (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade,
  change integer not null, -- ej: -1 (venta), +10 (reposición)
  reason text, -- ej: 'venta #123', 'reposición manual'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- HABILITAR RLS EN NUEVAS TABLAS
alter table public.categories enable row level security;
alter table public.addresses enable row level security;
alter table public.reviews enable row level security;
alter table public.coupons enable row level security;
alter table public.shipments enable row level security;
alter table public.notifications enable row level security;
alter table public.inventory_logs enable row level security;

-- POLÍTICAS NUEVAS

-- Categories: Visible para todos, admin edita
create policy "Categories viewable by everyone" on public.categories for select using (true);
create policy "Admins manage categories" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Addresses: Usuario ve y edita las suyas
create policy "Users manage own addresses" on public.addresses for all using (auth.uid() = user_id);

-- Reviews: Todos ven, usuarios crean las suyas
create policy "Reviews viewable by everyone" on public.reviews for select using (true);
create policy "Users create reviews" on public.reviews for insert with check (auth.uid() = user_id);
-- Opcional: Solo permitir review si compró el producto (lógica de app o policy avanzada)

-- Coupons: Todos leen (para validar), admin edita
create policy "Coupons viewable by everyone" on public.coupons for select using (true);
create policy "Admins manage coupons" on public.coupons for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Shipments: Usuario ve los suyos (via order), admin todo
create policy "Users view own shipments" on public.shipments for select using (
  exists (select 1 from public.orders where public.orders.id = public.shipments.order_id and public.orders.user_id = auth.uid())
);
create policy "Admins manage shipments" on public.shipments for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Notifications: Usuario ve las suyas
create policy "Users manage own notifications" on public.notifications for all using (auth.uid() = user_id);

-- Inventory Logs: Solo Admin
create policy "Admins view inventory logs" on public.inventory_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- VISTAS ÚTILES
create or replace view public.total_sales_stats as
select
  date(created_at) as day,
  sum(total_amount) as total_revenue,
  count(id) as total_orders
from public.orders
where status = 'paid' or status = 'shipped'
group by date(created_at);