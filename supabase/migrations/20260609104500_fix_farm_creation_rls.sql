-- Allow onboarding farm creation under RLS for authenticated users.
-- 1) User can insert a farm only for themselves (owner_id = auth.uid()).
-- 2) User can create their own initial owner membership for that farm.

-- farms: allow first-time farm creation
create policy "Users can create own farms"
  on public.farms
  for insert
  with check (owner_id = auth.uid());

-- farm_members: allow bootstrap owner row for newly created farm
create policy "Users can bootstrap own farm owner membership"
  on public.farm_members
  for insert
  with check (
    -- keep existing owner-managed invitation flow working
    public.is_farm_owner(farm_id)
    or (
      user_id = auth.uid()
      and role = 'owner'
      and status = 'active'
      and created_by = auth.uid()
      and exists (
        select 1
        from public.farms f
        where f.id = farm_members.farm_id
          and f.owner_id = auth.uid()
      )
    )
  );
