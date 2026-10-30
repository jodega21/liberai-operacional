-- 20261029171000_leitura_ajustes_validacao
-- STATUS: APLICADA via Studio em 29/10/2026 (2a execucao; a 1a falhou no registro da version e foi desfeita). RENUMERADA de 20261029170000 em 29/10: a version 20261029170000 ja era do liberai-financeiro (entregadores_pessoas_contract) - a tabela de versions e a mesma para os 3 apps. Testada no PGlite. Depende de 20261029130000. Registra a propria
-- version no fim (arquivo inteiro num comando).
--
-- CONTEXTO: LEI2, primeira validacao de Daniel no browser (29/10). Achados confirmados no banco:
-- (1) leitura mensal com data 20/10 aceita depois de uma saida cobrada em 29/10 na mesma unidade ->
--     previa_ciclo travou ("leitura anterior a ultima cobrada"); (2) leitura digitada sem virgula
--     (136000 em vez de 136,000) passou sem alerta: o R2 depende de historico e logo apos a carga nao
--     ha; (3) com leitura invalida a mensagem era a da foto (checada antes); (4) ciclo aberto no mes
--     errado nao tinha como sair.
--
-- MUDANCAS:
-- - _validar_leitura: sem historico, consumo > 30 m3 desde a anterior exige "conferi" (Daniel pode
--   mudar o limite; maior mes do Monte Castelo em 2026 = 27,4 m3).
-- - registrar_leitura: recusa data anterior a ultima leitura cobrada da unidade; foto checada DEPOIS
--   da leitura; numa correcao sem foto nova vale a foto ja salva.
-- - registrar_saida: foto checada depois da leitura.
-- - excluir_ciclo (nova): apaga ciclo ABERTO e SEM leituras (mes aberto errado). App: so quem fecha.
--
-- ROLLBACK (nao executar junto): recriar as 3 funcoes da 20261029130000 e
-- DROP FUNCTION leitura.excluir_ciclo(uuid, uuid, uuid);
-- DELETE FROM supabase_migrations.schema_migrations WHERE version = '20261029171000';

CREATE OR REPLACE FUNCTION leitura._validar_leitura(p_tenant uuid, p_medidor uuid, p_data date, p_valor numeric,
                                         p_ignorar text, p_quem_leu text, p_conferido boolean)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $$
DECLARE
  v_med       leitura.medidores%ROWTYPE;
  v_ant_valor numeric;
  v_ant_data  date;
  v_seg_valor numeric;
  v_hist_valor numeric;
  v_hist_data date;
  v_esperado  numeric;
  v_consumo   numeric;
