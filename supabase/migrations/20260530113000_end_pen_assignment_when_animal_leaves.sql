-- Animals that are no longer physically on the farm must not remain in active pen occupancy.

update public.animal_pen_assignments apa
set
  ended_at = coalesce(a.sold_at, current_date),
  updated_at = now(),
  reason = coalesce(apa.reason, 'Animal left farm')
from public.animals a
where apa.animal_id = a.id
  and apa.ended_at is null
  and a.status in ('sold', 'removed', 'dead');

create or replace function public.end_pen_assignment_when_animal_leaves()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('sold', 'removed', 'dead')
     and (old.status is distinct from new.status) then
    update public.animal_pen_assignments
    set
      ended_at = coalesce(new.sold_at, current_date),
      updated_at = now(),
      reason = coalesce(reason, 'Animal left farm')
    where farm_id = new.farm_id
      and animal_id = new.id
      and ended_at is null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_end_pen_assignment_when_animal_leaves on public.animals;
create trigger trg_end_pen_assignment_when_animal_leaves
after update of status on public.animals
for each row
execute function public.end_pen_assignment_when_animal_leaves();
