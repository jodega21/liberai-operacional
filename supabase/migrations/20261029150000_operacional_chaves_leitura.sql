-- 20261029150000_operacional_chaves_leitura
-- STATUS: APLICADA via Studio em 29/10/2026 (chaves 2, ligacoes 3, version 20261029150000).
--
-- CONTEXTO: LEI2 (29/10/2026). Chaves do LiberAi Operacional para o modulo Leitura. Decisao de Daniel
-- (29/10): lancar leituras e saidas = Administrador e Operador; fechar e reabrir ciclo = so Administrador.
-- Abrir o ciclo do mes entra no lancar (o operador comeca o mes sem depender do Administrador).
--
-- SEGURANCA: nenhuma mudanca de grant; acesso.* segue so service_role nas tabelas.
--
-- ROLLBACK EXATO (nao executar junto):
-- DELETE FROM acesso.papel_permissoes WHERE chave IN ('operacional.leitura.lancar', 'operacional.leitura.fechar');
-- DELETE FROM acesso.permissoes WHERE chave IN ('operacional.leitura.lancar', 'operacional.leitura.fechar');
-- DELETE FROM supabase_migrations.schema_migrations WHERE version = '20261029150000';

WITH k AS (
  INSERT INTO acesso.permissoes (chave, modulo, descricao) VALUES
    ('operacional.leitura.lancar', 'operacional', 'Abrir o ciclo do mes, lancar leituras de medidores e saidas de morador'),
    ('operacional.leitura.fechar', 'operacional', 'Fechar e reabrir o ciclo mensal de leitura (gera as cobrancas)')
  RETURNING chave
), pp AS (
  INSERT INTO acesso.papel_permissoes (papel_id, chave)
  SELECT p.id, k.chave FROM acesso.papeis p JOIN k
    ON (k.chave = 'operacional.leitura.lancar' AND p.nome IN ('Administrador', 'Operador'))
    OR (k.chave = 'operacional.leitura.fechar' AND p.nome = 'Administrador')
  RETURNING chave
), l AS (
  INSERT INTO supabase_migrations.schema_migrations (version, name)
  SELECT '20261029150000', 'operacional_chaves_leitura'
  WHERE (SELECT count(*) FROM pp) = 3
  RETURNING version
)
SELECT (SELECT count(*) FROM k)  AS chaves,
       (SELECT count(*) FROM pp) AS ligacoes,
       (SELECT version FROM l)   AS version;
