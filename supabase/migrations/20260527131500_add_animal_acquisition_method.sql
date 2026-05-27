-- 004_add_animal_acquisition_method.sql
-- Supports animals bred in-house entering the fattening workflow.

alter table public.animals add column if not exists acquisition_method text not null default 'purchased';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'animals_acquisition_method_check'
      and conrelid = 'public.animals'::regclass
  ) then
    alter table public.animals
      add constraint animals_acquisition_method_check
      check (acquisition_method in ('purchased', 'bred_in_house'));
  end if;
end $$;

create index if not exists idx_animals_acquisition_method on public.animals(acquisition_method);