BEGIN
  SELECT * INTO v_med FROM leitura.medidores WHERE id = p_medidor AND tenant_id = p_tenant;
  IF NOT FOUND THEN RAISE EXCEPTION 'Medidor nao encontrado'; END IF;
  IF p_data IS NULL THEN RAISE EXCEPTION 'Data obrigatoria'; END IF;
  IF p_valor IS NULL OR p_valor < 0 THEN RAISE EXCEPTION 'Leitura invalida'; END IF;
  IF p_valor <> round(p_valor, 3) THEN RAISE EXCEPTION 'Leitura com mais de 3 casas'; END IF;
  IF p_data < v_med.instalado_em THEN RAISE EXCEPTION 'Data anterior a instalacao do medidor'; END IF;
  IF v_med.retirado_em IS NOT NULL AND (p_data > v_med.retirado_em OR p_valor > v_med.leitura_final) THEN
    RAISE EXCEPTION 'Medidor ja retirado nessa data';
  END IF;

  -- anterior: ultima leitura do medidor antes (ou no mesmo dia) desta data; sem nenhuma, a inicial
  SELECT l.valor, l.data INTO v_ant_valor, v_ant_data FROM leitura.leituras l
   WHERE l.medidor_id = p_medidor AND l.data <= p_data AND l.id::text IS DISTINCT FROM p_ignorar
   ORDER BY l.data DESC, l.valor DESC LIMIT 1;
  IF NOT FOUND THEN v_ant_valor := v_med.leitura_inicial; v_ant_data := v_med.instalado_em; END IF;
  IF p_valor < v_ant_valor THEN
    RAISE EXCEPTION 'Leitura menor que a anterior (% em %)', v_ant_valor, to_char(v_ant_data, 'DD/MM/YYYY');
  END IF;
  SELECT l.valor INTO v_seg_valor FROM leitura.leituras l
   WHERE l.medidor_id = p_medidor AND l.data > p_data AND l.id::text IS DISTINCT FROM p_ignorar
   ORDER BY l.data, l.valor LIMIT 1;
  IF FOUND AND p_valor > v_seg_valor THEN RAISE EXCEPTION 'Leitura maior que a seguinte (%)', v_seg_valor; END IF;

  v_consumo := p_valor - v_ant_valor;

  -- R2: media diaria entre a leitura mais antiga dos ~6 meses antes da anterior e a anterior
  SELECT x.valor, x.data INTO v_hist_valor, v_hist_data FROM (
    SELECT l.valor, l.data FROM leitura.leituras l
     WHERE l.medidor_id = p_medidor AND l.data < v_ant_data AND l.data >= v_ant_data - 200
       AND l.id::text IS DISTINCT FROM p_ignorar
    UNION ALL
    SELECT v_med.leitura_inicial, v_med.instalado_em
     WHERE v_med.instalado_em < v_ant_data AND v_med.instalado_em >= v_ant_data - 200
  ) x ORDER BY x.data LIMIT 1;
  IF FOUND AND v_ant_data - v_hist_data >= 25 AND p_data > v_ant_data THEN
    v_esperado := (v_ant_valor - v_hist_valor) / (v_ant_data - v_hist_data) * (p_data - v_ant_data);
    IF v_consumo > greatest(10, 3 * v_esperado) AND NOT coalesce(p_conferido, false) THEN
      RAISE EXCEPTION 'CONSUMO_ALTO: % m3 (esperado cerca de % m3). Confira a leitura.',
        round(v_consumo, 3), round(v_esperado, 1);
    END IF;
  ELSIF v_consumo > 30 AND NOT coalesce(p_conferido, false) THEN
    -- Sem historico (ex.: logo depois da carga): limite fixo de 30 m3 desde a anterior.
    RAISE EXCEPTION 'CONSUMO_ALTO: % m3 (sem historico; acima de 30 m3). Confira a leitura.', round(v_consumo, 3);
  END IF;

  IF p_quem_leu IS NULL OR p_quem_leu NOT IN ('libergas', 'sindico') THEN RAISE EXCEPTION 'Quem leu invalido'; END IF;
  RETURN v_consumo;
END;
$$;

CREATE OR REPLACE FUNCTION leitura.registrar_leitura(p_tenant uuid, p_ciclo uuid, p_medidor uuid, p_data date,
                                          p_valor numeric, p_foto_path text, p_observacao text,
                                          p_conferido boolean, p_por uuid)
RETURNS uuid
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  v_ciclo   leitura.ciclos%ROWTYPE;
  v_quem    text;
  v_data    date;
  v_atual   uuid;
  v_unidade uuid;
  v_base    date;
  v_id      uuid;
