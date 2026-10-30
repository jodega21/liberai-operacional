import { describe, it, expect } from 'vitest';
import {
  consumoEntre,
  dataDaBase,
  diasEntre,
  emPares,
  historicoDoAno,
  montarDemonstrativos,
  precosPorCiclo,
  resumirCondominio,
  type ExtrasUnidade,
  type LeituraHist,
  type MedidorHist,
} from '@/lib/leitura/demonstrativo';
import type { CicloCompleto, LinhaCiclo } from '@/lib/leitura/modelo';

const VELHO: MedidorHist = { id: 'v', instalado_em: '2025-12-10', criado_em: '2025-12-10T10:00:00Z', leitura_inicial: 100, leitura_final: 110 };
const NOVO: MedidorHist = { id: 'n', instalado_em: '2026-03-20', criado_em: '2026-03-20T10:00:00Z', leitura_inicial: 0, leitura_final: null };
const mensal = (medidor_id: string, data: string, valor: number, referencia: string): LeituraHist => ({ medidor_id, data, valor, tipo: 'mensal', referencia });

describe('consumoEntre', () => {
  it('mesmo medidor', () => expect(consumoEntre([VELHO], { medidor_id: 'v', valor: 101 }, { medidor_id: 'v', valor: 104.5 })).toBe(3.5));
  it('atravessa a troca: final do velho - base + atual - inicial do novo', () =>
    expect(consumoEntre([NOVO, VELHO], { medidor_id: 'v', valor: 108 }, { medidor_id: 'n', valor: 3 })).toBe(5));
  it('ordem que nao fecha', () => expect(consumoEntre([VELHO, NOVO], { medidor_id: 'n', valor: 1 }, { medidor_id: 'v', valor: 2 })).toBeNull());
});

describe('historicoDoAno', () => {
  const leituras = [
    mensal('v', '2025-12-10', 100, '2025-12-01'),
    mensal('v', '2026-01-10', 104, '2026-01-01'),
    mensal('v', '2026-02-10', 108, '2026-02-01'),
    { medidor_id: 'v', data: '2026-02-20', valor: 109, tipo: 'saida' as const, referencia: null },
    mensal('n', '2026-03-25', 3, '2026-03-01'),
    mensal('n', '2026-04-10', 9, '2026-04-01'),
  ];
  it('um ponto por mes, a saida nao corta, a troca soma os medidores', () => {
    expect(historicoDoAno([VELHO, NOVO], leituras, 2026, '2026-04-01').map((p) => [p.referencia, p.m3])).toEqual([
      ['2026-01-01', 4],
      ['2026-02-01', 4],
      ['2026-03-01', 5],
      ['2026-04-01', 6],
    ]);
  });
  it('para no ciclo pedido', () => expect(historicoDoAno([VELHO, NOVO], leituras, 2026, '2026-02-01')).toHaveLength(2));
  it('sem mensal anterior parte da inicial do medidor', () =>
    expect(historicoDoAno([VELHO], [mensal('v', '2026-01-10', 103, '2026-01-01')], 2026, '2026-12-01').map((p) => p.m3)).toEqual([3]));
  it('valor do mes e marcas: + no acumulado, = no cobrado com acumulado, nada no cobrado normal', () => {
    const cobs = [
      { referencia: '2026-01-01', situacao: 'cobrar' as const, valor: 40, preco_m3: 10 },
      { referencia: '2026-02-01', situacao: 'acumula' as const, valor: 0, preco_m3: 0 }, // planilha: preco 0
      { referencia: '2026-03-01', situacao: 'cobrar' as const, valor: 90, preco_m3: 10 },
    ];
    const precos = new Map([['2026-01-01', 10], ['2026-02-01', 10], ['2026-03-01', 10]]);
    const h = historicoDoAno([VELHO, NOVO], leituras, 2026, '2026-04-01', cobs, precos);
    expect(h.map((p) => [p.valor, p.marca, p.valor_cobrado])).toEqual([
      [40, null, null],
      [40, '+', null],
      [50, '=', 90],
      [null, null, null], // abril sem preco nem cobranca
    ]);
  });
});

describe('dataDaBase e dias', () => {
  const ls = [mensal('v', '2026-01-10', 104, '2026-01-01'), mensal('v', '2026-02-10', 108, '2026-02-01')];
  it('leitura com o valor da base', () => expect(dataDaBase([VELHO], ls, { medidor_id: 'v', valor: 104 }, '2026-03-10')).toBe('2026-01-10'));
  it('base = leitura inicial -> instalacao', () => expect(dataDaBase([VELHO], ls, { medidor_id: 'v', valor: 100 }, '2026-03-10')).toBe('2025-12-10'));
  it('sem correspondencia', () => expect(dataDaBase([VELHO], ls, { medidor_id: 'v', valor: 99 }, '2026-03-10')).toBeNull());
  it('dias', () => expect(diasEntre('2026-09-10', '2026-10-10')).toBe(30));
});

