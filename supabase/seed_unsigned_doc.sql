-- Ajoute un document non signé pour tester le flow de signature en ligne
insert into public.documents (project_id, type, label, amount_ht)
select id, 'devis', 'Devis avenant — module reporting', 1500
from public.projects
where name = 'CRM interne';
