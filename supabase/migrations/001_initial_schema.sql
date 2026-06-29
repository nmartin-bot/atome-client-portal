-- ============================================================
-- ÉTAPE 0 — Nettoyage du schéma CRM recrutement (plus utilisé)
-- ============================================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin() cascade;

drop table if exists public.availability_slots cascade;
drop table if exists public.ats_applications cascade;
drop table if exists public.tasks cascade;
drop table if exists public.quotes cascade;
drop table if exists public.documents cascade;
drop table if exists public.evaluations cascade;
drop table if exists public.attendance cascade;
drop table if exists public.training_sessions cascade;
drop table if exists public.training_courses cascade;
drop table if exists public.cv_versions cascade;
drop table if exists public.coaching_sessions cascade;
drop table if exists public.appointments cascade;
drop table if exists public.interactions cascade;
drop table if exists public.learners cascade;
drop table if exists public.candidates cascade;
drop table if exists public.contacts cascade;
drop table if exists public.companies cascade;
drop table if exists public.profiles cascade;

-- ============================================================
-- EXTENSION UUID
-- ============================================================
create extension if not exists "uuid-ossp";

-- TABLE clients
create table public.clients (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  company_name text,
  created_at timestamptz default now()
);

-- TABLE projects
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  name text not null,
  status text check (status in ('active','paused','delivered')) default 'active',
  started_at date,
  estimated_at date,
  progress_pct int default 0 check (progress_pct between 0 and 100),
  total_amount_ht numeric(10,2),
  deposit_paid_at timestamptz,
  balance_paid_at timestamptz,
  created_at timestamptz default now()
);

-- TABLE project_steps (timeline du projet)
create table public.project_steps (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  status text check (status in ('pending','active','done')) default 'pending',
  completed_at timestamptz,
  sort_order int not null default 0
);

-- TABLE documents
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  type text check (type in ('devis','contrat','facture_acompte','facture_solde','autre')) not null,
  label text not null,
  storage_path text,
  amount_ht numeric(10,2),
  signed_at timestamptz,
  signature_data text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- TABLE vault_credentials
create table public.vault_credentials (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  label text not null,
  service text,
  type text check (type in ('api','dns','hosting','cms','autre')) not null,
  encrypted_value text not null,
  created_at timestamptz default now()
);

-- TABLE project_briefs
create table public.project_briefs (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null unique,
  project_type text check (project_type in ('crm','site','auto','autre')),
  activity text,
  team text,
  current_process text,
  blockers text,
  ideal_tool text,
  tech_constraints text,
  v1_priorities text,
  context text,
  meta jsonb,
  conversation_history jsonb,
  submitted_at timestamptz,
  created_at timestamptz default now()
);

-- TABLE sav_tickets
create table public.sav_tickets (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  body text,
  status text check (status in ('open','in_progress','closed')) default 'open',
  source_app text,
  assigned_to text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TABLE token_ledger
create table public.token_ledger (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  delta int not null,
  label text not null,
  created_at timestamptz default now()
);

-- TABLE admins (whitelist Nico + Maël)
create table public.admins (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS Policies
-- ============================================================
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_steps enable row level security;
alter table public.documents enable row level security;
alter table public.vault_credentials enable row level security;
alter table public.project_briefs enable row level security;
alter table public.sav_tickets enable row level security;
alter table public.token_ledger enable row level security;
alter table public.admins enable row level security;

-- clients : chaque client voit uniquement sa ligne
create policy "client_self" on public.clients
  for all using (auth.uid() = id);

-- projects : client voit ses projets
create policy "client_projects" on public.projects
  for select using (client_id = auth.uid());

-- project_steps : via project → client
create policy "client_steps" on public.project_steps
  for select using (
    project_id in (select id from public.projects where client_id = auth.uid())
  );

-- documents : lecture client
create policy "client_documents_read" on public.documents
  for select using (
    project_id in (select id from public.projects where client_id = auth.uid())
  );

-- documents : update client (signature uniquement)
create policy "client_documents_sign" on public.documents
  for update using (
    project_id in (select id from public.projects where client_id = auth.uid())
  ) with check (true);

-- vault_credentials : client lit et écrit les siennes
create policy "client_vault" on public.vault_credentials
  for all using (
    project_id in (select id from public.projects where client_id = auth.uid())
  );

-- project_briefs : client lit et écrit le sien
create policy "client_brief" on public.project_briefs
  for all using (
    project_id in (select id from public.projects where client_id = auth.uid())
  );

-- sav_tickets : client lit et crée les siens
create policy "client_sav_read" on public.sav_tickets
  for select using (
    project_id in (select id from public.projects where client_id = auth.uid())
  );
create policy "client_sav_insert" on public.sav_tickets
  for insert with check (
    project_id in (select id from public.projects where client_id = auth.uid())
  );

-- token_ledger : client lit uniquement
create policy "client_tokens_read" on public.token_ledger
  for select using (
    project_id in (select id from public.projects where client_id = auth.uid())
  );

-- admins : uniquement les admins voient la table admins
create policy "admins_self" on public.admins
  for select using (auth.uid() = id);

-- admins : un admin peut tout lire/écrire sur toutes les tables (back-office)
create or replace function public.is_admin()
returns boolean as $$
  select exists (select 1 from public.admins where id = auth.uid());
$$ language sql security definer stable;

create policy "admin_full_access_clients" on public.clients for all using (public.is_admin());
create policy "admin_full_access_projects" on public.projects for all using (public.is_admin());
create policy "admin_full_access_steps" on public.project_steps for all using (public.is_admin());
create policy "admin_full_access_documents" on public.documents for all using (public.is_admin());
create policy "admin_full_access_vault" on public.vault_credentials for all using (public.is_admin());
create policy "admin_full_access_briefs" on public.project_briefs for all using (public.is_admin());
create policy "admin_full_access_sav" on public.sav_tickets for all using (public.is_admin());
create policy "admin_full_access_tokens" on public.token_ledger for all using (public.is_admin());

-- ============================================================
-- Trigger : crée automatiquement une ligne "clients" à l'inscription
-- (inscription libre depuis /login — voir SESSION 1, déviation assumée
-- du brief qui prévoyait magic link uniquement)
-- ============================================================
create or replace function public.handle_new_client()
returns trigger as $$
begin
  insert into public.clients (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_client();

-- ============================================================
-- ÉTAPE FINALE — Recréer ton compte admin
-- ============================================================
insert into public.admins (id, email)
select id, email from auth.users where email = 'n.martin@untitled-hr.com'
on conflict (id) do nothing;
