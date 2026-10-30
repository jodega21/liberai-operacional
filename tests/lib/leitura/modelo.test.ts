import { describe, it, expect } from 'vitest';
import {
  dataSugerida,
  formatarM3Campo,
  previaDigitada,
  tipoPadrao,
  vencimento,
  documentoSchema,
  leituraSchema,
  lerValorM3,
  mensagemErro,
  proximaReferencia,
  rotuloMes,
  saidaSchema,
} from '@/lib/leitura/modelo';

const UUID = 'aaaaaaaa-1111-4222-8333-444444444444';

describe('lerValorM3', () => {
  it('aceita virgula, ponto e milhar', () => {
    expect(lerValorM3('2014,281')).toBe(2014.281);
    expect(lerValorM3('2014.281')).toBe(2014.281);
    expect(lerValorM3('2.014,281')).toBe(2014.281);
    expect(lerValorM3(' 345 ')).toBe(345);
    expect(lerValorM3('0,5')).toBe(0.5);
  });
  it('campo sem milhar volta igual', () => {
    expect(formatarM3Campo(2014.281)).toBe('2014,281');
    expect(lerValorM3(formatarM3Campo(2014.281))).toBe(2014.281);
  });
  it('recusa mais de 3 casas, negativo e texto', () => {
    for (const t of ['2014,2811', '-1', 'abc', '', '1,2,3']) expect(lerValorM3(t)).toBeNull();
  });
});

describe('meses', () => {
  it('proxima referencia vira o ano', () => {
    expect(proximaReferencia('2026-12-01', '2026-10-29')).toBe('2027-01-01');
    expect(proximaReferencia('2026-10-01', '2026-10-29')).toBe('2026-11-01');
    expect(proximaReferencia(null, '2026-10-29')).toBe('2026-10-01');
  });
  it('data sugerida respeita o fim do mes', () => {
    expect(dataSugerida('2026-11-01', 10)).toBe('2026-11-10');
    expect(dataSugerida('2027-02-01', 31)).toBe('2027-02-28');
  });
  it('rotulo do mes', () => expect(rotuloMes('2026-10-01')).toBe('out/2026'));
});

describe('schemas', () => {
  it('leitura: valor e data opcional', () => {
    const v = leituraSchema.parse({ cicloId: UUID, medidorId: UUID, valor: '2014,281', data: '', observacao: ' x ', conferido: false });
    expect(v).toMatchObject({ valor: 2014.281, data: null, observacao: 'x' });
    expect(leituraSchema.safeParse({ cicloId: UUID, medidorId: UUID, valor: '1,2345', data: '', observacao: '', conferido: false }).success).toBe(false);
  });
  it('saida exige data e quem leu', () => {
    const base = { unidadeId: UUID, data: '2026-10-29', valor: '10', quemLeu: 'sindico', observacao: '', conferido: false };
    expect(saidaSchema.safeParse(base).success).toBe(true);
    expect(saidaSchema.safeParse({ ...base, data: '2026-02-30' }).success).toBe(false);
    expect(saidaSchema.safeParse({ ...base, quemLeu: 'outro' }).success).toBe(false);
  });
});

describe('previaDigitada', () => {
  it('consumo, a cobrar e alerta', () => {
    expect(previaDigitada(136, 127.478, 127.478, 20.92)).toEqual({ consumo: 8.522, aCobrar: 8.522, valor: 178.28, menor: false, alto: false });
    expect(previaDigitada(136000, 127.478, 127.478, 20.92).alto).toBe(true);
    expect(previaDigitada(1, 127.478, 127.478, 20.92).menor).toBe(true);
    expect(previaDigitada(null, 127.478, 127.478, 20.92).consumo).toBeNull();
    // acumulou: cobra desde a ultima cobrada, nao desde a anterior
    expect(previaDigitada(345.08, 344.836, 344.524, 22.35)).toMatchObject({ consumo: 0.244, aCobrar: 0.556, valor: 12.43 });
  });
});

describe('faturamento', () => {
  it('tipo padrao vem do pagamento do cadastro; sem dado = boleto', () => {
    expect(tipoPadrao(null)).toBe('boleto');
    expect(tipoPadrao('Boleto')).toBe('boleto');
    expect(tipoPadrao('NF-e')).toBe('nfe');
    expect(tipoPadrao('PIX na hora')).toBe('recibo');
  });
  it('vencimento no mes seguinte, respeitando o fim do mes', () => {
    expect(vencimento('2026-10-01', 15)).toBe('2026-11-15');
    expect(vencimento('2026-12-01', 15)).toBe('2027-01-15');
    expect(vencimento('2027-01-01', 31)).toBe('2027-02-28');
    expect(vencimento('2026-10-01', null)).toBeNull();
  });
  it('documento exige numero quando lanca; desfazer nao', () => {
    const id = 'aaaaaaaa-1111-4222-8333-444444444444';
    expect(documentoSchema.safeParse({ id, tipo: 'boleto', numero: ' ' }).success).toBe(false);
    expect(documentoSchema.safeParse({ id, tipo: 'boleto', numero: '000123' }).success).toBe(true);
    expect(documentoSchema.safeParse({ id, tipo: null, numero: '' }).success).toBe(true);
    expect(documentoSchema.safeParse({ id, tipo: 'planilha', numero: '1' }).success).toBe(false);
  });
});

describe('mensagemErro', () => {
  it('traduz as mensagens do banco', () => {
    expect(mensagemErro('Leitura menor que a anterior (2982.289 em 10/10/2026)', 'x')).toBe('Leitura menor que a anterior (2.982,289 em 10/10/2026).');
    expect(mensagemErro('CONSUMO_ALTO: 60.000 m3 (esperado cerca de 7.1 m3). Confira a leitura.', 'x')).toContain('Consumo alto: 60,000 m³');
    expect(mensagemErro('FALTAM_LEITURAS: 2 unidade(s) sem leitura', 'x')).toBe('2 unidade(s) sem leitura.');
    expect(mensagemErro('Foto obrigatoria (leitura da Libergas)', 'x')).toBe('Foto obrigatória: a leitura é da Libergás.');
    expect(mensagemErro('CONSUMO_ALTO: 135872.522 m3 (sem historico; acima de 30 m3). Confira a leitura.', 'x')).toContain('acima de 30 m³');
    expect(mensagemErro('qualquer outra', 'padrao')).toBe('padrao');
  });
});
