-- Journal persistant des accès au vault (qui a déchiffré quoi, et quand)
create table public.vault_access_log (
  id uuid default uuid_generate_v4() primary key,
  credential_id uuid references public.vault_credentials(id) on delete cascade not null,
  accessed_by uuid references auth.users(id) not null,
  accessed_by_role text not null check (accessed_by_role in ('admin', 'client')),
  created_at timestamptz default now()
);

alter table public.vault_access_log enable row level security;

-- Les admins voient tout l'historique
create policy "admin_read_all_vault_log" on public.vault_access_log
  for select using (public.is_admin());

-- Un client peut voir l'historique d'accès de ses propres credentials
create policy "client_read_own_vault_log" on public.vault_access_log
  for select using (
    credential_id in (
      select vc.id from public.vault_credentials vc
      join public.projects p on p.id = vc.project_id
      where p.client_id = auth.uid()
    )
  );

-- N'importe quel utilisateur authentifié peut écrire une ligne, mais
-- uniquement pour lui-même (jamais usurper l'identité d'un autre accès)
create policy "self_insert_vault_log" on public.vault_access_log
  for insert with check (accessed_by = auth.uid());
