-- 20261029130000_leitura_lancamento
-- STATUS: APLICADA via Studio em 29/10/2026; version registrada em seguida. Testada no PGlite (supabase/testes). Depende de 2026102812000000 e 20261029120000
-- (liberai-cadastros).
--
-- CONTEXTO: LEI2, primeiro modulo do sistema operacional novo (G1-B, decidido por Daniel em 28/10/2026):
-- lancamento mensal da leitura dos medidores dos condominios. O cadastro (condominio, central, unidade,
-- ocupante, medidor) e do liberai-cadastros; o lancamento e daqui. Estas tabelas sao escritas so por
-- este repo (F5-A).
--
-- DECISOES (Daniel, 28/10):
-- - IA nao le a foto: o operador digita a leitura; a foto fica como registro (obrigatoria quando quem
--   le e a Libergas, opcional quando e o sindico - F7-A; o sindico manda as leituras por e-mail).
-- - F3-A ciclo mensal por condominio; no fechamento o preco do m3 (leitura.preco_m3_em na data da
--   leitura) e o minimo de cobranca ficam congelados.
-- - F6-A grava sempre a leitura real. A cobranca da unidade parte da ULTIMA LEITURA COBRADA (ou da
--   leitura inicial do primeiro medidor); valor abaixo do minimo do condominio = "acumula" (nao cobra e a
--   base nao anda).
-- - R1-A leitura menor que a anterior do medidor e recusada (medidor trocado = troca no cadastro).
-- - R2 consumo acima de max(10 m3, 3x o consumo esperado pela media diaria dos ultimos ~6 meses do
--   medidor) exige "conferi" (p_conferido).
-- - R3-B o ciclo fecha com unidade sem leitura se o operador confirmar; ela fica sem cobranca no mes.
-- - R4-A saida do morador: leitura avulsa no dia, cobrada na hora mesmo abaixo do minimo.
-- - Ciclo fechado nao muda; so o ultimo ciclo do condominio pode ser reaberto (Administrador, no app).
-- - O sistema NAO gera NF nem boleto (seguem no BS, como hoje).
--
-- SEGURANCA: padrao do D68. Tabelas com RLS e sem policy, grants so service_role; funcoes SECURITY
-- INVOKER, search_path = '', EXECUTE so service_role, autoria por p_por. O app prova a chave antes.
-- FOTOS: bucket privado "leitura-fotos" no Supabase Storage (criado a parte pelo Studio); aqui so o
-- caminho do arquivo.
--
-- ROLLBACK (nao executar junto):
-- DROP FUNCTION leitura.registrar_saida(uuid, uuid, date, numeric, text, text, text, boolean, uuid);
-- DROP FUNCTION leitura.reabrir_ciclo(uuid, uuid, uuid);
-- DROP FUNCTION leitura.fechar_ciclo(uuid, uuid, boolean, uuid);
-- DROP FUNCTION leitura.previa_ciclo(uuid, uuid);
-- DROP FUNCTION leitura.remover_leitura(uuid, uuid, uuid);
-- DROP FUNCTION leitura.registrar_leitura(uuid, uuid, uuid, date, numeric, text, text, boolean, uuid);
-- DROP FUNCTION leitura.abrir_ciclo(uuid, uuid, date, date, uuid);
-- DROP FUNCTION leitura._validar_leitura(uuid, uuid, date, numeric, text, text, boolean);
-- DROP FUNCTION leitura._consumo(uuid, uuid, numeric, uuid, numeric);
-- DROP FUNCTION leitura._base_cobranca(uuid);
-- DROP TABLE leitura.cobrancas, leitura.leituras, leitura.ciclos;
-- DELETE FROM supabase_migrations.schema_migrations WHERE version = '20261029130000';

-- ===== 1. TABELAS =====

