-- Upgrades sales_records into the actual sale outcome ledger.

alter table public.animals add column if not exists sold_at date;

alter table public.sales_records add column if not exists species_id uuid;
alter table public.sales_records add column if not exists buyer_contact text;
alter table public.sales_records add column if not exists price_basis text;
alter table public.sales_records add column if not exists currency text;
alter table public.sales_records add column if not exists gross_amount numeric(12,2);
alter table public.sales_records add column if not exists purchase_cost numeric(12,2);
alter table public.sales_records add column if not exists feed_cost numeric(12,2);
alter table public.sales_records add column if not exists health_cost numeric(12,2);
alter table public.sales_records add column if not exists other_cost numeric(12,2);
alter table public.sales_records add column if not exists total_cost numeric(12,2);
alter table public.sales_records add column if not exists net_profit numeric(12,2);
alter table public.sales_records add column if not exists profit_margin_percentage numeric(8,2);
alter table public.sales_records add column if not exists market_price_id uuid;
alter table public.sales_records add column if not exists prediction_id uuid;
alter table public.sales_records add column if not exists payment_status text;
alter table public.sales_records add column if not exists sale_status text;
alter table public.sales_records add column if not exists prediction_accuracy text;
alter table public.sales_records add column if not exists market_comparison_percentage numeric(8,2);
alter table public.sales_records add column if not exists voided_at timestamptz;
alter table public.sales_records add column if not exists voided_by uuid;
alter table public.sales_records add column if not exists void_reason text;
alter table public.sales_records add column if not exists metadata jsonb;
alter table public.sales_records add column if not exists updated_at timestamptz;

update public.sales_records sr
set species_id = a.species_id
from public.animals a
where sr.animal_id = a.id
  and sr.species_id is null;

update public.sales_records
set
  price_basis = coalesce(price_basis, 'live_weight'),
  currency = coalesce(currency, 'USD'),
  gross_amount = coalesce(gross_amount, total_amount),
  purchase_cost = coalesce(purchase_cost, 0),
  feed_cost = coalesce(feed_cost, 0),
  health_cost = coalesce(health_cost, 0),
  other_cost = coalesce(other_cost, 0),
  payment_status = coalesce(payment_status, 'paid'),
  sale_status = coalesce(sale_status, 'completed'),
  prediction_accuracy = coalesce(prediction_accuracy, 'not_linked'),
  metadata = coalesce(metadata, '{}'::jsonb),
  updated_at = coalesce(updated_at, created_at, now());

update public.sales_records sr
set purchase_cost = a.purchase_price
from public.animals a
where sr.animal_id = a.id
  and sr.purchase_cost = 0;

with feed_totals as (
  select animal_id, sum(allocated_cost)::numeric(12,2) as feed_cost
  from public.feeding_event_animals
  group by animal_id
)
update public.sales_records sr
set feed_cost = coalesce(ft.feed_cost, sr.feed_cost)
from feed_totals ft
where sr.animal_id = ft.animal_id;

update public.sales_records
set
  total_cost = coalesce(total_cost, purchase_cost + feed_cost + health_cost + other_cost),
  net_profit = coalesce(net_profit, gross_amount - (purchase_cost + feed_cost + health_cost + other_cost)),
  profit_margin_percentage = coalesce(
    profit_margin_percentage,
    case
      when gross_amount > 0
        then round(((gross_amount - (purchase_cost + feed_cost + health_cost + other_cost)) / gross_amount) * 100, 2)
      else null
    end
  );

