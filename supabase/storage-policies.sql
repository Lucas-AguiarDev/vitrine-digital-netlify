-- ═══════════════════════════════════════════════════════════════
-- STORAGE POLICIES — Execute após criar o bucket no Supabase
-- Bucket name: vitrine-uploads
-- ═══════════════════════════════════════════════════════════════

-- Criar bucket (execute uma vez)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vitrine-uploads',
  'vitrine-uploads',
  true,   -- arquivos públicos (imagens de produto)
  5242880, -- 5MB máximo
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Estrutura de paths:
-- vitrine-uploads/{store_id}/products/{filename}
-- vitrine-uploads/{store_id}/banners/{filename}
-- vitrine-uploads/{store_id}/logos/{filename}

-- Leitura pública (qualquer um pode ver imagens de produto)
create policy "storage_public_read"
  on storage.objects for select
  using (bucket_id = 'vitrine-uploads');

-- Upload: apenas dono da loja no próprio diretório
create policy "storage_owner_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'vitrine-uploads'
    and auth.uid() is not null
    -- Valida que o store_id no path pertence ao usuário logado
    and exists (
      select 1 from public.stores s
      where s.id::text = (string_to_array(name, '/'))[1]
      and s.owner_id = auth.uid()
    )
  );

-- Deleção: apenas dono
create policy "storage_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'vitrine-uploads'
    and auth.uid() is not null
    and exists (
      select 1 from public.stores s
      where s.id::text = (string_to_array(name, '/'))[1]
      and s.owner_id = auth.uid()
    )
  );
