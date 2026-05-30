-- Adds AI health assessment runs/results and extends manual health events.

create table if not exists public.health_assessment_runs (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  run_type text not null default 'manual',
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  engine_version text not null default 'health-assessment-v1',
  metadata jsonb not null default '{}'::jsonb,
  notes text
);

create table if not exists public.health_assessments (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  assessment_run_id uuid not null references public.health_assessment_runs(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  health_status text not null,
  health_score integer not null,
  risk_level text not null,
  confidence_score numeric(5,4) not null default 0,
  confidence_label text not null default 'Low',
  summary text not null,
  recommended_action text not null,
  source text not null default 'rule_based',
  engine_version text not null default 'health-assessment-v1',
  signals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'health_assessment_runs_run_type_check'
      and conrelid = 'public.health_assessment_runs'::regclass
  ) then
    alter table public.health_assessment_runs
      add constraint health_assessment_runs_run_type_check
      check (run_type in ('manual', 'scheduled', 'single_animal'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'health_assessment_runs_status_check'
      and conrelid = 'public.health_assessment_runs'::regclass
  ) then
    alter table public.health_assessment_runs
      add constraint health_assessment_runs_status_check
      check (status in ('running', 'completed', 'failed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'health_assessments_health_status_check'
      and conrelid = 'public.health_assessments'::regclass
  ) then
    alter table public.health_assessments
      add constraint health_assessments_health_status_check
      check (health_status in ('healthy', 'watch', 'at_risk', 'critical'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'health_assessments_risk_level_check'
      and conrelid = 'public.health_assessments'::regclass
  ) then
    alter table public.health_assessments
      add constraint health_assessments_risk_level_check
      check (risk_level in ('low', 'medium', 'high', 'critical'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'health_assessments_health_score_check'
      and conrelid = 'public.health_assessments'::regclass
  ) then
    alter table public.health_assessments
      add constraint health_assessments_health_score_check
      check (health_score >= 0 and health_score <= 100);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'health_assessments_confidence_score_check'
      and conrelid = 'public.health_assessments'::regclass
  ) then
    alter table public.health_assessments
      add constraint health_assessments_confidence_score_check
      check (confidence_score >= 0 and confidence_score <= 1);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'health_assessments_confidence_label_check'
      and conrelid = 'public.health_assessments'::regclass
  ) then
    alter table public.health_assessments
      add constraint health_assessments_confidence_label_check
      check (confidence_label in ('High', 'Medium', 'Low'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'health_assessments_source_check'
      and conrelid = 'public.health_assessments'::regclass
  ) then
    alter table public.health_assessments
      add constraint health_assessments_source_check
      check (source in ('rule_based', 'statistical', 'ml_model', 'manual'));
  end if;
end $$;

alter table public.health_events add column if not exists observed_at date;
alter table public.health_events add column if not exists symptoms text;
alter table public.health_events add column if not exists diagnosis_note text;
alter table public.health_events add column if not exists treatment_given text;
alter table public.health_events add column if not exists treated_by text;
alter table public.health_events add column if not exists recovery_notes text;
alter table public.health_events add column if not exists resolved_at timestamptz;

update public.health_events
set observed_at = event_date
where observed_at is null;

alter table public.health_events
  alter column observed_at set not null;

-- Keep backward compatibility by supporting existing 'monitoring' alongside newer states.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'health_events_status_check'
      and conrelid = 'public.health_events'::regclass
  ) then
    alter table public.health_events drop constraint health_events_status_check;
  end if;
end $$;

alter table public.health_events
  add constraint health_events_status_check
  check (status in ('open', 'monitoring', 'under_treatment', 'recovering', 'resolved'));

-- Enforce requested event types on new rows without breaking historical data.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'health_events_event_type_check'
      and conrelid = 'public.health_events'::regclass
  ) then
    alter table public.health_events
      add constraint health_events_event_type_check
      check (event_type in ('observation', 'illness', 'injury', 'treatment', 'vaccination', 'deworming', 'inspection', 'recovery', 'other'))
      not valid;
  end if;
end $$;

create unique index if not exists idx_health_assessments_run_animal
  on public.health_assessments(assessment_run_id, animal_id);
create index if not exists idx_health_assessment_runs_farm_started
  on public.health_assessment_runs(farm_id, started_at desc);
create index if not exists idx_health_assessment_runs_status
  on public.health_assessment_runs(farm_id, status);
create index if not exists idx_health_assessments_farm_created
  on public.health_assessments(farm_id, created_at desc);
create index if not exists idx_health_assessments_animal_created
  on public.health_assessments(animal_id, created_at desc);
create index if not exists idx_health_assessments_status
  on public.health_assessments(farm_id, health_status);
create index if not exists idx_health_events_observed_at
  on public.health_events(farm_id, observed_at desc);

alter table public.health_assessment_runs enable row level security;
alter table public.health_assessments enable row level security;

drop policy if exists "members select health_assessment_runs" on public.health_assessment_runs;
drop policy if exists "members insert health_assessment_runs" on public.health_assessment_runs;
drop policy if exists "managers update health_assessment_runs" on public.health_assessment_runs;
drop policy if exists "managers delete health_assessment_runs" on public.health_assessment_runs;
create policy "members select health_assessment_runs"
  on public.health_assessment_runs for select using (public.is_farm_member(farm_id));
create policy "members insert health_assessment_runs"
  on public.health_assessment_runs for insert with check (public.is_farm_member(farm_id));
create policy "managers update health_assessment_runs"
  on public.health_assessment_runs for update using (public.is_farm_manager(farm_id));
create policy "managers delete health_assessment_runs"
  on public.health_assessment_runs for delete using (public.is_farm_manager(farm_id));

drop policy if exists "members select health_assessments" on public.health_assessments;
drop policy if exists "members insert health_assessments" on public.health_assessments;
drop policy if exists "managers update health_assessments" on public.health_assessments;
drop policy if exists "managers delete health_assessments" on public.health_assessments;
create policy "members select health_assessments"
  on public.health_assessments for select using (public.is_farm_member(farm_id));
create policy "members insert health_assessments"
  on public.health_assessments for insert with check (public.is_farm_member(farm_id));
create policy "managers update health_assessments"
  on public.health_assessments for update using (public.is_farm_manager(farm_id));
create policy "managers delete health_assessments"
  on public.health_assessments for delete using (public.is_farm_manager(farm_id));

grant select, insert, update, delete on public.health_assessment_runs to authenticated;
grant select, insert, update, delete on public.health_assessments to authenticated;
