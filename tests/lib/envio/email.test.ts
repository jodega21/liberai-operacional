import { describe, it, expect } from 'vitest';
import { emailDemonstrativo, emailResumoCondominio, escapar } from '@/lib/envio/email';
import type { Demonstrativo } from '@/lib/leitura/demonstrativo';

const d: Demonstrativo = {
  unidade_id: 'u', identificacao: '401', morador: 'JOSÉ <TESTE>', situacao: 'cobrar',
  anterior: { valor: 8084.083, data: '2026-09-10' }, atual: { valor: 8107.534, data: '2026-10-10' }, dias: 30,
  consumo: 23.451, kg: 55.1, preco_m3: 22.35, valor: 524.13, composicao: [], documento: { tipo: 'boleto', numero: '777' },
  historico: [{ referencia: '2026-09-01', m3: 22.391, valor: 500.44, marca: null, valor_cobrado: null },
    { referencia: '2026-10-01', m3: 23.451, valor: 524.13, marca: null, valor_cobrado: null }],
  consumo_mes: 23.451,
};
const base = { d, condominio: 'MONTE CASTELO', referencia: '2026-10-01', vencimento: '2026-11-10', minimo: 65, quemLe: 'Libergás', urlBase: 'https://app.test' };

describe('emailDemonstrativo', () => {
  it('assunto, valores, documento e escape do texto', () => {
    const e = emailDemonstrativo({ ...base, comComunicado: false });
    expect(e.assunto).toBe('Demonstrativo de gás out/2026 - MONTE CASTELO - unidade 401');
    expect(e.html).toContain('8.107,534');
    expect(e.html).toContain('R$&nbsp;524,13'.replace('&nbsp;', ' '));
    expect(e.html).toContain('Boleto nº 777');
    expect(e.html).toContain('10/\u206011/\u20602026');
    expect(e.html).toContain('JOSÉ &lt;TESTE&gt;');
    expect(e.html).toContain('https://app.test/marca-libergas-transparente.png');
    // tabela mes a mes abaixo do grafico, com o valor em R$
    expect(e.html).toContain('VALOR DO CONSUMO');
    expect(e.html).toMatch(/22,391<\/td><td[^>]*>R\$\s500,44<\/td>/);
    expect(e.html).not.toContain('Prezado(a) morador(a)');
    expect(e.texto).toContain('Leitura atual: 8.107,534 m³ (10/10/2026)');
  });

  it('comunicado do primeiro mes com o minimo do condominio', () => {
    const e = emailDemonstrativo({ ...base, comComunicado: true, minimo: 65 });
    expect(e.html).toContain('Prezado(a) morador(a)');
    expect(e.html).toContain('abaixo do mínimo de R$ 65,00');
    expect(e.texto.startsWith('Novo demonstrativo de consumo de gás')).toBe(true);
  });

  it('unidade que acumula: sem cobranca, sem vencimento', () => {
    const e = emailDemonstrativo({ ...base, d: { ...d, situacao: 'acumula', documento: null, valor: 30 }, comComunicado: false });
    expect(e.html).toContain('Sem cobrança neste mês.');
    expect(e.html).not.toContain('Vencimento');
  });
});

describe('emailResumoCondominio', () => {
  it('total, documento e uma linha por unidade', () => {
    const e = emailResumoCondominio({
      resumo: { unidades: [d], cobradas: 1, acumulam: 0, total_valor: 524.13, consumo_mes: 23.451, kg_mes: 55.1, p45_mes: 1.2, preco_m3: 22.35 },
      condominio: 'PROLAR CADIZ', referencia: '2026-10-01', vencimento: null, documento: { tipo: 'boleto', numero: '55' }, urlBase: 'https://app.test',
    });
    expect(e.assunto).toBe('Resumo da leitura de gás out/2026 - PROLAR CADIZ');
    expect(e.html).toContain('Boleto nº 55');
    expect(e.texto).toContain('401 - JOSÉ <TESTE>: 23,451 m³');
  });
});

describe('escapar', () => {
  it('escapa HTML', () => expect(escapar('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;'));
});
