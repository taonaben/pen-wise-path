-- Adds stock-led feed inventory foundation: feed batches + movement ledger + richer feed master fields.

alter table public.feed_types
  add column if not exists category text not null default 'other'
    check (category in ('concentrate', 'roughage', 'silage', 'hay', 'supplement', 'mineral', 'mixed_ration', 'other')),
  add column if not exists description text,
  add column if not exists crude_fiber_percentage numeric(5,2),
  add column if not exists energy_me_mj_per_kg numeric(6,2),
  add column if not exists fat_percentage numeric(5,2),
  add column if not exists calcium_percentage numeric(5,2),
  add column if not exists phosphorus_percentage numeric(5,2),
  add column if not exists low_stock_threshold_kg numeric(10,2) not null default 0,
  add column if not exists is_active boolean not null default true;

create table if not exists public.feed_batches (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  feed_type_id uuid not null references public.feed_types(id) on delete cascade,
  batch_number text,
  supplier_name text,
  purchase_date date not null,
  expiry_date date,
  initial_quantity_kg numeric(10,2) not null check (initial_quantity_kg > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  total_cost numeric(14,2) generated always as (initial_quantity_kg * unit_cost) stored,
  storage_location text,
  nutrition_snapshot jsonb not null default '{}'::jsonb,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expiry_date is null or expiry_date >= purchase_date)
);

create table if not exists public.feed_movements (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  feed_type_id uuid not null references public.feed_types(id) on delete cascade,
  feed_batch_id uuid references public.feed_batches(id) on delete set null,
  movement_type text not null check (
    movement_type in (
      'purchase',
      'feeding',
      'adjustment_in',
      'adjustment_out',
      'spoilage',
      'transfer_in',
      'transfer_out',
      'return'
    )
  ),
  quantity_kg numeric(10,2) not null check (quantity_kg <> 0),
  unit_cost numeric(12,2),
  total_cost numeric(14,2),
  movement_date date not null,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (movement_type in ('purchase', 'adjustment_in', 'transfer_in', 'return') and quantity_kg > 0)
    or (movement_type in ('feeding', 'adjustment_out', 'spoilage', 'transfer_out') and quantity_kg < 0)
  )
);

create index if not exists idx_feed_types_category on public.feed_types(category);
create index if not exists idx_feed_types_is_active on public.feed_types(is_active);
create index if not exists idx_feed_batches_farm_id on public.feed_batches(farm_id);
create index if not exists idx_feed_batches_feed_type_id on public.feed_batches(feed_type_id);
create index if not exists idx_feed_batches_expiry_date on public.feed_batches(expiry_date);
create index if not exists idx_feed_batches_purchase_date on public.feed_batches(purchase_date);
create index if not exists idx_feed_movements_farm_id on public.feed_movements(farm_id);
create index if not exists idx_feed_movements_feed_type_id on public.feed_movements(feed_type_id);
create index if not exists idx_feed_movements_feed_batch_id on public.feed_movements(feed_batch_id);
create index if not exists idx_feed_movements_movement_date on public.feed_movements(movement_date);
create index if not exists idx_feed_movements_movement_type on public.feed_movements(movement_type);

alter table public.feed_batches enable row level security;
alter table public.feed_movements enable row level security;

drop policy if exists "members select feed_batches" on public.feed_batches;
drop policy if exists "members insert feed_batches" on public.feed_batches;
drop policy if exists "managers update feed_batches" on public.feed_batches;
drop policy if exists "managers delete feed_batches" on public.feed_batches;
create policy "members select feed_batches" on public.feed_batches for select using (public.is_farm_member(farm_id));
create policy "members insert feed_batches" on public.feed_batches for insert with check (public.is_farm_member(farm_id));
create policy "managers update feed_batches" on public.feed_batches for update using (public.is_farm_manager(farm_id));
create policy "managers delete feed_batches" on public.feed_batches for delete using (public.is_farm_manager(farm_id));

drop policy if exists "members select feed_movements" on public.feed_movements;
drop policy if exists "members insert feed_movements" on public.feed_movements;
drop policy if exists "managers update feed_movements" on public.feed_movements;
drop policy if exists "managers delete feed_movements" on public.feed_movements;
create policy "members select feed_movements" on public.feed_movements for select using (public.is_farm_member(farm_id));
create policy "members insert feed_movements" on public.feed_movements for insert with check (public.is_farm_member(farm_id));
create policy "managers update feed_movements" on public.feed_movements for update using (public.is_farm_manager(farm_id));
create policy "managers delete feed_movements" on public.feed_movements for delete using (public.is_farm_manager(farm_id));

grant select, insert, update, delete on public.feed_batches to authenticated;
grant select, insert, update, delete on public.feed_movements to authenticated;
