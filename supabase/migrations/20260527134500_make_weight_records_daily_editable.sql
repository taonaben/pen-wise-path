-- 006_make_weight_records_daily_editable.sql
-- Makes each animal/date weight entry editable through upsert-based bulk weighing.

alter table public.weight_records add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from public.weight_records
    group by farm_id, animal_id, recorded_at
    having count(*) > 1
  ) then
    raise exception 'Duplicate weight_records exist for the same farm_id, animal_id, and recorded_at. Resolve duplicates before adding daily uniqueness.';
  end if;
end $$;

create unique index if not exists idx_weight_records_one_per_animal_day
  on public.weight_records(farm_id, animal_id, recorded_at);
