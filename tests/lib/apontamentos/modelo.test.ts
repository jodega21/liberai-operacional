import { describe, it, expect } from 'vitest';
import {
  AREAS,
  areasQueResolve,
  chaveResolver,
  criarSchema,
  MOTIVO_FUSAO,
  MOTIVO_OUTRO,
  MOTIVOS,
  parseCaixa,
  resolverSchema,
} from '@/lib/apontamentos/modelo';
import { CHAVES } from '@/lib/acesso/chaves';

const base = {
  area: 'cadastros' as const,
  url: '/clientes/abc',
  entidade: { tipo: 'cliente', id: 'abc' },
  retrato: 'FULANO — NFe 1',
  alvo: { texto: 'Rua X 10', caminho: 'main > div', x: 10, y: 20 },
  motivo: 'Endereço',
  nota: '',
};

describe('apontamentos: chaves e areas', () => {
  it('este app so aponta: tem a chave de criar e nenhuma de resolver (a caixa fica no cadastros)', () => {
    for (const a of AREAS) expect(CHAVES).not.toContain(chaveResolver(a));
    expect(CHAVES).toContain('apontamentos.criar');
  });
  it('areas que o usuario resolve vem das chaves', () => {
    expect(areasQueResolve(['apontamentos.criar', 'apontamentos.valegas.resolver'])).toEqual([
      'valegas',
    ]);
    expect(areasQueResolve([])).toEqual([]);
  });
  it('toda area tem Outro; cadastros tem o motivo de fusao', () => {
    for (const a of AREAS) expect(MOTIVOS[a]).toContain(MOTIVO_OUTRO);
    expect(MOTIVOS.cadastros).toContain(MOTIVO_FUSAO);
  });
});

describe('apontamentos: criar', () => {
  it('aceita o apontamento completo e o sem registro', () => {
    expect(criarSchema.safeParse(base).success).toBe(true);
    expect(criarSchema.safeParse({ ...base, entidade: null, retrato: null }).success).toBe(true);
  });
  it('motivo precisa ser da lista da area', () => {
    expect(criarSchema.safeParse({ ...base, motivo: 'Comprovante' }).success).toBe(false);
    expect(criarSchema.safeParse({ ...base, area: 'valegas', motivo: 'Comprovante' }).success).toBe(
      true
    );
  });
  it('Outro exige nota', () => {
    expect(criarSchema.safeParse({ ...base, motivo: MOTIVO_OUTRO }).success).toBe(false);
    expect(criarSchema.safeParse({ ...base, motivo: MOTIVO_OUTRO, nota: '  x ' }).success).toBe(
      true
    );
  });
  it('url so do proprio app', () => {
    expect(criarSchema.safeParse({ ...base, url: 'https://x.com' }).success).toBe(false);
    expect(criarSchema.safeParse({ ...base, url: '//x.com/a' }).success).toBe(false);
  });
  it('tipo de registro so minusculas e _', () => {
    expect(
      criarSchema.safeParse({ ...base, entidade: { tipo: 'Cliente;drop', id: '1' } }).success
    ).toBe(false);
  });
});

describe('apontamentos: resolver', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  it('resolvido sem nota passa; descartado exige motivo', () => {
    expect(resolverSchema.safeParse({ id, status: 'resolvido', solucao: '' }).success).toBe(true);
    expect(resolverSchema.safeParse({ id, status: 'descartado', solucao: ' ' }).success).toBe(
      false
    );
    expect(
      resolverSchema.safeParse({ id, status: 'descartado', solucao: 'nao e erro' }).success
    ).toBe(true);
  });
  it('nao volta para aberto', () => {
    expect(resolverSchema.safeParse({ id, status: 'aberto', solucao: '' }).success).toBe(false);
  });
});

describe('apontamentos: filtros da caixa', () => {
  it('padrao: abertos de todas as areas', () => {
    expect(parseCaixa({})).toEqual({ status: 'aberto', area: null });
  });
  it('le situacao e area validas e ignora o resto', () => {
    expect(parseCaixa({ situacao: 'todos', area: 'valegas' })).toEqual({
      status: 'todos',
      area: 'valegas',
    });
    expect(parseCaixa({ situacao: 'x', area: 'y' })).toEqual({ status: 'aberto', area: null });
  });
});