update public.animals a
set sold_at = sr.sold_at
from public.sales_records sr
where sr.animal_id = a.id
  and sr.sale_status = 'completed'
  and a.sold_at is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_records_species_id_fkey'
      and conrelid = 'public.sales_records'::regclass
  ) then
    alter table public.sales_records
      add constraint sales_records_species_id_fkey
      foreign key (species_id) references public.animal_species(id) on delete restrict;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_records_market_price_id_fkey'
      and conrelid = 'public.sales_records'::regclass
  ) then
    alter table public.sales_records
      add constraint sales_records_market_price_id_fkey
      foreign key (market_price_id) references public.market_prices(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_records_prediction_id_fkey'
      and conrelid = 'public.sales_records'::regclass
  ) then
    alter table public.sales_records
      add constraint sales_records_prediction_id_fkey
      foreign key (prediction_id) references public.selling_predictions(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_records_voided_by_fkey'
      and conrelid = 'public.sales_records'::regclass
  ) then
    alter table public.sales_records
      add constraint sales_records_voided_by_fkey
      foreign key (voided_by) references auth.users(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_records_price_basis_check'
      and conrelid = 'public.sales_records'::regclass
  ) then
    alter table public.sales_records
      add constraint sales_records_price_basis_check
      check (price_basis in ('live_weight', 'carcass_weight', 'per_head'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_records_payment_status_check'
      and conrelid = 'public.sales_records'::regclass
  ) then
    alter table public.sales_records
      add constraint sales_records_payment_status_check
      check (payment_status in ('paid', 'partially_paid', 'unpaid'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_records_sale_status_check'
      and conrelid = 'public.sales_records'::regclass
  ) then
    alter table public.sales_records
      add constraint sales_records_sale_status_check
      check (sale_status in ('completed', 'voided', 'pending_payment', 'cancelled'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_records_prediction_accuracy_check'
      and conrelid = 'public.sales_records'::regclass
  ) then
    alter table public.sales_records
      add constraint sales_records_prediction_accuracy_check
      check (prediction_accuracy in ('accurate', 'close', 'overestimated', 'underestimated', 'not_linked'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_records_positive_values_check'
      and conrelid = 'public.sales_records'::regclass
  ) then
    alter table public.sales_records
      add constraint sales_records_positive_values_check
      check (
        sale_weight_kg > 0
        and price_per_kg > 0
        and total_amount >= 0
        and gross_amount >= 0
        and purchase_cost >= 0
        and feed_cost >= 0
        and health_cost >= 0
        and other_cost >= 0
        and total_cost >= 0
      );
  end if;
end $$;

alter table public.sales_records alter column price_basis set default 'live_weight';
alter table public.sales_records alter column price_basis set not null;
alter table public.sales_records alter column currency set default 'USD';
alter table public.sales_records alter column currency set not null;
alter table public.sales_records alter column gross_amount set default 0;
alter table public.sales_records alter column gross_amount set not null;
alter table public.sales_records alter column purchase_cost set default 0;
alter table public.sales_records alter column purchase_cost set not null;
alter table public.sales_records alter column feed_cost set default 0;
alter table public.sales_records alter column feed_cost set not null;
alter table public.sales_records alter column health_cost set default 0;
alter table public.sales_records alter column health_cost set not null;
alter table public.sales_records alter column other_cost set default 0;
alter table public.sales_records alter column other_cost set not null;
alter table public.sales_records alter column total_cost set default 0;
alter table public.sales_records alter column total_cost set not null;
alter table public.sales_records alter column payment_status set default 'paid';
alter table public.sales_records alter column payment_status set not null;
alter table public.sales_records alter column sale_status set default 'completed';
alter table public.sales_records alter column sale_status set not null;
alter table public.sales_records alter column prediction_accuracy set default 'not_linked';
alter table public.sales_records alter column prediction_accuracy set not null;
alter table public.sales_records alter column metadata set default '{}'::jsonb;
alter table public.sales_records alter column metadata set not null;
alter table public.sales_records alter column updated_at set default now();
alter table public.sales_records alter column updated_at set not null;

create index if not exists idx_sales_records_farm_sold_at on public.sales_records(farm_id, sold_at desc);
create index if not exists idx_sales_records_animal_id on public.sales_records(animal_id);
create index if not exists idx_sales_records_species_id on public.sales_records(species_id);
create index if not exists idx_sales_records_buyer_name on public.sales_records(farm_id, buyer_name);
create index if not exists idx_sales_records_sale_status on public.sales_records(farm_id, sale_status);
create index if not exists idx_sales_records_payment_status on public.sales_records(farm_id, payment_status);
create index if not exists idx_sales_records_prediction_id on public.sales_records(prediction_id);
create index if not exists idx_sales_records_market_price_id on public.sales_records(market_price_id);

create unique index if not exists idx_sales_records_one_active_sale_per_animal
  on public.sales_records(animal_id)
  where sale_status <> 'voided';
