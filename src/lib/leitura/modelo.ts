import { z } from 'zod';

// Leitura de medidores (LEI2). Modulo PURO (cliente e servidor): tipos, validacao das actions,
// formatacao e traducao das mensagens do banco. Leitura em carregar.ts; gravacao nas actions.

export const BUCKET_FOTOS = 'leitura-fotos';
export const FOTO_MAX_BYTES = 3 * 1024 * 1024;

export const SITUACOES = ['cobrar', 'acumula', 'sem_leitura'] as const;
export type Situacao = (typeof SITUACOES)[number];
export const ROTULO_SITUACAO: Record<Situacao, string> = {
  cobrar: 'Cobrar',
  acumula: 'Acumula',
  sem_leitura: 'Sem leitura',
};

export type QuemLe = 'libergas' | 'sindico';
export const ROTULO_QUEM_LE: Record<QuemLe, string> = { libergas: 'Libergás', sindico: 'Síndico' };

export type CicloResumo = {
  id: string;
  referencia: string; // YYYY-MM-01
  data_leitura: string;
  status: 'aberto' | 'fechado';
};

export type CondominioLista = {
  id: string;
  nome: string;
  quem_le: QuemLe;
  dia_leitura: number;
  unidades: number;
  ciclo: CicloResumo | null; // mais recente
  lidas: number | null; // leituras no ciclo mais recente
};

export type LinhaCiclo = {
  unidade_id: string;
  identificacao: string;
  morador: string | null;
  medidor_id: string | null; // medidor atual
  anterior: { valor: number; data: string } | null; // ultima leitura do medidor atual antes deste ciclo
  leitura: {
    id: string;
    valor: number;
    data: string;
    foto_url: string | null;
    observacao: string | null;
    conferido: boolean;
  } | null;
  base_valor: number | null;
  consumo: number | null;
  em_aberto: number; // m3 de meses anteriores que entram nesta cobranca (ex.: Lauro mar/2026)
  cobranca_id: string | null; // ciclo fechado
  documento: { tipo: TipoDocumento; numero: string | null } | null;
  composicao: string[]; // meses que entram nesta cobranca: acumulados e em aberto (ex.: 'mar/2026 em aberto 0,261 m³')
  codigo_bs: string | null;
  tipo_padrao: 'boleto' | 'nfe' | 'recibo'; // do cadastro da pessoa (pagamento padrao); sem dado = boleto
  ficou_em_aberto: number | null; // este mes acumulou e ficou para tras (sera cobrado depois)
  preco_m3: number | null;
  valor: number | null;
  situacao: Situacao;
};

export type CicloCompleto = {
  ciclo: CicloResumo & { minimo_cobranca: number | null; documento: { tipo: TipoDocumento; numero: string | null } | null };
  condominio: { id: string; nome: string; quem_le: QuemLe; minimo_cobranca: number; cobra_condominio: boolean; dia_vencimento: number | null; codigo_bs: string | null };
  vencimento: string | null;
  linhas: LinhaCiclo[];
  erroPrevia: string | null; // previa_ciclo recusou (ex.: leitura com data anterior a ultima cobrada)
};

export type UnidadeSaida = {
  id: string;
  identificacao: string;
  morador: string | null;
  tem_medidor: boolean;
  ultima: { valor: number; data: string } | null; // ultima leitura do medidor atual (ou a inicial)
  ultima_cobrada: number | null; // base da proxima cobranca (mesmo medidor)
  preco_m3: number | null; // preco de hoje
};

export type Saida = { unidade: string; morador: string | null; data: string; valor_leitura: number; consumo: number; valor: number };

export type CondominioDetalhe = {
  condominio: { id: string; nome: string; quem_le: QuemLe; dia_leitura: number; minimo_cobranca: number };
  ciclos: CicloResumo[];
  unidades: UnidadeSaida[];
  saidas: Saida[];
};

// ---- faturamento ----
export const TIPOS_DOCUMENTO = ['boleto', 'nfe', 'recibo'] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number] | 'planilha';
export const ROTULO_DOCUMENTO: Record<TipoDocumento, string> = { boleto: 'Boleto', nfe: 'NF-e', recibo: 'Recibo', planilha: 'Faturado (planilha)' };
// Pagamento padrao do cadastro -> tipo de documento sugerido. Sem dado (hoje e o caso de todos) = boleto.
export function tipoPadrao(pagamentoPadrao: string | null): 'boleto' | 'nfe' | 'recibo' {
  const p = (pagamentoPadrao ?? '').toLowerCase();
  if (p.includes('nf')) return 'nfe';
  if (p.includes('recibo') || p.includes('dinheiro') || p.includes('pix')) return 'recibo';
  return 'boleto';
}
// Vencimento: dia de vencimento do condominio no mes seguinte ao da referencia.
export function vencimento(referencia: string, dia: number | null): string | null {
  if (!dia) return null;
  const [a, m] = referencia.split('-').map(Number);
  const ultimo = new Date(Date.UTC(a, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(a, m, Math.min(dia, ultimo))).toISOString().slice(0, 10);
}
export const documentoSchema = z.object({
  id: z.guid({ error: 'Registro inválido.' }),
  tipo: z.enum(TIPOS_DOCUMENTO, { error: 'Escolha o tipo de documento.' }).nullable(),
  numero: z.string().trim().max(60, 'Número até 60 caracteres.'),
}).refine((v) => v.tipo === null || v.numero !== '', { message: 'Informe o número do documento.', path: ['numero'] });

// ---- datas e numeros ----

const partesHoje = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
export function hojeSaoPaulo(agora: Date = new Date()): string {
  return partesHoje.format(agora);
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function rotuloMes(referencia: string): string {
  const [a, m] = referencia.split('-');
  return `${MESES[Number(m) - 1]}/${a}`;
}
export function formatarData(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}
const m3 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
export function formatarM3(n: number | null): string {
  return n == null ? '—' : m3.format(n);
}
// Para o campo de digitacao: sem separador de milhar ("2014,281"), para nao confundir 2.014 com 2,014.
const m3Campo = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3, useGrouping: false });
export function formatarM3Campo(n: number): string {
  return m3Campo.format(n);
}
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function formatarMoeda(n: number | null): string {
  return n == null ? '—' : moeda.format(n);
}