CREATE TABLE leitura.ciclos (
  id               uuid          NOT NULL DEFAULT gen_random_uuid(),
  tenant_id        uuid          NOT NULL,
  condominio_id    uuid          NOT NULL,
  referencia       date          NOT NULL,
  data_leitura     date          NOT NULL,
  status           text          NOT NULL DEFAULT 'aberto',
  minimo_cobranca  numeric(10,2),
  criado_por       uuid          NOT NULL,
  criado_em        timestamptz   NOT NULL DEFAULT now(),
  fechado_por      uuid,
  fechado_em       timestamptz,
  CONSTRAINT ciclos_pkey PRIMARY KEY (id),
  CONSTRAINT ciclos_referencia_check CHECK (referencia = date_trunc('month', referencia)::date),
  CONSTRAINT ciclos_data_check CHECK (data_leitura BETWEEN referencia - 31 AND referencia + 62),
  CONSTRAINT ciclos_status_check CHECK (
    (status = 'aberto' AND fechado_por IS NULL AND fechado_em IS NULL AND minimo_cobranca IS NULL)
    OR (status = 'fechado' AND fechado_por IS NOT NULL AND fechado_em IS NOT NULL AND minimo_cobranca IS NOT NULL)),
  CONSTRAINT ciclos_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT ciclos_condominio_id_fkey FOREIGN KEY (condominio_id) REFERENCES leitura.condominios(id)
);
CREATE UNIQUE INDEX ciclos_condominio_referencia_key ON leitura.ciclos (condominio_id, referencia);
CREATE UNIQUE INDEX ciclos_um_aberto_key ON leitura.ciclos (condominio_id) WHERE status = 'aberto';

-- Leitura real do medidor. tipo 'mensal' pertence a um ciclo; 'saida' e avulsa (morador saindo).
CREATE TABLE leitura.leituras (
  id               uuid          NOT NULL DEFAULT gen_random_uuid(),
  tenant_id        uuid          NOT NULL,
  medidor_id       uuid          NOT NULL,
  ciclo_id         uuid,
  tipo             text          NOT NULL,
  data             date          NOT NULL,
  valor            numeric(12,3) NOT NULL,
  quem_leu         text          NOT NULL,
  foto_path        text,
  consumo_conferido boolean      NOT NULL DEFAULT false,
  observacao       text,
  registrado_por   uuid          NOT NULL,
  registrado_em    timestamptz   NOT NULL DEFAULT now(),
  atualizado_por   uuid,
  atualizado_em    timestamptz,
  CONSTRAINT leituras_pkey PRIMARY KEY (id),
  CONSTRAINT leituras_tipo_check CHECK ((tipo = 'mensal') = (ciclo_id IS NOT NULL) AND tipo IN ('mensal', 'saida')),
  CONSTRAINT leituras_valor_check CHECK (valor >= 0),
  CONSTRAINT leituras_quem_leu_check CHECK (quem_leu IN ('libergas', 'sindico')),
  CONSTRAINT leituras_foto_check CHECK (quem_leu = 'sindico' OR foto_path IS NOT NULL),
  CONSTRAINT leituras_foto_path_check CHECK (foto_path IS NULL OR (btrim(foto_path) <> '' AND length(foto_path) <= 300)),
  CONSTRAINT leituras_observacao_check CHECK (observacao IS NULL OR length(observacao) <= 500),
  CONSTRAINT leituras_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT leituras_medidor_id_fkey FOREIGN KEY (medidor_id) REFERENCES leitura.medidores(id),
  CONSTRAINT leituras_ciclo_id_fkey FOREIGN KEY (ciclo_id) REFERENCES leitura.ciclos(id)
);
CREATE UNIQUE INDEX leituras_ciclo_medidor_key ON leitura.leituras (ciclo_id, medidor_id) WHERE ciclo_id IS NOT NULL;
CREATE INDEX leituras_medidor_data_idx ON leitura.leituras (medidor_id, data);

