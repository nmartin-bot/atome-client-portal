-- EXTENSION UUID
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

-- Enable RLS sur toutes les tables
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