BEGIN
  IF p_por IS NULL THEN RAISE EXCEPTION 'Autoria obrigatoria'; END IF;
  SELECT * INTO v_ciclo FROM leitura.ciclos WHERE id = p_ciclo AND tenant_id = p_tenant FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ciclo nao encontrado'; END IF;
  IF v_ciclo.status <> 'aberto' THEN RAISE EXCEPTION 'Ciclo fechado'; END IF;
  SELECT co.quem_le, u.id INTO v_quem, v_unidade
    FROM leitura.medidores m
    JOIN leitura.unidades u ON u.id = m.unidade_id
    JOIN leitura.centrais ce ON ce.id = u.central_id
    JOIN leitura.condominios co ON co.id = ce.condominio_id
   WHERE m.id = p_medidor AND m.tenant_id = p_tenant AND co.id = v_ciclo.condominio_id AND u.ativa
     AND m.retirado_em IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Medidor nao e o atual de unidade ativa deste condominio'; END IF;
  v_data := coalesce(p_data, v_ciclo.data_leitura);
  IF v_data NOT BETWEEN v_ciclo.data_leitura - 15 AND v_ciclo.data_leitura + 15 THEN
    RAISE EXCEPTION 'Data longe da data do ciclo';
  END IF;
  SELECT b.data INTO v_base FROM leitura._base_cobranca(v_unidade) b;
  IF v_data < v_base THEN RAISE EXCEPTION 'Data anterior a ultima leitura cobrada'; END IF;

  SELECT id INTO v_atual FROM leitura.leituras WHERE ciclo_id = p_ciclo AND medidor_id = p_medidor FOR UPDATE;
  PERFORM leitura._validar_leitura(p_tenant, p_medidor, v_data, p_valor, v_atual::text, v_quem, p_conferido);
  -- Foto depois da leitura (a mensagem certa primeiro). Numa correcao, a foto ja salva vale.
  IF v_quem = 'libergas' AND nullif(btrim(p_foto_path), '') IS NULL
     AND NOT EXISTS (SELECT 1 FROM leitura.leituras WHERE id = v_atual AND foto_path IS NOT NULL) THEN
    RAISE EXCEPTION 'Foto obrigatoria (leitura da Libergas)';
  END IF;

  IF v_atual IS NULL THEN
    INSERT INTO leitura.leituras (tenant_id, medidor_id, ciclo_id, tipo, data, valor, quem_leu, foto_path,
                                  consumo_conferido, observacao, registrado_por)
    VALUES (p_tenant, p_medidor, p_ciclo, 'mensal', v_data, p_valor, v_quem, nullif(btrim(p_foto_path), ''),
            coalesce(p_conferido, false), nullif(btrim(p_observacao), ''), p_por)
    RETURNING id INTO v_id;
  ELSE
    UPDATE leitura.leituras
       SET data = v_data, valor = p_valor, foto_path = coalesce(nullif(btrim(p_foto_path), ''), foto_path),
           consumo_conferido = coalesce(p_conferido, false), observacao = nullif(btrim(p_observacao), ''),
           atualizado_por = p_por, atualizado_em = now()
     WHERE id = v_atual
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
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
  v_consumo := leitura._consumo(p_unidade, b.medidor_id, b.valor, v_med, p_valor);
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
  RETURN v_id;
END;
$$;

-- Apaga um ciclo aberto sem nenhuma leitura (aberto no mes errado).
CREATE FUNCTION leitura.excluir_ciclo(p_tenant uuid, p_ciclo uuid, p_por uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF p_por IS NULL THEN RAISE EXCEPTION 'Autoria obrigatoria'; END IF;
  PERFORM 1 FROM leitura.ciclos WHERE id = p_ciclo AND tenant_id = p_tenant AND status = 'aberto' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ciclo nao encontrado ou fechado'; END IF;
  PERFORM 1 FROM leitura.leituras WHERE ciclo_id = p_ciclo;
  IF FOUND THEN RAISE EXCEPTION 'Ciclo com leituras: remova as leituras antes'; END IF;
  DELETE FROM leitura.ciclos WHERE id = p_ciclo;
END;
$$;
REVOKE ALL ON FUNCTION leitura.excluir_ciclo(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION leitura.excluir_ciclo(uuid, uuid, uuid) TO service_role;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20261029171000', 'leitura_ajustes_validacao')
ON CONFLICT (version) DO NOTHING;