-- Resultado por unidade: no fechamento do ciclo (ciclo_id) ou na saida do morador (ciclo_id NULL).
CREATE TABLE leitura.cobrancas (
  id               uuid          NOT NULL DEFAULT gen_random_uuid(),
  tenant_id        uuid          NOT NULL,
  unidade_id       uuid          NOT NULL,
  ciclo_id         uuid,
  leitura_id       uuid          NOT NULL,
  cliente_id       uuid,
  base_medidor_id  uuid          NOT NULL,
  base_valor       numeric(12,3) NOT NULL,
  consumo          numeric(12,3) NOT NULL,
  preco_m3         numeric(10,2) NOT NULL,
  preco_origem     text,
  valor            numeric(12,2) NOT NULL,
  situacao         text          NOT NULL,
  criado_por       uuid          NOT NULL,
  criado_em        timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT cobrancas_pkey PRIMARY KEY (id),
  CONSTRAINT cobrancas_situacao_check CHECK (situacao IN ('cobrar', 'acumula')),
  CONSTRAINT cobrancas_saida_check CHECK (ciclo_id IS NOT NULL OR situacao = 'cobrar'),
  CONSTRAINT cobrancas_consumo_check CHECK (consumo >= 0 AND valor >= 0),
  CONSTRAINT cobrancas_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
  CONSTRAINT cobrancas_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES leitura.unidades(id),
  CONSTRAINT cobrancas_ciclo_id_fkey FOREIGN KEY (ciclo_id) REFERENCES leitura.ciclos(id),
  CONSTRAINT cobrancas_leitura_id_fkey FOREIGN KEY (leitura_id) REFERENCES leitura.leituras(id),
  CONSTRAINT cobrancas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT cobrancas_base_medidor_id_fkey FOREIGN KEY (base_medidor_id) REFERENCES leitura.medidores(id)
);
CREATE UNIQUE INDEX cobrancas_leitura_key ON leitura.cobrancas (leitura_id);
CREATE INDEX cobrancas_unidade_idx ON leitura.cobrancas (unidade_id, criado_em);
CREATE INDEX cobrancas_ciclo_idx ON leitura.cobrancas (ciclo_id);
CREATE INDEX cobrancas_cliente_idx ON leitura.cobrancas (cliente_id);

ALTER TABLE leitura.ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE leitura.leituras ENABLE ROW LEVEL SECURITY;
ALTER TABLE leitura.cobrancas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON leitura.ciclos, leitura.leituras, leitura.cobrancas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leitura.ciclos, leitura.leituras, leitura.cobrancas TO service_role;

-- ===== 2. AUXILIARES =====

-- Ponto de partida da proxima cobranca da unidade: a leitura da ultima cobranca 'cobrar'; sem nenhuma,
-- a leitura inicial do primeiro medidor.
CREATE FUNCTION leitura._base_cobranca(p_unidade uuid)
RETURNS TABLE (medidor_id uuid, valor numeric, data date)
LANGUAGE sql
STABLE
SET search_path TO ''
AS $$
  (SELECT l.medidor_id, l.valor, l.data
     FROM leitura.cobrancas c JOIN leitura.leituras l ON l.id = c.leitura_id
    WHERE c.unidade_id = p_unidade AND c.situacao = 'cobrar'
    ORDER BY l.data DESC, c.criado_em DESC LIMIT 1)
  UNION ALL
  (SELECT m.id, m.leitura_inicial, m.instalado_em
     FROM leitura.medidores m
    WHERE m.unidade_id = p_unidade
      AND NOT EXISTS (SELECT 1 FROM leitura.cobrancas c
                       WHERE c.unidade_id = p_unidade AND c.situacao = 'cobrar')
    ORDER BY m.instalado_em, m.criado_em LIMIT 1)
$$;