function linha(p: Partial<LinhaCiclo> & { unidade_id: string; identificacao: string }): LinhaCiclo {
  return {
    morador: 'M', medidor_id: 'v', anterior: null, leitura: null, base_valor: null, consumo: null, em_aberto: 0, cobranca_id: null,
    documento: null, composicao: [], codigo_bs: null, tipo_padrao: 'boleto', ficou_em_aberto: null, preco_m3: null, valor: null,
    situacao: 'sem_leitura', ...p,
  };
}
const leit = (valor: number, data: string) => ({ id: 'l', valor, data, foto_url: null, observacao: null, conferido: false });

describe('montarDemonstrativos e resumo', () => {
  const dados = {
    ciclo: { id: 'c', referencia: '2026-02-01', data_leitura: '2026-02-10', status: 'fechado', minimo_cobranca: 65, documento: null },
    condominio: { id: 'x', nome: 'X', quem_le: 'libergas', minimo_cobranca: 65, cobra_condominio: false, dia_vencimento: 10, codigo_bs: null },
    vencimento: '2026-03-10',
    erroPrevia: null,
    linhas: [
      linha({ unidade_id: 'u10', identificacao: '10', situacao: 'cobrar', leitura: leit(108, '2026-02-10'), base_valor: 104, consumo: 4, preco_m3: 22.35, valor: 89.4 }),
      linha({ unidade_id: 'u2', identificacao: '2', situacao: 'acumula', leitura: leit(51, '2026-02-10'), base_valor: 50, consumo: 1, preco_m3: 0, valor: 0 }),
      linha({ unidade_id: 'u3', identificacao: '3' }),
    ],
  } as CicloCompleto;
  const extras = new Map<string, ExtrasUnidade>([
    ['u10', {
      base: { medidor_id: 'v', valor: 104 }, medidores: [VELHO],
      leituras: [mensal('v', '2026-01-10', 104, '2026-01-01'), mensal('v', '2026-02-10', 108, '2026-02-01')],
      cobrancas: [{ referencia: '2026-01-01', situacao: 'cobrar', valor: 89.4, preco_m3: 22.35 }, { referencia: '2026-02-01', situacao: 'cobrar', valor: 89.4, preco_m3: 22.35 }],
    }],
  ]);
  const ds = montarDemonstrativos(dados, extras, 2.35);
  it('so unidades com leitura, em ordem de unidade', () => expect(ds.map((d) => d.identificacao)).toEqual(['2', '10']));
  it('cobrar com base, dias, kg e historico', () => {
    const d = ds[1];
    expect(d.anterior).toEqual({ valor: 104, data: '2026-01-10' });
    expect(d.dias).toBe(31);
    expect(d.kg).toBe(9.4);
    expect(d.historico).toEqual([
      { referencia: '2026-01-01', m3: 4, valor: 89.4, marca: null, valor_cobrado: null },
      { referencia: '2026-02-01', m3: 4, valor: 89.4, marca: null, valor_cobrado: null },
    ]);
    expect(d.consumo_mes).toBe(4);
  });
  it('documento so na cobrada; condominio que paga usa o documento do ciclo', () => {
    expect(ds[1].documento).toBeNull();
    const comDoc = { ...dados, linhas: [{ ...dados.linhas[0], documento: { tipo: 'boleto' as const, numero: '123' } }] };
    expect(montarDemonstrativos(comDoc, extras, 2.35)[0].documento).toEqual({ tipo: 'boleto', numero: '123' });
    const cond = { ...comDoc, condominio: { ...comDoc.condominio, cobra_condominio: true }, ciclo: { ...comDoc.ciclo, documento: { tipo: 'nfe' as const, numero: '9' } } };
    expect(montarDemonstrativos(cond, extras, 2.35)[0].documento).toEqual({ tipo: 'nfe', numero: '9' });
  });
  it('preco zero (planilha) vira null; sem extras, sem data e sem historico', () => {
    expect(ds[0].preco_m3).toBeNull();
    expect(ds[0].anterior.data).toBeNull();
    expect(ds[0].historico).toEqual([]);
  });
  it('resumo', () => {
    const r = resumirCondominio(ds, 2.35);
    expect(r).toMatchObject({ cobradas: 1, acumulam: 1, total_valor: 89.4, consumo_mes: 4, kg_mes: 9.4, p45_mes: 0.2, preco_m3: 22.35 });
  });
  it('pares', () => expect(emPares([1, 2, 3])).toEqual([[1, 2], [3]]));
  it('preco de reserva = o mais comum do ciclo, nao o maior', () => {
    const e = (preco: number) => ({ base: null, medidores: [], leituras: [], cobrancas: [{ referencia: '2026-09-01', situacao: 'cobrar' as const, valor: 1, preco_m3: preco }] });
    expect(precosPorCiclo([e(22.35), e(38.18), e(22.35), e(0)]).get('2026-09-01')).toBe(22.35);
  });
  it('o preco da propria cobranca vence o do ciclo', () => {
    const cobs = [{ referencia: '2026-01-01', situacao: 'cobrar' as const, valor: 152.72, preco_m3: 38.18 }];
    const h = historicoDoAno([VELHO], [mensal('v', '2026-01-10', 104, '2026-01-01')], 2026, '2026-12-01', cobs, new Map([['2026-01-01', 22.35]]));
    expect([h[0].valor, h[0].marca]).toEqual([152.72, null]);
  });
});
