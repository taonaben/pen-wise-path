-- Add frontend-readable member identity data and tighten farm member RBAC.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);

grant select, insert, update on public.profiles to authenticated;

alter table public.profiles enable row level security;

create or replace function public.is_farm_owner(target_farm_id uuid)
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
      and fm.role = 'owner'
  );
$$;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Farm members can view peer profiles" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select using (id = auth.uid());

create policy "Farm members can view peer profiles"
  on public.profiles for select using (
    exists (
      select 1
      from public.farm_members viewer
      join public.farm_members peer
        on peer.farm_id = viewer.farm_id
       and peer.user_id = profiles.id
      where viewer.user_id = auth.uid()
        and viewer.status = 'active'
    )
  );

create policy "Users can insert own profile"
  on public.profiles for insert with check (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Farm managers can insert members" on public.farm_members;
drop policy if exists "Farm managers can update members" on public.farm_members;
drop policy if exists "Farm owners can insert members" on public.farm_members;
drop policy if exists "Farm owners can update members" on public.farm_members;

create policy "Farm owners can insert members"
  on public.farm_members for insert with check (public.is_farm_owner(farm_id));

create policy "Farm owners can update members"
  on public.farm_members for update using (public.is_farm_owner(farm_id));

drop policy if exists "members select audit_logs" on public.audit_logs;
drop policy if exists "managers select audit_logs" on public.audit_logs;

create policy "managers select audit_logs"
  on public.audit_logs for select using (public.is_farm_manager(farm_id));
