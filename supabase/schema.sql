-- ═══════════════════════════════════════════════════════════════
-- VITRINE DIGITAL — Schema com RLS (Row Level Security)
-- Execute no Supabase: SQL Editor > New Query
-- ═══════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Profiles (espelho do auth.users) ──────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'owner' check (role in ('owner', 'admin', 'superadmin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Usuário vê/edita apenas o próprio perfil; superadmin vê tudo
create policy "profiles_select" on public.profiles
  for select using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- ── Stores (lojas / tenants) ───────────────────────────────────
create table public.stores (
  id                uuid primary key default uuid_generate_v4(),
  slug              text unique not null,
  name              text not null,
  description       text,
  whatsapp          text not null,
  accent_color      text not null default '#C9376E',
  banner_message    text,
  banner_image_url  text,
  logo_url          text,
  owner_id          uuid not null references public.profiles(id) on delete cascade,
  active            boolean not null default true,
  plan              text not null default 'trial' check (plan in ('trial', 'basic', 'pro')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.stores enable row level security;

-- Dono vê/edita apenas a própria loja; público vê lojas ativas
create policy "stores_select_owner" on public.stores
  for select using (auth.uid() = owner_id);
create policy "stores_select_public" on public.stores
  for select using (active = true);
create policy "stores_insert" on public.stores
  for insert with check (auth.uid() = owner_id);
create policy "stores_update" on public.stores
  for update using (auth.uid() = owner_id);
create policy "stores_delete" on public.stores
  for delete using (auth.uid() = owner_id);

-- ── Products ───────────────────────────────────────────────────
create table public.products (
  id          uuid primary key default uuid_generate_v4(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  name        text not null,
  description text,
  price       numeric(10,2) not null check (price >= 0),
  category    text not null default 'Geral',
  sizes       text[] not null default '{}',
  colors      text[] not null default '{}',
  image_url   text,
  active      boolean not null default true,
  featured    boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.products enable row level security;

-- Dono gerencia produtos da própria loja; público vê produtos ativos de lojas ativas
create policy "products_select_owner" on public.products
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );
create policy "products_select_public" on public.products
  for select using (
    active = true
    and exists (select 1 from public.stores s where s.id = store_id and s.active = true)
  );
create policy "products_insert" on public.products
  for insert with check (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );
create policy "products_update" on public.products
  for update using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );
create policy "products_delete" on public.products
  for delete using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

-- ── Orders (log de pedidos) ────────────────────────────────────
create table public.orders (
  id               uuid primary key default uuid_generate_v4(),
  store_id         uuid not null references public.stores(id) on delete cascade,
  customer_name    text not null,
  customer_phone   text not null,
  customer_address text,
  items            jsonb not null default '[]',
  total            numeric(10,2) not null check (total >= 0),
  status           text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at       timestamptz not null default now()
);
alter table public.orders enable row level security;

-- Apenas o dono da loja vê os pedidos
create policy "orders_select" on public.orders
  for select using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );
-- Inserção pública (cliente faz pedido) — via service role na API
create policy "orders_insert_service" on public.orders
  for insert with check (true); -- Controlado na API route com validação

-- ── LGPD — Consent log ────────────────────────────────────────
create table public.consent_logs (
  id           uuid primary key default uuid_generate_v4(),
  store_id     uuid references public.stores(id) on delete set null,
  user_id      uuid references auth.users(id) on delete set null,
  ip_hash      text not null,  -- NUNCA armazenar IP real
  consent_type text not null check (consent_type in ('cookies_analytics', 'cookies_marketing', 'data_processing')),
  granted      boolean not null,
  created_at   timestamptz not null default now()
);
alter table public.consent_logs enable row level security;

create policy "consent_insert" on public.consent_logs
  for insert with check (true);
create policy "consent_select_owner" on public.consent_logs
  for select using (
    store_id is not null
    and exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

-- ── LGPD — Data deletion requests ─────────────────────────────
create table public.deletion_requests (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id),
  email        text not null,
  reason       text,
  status       text not null default 'pending' check (status in ('pending', 'processing', 'completed')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.deletion_requests enable row level security;

create policy "deletion_insert" on public.deletion_requests
  for insert with check (true);
create policy "deletion_select_own" on public.deletion_requests
  for select using (auth.uid() = user_id or email = (select email from auth.users where id = auth.uid()));

-- ── Função: auto-atualizar updated_at ─────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger stores_updated_at before update on public.stores for each row execute function update_updated_at();
create trigger products_updated_at before update on public.products for each row execute function update_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function update_updated_at();

-- ── Função: criar perfil ao registrar ─────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Indexes para performance ───────────────────────────────────
create index stores_slug_idx on public.stores(slug);
create index stores_owner_idx on public.stores(owner_id);
create index products_store_idx on public.products(store_id, active, sort_order);
create index products_featured_idx on public.products(store_id, featured) where featured = true;
create index orders_store_idx on public.orders(store_id, created_at desc);