// Proximo mes de referencia: o seguinte ao ultimo ciclo; sem ciclo, o mes de hoje.
export function proximaReferencia(ultimo: string | null, hoje: string): string {
  if (!ultimo) return `${hoje.slice(0, 7)}-01`;
  const [a, m] = ultimo.split('-').map(Number);
  const d = new Date(Date.UTC(a, m, 1)); // m ja e o mes seguinte (base 0)
  return d.toISOString().slice(0, 10);
}
// Data sugerida da leitura: o dia da leitura do condominio no mes (limitado ao fim do mes).
export function dataSugerida(referencia: string, dia: number): string {
  const [a, m] = referencia.split('-').map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return `${referencia.slice(0, 8)}${String(Math.min(dia, ultimo)).padStart(2, '0')}`;
}

// Previa do que o operador digitou: consumo desde a anterior e quanto sera cobrado desde a ultima
// cobrada (mesmo medidor). So para mostrar; o calculo que vale e o do banco.
export function previaDigitada(
  valor: number | null,
  anterior: number | null,
  base: number | null,
  preco: number | null,
): { consumo: number | null; aCobrar: number | null; valor: number | null; menor: boolean; alto: boolean } {
  if (valor === null || anterior === null) return { consumo: null, aCobrar: null, valor: null, menor: false, alto: false };
  const consumo = Math.round((valor - anterior) * 1000) / 1000;
  const aCobrar = base !== null && valor >= base ? Math.round((valor - base) * 1000) / 1000 : null;
  return {
    consumo,
    aCobrar,
    valor: aCobrar !== null && preco !== null ? Math.round(aCobrar * preco * 100) / 100 : null,
    menor: consumo < 0,
    alto: consumo > 30,
  };
}

