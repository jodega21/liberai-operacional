import 'server-only';
import { TENANT_ID } from '@/lib/constants';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { lerPaginado } from './paginar';
import {
  BUCKET_FOTOS,
  mensagemErro,
  type CicloCompleto,
  type CicloResumo,
  type CondominioDetalhe,
  formatarM3,
  rotuloMes,
  tipoPadrao,
  vencimento,
  type TipoDocumento,
  type CondominioLista,
  type LinhaCiclo,
  type QuemLe,
  type Situacao,
} from './modelo';

// Service role (burla RLS): so chamar DEPOIS do gate da pagina. Tudo filtra pelo tenant do app.

type Db = ReturnType<typeof createServiceRoleClient>;
const leitura = (db: Db) => db.schema('leitura');
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const ordemUnidade = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });

function falha(onde: string, e: { message: string } | null): void {
  if (e) throw new Error(`${onde}: ${e.message}`);
}

async function nomes(db: Db, ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const r = await db.from('clientes').select('id, nome').eq('tenant_id', TENANT_ID).in('id', [...new Set(ids)]);
  falha('clientes', r.error);
  return new Map(((r.data ?? []) as { id: string; nome: string }[]).map((p) => [p.id, p.nome]));
}

type Pessoa = { nome: string; codigo: string | null; pagamento: string | null };
async function pessoas(db: Db, ids: string[]): Promise<Map<string, Pessoa>> {
  if (ids.length === 0) return new Map();
  const r = await db.from('clientes').select('id, nome, codigo_legado_nfe, pagamento_padrao').eq('tenant_id', TENANT_ID).in('id', [...new Set(ids)]);
  falha('clientes', r.error);
  return new Map(((r.data ?? []) as { id: string; nome: string; codigo_legado_nfe: string | null; pagamento_padrao: string | null }[])
    .map((p) => [p.id, { nome: p.nome, codigo: p.codigo_legado_nfe, pagamento: p.pagamento_padrao }]));
}

type UnidadeBase = { id: string; identificacao: string; central_id: string };
async function unidadesAtivas(db: Db, condominioIds: string[]): Promise<(UnidadeBase & { condominio_id: string })[]> {
  if (condominioIds.length === 0) return [];
  const c = await leitura(db).from('centrais').select('id, condominio_id').eq('tenant_id', TENANT_ID).in('condominio_id', condominioIds);
  falha('centrais', c.error);
  const centrais = (c.data ?? []) as { id: string; condominio_id: string }[];
  if (centrais.length === 0) return [];
  const u = await leitura(db).from('unidades').select('id, identificacao, central_id')
    .eq('tenant_id', TENANT_ID).eq('ativa', true).in('central_id', centrais.map((x) => x.id));
  falha('unidades', u.error);
  const cond = new Map(centrais.map((x) => [x.id, x.condominio_id]));
  return ((u.data ?? []) as UnidadeBase[]).map((x) => ({ ...x, condominio_id: cond.get(x.central_id)! }));
}

async function ocupantesAtuais(db: Db, unidadeIds: string[]): Promise<Map<string, string>> {
  if (unidadeIds.length === 0) return new Map();
  const o = await leitura(db).from('unidade_ocupantes').select('unidade_id, cliente_id')
    .eq('tenant_id', TENANT_ID).is('ate', null).in('unidade_id', unidadeIds);
  falha('unidade_ocupantes', o.error);
  const ocs = (o.data ?? []) as { unidade_id: string; cliente_id: string }[];
  const n = await nomes(db, ocs.map((x) => x.cliente_id));
  return new Map(ocs.map((x) => [x.unidade_id, n.get(x.cliente_id) ?? '(pessoa não encontrada)']));
}

async function medidoresAtuais(db: Db, unidadeIds: string[]) {
  if (unidadeIds.length === 0) return new Map<string, { id: string; instalado_em: string; leitura_inicial: number }>();
  const m = await leitura(db).from('medidores').select('id, unidade_id, instalado_em, leitura_inicial')
    .eq('tenant_id', TENANT_ID).is('retirado_em', null).in('unidade_id', unidadeIds);
  falha('medidores', m.error);
  return new Map(((m.data ?? []) as { id: string; unidade_id: string; instalado_em: string; leitura_inicial: unknown }[])
    .map((x) => [x.unidade_id, { id: x.id, instalado_em: x.instalado_em, leitura_inicial: Number(x.leitura_inicial) }]));
}

