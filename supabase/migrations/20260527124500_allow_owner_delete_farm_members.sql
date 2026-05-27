-- Allow farm owners to hard-remove a member row from their farm.

drop policy if exists "Farm owners can delete members" on public.farm_members;

create policy "Farm owners can delete members"
  on public.farm_members for delete using (public.is_farm_owner(farm_id));