-- Consumo entre (medidor base, valor base) e (medidor atual, valor atual) da mesma unidade, somando
-- os medidores trocados no meio: (final do base - base) + (final - inicial dos do meio) + (atual - inicial).
CREATE FUNCTION leitura._consumo(p_unidade uuid, p_med_base uuid, p_val_base numeric,
                                 p_med_atual uuid, p_val_atual numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $$
DECLARE
  m        record;
  v_total  numeric := 0;
  v_dentro boolean := false;
BEGIN
  IF p_med_base = p_med_atual THEN
    IF p_val_atual < p_val_base THEN RAISE EXCEPTION 'Leitura menor que a base da cobranca'; END IF;
    RETURN p_val_atual - p_val_base;
  END IF;
  FOR m IN SELECT * FROM leitura.medidores WHERE unidade_id = p_unidade ORDER BY instalado_em, criado_em LOOP
    IF m.id = p_med_base THEN
      IF m.leitura_final IS NULL THEN RAISE EXCEPTION 'Medidor base sem leitura final'; END IF;
      IF m.leitura_final < p_val_base THEN RAISE EXCEPTION 'Leitura final menor que a base da cobranca'; END IF;
      v_total := m.leitura_final - p_val_base;
      v_dentro := true;
    ELSIF v_dentro AND m.id = p_med_atual THEN
      RETURN v_total + (p_val_atual - m.leitura_inicial);
    ELSIF v_dentro THEN
      v_total := v_total + (m.leitura_final - m.leitura_inicial);
    END IF;
  END LOOP;
  RAISE EXCEPTION 'Medidores fora de ordem na unidade';
END;
$$;

-- Valida uma leitura do medidor: unidade/medidor no tenant, data no periodo do medidor, 3 casas, entre a
-- leitura anterior e a seguinte do mesmo medidor (R1-A), foto e consumo alto (R2). p_ignorar = a propria
-- leitura numa edicao. Devolve o consumo desde a leitura anterior.
CREATE FUNCTION leitura._validar_leitura(p_tenant uuid, p_medidor uuid, p_data date, p_valor numeric,
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
  END IF;

  IF p_quem_leu IS NULL OR p_quem_leu NOT IN ('libergas', 'sindico') THEN RAISE EXCEPTION 'Quem leu invalido'; END IF;
  RETURN v_consumo;
END;
$$;

-- ===== 3. ESCRITA =====

CREATE FUNCTION leitura.abrir_ciclo(p_tenant uuid, p_condominio uuid, p_referencia date,
                                    p_data_leitura date, p_por uuid)
RETURNS uuid
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_por IS NULL THEN RAISE EXCEPTION 'Autoria obrigatoria'; END IF;
  IF p_referencia IS NULL OR p_referencia <> date_trunc('month', p_referencia)::date THEN
    RAISE EXCEPTION 'Mes de referencia invalido';
  END IF;
  IF p_data_leitura IS NULL OR p_data_leitura NOT BETWEEN p_referencia - 31 AND p_referencia + 62 THEN
    RAISE EXCEPTION 'Data da leitura fora do mes de referencia';
  END IF;
  PERFORM 1 FROM leitura.condominios c WHERE c.id = p_condominio AND c.tenant_id = p_tenant AND c.ativo FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Condominio nao encontrado ou inativo'; END IF;
  PERFORM 1 FROM leitura.ciclos c WHERE c.condominio_id = p_condominio AND c.status = 'aberto';
  IF FOUND THEN RAISE EXCEPTION 'Ja ha um ciclo aberto neste condominio'; END IF;
  PERFORM 1 FROM leitura.ciclos c WHERE c.condominio_id = p_condominio AND c.referencia >= p_referencia;
  IF FOUND THEN RAISE EXCEPTION 'Ja ha ciclo deste mes ou posterior'; END IF;
  INSERT INTO leitura.ciclos (tenant_id, condominio_id, referencia, data_leitura, criado_por)
  VALUES (p_tenant, p_condominio, p_referencia, p_data_leitura, p_por)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Lanca ou corrige (mesmo ciclo e medidor) a leitura mensal. p_data NULL = data do ciclo.
-- Devolve o id da leitura.
CREATE FUNCTION leitura.registrar_leitura(p_tenant uuid, p_ciclo uuid, p_medidor uuid, p_data date,
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
  v_id      uuid;
BEGIN
  IF p_por IS NULL THEN RAISE EXCEPTION 'Autoria obrigatoria'; END IF;
  SELECT * INTO v_ciclo FROM leitura.ciclos WHERE id = p_ciclo AND tenant_id = p_tenant FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ciclo nao encontrado'; END IF;
  IF v_ciclo.status <> 'aberto' THEN RAISE EXCEPTION 'Ciclo fechado'; END IF;
  SELECT co.quem_le INTO v_quem
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
  IF v_quem = 'libergas' AND nullif(btrim(p_foto_path), '') IS NULL THEN
    RAISE EXCEPTION 'Foto obrigatoria (leitura da Libergas)';
  END IF;

  SELECT id INTO v_atual FROM leitura.leituras WHERE ciclo_id = p_ciclo AND medidor_id = p_medidor FOR UPDATE;
  PERFORM leitura._validar_leitura(p_tenant, p_medidor, v_data, p_valor, v_atual::text, v_quem, p_conferido);

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

CREATE FUNCTION leitura.remover_leitura(p_tenant uuid, p_leitura uuid, p_por uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF p_por IS NULL THEN RAISE EXCEPTION 'Autoria obrigatoria'; END IF;
  DELETE FROM leitura.leituras l
   USING leitura.ciclos c
   WHERE l.id = p_leitura AND l.tenant_id = p_tenant AND c.id = l.ciclo_id AND c.status = 'aberto';
  IF NOT FOUND THEN RAISE EXCEPTION 'Leitura nao encontrada ou ciclo fechado'; END IF;
END;
$$;

-- Previa do ciclo: uma linha por unidade ativa do condominio. situacao 'sem_leitura' quando a unidade
-- nao tem leitura no ciclo. Usada pela tela e pelo fechamento.
CREATE FUNCTION leitura.previa_ciclo(p_tenant uuid, p_ciclo uuid)
RETURNS TABLE (unidade_id uuid, identificacao text, central_id uuid, cliente_id uuid, leitura_id uuid,
               medidor_id uuid, base_medidor_id uuid, base_valor numeric, valor_atual numeric,
               consumo numeric, preco_m3 numeric, preco_origem text, valor numeric, situacao text)
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
    SELECT * INTO p FROM leitura.preco_m3_em(p_tenant, u.central_id, v_ciclo.data_leitura);
    preco_m3 := p.preco_m3; preco_origem := p.origem;
    IF u.leitura_id IS NULL THEN
      consumo := NULL; valor := NULL; situacao := 'sem_leitura';
    ELSE
      IF u.data < b.data THEN RAISE EXCEPTION 'Unidade %: leitura anterior a ultima cobrada', u.identificacao; END IF;
      consumo := leitura._consumo(u.id, b.medidor_id, b.valor, u.medidor_id, u.valor);
      IF preco_m3 IS NULL THEN RAISE EXCEPTION 'Sem preco do P45 para o condominio'; END IF;
      valor := round(consumo * preco_m3, 2);
      situacao := CASE WHEN valor >= v_min AND valor > 0 THEN 'cobrar' ELSE 'acumula' END;
    END IF;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Fecha o ciclo: grava as cobrancas (cobrar/acumula) e congela o minimo. Com unidade sem leitura,
-- exige p_aceitar_faltantes (R3-B). Devolve quantas unidades ficaram sem leitura.
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

  UPDATE leitura.ciclos SET status = 'fechado', minimo_cobranca = v_min, fechado_por = p_por, fechado_em = now()
   WHERE id = p_ciclo;
  DROP TABLE _previa;
  RETURN v_falta;
END;
$$;

-- Reabre o ultimo ciclo do condominio (apaga as cobrancas dele). Recusa se houve saida cobrada depois
-- do fechamento numa unidade do condominio (a base dela veio deste ciclo).
CREATE FUNCTION leitura.reabrir_ciclo(p_tenant uuid, p_ciclo uuid, p_por uuid)
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

-- Saida do morador (R4-A): leitura avulsa do medidor atual da unidade e cobranca na hora, mesmo
-- abaixo do minimo. Recusa se a unidade tiver leitura num ciclo aberto (feche ou remova antes).
-- Devolve o id da cobranca. A troca do ocupante segue no cadastro (leitura.definir_ocupante).
CREATE FUNCTION leitura.registrar_saida(p_tenant uuid, p_unidade uuid, p_data date, p_valor numeric,
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
  IF p_quem_leu = 'libergas' AND nullif(btrim(p_foto_path), '') IS NULL THEN
    RAISE EXCEPTION 'Foto obrigatoria (leitura da Libergas)';
  END IF;
  PERFORM 1 FROM leitura.leituras l JOIN leitura.ciclos c ON c.id = l.ciclo_id
   WHERE c.status = 'aberto' AND l.medidor_id IN (SELECT id FROM leitura.medidores WHERE unidade_id = p_unidade);
  IF FOUND THEN RAISE EXCEPTION 'Unidade com leitura em ciclo aberto: feche o ciclo ou remova a leitura'; END IF;

  PERFORM leitura._validar_leitura(p_tenant, v_med, p_data, p_valor, NULL, p_quem_leu, p_conferido);
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

-- ===== 4. PERMISSOES DAS FUNCOES =====

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'leitura._base_cobranca(uuid)',
    'leitura._consumo(uuid, uuid, numeric, uuid, numeric)',
    'leitura._validar_leitura(uuid, uuid, date, numeric, text, text, boolean)',
    'leitura.abrir_ciclo(uuid, uuid, date, date, uuid)',
    'leitura.registrar_leitura(uuid, uuid, uuid, date, numeric, text, text, boolean, uuid)',
    'leitura.remover_leitura(uuid, uuid, uuid)',
    'leitura.previa_ciclo(uuid, uuid)',
    'leitura.fechar_ciclo(uuid, uuid, boolean, uuid)',
    'leitura.reabrir_ciclo(uuid, uuid, uuid)',
    'leitura.registrar_saida(uuid, uuid, date, numeric, text, text, text, boolean, uuid)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END;
$$;
