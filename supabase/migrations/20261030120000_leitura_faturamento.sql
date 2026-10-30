-- 20261030120000_leitura_faturamento
-- STATUS: APLICADA via Studio em 29/10/2026; validada no browser por Daniel (ciclo de teste completo, desfeito). Testada no PGlite. Depende de 20261029190000. Registra a propria version.
--
-- CONTEXTO: LEI2 - faturamento do ciclo fechado, no padrao do vale-gas (Daniel, 29/10): impressao para o
-- faturamento e, no sistema, o documento de cobranca lancado para "fechar a conta".
-- DECISOES: D1-A documento por cobranca (cada morador); quando quem paga e o CONDOMINIO (pacote
-- intermediario ou basico - ex.: Prolar Cadiz), um documento so, no ciclo (no resumo, ao lado do total).
-- D2-B tipo boleto | nfe | recibo (padrao vindo do cadastro da pessoa, no app). D3 quem lanca = chave de
-- fechar (Administrador). D4 cobrancas da carga da planilha ficam faturadas com tipo 'planilha'. D5 ciclo com
-- documento lancado nao reabre (desfazer o documento antes).
--
-- ROLLBACK (nao executar junto): recriar reabrir_ciclo da 20261029130000;
-- DROP FUNCTION leitura.faturar_cobranca(uuid, uuid, text, text, uuid);
-- DROP FUNCTION leitura.faturar_ciclo(uuid, uuid, text, text, uuid);
-- DROP FUNCTION leitura._cobra_condominio(uuid);
-- ALTER TABLE leitura.cobrancas DROP COLUMN documento_tipo, DROP COLUMN documento_numero, DROP COLUMN faturado_em, DROP COLUMN faturado_por;
-- ALTER TABLE leitura.ciclos DROP COLUMN documento_tipo, DROP COLUMN documento_numero, DROP COLUMN faturado_em, DROP COLUMN faturado_por;
-- DELETE FROM supabase_migrations.schema_migrations WHERE version = '20261030120000';

ALTER TABLE leitura.cobrancas
  ADD COLUMN documento_tipo text,
  ADD COLUMN documento_numero text,
  ADD COLUMN faturado_em timestamptz,
  ADD COLUMN faturado_por uuid,
  ADD CONSTRAINT cobrancas_documento_tipo_check CHECK (documento_tipo IN ('boleto', 'nfe', 'recibo', 'planilha')),
  ADD CONSTRAINT cobrancas_documento_check CHECK (
    (documento_tipo IS NULL AND documento_numero IS NULL AND faturado_em IS NULL AND faturado_por IS NULL)
    OR (documento_tipo IS NOT NULL AND situacao = 'cobrar' AND faturado_em IS NOT NULL AND faturado_por IS NOT NULL
        AND (documento_tipo = 'planilha' OR (documento_numero IS NOT NULL AND btrim(documento_numero) <> '' AND length(documento_numero) <= 60))));

ALTER TABLE leitura.ciclos
  ADD COLUMN documento_tipo text,
  ADD COLUMN documento_numero text,
  ADD COLUMN faturado_em timestamptz,
  ADD COLUMN faturado_por uuid,
  ADD CONSTRAINT ciclos_documento_tipo_check CHECK (documento_tipo IN ('boleto', 'nfe', 'recibo', 'planilha')),
  ADD CONSTRAINT ciclos_documento_check CHECK (
    (documento_tipo IS NULL AND documento_numero IS NULL AND faturado_em IS NULL AND faturado_por IS NULL)
    OR (documento_tipo IS NOT NULL AND status = 'fechado' AND faturado_em IS NOT NULL AND faturado_por IS NOT NULL
        AND (documento_tipo = 'planilha' OR (documento_numero IS NOT NULL AND btrim(documento_numero) <> '' AND length(documento_numero) <= 60))));

