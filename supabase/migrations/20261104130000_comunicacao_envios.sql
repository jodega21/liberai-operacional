-- 20261104130000_comunicacao_envios
-- STATUS: APLICADA via Studio em 04/11/2026 (tabela 1, rls true, version 20261104130000); schema
-- "comunicacao" incluido em Settings > API > Exposed schemas. Registra a propria version.
--
-- CONTEXTO: LEI5 fatia 2 - envio do demonstrativo da leitura por e-mail (Daniel, 31/10 E1-E9 e 04/11
-- G1-G6). E7-A: registro generico de comunicacao (um por destinatario e canal), para servir depois a
-- NF, pedidos e atendimento; hoje so a leitura escreve. Cada tentativa e uma linha (reenvio = linha
-- nova), nada e apagado ou alterado: e o historico do que saiu para quem.
--
-- origem_tipo / origem_id: o documento que gerou o envio. Leitura: 'leitura_cobranca' (demonstrativo do
-- morador, id = leitura.cobrancas.id) e 'leitura_ciclo' (resumo para o condominio que paga, id =
-- leitura.ciclos.id). Sem FK de proposito: o registro sobrevive ao documento (LGPD: guarda o
-- destinatario usado no dia).
-- cliente_id sem FK para public.clientes: as fusoes recusam cadastro com linha em tabela com FK (F7-A)
-- e o historico de envio nao pode travar fusao; o nome vai junto (foto do dia).
--
-- SEGURANCA: padrao do D68. Schema sem acesso de anon/authenticated; tabela com RLS e sem policy; so
-- service_role, e so SELECT e INSERT (sem UPDATE/DELETE: historico imutavel pelo app).
--
-- ROLLBACK EXATO (nao executar junto):
-- DROP SCHEMA comunicacao CASCADE;
-- DELETE FROM supabase_migrations.schema_migrations WHERE version = '20261104130000';

CREATE SCHEMA comunicacao;
REVOKE ALL ON SCHEMA comunicacao FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA comunicacao TO service_role;

CREATE TABLE comunicacao.envios (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL,
  canal         text        NOT NULL,
  destinatario  text        NOT NULL,
  cliente_id    uuid,
  cliente_nome  text,
  origem_tipo   text        NOT NULL,
  origem_id     uuid        NOT NULL,
  assunto       text        NOT NULL,
  com_comunicado boolean    NOT NULL DEFAULT false,
  status        text        NOT NULL,
  provedor_id   text,
  erro          text,
  enviado_por   uuid        NOT NULL,
  enviado_em    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT envios_pkey PRIMARY KEY (id),
  CONSTRAINT envios_canal_check CHECK (canal IN ('email', 'whatsapp', 'carta')),
  CONSTRAINT envios_destinatario_check CHECK (btrim(destinatario) <> '' AND length(destinatario) <= 320),
  CONSTRAINT envios_origem_tipo_check CHECK (origem_tipo IN ('leitura_cobranca', 'leitura_ciclo')),
  CONSTRAINT envios_status_check CHECK (status IN ('enviado', 'falhou')),
  CONSTRAINT envios_resultado_check CHECK (
    (status = 'enviado' AND erro IS NULL) OR (status = 'falhou' AND erro IS NOT NULL))
);

CREATE INDEX envios_origem_idx ON comunicacao.envios (tenant_id, origem_tipo, origem_id);
CREATE INDEX envios_cliente_idx ON comunicacao.envios (tenant_id, cliente_id) WHERE cliente_id IS NOT NULL;

COMMENT ON TABLE comunicacao.envios IS
  'Cada tentativa de envio de um documento a um destinatario (E7-A, LEI5). Imutavel pelo app: reenvio = linha nova.';

ALTER TABLE comunicacao.envios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE comunicacao.envios FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE comunicacao.envios TO service_role;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20261104130000', 'comunicacao_envios');

-- CONFERENCIA (resultado do comando). ESPERADO: tabela 1, rls true, version 20261104130000.
SELECT
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'comunicacao' AND tablename = 'envios') AS tabela,
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'comunicacao.envios'::regclass)          AS rls,
  (SELECT version FROM supabase_migrations.schema_migrations WHERE version = '20261104130000') AS version;
