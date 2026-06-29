-- Seed de test — à exécuter une fois que le client test s'est connecté au moins une fois
-- (le compte auth.users doit déjà exister via signup sur /login)

insert into public.clients (id, email, full_name, company_name)
select id, email, 'Client Test', 'Entreprise Test'
from auth.users
where email = 'nicolas.martin4846@icloud.com'
on conflict (id) do nothing;

with new_project as (
  insert into public.projects (client_id, name, status, started_at, estimated_at, progress_pct, total_amount_ht, deposit_paid_at)
  select id, 'CRM interne', 'active', current_date - interval '20 days', current_date + interval '40 days', 45, 8000, now() - interval '15 days'
  from public.clients
  where email = 'nicolas.martin4846@icloud.com'
  returning id
)
insert into public.project_steps (project_id, title, description, status, completed_at, sort_order)
select id, 'Cahier des charges', 'Recueil des besoins et validation du périmètre', 'done', now() - interval '20 days', 1 from new_project
union all
select id, 'Acompte 20%', 'Paiement de l''acompte de démarrage', 'done', now() - interval '15 days', 2 from new_project
union all
select id, 'Livrable 1', 'Première version fonctionnelle', 'active', null::timestamptz, 3 from new_project
union all
select id, 'RDV livrable 1', 'Présentation et retours client', 'pending', null::timestamptz, 4 from new_project
union all
select id, 'Livraison finale', 'Mise en production', 'pending', null::timestamptz, 5 from new_project
union all
select id, 'Abonnement actif', 'Maintenance et support', 'pending', null::timestamptz, 6 from new_project;

insert into public.documents (project_id, type, label, amount_ht, signed_at, paid_at)
select id, 'devis', 'Devis CRM interne', 8000, now() - interval '20 days', null::timestamptz from public.projects where name = 'CRM interne'
union all
select id, 'contrat', 'Contrat de prestation', 8000, now() - interval '18 days', null::timestamptz from public.projects where name = 'CRM interne'
union all
select id, 'facture_acompte', 'Facture acompte 20%', 1600, null::timestamptz, now() - interval '15 days' from public.projects where name = 'CRM interne';

insert into public.token_ledger (project_id, delta, label)
select id, 100, 'Crédit initial' from public.projects where name = 'CRM interne'
union all
select id, -12, 'Correction bug formulaire' from public.projects where name = 'CRM interne'
union all
select id, -8, 'Ajout export CSV' from public.projects where name = 'CRM interne';

insert into public.sav_tickets (project_id, title, body, status, source_app)
select id, 'Bouton export ne fonctionne pas', 'Le bouton export CSV reste bloqué en chargement.', 'open', 'crm-interne' from public.projects where name = 'CRM interne'
union all
select id, 'Erreur 500 sur la page clients', 'Résolu après correctif du 12/06.', 'closed', 'crm-interne' from public.projects where name = 'CRM interne';

insert into public.vault_credentials (project_id, label, service, type, encrypted_value)
select id, 'Accès hébergement', 'OVH', 'hosting', 'placeholder_non_chiffre_pour_test' from public.projects where name = 'CRM interne'
union all
select id, 'Clé API Stripe', 'Stripe', 'api', 'placeholder_non_chiffre_pour_test' from public.projects where name = 'CRM interne';