-- Quem paga e o condominio (um documento no ciclo): pacotes basico e intermediario.
CREATE FUNCTION leitura._cobra_condominio(p_condominio uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO ''
AS $$ SELECT pacote IN ('basico', 'intermediario') FROM leitura.condominios WHERE id = p_condominio $$;

-- Lanca (p_tipo nao nulo) ou desfaz (p_tipo nulo) o documento de UMA cobranca 'cobrar' de morador.
CREATE FUNCTION leitura.faturar_cobranca(p_tenant uuid, p_cobranca uuid, p_tipo text, p_numero text, p_por uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  v leitura.cobrancas%ROWTYPE;
  v_cond uuid;
BEGIN
  IF p_por IS NULL THEN RAISE EXCEPTION 'Autoria obrigatoria'; END IF;
  SELECT * INTO v FROM leitura.cobrancas WHERE id = p_cobranca AND tenant_id = p_tenant FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cobranca nao encontrada'; END IF;
  IF v.situacao <> 'cobrar' THEN RAISE EXCEPTION 'So cobranca a cobrar recebe documento'; END IF;
  SELECT ce.condominio_id INTO v_cond FROM leitura.unidades u JOIN leitura.centrais ce ON ce.id = u.central_id WHERE u.id = v.unidade_id;
  IF leitura._cobra_condominio(v_cond) THEN RAISE EXCEPTION 'Este condominio paga num documento so: lance no ciclo'; END IF;
  IF p_tipo IS NULL THEN
    UPDATE leitura.cobrancas SET documento_tipo = NULL, documento_numero = NULL, faturado_em = NULL, faturado_por = NULL WHERE id = v.id;
    RETURN;
  END IF;
  IF p_tipo NOT IN ('boleto', 'nfe', 'recibo') THEN RAISE EXCEPTION 'Tipo de documento invalido'; END IF;
  IF nullif(btrim(p_numero), '') IS NULL OR length(btrim(p_numero)) > 60 THEN RAISE EXCEPTION 'Numero do documento invalido'; END IF;
  UPDATE leitura.cobrancas SET documento_tipo = p_tipo, documento_numero = btrim(p_numero), faturado_em = now(), faturado_por = p_por
   WHERE id = v.id;
END;
$$;

-- Lanca ou desfaz o documento do CICLO (quem paga e o condominio).
CREATE FUNCTION leitura.faturar_ciclo(p_tenant uuid, p_ciclo uuid, p_tipo text, p_numero text, p_por uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  v leitura.ciclos%ROWTYPE;
BEGIN
  IF p_por IS NULL THEN RAISE EXCEPTION 'Autoria obrigatoria'; END IF;
  SELECT * INTO v FROM leitura.ciclos WHERE id = p_ciclo AND tenant_id = p_tenant FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ciclo nao encontrado'; END IF;
  IF v.status <> 'fechado' THEN RAISE EXCEPTION 'Feche o ciclo antes de faturar'; END IF;
  IF NOT leitura._cobra_condominio(v.condominio_id) THEN RAISE EXCEPTION 'Este condominio cobra por morador: lance em cada cobranca'; END IF;
  IF p_tipo IS NULL THEN
    UPDATE leitura.ciclos SET documento_tipo = NULL, documento_numero = NULL, faturado_em = NULL, faturado_por = NULL WHERE id = v.id;
    RETURN;
  END IF;
  IF p_tipo NOT IN ('boleto', 'nfe', 'recibo') THEN RAISE EXCEPTION 'Tipo de documento invalido'; END IF;
  IF nullif(btrim(p_numero), '') IS NULL OR length(btrim(p_numero)) > 60 THEN RAISE EXCEPTION 'Numero do documento invalido'; END IF;
  UPDATE leitura.ciclos SET documento_tipo = p_tipo, documento_numero = btrim(p_numero), faturado_em = now(), faturado_por = p_por
   WHERE id = v.id;
END;
$$;

-- D5: reabrir recusa ciclo com documento lancado (no ciclo ou em alguma cobranca).
CREATE OR REPLACE FUNCTION leitura.reabrir_ciclo(p_tenant uuid, p_ciclo uuid, p_por uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  v_ciclo leitura.ciclos%ROWTYPE;
BEGIN
  IF p_por IS NULL THEN RAISE EXCEPTION 'Autoria obrigatoria'; END IF;
  SELECT * INTO v_ciclo FROM leitura.ciclos WHERE id = p_ciclo AND tenant_id = p_tenant FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ciclo nao encontrado'; END IF;
  IF v_ciclo.status <> 'fechado' THEN RAISE EXCEPTION 'Ciclo nao esta fechado'; END IF;
  IF v_ciclo.documento_tipo IS NOT NULL
     OR EXISTS (SELECT 1 FROM leitura.cobrancas WHERE ciclo_id = p_ciclo AND documento_tipo IS NOT NULL) THEN
    RAISE EXCEPTION 'Ciclo faturado: desfaca os documentos antes de reabrir';
  END IF;
  PERFORM 1 FROM leitura.ciclos c WHERE c.condominio_id = v_ciclo.condominio_id AND c.referencia > v_ciclo.referencia;
  IF FOUND THEN RAISE EXCEPTION 'So o ultimo ciclo do condominio pode ser reaberto'; END IF;
  PERFORM 1 FROM leitura.cobrancas cb
    JOIN leitura.unidades u ON u.id = cb.unidade_id
    JOIN leitura.centrais ce ON ce.id = u.central_id
   WHERE ce.condominio_id = v_ciclo.condominio_id AND cb.ciclo_id IS NULL AND cb.criado_em > v_ciclo.fechado_em;
  IF FOUND THEN RAISE EXCEPTION 'Houve saida de morador cobrada depois do fechamento'; END IF;
  DELETE FROM leitura.cobrancas WHERE ciclo_id = p_ciclo;
  UPDATE leitura.ciclos SET status = 'aberto', minimo_cobranca = NULL, fechado_por = NULL, fechado_em = NULL
   WHERE id = p_ciclo;
END;
$$;

-- D4: historico da planilha ja foi faturado no BS.
UPDATE leitura.cobrancas c SET documento_tipo = 'planilha', faturado_em = ci.fechado_em, faturado_por = ci.fechado_por
  FROM leitura.ciclos ci, leitura.leituras l
 WHERE c.ciclo_id = ci.id AND l.id = c.leitura_id AND l.origem = 'planilha' AND c.situacao = 'cobrar'
   AND NOT leitura._cobra_condominio(ci.condominio_id);
UPDATE leitura.ciclos ci SET documento_tipo = 'planilha', faturado_em = ci.fechado_em, faturado_por = ci.fechado_por
 WHERE ci.status = 'fechado' AND leitura._cobra_condominio(ci.condominio_id)
   AND EXISTS (SELECT 1 FROM leitura.leituras l WHERE l.ciclo_id = ci.id AND l.origem = 'planilha');

REVOKE ALL ON FUNCTION leitura._cobra_condominio(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION leitura._cobra_condominio(uuid) TO service_role;
REVOKE ALL ON FUNCTION leitura.faturar_cobranca(uuid, uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION leitura.faturar_cobranca(uuid, uuid, text, text, uuid) TO service_role;
REVOKE ALL ON FUNCTION leitura.faturar_ciclo(uuid, uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION leitura.faturar_ciclo(uuid, uuid, text, text, uuid) TO service_role;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20261030120000', 'leitura_faturamento')
ON CONFLICT (version) DO NOTHING;
