-- Configurable profitability normalization factors per farm and per species.

create table if not exists public.report_normalization_factors (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  species_id uuid references public.animal_species(id) on delete cascade,
  carcass_to_live_ratio numeric(8,4) not null default 0.6200,
  per_head_to_live_factor numeric(8,4) not null default 1.0000,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (carcass_to_live_ratio > 0 and carcass_to_live_ratio <= 1.5),
  check (per_head_to_live_factor > 0 and per_head_to_live_factor <= 10)
);

create unique index if not exists idx_report_norm_factor_farm_species_active
  on public.report_normalization_factors (
    farm_id,
    coalesce(species_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where is_active = true;

create index if not exists idx_report_norm_factor_farm on public.report_normalization_factors(farm_id);

alter table public.report_normalization_factors enable row level security;

drop policy if exists "members select report normalization factors" on public.report_normalization_factors;
drop policy if exists "managers insert report normalization factors" on public.report_normalization_factors;
drop policy if exists "managers update report normalization factors" on public.report_normalization_factors;
drop policy if exists "managers delete report normalization factors" on public.report_normalization_factors;

create policy "members select report normalization factors"
  on public.report_normalization_factors
  for select
  using (public.is_farm_member(farm_id));

create policy "managers insert report normalization factors"
  on public.report_normalization_factors
  for insert
  with check (public.is_farm_manager(farm_id));

create policy "managers update report normalization factors"
  on public.report_normalization_factors
  for update
  using (public.is_farm_manager(farm_id));

create policy "managers delete report normalization factors"
  on public.report_normalization_factors
  for delete
  using (public.is_farm_manager(farm_id));

grant select, insert, update, delete on public.report_normalization_factors to authenticated;
