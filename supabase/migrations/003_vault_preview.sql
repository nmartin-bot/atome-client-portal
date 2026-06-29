-- Colonne d'identification visuelle sans exposer la valeur déchiffrée
alter table public.vault_credentials
  add column if not exists value_preview text;
