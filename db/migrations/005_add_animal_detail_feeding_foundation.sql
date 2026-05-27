-- 005_add_animal_detail_feeding_foundation.sql
-- Adds pen/group feeding, per-animal feed allocations, and light health events.

alter table public.feed_types add column if not exists species_id uuid references public.animal_species(id) on delete set null;
alter table public.feed_types add column if not exists dry_matter_percentage numeric(5,2);

create table if not exists public.pens (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  species_id uuid references public.animal_species(id) on delete set null,
  capacity integer,
  status text not null default 'active' check (status in ('active', 'inactive', 'maintenance')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, name)
);

create table if not exists public.animal_pen_assignments (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  pen_id uuid not null references public.pens(id) on delete cascade,
  started_at date not null default current_date,
  ended_at date,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create table if not exists public.feeding_events (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  pen_id uuid references public.pens(id) on delete set null,
  feed_type_id uuid references public.feed_types(id) on delete set null,
  feeding_method text not null check (feeding_method in ('individual', 'pen_group', 'custom_group')),
  quantity_kg numeric(10,2) not null check (quantity_kg > 0),
  feeding_date date not null,
  allocation_method text not null default 'equal_per_animal' check (allocation_method in ('equal_per_animal', 'by_weight_percentage', 'manual')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feeding_event_animals (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  feeding_event_id uuid not null references public.feeding_events(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  allocated_quantity_kg numeric(10,2) not null check (allocated_quantity_kg >= 0),
  allocated_cost numeric(12,2) not null default 0 check (allocated_cost >= 0),
  created_at timestamptz not null default now(),
  unique (feeding_event_id, animal_id)
);

create table if not exists public.health_events (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  event_date date not null,
  event_type text not null default 'observation',
  severity text not null default 'low' check (severity in ('low', 'medium', 'high', 'critical')),
  title text not null,
  notes text,
  treatment text,
  status text not null default 'open' check (status in ('open', 'monitoring', 'resolved')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_animal_pen_assignments_one_active
  on public.animal_pen_assignments(animal_id)
  where ended_at is null;

create index if not exists idx_feed_types_species_id on public.feed_types(species_id);
create index if not exists idx_pens_farm_id on public.pens(farm_id);
create index if not exists idx_pens_species_id on public.pens(species_id);
create index if not exists idx_animal_pen_assignments_farm_id on public.animal_pen_assignments(farm_id);
create index if not exists idx_animal_pen_assignments_animal_id on public.animal_pen_assignments(animal_id);
create index if not exists idx_animal_pen_assignments_pen_id on public.animal_pen_assignments(pen_id);
create index if not exists idx_feeding_events_farm_id on public.feeding_events(farm_id);
create index if not exists idx_feeding_events_pen_id on public.feeding_events(pen_id);
create index if not exists idx_feeding_events_feeding_date on public.feeding_events(feeding_date);
create index if not exists idx_feeding_event_animals_farm_id on public.feeding_event_animals(farm_id);
create index if not exists idx_feeding_event_animals_animal_id on public.feeding_event_animals(animal_id);
create index if not exists idx_feeding_event_animals_event_id on public.feeding_event_animals(feeding_event_id);
create index if not exists idx_health_events_farm_id on public.health_events(farm_id);
create index if not exists idx_health_events_animal_id on public.health_events(animal_id);
create index if not exists idx_health_events_event_date on public.health_events(event_date);

alter table public.pens enable row level security;
alter table public.animal_pen_assignments enable row level security;
alter table public.feeding_events enable row level security;
alter table public.feeding_event_animals enable row level security;
alter table public.health_events enable row level security;

drop policy if exists "members select pens" on public.pens;
drop policy if exists "members insert pens" on public.pens;
drop policy if exists "managers update pens" on public.pens;
drop policy if exists "managers delete pens" on public.pens;
create policy "members select pens" on public.pens for select using (public.is_farm_member(farm_id));
create policy "members insert pens" on public.pens for insert with check (public.is_farm_member(farm_id));
create policy "managers update pens" on public.pens for update using (public.is_farm_manager(farm_id));
create policy "managers delete pens" on public.pens for delete using (public.is_farm_manager(farm_id));

drop policy if exists "members select animal_pen_assignments" on public.animal_pen_assignments;
drop policy if exists "members insert animal_pen_assignments" on public.animal_pen_assignments;
drop policy if exists "managers update animal_pen_assignments" on public.animal_pen_assignments;
drop policy if exists "managers delete animal_pen_assignments" on public.animal_pen_assignments;
create policy "members select animal_pen_assignments" on public.animal_pen_assignments for select using (public.is_farm_member(farm_id));
create policy "members insert animal_pen_assignments" on public.animal_pen_assignments for insert with check (public.is_farm_member(farm_id));
create policy "managers update animal_pen_assignments" on public.animal_pen_assignments for update using (public.is_farm_manager(farm_id));
create policy "managers delete animal_pen_assignments" on public.animal_pen_assignments for delete using (public.is_farm_manager(farm_id));

drop policy if exists "members select feeding_events" on public.feeding_events;
drop policy if exists "members insert feeding_events" on public.feeding_events;
drop policy if exists "managers update feeding_events" on public.feeding_events;
drop policy if exists "managers delete feeding_events" on public.feeding_events;
create policy "members select feeding_events" on public.feeding_events for select using (public.is_farm_member(farm_id));
create policy "members insert feeding_events" on public.feeding_events for insert with check (public.is_farm_member(farm_id));
create policy "managers update feeding_events" on public.feeding_events for update using (public.is_farm_manager(farm_id));
create policy "managers delete feeding_events" on public.feeding_events for delete using (public.is_farm_manager(farm_id));

drop policy if exists "members select feeding_event_animals" on public.feeding_event_animals;
drop policy if exists "members insert feeding_event_animals" on public.feeding_event_animals;
drop policy if exists "managers update feeding_event_animals" on public.feeding_event_animals;
drop policy if exists "managers delete feeding_event_animals" on public.feeding_event_animals;
create policy "members select feeding_event_animals" on public.feeding_event_animals for select using (public.is_farm_member(farm_id));
create policy "members insert feeding_event_animals" on public.feeding_event_animals for insert with check (public.is_farm_member(farm_id));
create policy "managers update feeding_event_animals" on public.feeding_event_animals for update using (public.is_farm_manager(farm_id));
create policy "managers delete feeding_event_animals" on public.feeding_event_animals for delete using (public.is_farm_manager(farm_id));

drop policy if exists "members select health_events" on public.health_events;
drop policy if exists "members insert health_events" on public.health_events;
drop policy if exists "managers update health_events" on public.health_events;
drop policy if exists "managers delete health_events" on public.health_events;
create policy "members select health_events" on public.health_events for select using (public.is_farm_member(farm_id));
create policy "members insert health_events" on public.health_events for insert with check (public.is_farm_member(farm_id));
create policy "managers update health_events" on public.health_events for update using (public.is_farm_manager(farm_id));
create policy "managers delete health_events" on public.health_events for delete using (public.is_farm_manager(farm_id));

grant select, insert, update, delete on public.pens to authenticated;
grant select, insert, update, delete on public.animal_pen_assignments to authenticated;
grant select, insert, update, delete on public.feeding_events to authenticated;
grant select, insert, update, delete on public.feeding_event_animals to authenticated;
grant select, insert, update, delete on public.health_events to authenticated;
