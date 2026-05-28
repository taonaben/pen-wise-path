-- Adds stored selling prediction runs and per-animal prediction snapshots.

create table if not exists public.prediction_runs (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  run_type text not null default 'manual',
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  engine_version text not null default 'selling-predictions-v1',
  metadata jsonb not null default '{}'::jsonb,
  notes text
);

create table if not exists public.selling_predictions (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  prediction_run_id uuid not null references public.prediction_runs(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  species_id uuid references public.animal_species(id) on delete set null,
  current_weight_kg numeric(10,2),
  average_daily_gain_kg numeric(10,4),
  current_market_price numeric(12,2),
  best_window_days integer not null default 0,
  best_sell_date date,
  predicted_weight_kg numeric(10,2),
  expected_revenue numeric(12,2),
  expected_total_cost numeric(12,2),
  expected_profit numeric(12,2),
  recommendation text not null,
  confidence_score numeric(5,4) not null default 0,
  confidence_label text not null default 'Low',
  explanation text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'prediction_runs_run_type_check'
      and conrelid = 'public.prediction_runs'::regclass
  ) then
    alter table public.prediction_runs
      add constraint prediction_runs_run_type_check
      check (run_type in ('manual', 'scheduled', 'single_animal'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'prediction_runs_status_check'
      and conrelid = 'public.prediction_runs'::regclass
  ) then
    alter table public.prediction_runs
      add constraint prediction_runs_status_check
      check (status in ('running', 'completed', 'failed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'selling_predictions_recommendation_check'
      and conrelid = 'public.selling_predictions'::regclass
  ) then
    alter table public.selling_predictions
      add constraint selling_predictions_recommendation_check
      check (recommendation in ('SELL_NOW', 'HOLD', 'WATCH', 'INSPECT_BEFORE_SELLING', 'NOT_READY'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'selling_predictions_confidence_label_check'
      and conrelid = 'public.selling_predictions'::regclass
  ) then
    alter table public.selling_predictions
      add constraint selling_predictions_confidence_label_check
      check (confidence_label in ('High', 'Medium', 'Low'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'selling_predictions_confidence_score_check'
      and conrelid = 'public.selling_predictions'::regclass
  ) then
    alter table public.selling_predictions
      add constraint selling_predictions_confidence_score_check
      check (confidence_score >= 0 and confidence_score <= 1);
  end if;
end $$;

create index if not exists idx_prediction_runs_farm_started
  on public.prediction_runs(farm_id, started_at desc);
create index if not exists idx_prediction_runs_status
  on public.prediction_runs(farm_id, status);
create index if not exists idx_selling_predictions_farm_created
  on public.selling_predictions(farm_id, created_at desc);
create index if not exists idx_selling_predictions_run
  on public.selling_predictions(prediction_run_id);
create index if not exists idx_selling_predictions_animal
  on public.selling_predictions(animal_id);
create index if not exists idx_selling_predictions_recommendation
  on public.selling_predictions(farm_id, recommendation);

alter table public.prediction_runs enable row level security;
alter table public.selling_predictions enable row level security;

drop policy if exists "members select prediction_runs" on public.prediction_runs;
drop policy if exists "members insert prediction_runs" on public.prediction_runs;
drop policy if exists "managers update prediction_runs" on public.prediction_runs;
drop policy if exists "managers delete prediction_runs" on public.prediction_runs;
create policy "members select prediction_runs" on public.prediction_runs for select using (public.is_farm_member(farm_id));
create policy "members insert prediction_runs" on public.prediction_runs for insert with check (public.is_farm_member(farm_id));
create policy "managers update prediction_runs" on public.prediction_runs for update using (public.is_farm_manager(farm_id));
create policy "managers delete prediction_runs" on public.prediction_runs for delete using (public.is_farm_manager(farm_id));

drop policy if exists "members select selling_predictions" on public.selling_predictions;
drop policy if exists "members insert selling_predictions" on public.selling_predictions;
drop policy if exists "managers update selling_predictions" on public.selling_predictions;
drop policy if exists "managers delete selling_predictions" on public.selling_predictions;
create policy "members select selling_predictions" on public.selling_predictions for select using (public.is_farm_member(farm_id));
create policy "members insert selling_predictions" on public.selling_predictions for insert with check (public.is_farm_member(farm_id));
create policy "managers update selling_predictions" on public.selling_predictions for update using (public.is_farm_manager(farm_id));
create policy "managers delete selling_predictions" on public.selling_predictions for delete using (public.is_farm_manager(farm_id));

grant select, insert, update, delete on public.prediction_runs to authenticated;
grant select, insert, update, delete on public.selling_predictions to authenticated;
