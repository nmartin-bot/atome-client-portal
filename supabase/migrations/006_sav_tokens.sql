-- Catégorie de ticket SAV : bug/question = gratuit, modification/feature = facturé en tokens
alter table public.sav_tickets
  add column if not exists category text check (category in ('bug', 'modification', 'feature', 'question')) default 'bug',
  add column if not exists token_cost int;

-- Décompte automatique des tokens dès que l'admin renseigne un coût sur le ticket
-- (une seule fois — passage de null à une valeur ; les ajustements ultérieurs
-- se font manuellement via l'onglet Tokens, comme tout mouvement du ledger)
create or replace function charge_tokens_on_sav_cost()
returns trigger as $$
begin
  if new.token_cost is not null and old.token_cost is null then
    insert into public.token_ledger (project_id, delta, label)
    values (new.project_id, -new.token_cost, 'SAV : ' || new.title);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_sav_token_cost_set on public.sav_tickets;

create trigger on_sav_token_cost_set
  after update on public.sav_tickets
  for each row
  when (new.token_cost is distinct from old.token_cost)
  execute function charge_tokens_on_sav_cost();
