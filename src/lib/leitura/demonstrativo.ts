import type { CicloCompleto, Situacao, TipoDocumento } from './modelo';

// Demonstrativo da leitura (LEI4, Daniel 30/10): um por unidade com leitura no ciclo fechado (inclusive
// as que acumulam) e o resumo do condominio. Modulo PURO: monta o que as telas de impressao mostram a
// partir do ciclo (carregarCiclo) e dos dados extras de carregarDemonstrativos.

export const WHATSAPP = { rotulo: '(54) 3227-2263', link: 'https://wa.me/555432272263' };
export const KG_POR_P45 = 45;

export type MedidorHist = {
  id: string;
  instalado_em: string;
  criado_em: string;
  leitura_inicial: number;
  leitura_final: number | null;
};
export type LeituraHist = { medidor_id: string; data: string; valor: number; tipo: 'mensal' | 'saida'; referencia: string | null };

// valor = m3 do mes x preco do m3 do ciclo (1-A, Daniel 30/10). marca: '+' o mes acumulou (soma com o
// seguinte); '=' o mes foi cobrado por um valor diferente do proprio consumo (acumulados ou em aberto
// entraram) e valor_cobrado e o total da cobranca.
export type PontoHistorico = {
  referencia: string;
  m3: number;
  valor: number | null;
  marca: '+' | '=' | null;
  valor_cobrado: number | null;
};

// Cobranca mensal da unidade (para o historico). preco_m3 0 = historico da planilha sem preco.
export type CobrancaHist = { referencia: string; situacao: 'cobrar' | 'acumula'; valor: number; preco_m3: number };

const r3 = (n: number) => Math.round(n * 1000) / 1000;

// Consumo entre duas leituras da mesma unidade, somando os medidores trocados no meio (mesma conta do
// leitura._consumo do banco). null se a ordem dos medidores nao fecha.
export function consumoEntre(
  medidores: MedidorHist[],
  de: { medidor_id: string; valor: number },
  ate: { medidor_id: string; valor: number },
): number | null {
  if (de.medidor_id === ate.medidor_id) return r3(ate.valor - de.valor);
  const ordem = [...medidores].sort((a, b) => a.instalado_em.localeCompare(b.instalado_em) || a.criado_em.localeCompare(b.criado_em));
  const i = ordem.findIndex((m) => m.id === de.medidor_id);
  const j = ordem.findIndex((m) => m.id === ate.medidor_id);
  if (i < 0 || j < 0 || j < i) return null;
  let total = 0;
  for (let k = i; k <= j; k++) {
    const m = ordem[k];
    if (k === i) {
      if (m.leitura_final === null) return null;
      total += m.leitura_final - de.valor;
    } else if (k === j) {
      total += ate.valor - m.leitura_inicial;
    } else {
      if (m.leitura_final === null) return null;
      total += m.leitura_final - m.leitura_inicial;
    }
  }
  return r3(total);
}