// /leitura: condominios ativos com o ciclo mais recente.
export async function listarCondominios(): Promise<{ ok: true; itens: CondominioLista[] } | { ok: false }> {
  try {
    const db = createServiceRoleClient();
    const c = await leitura(db).from('condominios').select('id, cliente_id, quem_le, dia_leitura')
      .eq('tenant_id', TENANT_ID).eq('ativo', true);
    falha('condominios', c.error);
    const conds = (c.data ?? []) as { id: string; cliente_id: string; quem_le: QuemLe; dia_leitura: number }[];
    const ids = conds.map((x) => x.id);
    const [n, unis, cic] = await Promise.all([
      nomes(db, conds.map((x) => x.cliente_id)),
      unidadesAtivas(db, ids),
      ids.length
        ? lerPaginado<CicloResumo & { condominio_id: string }>((de, ate) => leitura(db).from('ciclos')
            .select('id, condominio_id, referencia, data_leitura, status')
            .eq('tenant_id', TENANT_ID).in('condominio_id', ids).order('referencia', { ascending: false }).order('id')
            .range(de, ate), 'ciclos')
        : Promise.resolve([]),
    ]);
    const ultimo = new Map<string, CicloResumo>();
    for (const x of cic) {
      if (!ultimo.has(x.condominio_id)) ultimo.set(x.condominio_id, { id: x.id, referencia: x.referencia, data_leitura: x.data_leitura, status: x.status });
    }
    const cicloIds = [...ultimo.values()].map((x) => x.id);
    const lidas = new Map<string, number>();
    if (cicloIds.length) {
      const l = await leitura(db).from('leituras').select('ciclo_id').eq('tenant_id', TENANT_ID).in('ciclo_id', cicloIds);
      falha('leituras', l.error);
      for (const x of (l.data ?? []) as { ciclo_id: string }[]) lidas.set(x.ciclo_id, (lidas.get(x.ciclo_id) ?? 0) + 1);
    }
    const itens = conds
      .map((x) => {
        const ciclo = ultimo.get(x.id) ?? null;
        return {
          id: x.id,
          nome: n.get(x.cliente_id) ?? '(cliente não encontrado)',
          quem_le: x.quem_le,
          dia_leitura: x.dia_leitura,
          unidades: unis.filter((u) => u.condominio_id === x.id).length,
          ciclo,
          lidas: ciclo ? (lidas.get(ciclo.id) ?? 0) : null,
        };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    return { ok: true, itens };
  } catch (err) {
    console.error('[listarCondominios]', err instanceof Error ? err.message : 'desconhecida');
    return { ok: false };
  }
}

async function cabecalhoCondominio(db: Db, id: string) {
  const c = await leitura(db).from('condominios').select('id, cliente_id, quem_le, dia_leitura, minimo_cobranca, pacote, dia_vencimento')
    .eq('tenant_id', TENANT_ID).eq('id', id).maybeSingle();
  falha('condominios', c.error);
  if (!c.data) return null;
  const d = c.data as { id: string; cliente_id: string; quem_le: QuemLe; dia_leitura: number; minimo_cobranca: unknown; pacote: string; dia_vencimento: number | null };
  const p = await pessoas(db, [d.cliente_id]);
  return {
    id: d.id, nome: p.get(d.cliente_id)?.nome ?? '(cliente não encontrado)', quem_le: d.quem_le, dia_leitura: d.dia_leitura,
    minimo_cobranca: Number(d.minimo_cobranca), dia_vencimento: d.dia_vencimento, codigo_bs: p.get(d.cliente_id)?.codigo ?? null,
    // pacotes em que quem paga e o condominio (um documento no ciclo) - igual a leitura._cobra_condominio
    cobra_condominio: d.pacote === 'basico' || d.pacote === 'intermediario',
  };
}

// /leitura/condominio/[id]: ciclos, unidades (para a saida) e saidas ja cobradas.
export async function carregarCondominio(id: string): Promise<{ ok: true; d: CondominioDetalhe | null } | { ok: false }> {
  try {
    const db = createServiceRoleClient();
    const condominio = await cabecalhoCondominio(db, id);
    if (!condominio) return { ok: true, d: null };
    const [cic, unis] = await Promise.all([
      lerPaginado<CicloResumo>((de, ate) => leitura(db).from('ciclos').select('id, referencia, data_leitura, status')
        .eq('tenant_id', TENANT_ID).eq('condominio_id', id).order('referencia', { ascending: false }).order('id')
        .range(de, ate), 'ciclos'),
      unidadesAtivas(db, [id]),
    ]);
    const uids = unis.map((u) => u.id);
    const [ocs, meds] = await Promise.all([ocupantesAtuais(db, uids), medidoresAtuais(db, uids)]);
    const sa = uids.length
      ? await lerPaginado((de, ate) => leitura(db).from('cobrancas').select('unidade_id, cliente_id, consumo, valor, leituras(data, valor)')
          .eq('tenant_id', TENANT_ID).is('ciclo_id', null).in('unidade_id', uids).order('criado_em', { ascending: false })
          .order('id').range(de, ate), 'cobrancas')
      : [];
    const saidasBrutas = sa as { unidade_id: string; cliente_id: string | null; consumo: unknown; valor: unknown; leituras: { data: string; valor: unknown } | null }[];

    // Para a janela de saida: ultima leitura do medidor atual, ultima cobrada e preco de hoje.
    const medIds = [...meds.values()].map((m) => m.id);
    const [ult, cob, primeiros] = await Promise.all([
      medIds.length
        ? lerPaginado((de, ate) => leitura(db).from('leituras').select('medidor_id, valor, data').eq('tenant_id', TENANT_ID)
            .in('medidor_id', medIds).order('data', { ascending: false }).order('id').range(de, ate), 'ultimas leituras')
        : Promise.resolve([]),
      uids.length
        ? lerPaginado((de, ate) => leitura(db).from('cobrancas').select('unidade_id, leituras(medidor_id, valor, data)')
            .eq('tenant_id', TENANT_ID).eq('situacao', 'cobrar').in('unidade_id', uids).order('id').range(de, ate), 'cobrancas cobradas')
        : Promise.resolve([]),
      uids.length
        ? lerPaginado((de, ate) => leitura(db).from('medidores').select('id, unidade_id, instalado_em, leitura_inicial')
            .eq('tenant_id', TENANT_ID).in('unidade_id', uids).order('instalado_em').order('criado_em').order('id')
            .range(de, ate), 'medidores')
        : Promise.resolve([]),
    ]);
    const ultimaPorMedidor = new Map<string, { valor: number; data: string }>();
    for (const x of ult as { medidor_id: string; valor: unknown; data: string }[]) {
      if (!ultimaPorMedidor.has(x.medidor_id)) ultimaPorMedidor.set(x.medidor_id, { valor: Number(x.valor), data: x.data });
    }
    const cobradaPorUnidade = new Map<string, { medidor_id: string; valor: number; data: string }>();
    for (const x of cob as { unidade_id: string; leituras: { medidor_id: string; valor: unknown; data: string } | null }[]) {
      if (!x.leituras) continue;
      const atual = cobradaPorUnidade.get(x.unidade_id);
      if (!atual || x.leituras.data > atual.data) {
        cobradaPorUnidade.set(x.unidade_id, { medidor_id: x.leituras.medidor_id, valor: Number(x.leituras.valor), data: x.leituras.data });
      }
    }
    const primeiroPorUnidade = new Map<string, { id: string; leitura_inicial: number }>();
    for (const x of primeiros as { id: string; unidade_id: string; leitura_inicial: unknown }[]) {
      if (!primeiroPorUnidade.has(x.unidade_id)) primeiroPorUnidade.set(x.unidade_id, { id: x.id, leitura_inicial: Number(x.leitura_inicial) });
    }
    const centrais = [...new Set(unis.map((u) => u.central_id))];
    const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    const precos = new Map<string, number>();
    for (const ce of centrais) {
      const p = await leitura(db).rpc('preco_m3_em', { p_tenant: TENANT_ID, p_central: ce, p_dia: hoje });
      const linha = !p.error && Array.isArray(p.data) && p.data[0] ? (p.data[0] as { preco_m3: unknown }) : null;
      if (linha) precos.set(ce, Number(linha.preco_m3));
    }
    const nomesSaida = await nomes(db, saidasBrutas.map((x) => x.cliente_id).filter((x): x is string => !!x));
    const ident = new Map(unis.map((u) => [u.id, u.identificacao]));
    return {
      ok: true,
      d: {
        condominio,
        ciclos: cic,
        unidades: unis
          .map((u) => {
            const med = meds.get(u.id);
            const cobrada = cobradaPorUnidade.get(u.id);
            const primeiro = primeiroPorUnidade.get(u.id);
            const base = cobrada ? cobrada : primeiro ? { medidor_id: primeiro.id, valor: primeiro.leitura_inicial } : null;
            return {
              id: u.id,
              identificacao: u.identificacao,
              morador: ocs.get(u.id) ?? null,
              tem_medidor: !!med,
              ultima: med ? (ultimaPorMedidor.get(med.id) ?? { valor: med.leitura_inicial, data: med.instalado_em }) : null,
              ultima_cobrada: med && base && base.medidor_id === med.id ? base.valor : null,
              preco_m3: precos.get(u.central_id) ?? null,
            };
          })
          .sort((a, b) => ordemUnidade(a.identificacao, b.identificacao)),
        saidas: saidasBrutas.map((x) => ({
          unidade: ident.get(x.unidade_id) ?? '?',
          morador: x.cliente_id ? (nomesSaida.get(x.cliente_id) ?? null) : null,
          data: x.leituras?.data ?? '',
          valor_leitura: Number(x.leituras?.valor ?? 0),
          consumo: Number(x.consumo),
          valor: Number(x.valor),
        })),
      },
    };
  } catch (err) {
    console.error('[carregarCondominio]', err instanceof Error ? err.message : 'desconhecida');
    return { ok: false };
  }
}

// /leitura/ciclo/[id]: uma linha por unidade ativa. Aberto = previa (previa_ciclo); fechado = cobrancas.
export async function carregarCiclo(id: string): Promise<{ ok: true; d: CicloCompleto | null } | { ok: false }> {
  try {
    const db = createServiceRoleClient();
    const c = await leitura(db).from('ciclos').select('id, condominio_id, referencia, data_leitura, status, minimo_cobranca, documento_tipo, documento_numero')
      .eq('tenant_id', TENANT_ID).eq('id', id).maybeSingle();
    falha('ciclos', c.error);
    if (!c.data) return { ok: true, d: null };
    const ci = c.data as CicloResumo & { condominio_id: string; minimo_cobranca: unknown; documento_tipo: TipoDocumento | null; documento_numero: string | null };
    const condominio = await cabecalhoCondominio(db, ci.condominio_id);
    if (!condominio) return { ok: true, d: null };

    const unis = await unidadesAtivas(db, [ci.condominio_id]);
    const uids = unis.map((u) => u.id);
    const [ocs, meds, lei] = await Promise.all([
      ocupantesAtuais(db, uids),
      medidoresAtuais(db, uids),
      leitura(db).from('leituras').select('id, medidor_id, valor, data, foto_path, observacao, consumo_conferido')
        .eq('tenant_id', TENANT_ID).eq('ciclo_id', id),
    ]);
    falha('leituras', lei.error);
    const leituras = (lei.data ?? []) as { id: string; medidor_id: string; valor: unknown; data: string; foto_path: string | null; observacao: string | null; consumo_conferido: boolean }[];
    const porMedidor = new Map(leituras.map((l) => [l.medidor_id, l]));

    // Anterior: ultima leitura do medidor atual fora deste ciclo; sem nenhuma, a inicial.
    const medIds = [...meds.values()].map((m) => m.id);
    const ant = medIds.length
      ? await lerPaginado((de, ate) => leitura(db).from('leituras').select('medidor_id, valor, data').eq('tenant_id', TENANT_ID)
          .in('medidor_id', medIds).or(`ciclo_id.is.null,ciclo_id.neq.${id}`).lte('data', ci.data_leitura)
          .order('data', { ascending: false }).order('id').range(de, ate), 'leituras anteriores')
      : [];
    const anterior = new Map<string, { valor: number; data: string }>();
    for (const x of ant as { medidor_id: string; valor: unknown; data: string }[]) {
      if (!anterior.has(x.medidor_id)) anterior.set(x.medidor_id, { valor: Number(x.valor), data: x.data });
    }

    const caminhos = leituras.map((l) => l.foto_path).filter((p): p is string => !!p);
    const urls = new Map<string, string>();
    if (caminhos.length) {
      const s = await db.storage.from(BUCKET_FOTOS).createSignedUrls(caminhos, 3600);
      if (s.error) console.error('[carregarCiclo] fotos:', s.error.message);
      for (const x of s.data ?? []) if (x.path && x.signedUrl) urls.set(x.path, x.signedUrl);
    }

    type Calculo = {
      base_valor: number | null; consumo: number | null; em_aberto: number; ficou_em_aberto: number | null; preco_m3: number | null;
      valor: number | null; situacao: Situacao; cobranca_id?: string; cliente_id?: string | null;
      documento?: { tipo: TipoDocumento; numero: string | null } | null;
    };
    const calculo = new Map<string, Calculo>();
    let erroPrevia: string | null = null;
    if (ci.status === 'aberto') {
      const p = await leitura(db).rpc('previa_ciclo', { p_tenant: TENANT_ID, p_ciclo: id });
      if (p.error) {
        console.error('[carregarCiclo] previa_ciclo:', p.error.message);
        erroPrevia = mensagemErro(p.error.message, 'Não foi possível calcular a prévia do ciclo.');
      } else {
        for (const r of (p.data ?? []) as Record<string, unknown>[]) {
          calculo.set(String(r.unidade_id), {
            base_valor: num(r.base_valor), consumo: num(r.consumo), em_aberto: Number(r.em_aberto ?? 0), ficou_em_aberto: null,
            preco_m3: num(r.preco_m3), valor: num(r.valor), situacao: r.situacao as Situacao, cliente_id: (r.cliente_id as string | null) ?? null,
          });
        }
      }
    } else {
      const cb = await leitura(db).from('cobrancas').select('id, unidade_id, cliente_id, base_valor, consumo, preco_m3, valor, situacao, consumo_em_aberto, documento_tipo, documento_numero')
        .eq('tenant_id', TENANT_ID).eq('ciclo_id', id);
      falha('cobrancas', cb.error);
      const cobs = (cb.data ?? []) as Record<string, unknown>[];
      // em aberto de meses anteriores que estas cobrancas levaram
      const levado = new Map<string, number>();
      if (cobs.length) {
        const q = await leitura(db).from('cobrancas').select('quitada_por, consumo_em_aberto').eq('tenant_id', TENANT_ID)
          .in('quitada_por', cobs.map((r) => String(r.id)));
        falha('em aberto quitado', q.error);
        for (const x of (q.data ?? []) as { quitada_por: string; consumo_em_aberto: unknown }[]) {
          levado.set(x.quitada_por, (levado.get(x.quitada_por) ?? 0) + Number(x.consumo_em_aberto));
        }
      }
      for (const r of cobs) {
        calculo.set(String(r.unidade_id), {
          base_valor: num(r.base_valor), consumo: num(r.consumo), em_aberto: levado.get(String(r.id)) ?? 0,
          ficou_em_aberto: num(r.consumo_em_aberto), preco_m3: num(r.preco_m3), valor: num(r.valor), situacao: r.situacao as Situacao,
          cobranca_id: String(r.id), cliente_id: (r.cliente_id as string | null) ?? null,
          documento: r.documento_tipo ? { tipo: r.documento_tipo as TipoDocumento, numero: (r.documento_numero as string | null) ?? null } : null,
        });
      }
    }

    // Composicao: meses acumulados desde a ultima cobrada e consumo em aberto levado por esta cobranca.
    const hist = uids.length
      ? await lerPaginado((de, ate) => leitura(db).from('cobrancas')
          .select('id, unidade_id, ciclo_id, situacao, consumo_em_aberto, quitada_por, ciclos(referencia), leituras(data)')
          .eq('tenant_id', TENANT_ID).in('unidade_id', uids).order('id').range(de, ate), 'historico de cobrancas')
      : [];
    type H = { id: string; unidade_id: string; ciclo_id: string | null; situacao: string; consumo_em_aberto: unknown; quitada_por: string | null; ciclos: { referencia: string } | null; leituras: { data: string } | null };
    const historico = (hist as H[]).sort((a, b) => (a.leituras?.data ?? '').localeCompare(b.leituras?.data ?? ''));
    function composicao(unidade: string, cobrancaId: string | undefined, dataAtual: string): string[] {
      const da = historico.filter((h) => h.unidade_id === unidade && h.ciclo_id !== id && (h.leituras?.data ?? '') < dataAtual);
      const ultimaCobrada = [...da].reverse().find((h) => h.situacao === 'cobrar');
      const acumulados = da.filter((h) => h.situacao === 'acumula' && h.consumo_em_aberto === null && h.ciclos
        && (!ultimaCobrada || (h.leituras?.data ?? '') > (ultimaCobrada.leituras?.data ?? '')));
      const partes: string[] = [];
      if (acumulados.length) partes.push(`acumulado de ${acumulados.map((h) => rotuloMes(h.ciclos!.referencia)).join(', ')}`);
      for (const h of historico) {
        if (h.unidade_id !== unidade || h.consumo_em_aberto === null) continue;
        const levada = cobrancaId ? h.quitada_por === cobrancaId : h.quitada_por === null;
        if (levada && h.ciclos) partes.push(`${rotuloMes(h.ciclos.referencia)} em aberto ${formatarM3(Number(h.consumo_em_aberto))} m³`);
      }
      return partes;
    }
    const idsPessoas = [...[...calculo.values()].map((k) => k.cliente_id).filter((x): x is string => !!x)];
    const ocAtualId = new Map<string, string>();
    if (uids.length) {
      const o = await leitura(db).from('unidade_ocupantes').select('unidade_id, cliente_id').eq('tenant_id', TENANT_ID).is('ate', null).in('unidade_id', uids);
      falha('ocupantes', o.error);
      for (const x of (o.data ?? []) as { unidade_id: string; cliente_id: string }[]) { ocAtualId.set(x.unidade_id, x.cliente_id); idsPessoas.push(x.cliente_id); }
    }
    const pes = await pessoas(db, idsPessoas);

    const linhas: LinhaCiclo[] = unis
      .map((u) => {
        const med = meds.get(u.id) ?? null;
        const l = med ? porMedidor.get(med.id) : undefined;
        const k = calculo.get(u.id);
        const pessoaId = k?.cliente_id ?? ocAtualId.get(u.id) ?? null;
        const pessoa = pessoaId ? pes.get(pessoaId) : undefined;
        return {
          unidade_id: u.id,
          identificacao: u.identificacao,
          morador: pessoa?.nome ?? ocs.get(u.id) ?? null,
          codigo_bs: pessoa?.codigo ?? null,
          tipo_padrao: tipoPadrao(pessoa?.pagamento ?? null),
          cobranca_id: k?.cobranca_id ?? null,
          documento: k?.documento ?? null,
          composicao: l && (k?.situacao === 'cobrar' || k?.situacao === 'acumula') ? composicao(u.id, k?.cobranca_id, l.data) : [],
          medidor_id: med?.id ?? null,
          anterior: med ? (anterior.get(med.id) ?? { valor: med.leitura_inicial, data: med.instalado_em }) : null,
          leitura: l
            ? {
                id: l.id, valor: Number(l.valor), data: l.data, foto_url: l.foto_path ? (urls.get(l.foto_path) ?? null) : null,
                observacao: l.observacao, conferido: l.consumo_conferido,
              }
            : null,
          base_valor: k?.base_valor ?? null,
          consumo: k?.consumo ?? null,
          em_aberto: k?.em_aberto ?? 0,
          ficou_em_aberto: k?.ficou_em_aberto ?? null,
          preco_m3: k?.preco_m3 ?? null,
          valor: k?.valor ?? null,
          situacao: k?.situacao ?? 'sem_leitura',
        };
      })
      .sort((a, b) => ordemUnidade(a.identificacao, b.identificacao));

    return {
      ok: true,
      d: {
        ciclo: {
          id: ci.id, referencia: ci.referencia, data_leitura: ci.data_leitura, status: ci.status, minimo_cobranca: num(ci.minimo_cobranca),
          documento: ci.documento_tipo ? { tipo: ci.documento_tipo, numero: ci.documento_numero } : null,
        },
        condominio: {
          id: condominio.id, nome: condominio.nome, quem_le: condominio.quem_le, minimo_cobranca: condominio.minimo_cobranca,
          cobra_condominio: condominio.cobra_condominio, dia_vencimento: condominio.dia_vencimento, codigo_bs: condominio.codigo_bs,
        },
        vencimento: vencimento(ci.referencia, condominio.dia_vencimento),
        linhas,
        erroPrevia,
      },
    };
  } catch (err) {
    console.error('[carregarCiclo]', err instanceof Error ? err.message : 'desconhecida');
    return { ok: false };
  }
}