// ---- validacao ----

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const dataValida = (t: string) => {
  if (!DATA_ISO.test(t)) return false;
  const d = new Date(`${t}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === t;
};

// "2014,281" | "2014.281" | "2.014,281" -> 2014.281 (ate 3 casas)
export function lerValorM3(texto: string): number | null {
  const t = texto.trim().replace(/\s/g, '');
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,3})?$|^\d+([.,]\d{1,3})?$/.test(t)) return null;
  const normal = /,/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t;
  const n = Number(normal);
  return Number.isFinite(n) && n >= 0 && n < 1e9 ? n : null;
}

const uuid = (msg: string) => z.guid({ error: msg });
const valorM3 = z
  .string()
  .transform((t, ctx) => {
    const n = lerValorM3(t);
    if (n === null) {
      ctx.addIssue({ code: 'custom', message: 'Leitura inválida: use até 3 casas depois da vírgula.' });
      return z.NEVER;
    }
    return n;
  });
const dataOpcional = z
  .string()
  .trim()
  .refine((t) => t === '' || dataValida(t), 'Data inválida.')
  .transform((t) => (t === '' ? null : t));
const observacao = z.string().trim().max(500, 'Observação até 500 caracteres.');

export const abrirCicloSchema = z.object({
  condominioId: uuid('Condomínio inválido.'),
  referencia: z.string().refine((t) => /^\d{4}-\d{2}-01$/.test(t) && dataValida(t), 'Mês inválido.'),
  dataLeitura: z.string().refine(dataValida, 'Data da leitura inválida.'),
});

export const leituraSchema = z.object({
  cicloId: uuid('Ciclo inválido.'),
  medidorId: uuid('Medidor inválido.'),
  valor: valorM3,
  data: dataOpcional,
  observacao,
  conferido: z.boolean(),
});

export const saidaSchema = z.object({
  unidadeId: uuid('Unidade inválida.'),
  data: z.string().refine(dataValida, 'Data da saída inválida.'),
  valor: valorM3,
  quemLeu: z.enum(['libergas', 'sindico'], { error: 'Informe quem leu.' }),
  observacao,
  conferido: z.boolean(),
});

export const idSchema = uuid('Registro inválido.');

// ---- mensagens do banco ----

const ERROS_RPC: Record<string, string> = {
  'Ja ha um ciclo aberto neste condominio': 'Já há um ciclo aberto neste condomínio.',
  'Ja ha ciclo deste mes ou posterior': 'Já existe ciclo deste mês ou de um mês posterior.',
  'Data da leitura fora do mes de referencia': 'A data da leitura está longe do mês escolhido.',
  'Condominio nao encontrado ou inativo': 'Condomínio não encontrado ou com a leitura desativada.',
  'Ciclo fechado': 'Este ciclo já foi fechado.',
  'Ciclo ja fechado': 'Este ciclo já foi fechado.',
  'Ciclo nao esta fechado': 'Este ciclo não está fechado.',
  'Medidor nao e o atual de unidade ativa deste condominio': 'Este medidor não é o atual da unidade.',
  'Data longe da data do ciclo': 'A data está a mais de 15 dias da data do ciclo.',
  'Foto obrigatoria (leitura da Libergas)': 'Foto obrigatória: a leitura é da Libergás.',
  'Leitura com mais de 3 casas': 'Use até 3 casas depois da vírgula.',
  'Data anterior a instalacao do medidor': 'Data anterior à instalação do medidor.',
  'Medidor ja retirado nessa data': 'O medidor já tinha sido retirado nessa data.',
  'Leitura nao encontrada ou ciclo fechado': 'Leitura não encontrada ou ciclo já fechado.',
  'So o ultimo ciclo do condominio pode ser reaberto': 'Só o último ciclo do condomínio pode ser reaberto.',
  'Houve saida de morador cobrada depois do fechamento': 'Houve saída de morador cobrada depois do fechamento: não dá para reabrir.',
  'Unidade com leitura em ciclo aberto: feche o ciclo ou remova a leitura':
    'A unidade tem leitura no ciclo aberto: feche o ciclo ou remova a leitura antes da saída.',
  'Data anterior a ultima leitura cobrada': 'Data anterior à última leitura cobrada.',
  'Sem preco do P45 para o condominio': 'Sem preço do P45 para o condomínio (veja Preços no Cadastros).',
  'Unidade sem medidor': 'A unidade não tem medidor.',
  'Unidade nao encontrada': 'Unidade não encontrada.',
  'Ciclo faturado: desfaca os documentos antes de reabrir': 'Ciclo faturado: desfaça os documentos antes de reabrir.',
  'Este condominio paga num documento so: lance no ciclo': 'Este condomínio paga num documento só: lance no resumo do ciclo.',
  'Este condominio cobra por morador: lance em cada cobranca': 'Este condomínio cobra por morador: lance em cada unidade.',
  'So cobranca a cobrar recebe documento': 'Só cobrança a cobrar recebe documento.',
  'Feche o ciclo antes de faturar': 'Feche o ciclo antes de faturar.',
  'Numero do documento invalido': 'Número do documento inválido.',
  'Cobranca nao encontrada': 'Cobrança não encontrada.',
  'Ciclo nao encontrado ou fechado': 'Ciclo não encontrado ou já fechado.',
  'Ciclo com leituras: remova as leituras antes': 'O ciclo tem leituras: remova-as antes de excluir.',
};

export function mensagemErro(msg: string, padrao: string): string {
  if (Object.hasOwn(ERROS_RPC, msg)) return ERROS_RPC[msg];
  const anterior = /^Leitura menor que a anterior \(([\d.]+) em ([\d/]+)\)$/.exec(msg);
  if (anterior) return `Leitura menor que a anterior (${formatarM3(Number(anterior[1]))} em ${anterior[2]}).`;
  const seguinte = /^Leitura maior que a seguinte \(([\d.]+)\)$/.exec(msg);
  if (seguinte) return `Leitura maior que a seguinte (${formatarM3(Number(seguinte[1]))}).`;
  const alto = /^CONSUMO_ALTO: ([\d.]+) m3 \(esperado cerca de ([\d.]+) m3\)/.exec(msg);
  if (alto)
    return `Consumo alto: ${formatarM3(Number(alto[1]))} m³ (o normal seria cerca de ${alto[2].replace('.', ',')} m³). Confira a foto e marque "Conferi".`;
  const altoSemHist = /^CONSUMO_ALTO: ([\d.]+) m3 \(sem historico/.exec(msg);
  if (altoSemHist)
    return `Consumo alto: ${formatarM3(Number(altoSemHist[1]))} m³ num mês (acima de 30 m³). Confira a vírgula e a foto e marque "Conferi".`;
  const falta = /^FALTAM_LEITURAS: (\d+) unidade/.exec(msg);
  if (falta) return `${falta[1]} unidade(s) sem leitura.`;
  const unidade = /^Unidade (.+): leitura anterior a ultima cobrada$/.exec(msg);
  if (unidade) return `Unidade ${unidade[1]}: leitura com data anterior à última cobrada.`;
  return padrao;
}
export const ehConsumoAlto = (msg: string) => msg.startsWith('CONSUMO_ALTO');
export const ehFaltamLeituras = (msg: string) => msg.startsWith('FALTAM_LEITURAS');
