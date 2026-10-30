-- 20261029180000_leitura_em_aberto_e_historico
-- STATUS: APLICADA via Studio em 29/10/2026. Testada no PGlite. Depende de 20261029171000. Registra a propria
-- version no fim (arquivo inteiro num comando).
--
-- CONTEXTO: LEI2, carga do historico 2026 das planilhas (opcao A, Daniel 29/10).
-- (1) Consumo em aberto: no LAURO, as leituras de mar/2026 ficaram abaixo do minimo e a planilha
--     recomecou abril do numero de marco sem cobrar ("valor deixado para tras"). Daniel (29/10): marcar
--     como acumula e cobrar em novembro, mostrando o mes junto no faturamento para justificar ao morador.
--     cobrancas.consumo_em_aberto = m3 dessa cobranca 'acumula' que ficou para tras; quitada_por = a
--     cobranca que levou (no fechamento seguinte com 'cobrar' ou na saida do morador). previa_ciclo soma
--     o em aberto ao consumo e devolve em_aberto a parte.
-- (2) Leituras historicas da planilha nao tem foto: leituras.origem = 'app' | 'planilha'; a foto
--     obrigatoria da leitura da Libergas so vale para origem 'app'.
--
-- ROLLBACK (nao executar junto, so sem cobranca em aberto e sem leitura de origem planilha): recriar
-- previa_ciclo/fechar_ciclo da 20261029130000 e registrar_saida da 20261029171000;
-- DROP FUNCTION leitura._em_aberto(uuid);
-- ALTER TABLE leitura.cobrancas DROP COLUMN quitada_por, DROP COLUMN consumo_em_aberto;
-- ALTER TABLE leitura.leituras DROP CONSTRAINT leituras_foto_check, DROP COLUMN origem,
--   ADD CONSTRAINT leituras_foto_check CHECK (quem_leu = 'sindico' OR foto_path IS NOT NULL);
-- DELETE FROM supabase_migrations.schema_migrations WHERE version = '20261029180000';

-- ===== 1. COLUNAS =====

ALTER TABLE leitura.leituras
  ADD COLUMN origem text NOT NULL DEFAULT 'app',
  ADD CONSTRAINT leituras_origem_check CHECK (origem IN ('app', 'planilha')),
  DROP CONSTRAINT leituras_foto_check,
  ADD CONSTRAINT leituras_foto_check CHECK (quem_leu = 'sindico' OR foto_path IS NOT NULL OR origem = 'planilha');

ALTER TABLE leitura.cobrancas
  ADD COLUMN consumo_em_aberto numeric(12,3),
  ADD COLUMN quitada_por uuid,
  ADD CONSTRAINT cobrancas_em_aberto_check CHECK (
    consumo_em_aberto IS NULL OR (situacao = 'acumula' AND consumo_em_aberto > 0)),
  ADD CONSTRAINT cobrancas_quitada_check CHECK (quitada_por IS NULL OR consumo_em_aberto IS NOT NULL),
  ADD CONSTRAINT cobrancas_quitada_por_fkey FOREIGN KEY (quitada_por) REFERENCES leitura.cobrancas(id) ON DELETE SET NULL;
CREATE INDEX cobrancas_em_aberto_idx ON leitura.cobrancas (unidade_id) WHERE consumo_em_aberto IS NOT NULL AND quitada_por IS NULL;

-- ===== 2. FUNCOES =====

