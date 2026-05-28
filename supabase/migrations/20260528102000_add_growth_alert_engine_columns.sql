-- Adds growth-engine alert metadata and duplicate prevention support.

alter table public.alerts
  add column if not exists status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed'));

alter table public.alerts
  add column if not exists detected_metric text;

alter table public.alerts
  add column if not exists expected_value numeric(12,4);

alter table public.alerts
  add column if not exists actual_value numeric(12,4);

alter table public.alerts
  add column if not exists confidence numeric(5,4) not null default 0.5 check (confidence >= 0 and confidence <= 1);

alter table public.alerts
  add column if not exists source text not null default 'manual' check (source in ('rule_based', 'statistical', 'ml_model', 'manual'));

alter table public.alerts
  add column if not exists engine_version text;

alter table public.alerts
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.alerts
  add column if not exists resolution_notes text;

alter table public.alerts
  add column if not exists last_detected_at timestamptz not null default now();

-- Backfill status from legacy resolved flag where possible.
update public.alerts
set status = case
  when resolved = true then 'resolved'
  else 'open'
end
where status is null;

create index if not exists idx_alerts_status on public.alerts(status);
create index if not exists idx_alerts_last_detected_at on public.alerts(last_detected_at desc);

with ranked_open as (
  select
    id,
    row_number() over (
      partition by farm_id, animal_id, alert_type
      order by last_detected_at desc, created_at desc
    ) as row_num
  from public.alerts
  where status = 'open'
    and animal_id is not null
)
update public.alerts a
set status = 'reviewing'
from ranked_open r
where a.id = r.id
  and r.row_num > 1;

-- Keep duplicate growth alerts clean: one open alert per farm/animal/type.
create unique index if not exists idx_alerts_open_unique_per_animal_type
  on public.alerts(farm_id, animal_id, alert_type)
  where status = 'open' and animal_id is not null;
