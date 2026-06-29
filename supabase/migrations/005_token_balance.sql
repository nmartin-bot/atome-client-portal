-- Calcule le solde de tokens d'un projet (somme des deltas du ledger)
create or replace function get_token_balance(p_project_id uuid)
returns int as $$
  select coalesce(sum(delta), 0)
  from public.token_ledger
  where project_id = p_project_id;
$$ language sql security definer;