// Consumo de cada mes de referencia de um ano: diferenca entre leituras MENSAIS seguidas da unidade (a
// saida do morador nao corta o mes). Sem leitura mensal antes, parte da leitura inicial do medidor.
export function historicoDoAno(
  medidores: MedidorHist[],
  leituras: LeituraHist[],
  ano: number,
  ateReferencia: string,
  cobrancas: CobrancaHist[] = [],
  precoPorCiclo: Map<string, number> = new Map(),
): PontoHistorico[] {
  const cobPorRef = new Map(cobrancas.map((c) => [c.referencia, c]));
  const mensais = leituras
    .filter((l) => l.tipo === 'mensal' && l.referencia)
    .sort((a, b) => a.data.localeCompare(b.data) || a.valor - b.valor);
  const pontos: PontoHistorico[] = [];
  for (let n = 0; n < mensais.length; n++) {
    const l = mensais[n];
    const ref = l.referencia!;
    if (Number(ref.slice(0, 4)) !== ano || ref > ateReferencia) continue;
    const ant = n > 0 ? mensais[n - 1] : null;
    let m3: number | null;
    if (ant) m3 = consumoEntre(medidores, ant, l);
    else {
      const med = medidores.find((m) => m.id === l.medidor_id);
      m3 = med ? r3(l.valor - med.leitura_inicial) : null;
    }
    if (m3 === null || m3 < 0) continue;
    const c = cobPorRef.get(ref);
    // preco da propria cobranca da unidade; sem ele, o mais comum do ciclo
    const preco = c && c.preco_m3 > 0 ? c.preco_m3 : (precoPorCiclo.get(ref) ?? null);
    const valor = preco !== null ? Math.round(m3 * preco * 100) / 100 : null;
    let marca: PontoHistorico['marca'] = null;
    let valorCobrado: number | null = null;
    if (c?.situacao === 'acumula') marca = '+';
    else if (c?.situacao === 'cobrar' && (valor === null || Math.abs(c.valor - valor) > 0.01)) {
      marca = '=';
      valorCobrado = c.valor;
    }
    pontos.push({ referencia: ref, m3, valor, marca, valor_cobrado: valorCobrado });
  }
  return pontos;
}

// Data da leitura base da cobranca: a leitura do medidor base com esse valor (a mais recente antes da
// atual) ou, sem ela, a instalacao do medidor (cobranca que partiu da leitura inicial).
export function dataDaBase(
  medidores: MedidorHist[],
  leituras: LeituraHist[],
  base: { medidor_id: string; valor: number },
  antesDe: string,
): string | null {
  const l = leituras
    .filter((x) => x.medidor_id === base.medidor_id && Math.abs(x.valor - base.valor) < 0.0005 && x.data < antesDe)
    .sort((a, b) => b.data.localeCompare(a.data))[0];
  if (l) return l.data;
  const m = medidores.find((x) => x.id === base.medidor_id);
  return m && Math.abs(m.leitura_inicial - base.valor) < 0.0005 ? m.instalado_em : null;
}

export function diasEntre(de: string, ate: string): number {
  return Math.round((Date.parse(`${ate.slice(0, 10)}T00:00:00Z`) - Date.parse(`${de.slice(0, 10)}T00:00:00Z`)) / 86400000);
}

export type ExtrasUnidade = {
  base: { medidor_id: string; valor: number } | null; // da cobranca gravada
  medidores: MedidorHist[];
  leituras: LeituraHist[];
  cobrancas: CobrancaHist[]; // mensais da unidade (todos os ciclos)
};

// Preco de reserva de cada ciclo, para o mes da unidade cuja cobranca nao guardou preco (acumuladas da
// planilha gravaram 0): o preco MAIS COMUM nas cobrancas do ciclo. Na planilha o preco varia por unidade
// (Monte Castelo set/2026: 22,35 e 38,18; Mahe: seis precos), entao o maior nao serve.
export function precosPorCiclo(extras: Iterable<ExtrasUnidade>): Map<string, number> {
  const conta = new Map<string, Map<number, number>>();
  for (const e of extras)
    for (const c of e.cobrancas)
      if (c.preco_m3 > 0) {
        const m = conta.get(c.referencia) ?? new Map<number, number>();
        m.set(c.preco_m3, (m.get(c.preco_m3) ?? 0) + 1);
        conta.set(c.referencia, m);
      }
  const out = new Map<string, number>();
  for (const [ref, m] of conta) out.set(ref, [...m.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]);
  return out;
}

export type Demonstrativo = {
  unidade_id: string;
  identificacao: string;
  morador: string | null;
  situacao: Exclude<Situacao, 'sem_leitura'>;
  anterior: { valor: number; data: string | null };
  atual: { valor: number; data: string };
  dias: number | null;
  consumo: number; // m3 cobrados (ou acumulados) desde a ultima cobrada
  kg: number;
  preco_m3: number | null; // null quando a cobranca nao guardou preco (historico da planilha)
  valor: number | null;
  composicao: string[];
  documento: { tipo: TipoDocumento; numero: string | null } | null; // boleto/NF-e/recibo lancado no faturamento
  historico: PontoHistorico[];
  consumo_mes: number | null; // so deste mes (leitura mensal anterior -> esta)
};

