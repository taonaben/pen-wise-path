-- 002_create_rls_policies.sql

alter table public.farms enable row level security;
alter table public.farm_members enable row level security;
alter table public.animals enable row level security;
alter table public.weight_records enable row level security;
alter table public.feed_types enable row level security;
alter table public.feed_records enable row level security;
alter table public.market_prices enable row level security;
alter table public.sales_records enable row level security;
alter table public.alerts enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_farm_member(target_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.farm_members fm
    where fm.farm_id = target_farm_id
      and fm.user_id = auth.uid()
      and fm.status = 'active'
  );
$$;

create or replace function public.is_farm_manager(target_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.farm_members fm
    where fm.farm_id = target_farm_id
      and fm.user_id = auth.uid()
      and fm.status = 'active'
      and fm.role in ('owner', 'manager')
  );
$$;

-- farms
create policy "Farm members can view farms"
  on public.farms for select using (public.is_farm_member(id));

create policy "Owners can update farms"
  on public.farms for update using (
    exists (
      select 1 from public.farm_members fm
      where fm.farm_id = farms.id
        and fm.user_id = auth.uid()
        and fm.role = 'owner'
        and fm.status = 'active'
    )
  );

-- farm_members
create policy "Farm members can view farm members"
  on public.farm_members for select using (public.is_farm_member(farm_id));
create policy "Farm managers can insert members"
  on public.farm_members for insert with check (public.is_farm_manager(farm_id));
create policy "Farm managers can update members"
  on public.farm_members for update using (public.is_farm_manager(farm_id));

-- animals
create policy "members select animals"  on public.animals for select using (public.is_farm_member(farm_id));
create policy "members insert animals"  on public.animals for insert with check (public.is_farm_member(farm_id));
create policy "managers update animals" on public.animals for update using (public.is_farm_manager(farm_id));
create policy "managers delete animals" on public.animals for delete using (public.is_farm_manager(farm_id));

-- weight_records
create policy "members select weights"  on public.weight_records for select using (public.is_farm_member(farm_id));
create policy "members insert weights"  on public.weight_records for insert with check (public.is_farm_member(farm_id));
create policy "managers update weights" on public.weight_records for update using (public.is_farm_manager(farm_id));
create policy "managers delete weights" on public.weight_records for delete using (public.is_farm_manager(farm_id));

-- feed_types
create policy "members select feed_types"  on public.feed_types for select using (public.is_farm_member(farm_id));
create policy "members insert feed_types"  on public.feed_types for insert with check (public.is_farm_member(farm_id));
create policy "managers update feed_types" on public.feed_types for update using (public.is_farm_manager(farm_id));
create policy "managers delete feed_types" on public.feed_types for delete using (public.is_farm_manager(farm_id));

-- feed_records
create policy "members select feed_records"  on public.feed_records for select using (public.is_farm_member(farm_id));
create policy "members insert feed_records"  on public.feed_records for insert with check (public.is_farm_member(farm_id));
create policy "managers update feed_records" on public.feed_records for update using (public.is_farm_manager(farm_id));
create policy "managers delete feed_records" on public.feed_records for delete using (public.is_farm_manager(farm_id));

-- market_prices
create policy "members select market_prices"  on public.market_prices for select using (public.is_farm_member(farm_id));
create policy "members insert market_prices"  on public.market_prices for insert with check (public.is_farm_member(farm_id));
create policy "managers update market_prices" on public.market_prices for update using (public.is_farm_manager(farm_id));
create policy "managers delete market_prices" on public.market_prices for delete using (public.is_farm_manager(farm_id));

-- sales_records
create policy "members select sales"  on public.sales_records for select using (public.is_farm_member(farm_id));
create policy "members insert sales"  on public.sales_records for insert with check (public.is_farm_member(farm_id));
create policy "managers update sales" on public.sales_records for update using (public.is_farm_manager(farm_id));
create policy "managers delete sales" on public.sales_records for delete using (public.is_farm_manager(farm_id));

-- alerts
create policy "members select alerts"  on public.alerts for select using (public.is_farm_member(farm_id));
create policy "members insert alerts"  on public.alerts for insert with check (public.is_farm_member(farm_id));
create policy "managers update alerts" on public.alerts for update using (public.is_farm_manager(farm_id));
create policy "managers delete alerts" on public.alerts for delete using (public.is_farm_manager(farm_id));

-- audit_logs (insert + select only)
create policy "members select audit_logs" on public.audit_logs for select using (public.is_farm_member(farm_id));
create policy "members insert audit_logs" on public.audit_logs for insert with check (public.is_farm_member(farm_id));
