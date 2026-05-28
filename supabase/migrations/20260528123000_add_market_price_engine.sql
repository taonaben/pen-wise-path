-- Adds market sources and richer market price records for selling predictions.

create table if not exists public.market_sources (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  source_type text not null default 'other',
  location text,
  contact_name text,
  contact_phone text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, name)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'market_sources_source_type_check'
      and conrelid = 'public.market_sources'::regclass
  ) then
    alter table public.market_sources
      add constraint market_sources_source_type_check
      check (source_type in ('auction', 'abattoir', 'butcher', 'private_buyer', 'market_board', 'online', 'other'));
  end if;
end $$;

alter table public.market_prices add column if not exists species_id uuid;
alter table public.market_prices add column if not exists market_source_id uuid;
alter table public.market_prices add column if not exists currency text;
alter table public.market_prices add column if not exists price_basis text;
alter table public.market_prices add column if not exists quality_grade text;
alter table public.market_prices add column if not exists weight_min_kg numeric(10,2);
alter table public.market_prices add column if not exists weight_max_kg numeric(10,2);

insert into public.market_sources (farm_id, name, source_type, created_by)
select distinct
  mp.farm_id,
  coalesce(nullif(trim(mp.source), ''), 'Unspecified Source') as name,
  'other',
  mp.created_by
from public.market_prices mp
where mp.source is not null
on conflict (farm_id, name) do nothing;

insert into public.market_sources (farm_id, name, source_type)
select distinct mp.farm_id, 'Unspecified Source', 'other'
from public.market_prices mp
where not exists (
  select 1
  from public.market_sources ms
  where ms.farm_id = mp.farm_id
    and ms.name = 'Unspecified Source'
)
on conflict (farm_id, name) do nothing;

update public.market_prices mp
set market_source_id = ms.id
from public.market_sources ms
where ms.farm_id = mp.farm_id
  and ms.name = coalesce(nullif(trim(mp.source), ''), 'Unspecified Source')
  and mp.market_source_id is null;

update public.market_prices mp
set species_id = s.id
from public.animal_species s
where s.slug = 'cattle'
  and mp.species_id is null;

update public.market_prices
set currency = 'USD'
where currency is null;

update public.market_prices
set price_basis = 'live_weight'
where price_basis is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'market_prices_species_id_fkey'
      and conrelid = 'public.market_prices'::regclass
  ) then
    alter table public.market_prices
      add constraint market_prices_species_id_fkey
      foreign key (species_id) references public.animal_species(id) on delete restrict;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'market_prices_market_source_id_fkey'
      and conrelid = 'public.market_prices'::regclass
  ) then
    alter table public.market_prices
      add constraint market_prices_market_source_id_fkey
      foreign key (market_source_id) references public.market_sources(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'market_prices_price_basis_check'
      and conrelid = 'public.market_prices'::regclass
  ) then
    alter table public.market_prices
      add constraint market_prices_price_basis_check
      check (price_basis in ('live_weight', 'carcass_weight', 'per_head'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'market_prices_price_per_kg_positive_check'
      and conrelid = 'public.market_prices'::regclass
  ) then
    alter table public.market_prices
      add constraint market_prices_price_per_kg_positive_check
      check (price_per_kg > 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'market_prices_weight_range_check'
      and conrelid = 'public.market_prices'::regclass
  ) then
    alter table public.market_prices
      add constraint market_prices_weight_range_check
      check (
        weight_min_kg is null
        or weight_max_kg is null
        or weight_min_kg <= weight_max_kg
      );
  end if;
end $$;

alter table public.market_prices alter column currency set not null;
alter table public.market_prices alter column price_basis set not null;

create index if not exists idx_market_sources_farm_id on public.market_sources(farm_id);
create index if not exists idx_market_sources_active on public.market_sources(farm_id, is_active);
create index if not exists idx_market_prices_species_id on public.market_prices(species_id);
create index if not exists idx_market_prices_market_source_id on public.market_prices(market_source_id);
create index if not exists idx_market_prices_recorded_at on public.market_prices(recorded_at);
create index if not exists idx_market_prices_basis_currency on public.market_prices(price_basis, currency);

alter table public.market_sources enable row level security;

drop policy if exists "members select market_sources" on public.market_sources;
drop policy if exists "members insert market_sources" on public.market_sources;
drop policy if exists "managers update market_sources" on public.market_sources;
drop policy if exists "managers delete market_sources" on public.market_sources;
create policy "members select market_sources" on public.market_sources for select using (public.is_farm_member(farm_id));
create policy "members insert market_sources" on public.market_sources for insert with check (public.is_farm_member(farm_id));
create policy "managers update market_sources" on public.market_sources for update using (public.is_farm_manager(farm_id));
create policy "managers delete market_sources" on public.market_sources for delete using (public.is_farm_manager(farm_id));

grant select, insert, update, delete on public.market_sources to authenticated;