export type ResumoCondominio = {
  unidades: Demonstrativo[];
  cobradas: number;
  acumulam: number;
  total_valor: number;
  consumo_mes: number; // soma do consumo do mes das unidades
  kg_mes: number;
  p45_mes: number;
  preco_m3: number | null;
};

const ordemUnidade = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });

export function montarDemonstrativos(
  dados: CicloCompleto,
  extras: Map<string, ExtrasUnidade>,
  fatorKgM3: number,
): Demonstrativo[] {
  const { ciclo, linhas } = dados;
  const ano = Number(ciclo.referencia.slice(0, 4));
  const precos = precosPorCiclo(extras.values());
  const docCondominio = dados.condominio.cobra_condominio ? ciclo.documento : null;
  const out: Demonstrativo[] = [];
  for (const l of linhas) {
    if (!l.leitura || l.situacao === 'sem_leitura' || l.consumo === null || l.base_valor === null) continue;
    const ex = extras.get(l.unidade_id);
    const historico = ex ? historicoDoAno(ex.medidores, ex.leituras, ano, ciclo.referencia, ex.cobrancas, precos) : [];
    const doMes = historico.find((p) => p.referencia === ciclo.referencia);
    const dataBase = ex?.base ? dataDaBase(ex.medidores, ex.leituras, ex.base, l.leitura.data) : null;
    out.push({
      unidade_id: l.unidade_id,
      identificacao: l.identificacao,
      morador: l.morador,
      situacao: l.situacao,
      anterior: { valor: l.base_valor, data: dataBase },
      atual: { valor: l.leitura.valor, data: l.leitura.data },
      dias: dataBase ? diasEntre(dataBase, l.leitura.data) : null,
      consumo: l.consumo,
      kg: Math.round(l.consumo * fatorKgM3 * 10) / 10,
      preco_m3: l.preco_m3 && l.preco_m3 > 0 ? l.preco_m3 : null,
      valor: l.valor,
      composicao: l.composicao,
      documento: l.situacao === 'cobrar' ? (docCondominio ?? l.documento) : null,
      historico,
      consumo_mes: doMes ? doMes.m3 : null,
    });
  }
  return out.sort((a, b) => ordemUnidade(a.identificacao, b.identificacao));
}

export function resumirCondominio(demonstrativos: Demonstrativo[], fatorKgM3: number): ResumoCondominio {
  const cobrar = demonstrativos.filter((d) => d.situacao === 'cobrar');
  const consumoMes = r3(demonstrativos.reduce((s, d) => s + (d.consumo_mes ?? 0), 0));
  const kg = Math.round(consumoMes * fatorKgM3 * 10) / 10;
  const precos = [...new Set(cobrar.map((d) => d.preco_m3).filter((p): p is number => p !== null))];
  return {
    unidades: demonstrativos,
    cobradas: cobrar.length,
    acumulam: demonstrativos.length - cobrar.length,
    total_valor: Math.round(cobrar.reduce((s, d) => s + (d.valor ?? 0), 0) * 100) / 100,
    consumo_mes: consumoMes,
    kg_mes: kg,
    p45_mes: Math.round((kg / KG_POR_P45) * 10) / 10,
    preco_m3: precos.length === 1 ? precos[0] : null,
  };
}

// Pares para a folha A4 com dois demonstrativos (meia folha cada, D1-A).
export function emPares<T>(itens: T[]): T[][] {
  const pares: T[][] = [];
  for (let i = 0; i < itens.length; i += 2) pares.push(itens.slice(i, i + 2));
  return pares;
}