-- m3 em aberto (ainda nao levado por nenhuma cobranca) da unidade.
CREATE FUNCTION leitura._em_aberto(p_unidade uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path TO ''
AS $$
  SELECT coalesce(sum(c.consumo_em_aberto), 0) FROM leitura.cobrancas c
   WHERE c.unidade_id = p_unidade AND c.consumo_em_aberto IS NOT NULL AND c.quitada_por IS NULL
$$;

DROP FUNCTION leitura.fechar_ciclo(uuid, uuid, boolean, uuid);
DROP FUNCTION leitura.previa_ciclo(uuid, uuid);

-- Previa do ciclo: uma linha por unidade ativa. consumo = desde a ultima cobrada + em aberto (em_aberto
-- devolvido a parte, para a tela e o demonstrativo). situacao 'sem_leitura' sem leitura no ciclo.
CREATE FUNCTION leitura.previa_ciclo(p_tenant uuid, p_ciclo uuid)
RETURNS TABLE (unidade_id uuid, identificacao text, central_id uuid, cliente_id uuid, leitura_id uuid,
               medidor_id uuid, base_medidor_id uuid, base_valor numeric, valor_atual numeric,
               consumo numeric, em_aberto numeric, preco_m3 numeric, preco_origem text, valor numeric, situacao text)
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $$
DECLARE
  v_ciclo leitura.ciclos%ROWTYPE;
  v_min   numeric;
  u       record;
  b       record;
  p       record;
BEGIN
  SELECT * INTO v_ciclo FROM leitura.ciclos c WHERE c.id = p_ciclo AND c.tenant_id = p_tenant;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ciclo nao encontrado'; END IF;
  SELECT co.minimo_cobranca INTO v_min FROM leitura.condominios co WHERE co.id = v_ciclo.condominio_id;
  v_min := coalesce(v_ciclo.minimo_cobranca, v_min);
  FOR u IN
    SELECT un.id, un.identificacao, un.central_id, l.id AS leitura_id, l.medidor_id, l.valor, l.data
      FROM leitura.unidades un
      JOIN leitura.centrais ce ON ce.id = un.central_id
      LEFT JOIN leitura.leituras l ON l.ciclo_id = p_ciclo
            AND l.medidor_id IN (SELECT m.id FROM leitura.medidores m WHERE m.unidade_id = un.id)
     WHERE ce.condominio_id = v_ciclo.condominio_id AND un.ativa
     ORDER BY un.identificacao
  LOOP
    unidade_id := u.id; identificacao := u.identificacao; central_id := u.central_id;
    leitura_id := u.leitura_id; medidor_id := u.medidor_id; valor_atual := u.valor;
    SELECT o.cliente_id INTO cliente_id FROM leitura.unidade_ocupantes o
     WHERE o.unidade_id = u.id AND o.desde <= coalesce(u.data, v_ciclo.data_leitura)
       AND (o.ate IS NULL OR o.ate > coalesce(u.data, v_ciclo.data_leitura))
     ORDER BY o.desde DESC LIMIT 1;
    IF NOT FOUND THEN cliente_id := NULL; END IF;
    SELECT * INTO b FROM leitura._base_cobranca(u.id);
    base_medidor_id := b.medidor_id; base_valor := b.valor;
    em_aberto := leitura._em_aberto(u.id);
    SELECT * INTO p FROM leitura.preco_m3_em(p_tenant, u.central_id, v_ciclo.data_leitura);
    preco_m3 := p.preco_m3; preco_origem := p.origem;
    IF u.leitura_id IS NULL THEN
      consumo := NULL; valor := NULL; situacao := 'sem_leitura';
    ELSE
      IF u.data < b.data THEN RAISE EXCEPTION 'Unidade %: leitura anterior a ultima cobrada', u.identificacao; END IF;
      consumo := leitura._consumo(u.id, b.medidor_id, b.valor, u.medidor_id, u.valor) + em_aberto;
      IF preco_m3 IS NULL THEN RAISE EXCEPTION 'Sem preco do P45 para o condominio'; END IF;
      valor := round(consumo * preco_m3, 2);
      situacao := CASE WHEN valor >= v_min AND valor > 0 THEN 'cobrar' ELSE 'acumula' END;
    END IF;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Fecha o ciclo: grava as cobrancas, congela o minimo e quita o consumo em aberto das unidades cobradas.
CREATE FUNCTION leitura.fechar_ciclo(p_tenant uuid, p_ciclo uuid, p_aceitar_faltantes boolean, p_por uuid)
RETURNS integer
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  v_ciclo leitura.ciclos%ROWTYPE;
  v_min   numeric;
  v_falta integer;
BEGIN
  IF p_por IS NULL THEN RAISE EXCEPTION 'Autoria obrigatoria'; END IF;
  SELECT * INTO v_ciclo FROM leitura.ciclos WHERE id = p_ciclo AND tenant_id = p_tenant FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ciclo nao encontrado'; END IF;
  IF v_ciclo.status <> 'aberto' THEN RAISE EXCEPTION 'Ciclo ja fechado'; END IF;
  SELECT co.minimo_cobranca INTO v_min FROM leitura.condominios co WHERE co.id = v_ciclo.condominio_id FOR UPDATE;

  CREATE TEMP TABLE _previa ON COMMIT DROP AS SELECT * FROM leitura.previa_ciclo(p_tenant, p_ciclo);
  SELECT count(*) INTO v_falta FROM _previa WHERE situacao = 'sem_leitura';
  IF v_falta > 0 AND NOT coalesce(p_aceitar_faltantes, false) THEN
    RAISE EXCEPTION 'FALTAM_LEITURAS: % unidade(s) sem leitura', v_falta;
  END IF;

  INSERT INTO leitura.cobrancas (tenant_id, unidade_id, ciclo_id, leitura_id, cliente_id, base_medidor_id,
                                 base_valor, consumo, preco_m3, preco_origem, valor, situacao, criado_por)
  SELECT p_tenant, x.unidade_id, p_ciclo, x.leitura_id, x.cliente_id, x.base_medidor_id, x.base_valor,
         x.consumo, x.preco_m3, x.preco_origem, x.valor, x.situacao, p_por
    FROM _previa x WHERE x.situacao <> 'sem_leitura';

  -- em aberto das unidades cobradas agora foi junto
  UPDATE leitura.cobrancas pend SET quitada_por = nova.id
    FROM leitura.cobrancas nova
   WHERE nova.ciclo_id = p_ciclo AND nova.situacao = 'cobrar'
     AND pend.unidade_id = nova.unidade_id AND pend.consumo_em_aberto IS NOT NULL AND pend.quitada_por IS NULL;

  UPDATE leitura.ciclos SET status = 'fechado', minimo_cobranca = v_min, fechado_por = p_por, fechado_em = now()
   WHERE id = p_ciclo;
  DROP TABLE _previa;
  RETURN v_falta;
END;
$$;

CREATE OR REPLACE FUNCTION leitura.registrar_saida(p_tenant uuid, p_unidade uuid, p_data date, p_valor numeric,
                                        p_quem_leu text, p_foto_path text, p_observacao text,
                                        p_conferido boolean, p_por uuid)
RETURNS uuid
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  v_central uuid;
  v_med     uuid;
  v_cliente uuid;
  v_leitura uuid;
  b         record;
  p         record;
  v_consumo numeric;
  v_id      uuid;
BEGIN
  IF p_por IS NULL THEN RAISE EXCEPTION 'Autoria obrigatoria'; END IF;
  IF p_data IS NULL THEN RAISE EXCEPTION 'Data obrigatoria'; END IF;
  SELECT u.central_id INTO v_central FROM leitura.unidades u
   WHERE u.id = p_unidade AND u.tenant_id = p_tenant AND u.ativa FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unidade nao encontrada'; END IF;
  SELECT m.id INTO v_med FROM leitura.medidores m WHERE m.unidade_id = p_unidade AND m.retirado_em IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unidade sem medidor'; END IF;
  PERFORM 1 FROM leitura.leituras l JOIN leitura.ciclos c ON c.id = l.ciclo_id
   WHERE c.status = 'aberto' AND l.medidor_id IN (SELECT id FROM leitura.medidores WHERE unidade_id = p_unidade);
  IF FOUND THEN RAISE EXCEPTION 'Unidade com leitura em ciclo aberto: feche o ciclo ou remova a leitura'; END IF;

  PERFORM leitura._validar_leitura(p_tenant, v_med, p_data, p_valor, NULL, p_quem_leu, p_conferido);
  IF p_quem_leu = 'libergas' AND nullif(btrim(p_foto_path), '') IS NULL THEN
    RAISE EXCEPTION 'Foto obrigatoria (leitura da Libergas)';
  END IF;
  SELECT * INTO b FROM leitura._base_cobranca(p_unidade);
  IF p_data < b.data THEN RAISE EXCEPTION 'Data anterior a ultima leitura cobrada'; END IF;
  v_consumo := leitura._consumo(p_unidade, b.medidor_id, b.valor, v_med, p_valor) + leitura._em_aberto(p_unidade);
  SELECT * INTO p FROM leitura.preco_m3_em(p_tenant, v_central, p_data);
  IF p.preco_m3 IS NULL THEN RAISE EXCEPTION 'Sem preco do P45 para o condominio'; END IF;
  SELECT o.cliente_id INTO v_cliente FROM leitura.unidade_ocupantes o
   WHERE o.unidade_id = p_unidade AND o.desde <= p_data AND (o.ate IS NULL OR o.ate > p_data)
   ORDER BY o.desde DESC LIMIT 1;

  INSERT INTO leitura.leituras (tenant_id, medidor_id, ciclo_id, tipo, data, valor, quem_leu, foto_path,
                                consumo_conferido, observacao, registrado_por)
  VALUES (p_tenant, v_med, NULL, 'saida', p_data, p_valor, p_quem_leu, nullif(btrim(p_foto_path), ''),
          coalesce(p_conferido, false), nullif(btrim(p_observacao), ''), p_por)
  RETURNING id INTO v_leitura;
  INSERT INTO leitura.cobrancas (tenant_id, unidade_id, ciclo_id, leitura_id, cliente_id, base_medidor_id,
                                 base_valor, consumo, preco_m3, preco_origem, valor, situacao, criado_por)
  VALUES (p_tenant, p_unidade, NULL, v_leitura, v_cliente, b.medidor_id, b.valor, v_consumo, p.preco_m3,
          p.origem, round(v_consumo * p.preco_m3, 2), 'cobrar', p_por)
  RETURNING id INTO v_id;
  -- consumo em aberto de meses anteriores foi junto nesta cobranca
  UPDATE leitura.cobrancas SET quitada_por = v_id
   WHERE unidade_id = p_unidade AND consumo_em_aberto IS NOT NULL AND quitada_por IS NULL;
  RETURN v_id;
END;
$$;

-- ===== 3. PERMISSOES =====
REVOKE ALL ON FUNCTION leitura._em_aberto(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION leitura._em_aberto(uuid) TO service_role;
REVOKE ALL ON FUNCTION leitura.previa_ciclo(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION leitura.previa_ciclo(uuid, uuid) TO service_role;
REVOKE ALL ON FUNCTION leitura.fechar_ciclo(uuid, uuid, boolean, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION leitura.fechar_ciclo(uuid, uuid, boolean, uuid) TO service_role;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20261029180000', 'leitura_em_aberto_e_historico')
ON CONFLICT (version) DO NOTHING;
