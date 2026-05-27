-- 001_create_core_schema.sql
-- PenSmart core schema. Apply manually via psql or Supabase SQL editor
-- when you have provisioned your own Supabase project.

create extension if not exists "pgcrypto";

create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farm_members (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'worker' check (role in ('owner', 'manager', 'worker')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, user_id)
);

create table if not exists public.animals (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  tag_number text not null,
  breed text,
  sex text check (sex in ('male', 'female')),
  purchase_date date not null,
  purchase_weight_kg numeric(10,2) not null,
  purchase_price numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'sold', 'sick', 'removed', 'dead')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, tag_number)
);

create table if not exists public.weight_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  weight_kg numeric(10,2) not null,
  recorded_at date not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.feed_types (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  cost_per_kg numeric(12,2) not null default 0,
  protein_percentage numeric(5,2),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, name)
);

create table if not exists public.feed_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  feed_type_id uuid references public.feed_types(id) on delete set null,
  quantity_kg numeric(10,2) not null,
  feeding_date date not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.market_prices (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  price_per_kg numeric(12,2) not null,
  recorded_at date not null,
  source text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete restrict,
  sale_weight_kg numeric(10,2) not null,
  price_per_kg numeric(12,2) not null,
  total_amount numeric(12,2) not null,
  sold_at date not null,
  buyer_name text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid references public.animals(id) on delete cascade,
  alert_type text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  title text not null,
  message text not null,
  resolved boolean not null default false,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_farm_members_farm_id on public.farm_members(farm_id);
create index if not exists idx_farm_members_user_id on public.farm_members(user_id);
create index if not exists idx_animals_farm_id on public.animals(farm_id);
create index if not exists idx_animals_status on public.animals(status);
create index if not exists idx_weight_records_farm_id on public.weight_records(farm_id);
create index if not exists idx_weight_records_animal_id on public.weight_records(animal_id);
create index if not exists idx_weight_records_recorded_at on public.weight_records(recorded_at);
create index if not exists idx_feed_records_farm_id on public.feed_records(farm_id);
create index if not exists idx_feed_records_animal_id on public.feed_records(animal_id);
create index if not exists idx_feed_records_feeding_date on public.feed_records(feeding_date);
create index if not exists idx_market_prices_farm_id on public.market_prices(farm_id);
create index if not exists idx_alerts_farm_id on public.alerts(farm_id);
create index if not exists idx_audit_logs_farm_id on public.audit_logs(farm_id);

grant select, insert, update, delete on public.farms to authenticated;
grant select, insert, update, delete on public.farm_members to authenticated;
grant select, insert, update, delete on public.animals to authenticated;
grant select, insert, update, delete on public.weight_records to authenticated;
grant select, insert, update, delete on public.feed_types to authenticated;
grant select, insert, update, delete on public.feed_records to authenticated;
grant select, insert, update, delete on public.market_prices to authenticated;
grant select, insert, update, delete on public.sales_records to authenticated;
grant select, insert, update, delete on public.alerts to authenticated;
grant select, insert on public.audit_logs to authenticated;
