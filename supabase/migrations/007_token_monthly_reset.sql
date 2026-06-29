-- Remet le solde de tous les projets actifs à exactement 100 tokens le 1er
-- de chaque mois, quel que soit le solde restant (positif ou négatif).
create extension if not exists pg_cron;

create or replace function reset_monthly_tokens()
returns void as $$
declare
  proj record;
  current_balance int;
begin
  for proj in select id from public.projects where status = 'active' loop
    select coalesce(sum(delta), 0) into current_balance
    from public.token_ledger
    where project_id = proj.id;

    insert into public.token_ledger (project_id, delta, label)
    values (proj.id, 100 - current_balance, 'Renouvellement mensuel');
  end loop;
end;
$$ language plpgsql security definer;

select cron.schedule(
  'reset-tokens-monthly',
  '0 0 1 * *',
  $$select reset_monthly_tokens()$$
);
