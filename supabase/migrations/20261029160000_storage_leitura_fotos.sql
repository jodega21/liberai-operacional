-- 20261029160000_storage_leitura_fotos
-- STATUS: APLICADA via Studio em 29/10/2026 (bucket leitura-fotos, version 20261029160000).
--
-- CONTEXTO: LEI2 (29/10/2026). Fotos dos relogios (registro; o operador digita a leitura - decisao de
-- Daniel 28/10). Bucket PRIVADO: o app sobe e le com service role (URL assinada de 1 h na tela); sem
-- policy em storage.objects, anon/authenticated nao leem nem gravam. Caminho:
-- <tenant>/<ciclo>/<uuid>.jpg e <tenant>/saida/<unidade>/<uuid>.jpg (so o caminho fica em
-- leitura.leituras.foto_path). Limite de 3 MB por arquivo (o navegador ja reduz para ~300 KB).
--
-- ROLLBACK (nao executar junto; so com o bucket vazio):
-- DELETE FROM storage.buckets WHERE id = 'leitura-fotos';
-- DELETE FROM supabase_migrations.schema_migrations WHERE version = '20261029160000';

WITH b AS (
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('leitura-fotos', 'leitura-fotos', false, 3145728,
          ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
  RETURNING id
), l AS (
  INSERT INTO supabase_migrations.schema_migrations (version, name)
  SELECT '20261029160000', 'storage_leitura_fotos' WHERE EXISTS (SELECT 1 FROM b)
  RETURNING version
)
SELECT (SELECT id FROM b) AS bucket, (SELECT version FROM l) AS version;
