-- Bucket "documents" — privé, accès via URL signée uniquement
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Convention de chemin : {project_id}/{nom_fichier}
-- Le client ne peut lire que les fichiers de ses propres projets
create policy "client_read_own_documents" on storage.objects
  for select to authenticated using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1]::uuid in (
      select id from public.projects where client_id = auth.uid()
    )
  );

-- Les admins ont un accès complet (upload/suppression/lecture)
create policy "admin_documents_all" on storage.objects
  for all to authenticated using (
    bucket_id = 'documents' and public.is_admin()
  );
