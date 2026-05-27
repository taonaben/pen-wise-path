-- 003_add_multi_species_support.sql
-- Adds livestock species and breed reference data while keeping animals.breed
-- for temporary compatibility with existing app code/data.

create table if not exists public.animal_species (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.animal_breeds (
  id uuid primary key default gen_random_uuid(),
  species_id uuid not null references public.animal_species(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (species_id, slug)
);

insert into public.animal_species (name, slug, description)
values
  ('Cattle', 'cattle', 'Cattle used for pen fattening and beef production.'),
  ('Pigs', 'pigs', 'Pigs managed for livestock fattening.'),
  ('Goats', 'goats', 'Goats managed for livestock fattening.')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  updated_at = now();

with seed_breeds(species_slug, name, slug, description) as (
  values
    ('cattle', 'Brahman', 'brahman', 'Cattle breed.'),
    ('cattle', 'Angus', 'angus', 'Cattle breed.'),
    ('cattle', 'Hereford', 'hereford', 'Cattle breed.'),
    ('cattle', 'Mashona', 'mashona', 'Cattle breed.'),
    ('cattle', 'Boran', 'boran', 'Cattle breed.'),
    ('cattle', 'Afrikaner', 'afrikaner', 'Cattle breed.'),
    ('pigs', 'Large White', 'large-white', 'Pig breed.'),
    ('pigs', 'Landrace', 'landrace', 'Pig breed.'),
    ('pigs', 'Duroc', 'duroc', 'Pig breed.'),
    ('pigs', 'Hampshire', 'hampshire', 'Pig breed.'),
    ('pigs', 'Indigenous', 'indigenous', 'Locally adapted pig breed.'),
    ('goats', 'Boer', 'boer', 'Goat breed.'),
    ('goats', 'Kalahari Red', 'kalahari-red', 'Goat breed.'),
    ('goats', 'Savanna', 'savanna', 'Goat breed.'),
    ('goats', 'Indigenous', 'indigenous', 'Locally adapted goat breed.')
)
insert into public.animal_breeds (species_id, name, slug, description)
select s.id, b.name, b.slug, b.description
from seed_breeds b
join public.animal_species s on s.slug = b.species_slug
on conflict (species_id, slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  updated_at = now();

alter table public.animals add column if not exists species_id uuid;
alter table public.animals add column if not exists breed_id uuid;
alter table public.animals add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.animals a
set species_id = s.id
from public.animal_species s
where s.slug = 'cattle'
  and a.species_id is null;

update public.animals a
set breed_id = b.id
from public.animal_species s
join public.animal_breeds b on b.species_id = s.id
where s.slug = 'cattle'
  and a.breed_id is null
  and a.breed is not null
  and lower(regexp_replace(a.breed, '[^a-zA-Z0-9]+', '-', 'g')) = b.slug;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'animals_species_id_fkey'
      and conrelid = 'public.animals'::regclass
  ) then
    alter table public.animals
      add constraint animals_species_id_fkey
      foreign key (species_id) references public.animal_species(id) on delete restrict;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'animals_breed_id_fkey'
      and conrelid = 'public.animals'::regclass
  ) then
    alter table public.animals
      add constraint animals_breed_id_fkey
      foreign key (breed_id) references public.animal_breeds(id) on delete set null;
  end if;
end $$;

alter table public.animals alter column species_id set not null;

create index if not exists idx_animal_species_active_slug on public.animal_species(is_active, slug);
create index if not exists idx_animal_breeds_species_id on public.animal_breeds(species_id);
create index if not exists idx_animal_breeds_active_slug on public.animal_breeds(is_active, slug);
create index if not exists idx_animals_species_id on public.animals(species_id);
create index if not exists idx_animals_breed_id on public.animals(breed_id);

grant select on public.animal_species to authenticated;
grant select on public.animal_breeds to authenticated;
