import { describe, it, expect } from 'vitest';
import { alvosCondominio, alvosMoradores, chaveAlvo, pendentes, type EnvioRegistrado, type UnidadeCobrada } from '@/lib/envio/modelo';

const ana = { cliente_id: 'ana', nome: 'ANA', email: 'ana@x.com', canal: 'email' };
const un = (patch: Partial<UnidadeCobrada>): UnidadeCobrada => ({
  unidade_id: 'u1', identificacao: '101', cobranca_id: 'c1', documento: { tipo: 'boleto', numero: '123' }, morador: ana, ...patch,
});
const env = (p: Partial<EnvioRegistrado>): EnvioRegistrado => ({
  origem_tipo: 'leitura_cobranca', origem_id: 'c1', destinatario: 'ana@x.com', cliente_id: 'ana', status: 'enviado', erro: null,
  enviado_em: '2026-11-20T12:00:00Z', ...p,
});

describe('alvosMoradores (G1-A)', () => {
  it('cobranca com documento e morador de canal e-mail: envia, com o comunicado na primeira vez', () => {
    const [a] = alvosMoradores([un({})], []);
    expect(a).toMatchObject({ para: 'ana@x.com', motivo: null, com_comunicado: true, ultimo: null, rotulo: 'Unidade 101' });
  });

  it('motivos de nao enviar, na ordem: documento, morador, canal, e-mail', () => {
    const r = alvosMoradores([
      un({ cobranca_id: 'a', documento: null }),
      un({ cobranca_id: 'b', documento: { tipo: 'planilha', numero: null } }),
      un({ cobranca_id: 'c', morador: null }),
      un({ cobranca_id: 'd', morador: { ...ana, canal: 'carta' } }),
      un({ cobranca_id: 'e', morador: { ...ana, canal: null } }),
      un({ cobranca_id: 'f', morador: { ...ana, email: null } }),
      un({ cobranca_id: 'g', morador: { ...ana, email: 'sem-arroba' } }),
    ], []);
    expect(r.map((a) => a.motivo)).toEqual(['sem_documento', 'sem_documento', 'sem_morador', 'canal', 'canal', 'sem_email', 'sem_email']);
    expect(r.every((a) => a.para === null && !a.com_comunicado)).toBe(true);
  });

  it('quem ja recebeu um demonstrativo nao recebe o comunicado de novo; falha nao conta', () => {
    expect(alvosMoradores([un({ cobranca_id: 'c2' })], [env({ origem_id: 'c1' })])[0].com_comunicado).toBe(false);
    expect(alvosMoradores([un({ cobranca_id: 'c2' })], [env({ origem_id: 'c1', status: 'falhou', erro: 'x' })])[0].com_comunicado).toBe(true);
  });

  it('ultimo envio da origem e do e-mail: o mais recente', () => {
    const [a] = alvosMoradores([un({})], [
      env({ status: 'falhou', erro: 'x', enviado_em: '2026-11-20T10:00:00Z' }),
      env({ enviado_em: '2026-11-20T11:00:00Z' }),
      env({ destinatario: 'outro@x.com', status: 'falhou', erro: 'y', enviado_em: '2026-11-21T10:00:00Z' }),
    ]);
    expect(a.ultimo?.status).toBe('enviado');
  });
});

describe('pendentes e chave', () => {
  it('so quem pode e ainda nao tem envio com sucesso', () => {
    const r = alvosMoradores([un({ cobranca_id: 'c1' }), un({ cobranca_id: 'c2' }), un({ cobranca_id: 'c3', morador: null })], [
      env({ origem_id: 'c1' }),
      env({ origem_id: 'c2', status: 'falhou', erro: 'x' }),
    ]);
    expect(pendentes(r).map((a) => a.origem_id)).toEqual(['c2']);
    expect(chaveAlvo(r[0])).toBe('c1|ana@x.com');
  });
});

describe('alvosCondominio (G2)', () => {
  it('um alvo por e-mail valido, sem repetir; sem documento ou sem e-mail vira motivo', () => {
    expect(alvosCondominio('ci', { tipo: 'boleto', numero: '9' }, [' Sindico@X.com ', 'sindico@x.com', 'adm@y.com', 'ruim'], [])
      .map((a) => a.para)).toEqual(['sindico@x.com', 'adm@y.com']);
    expect(alvosCondominio('ci', null, ['a@b.com'], [])[0].motivo).toBe('sem_documento');
    expect(alvosCondominio('ci', { tipo: 'boleto', numero: '9' }, [], [])[0].motivo).toBe('sem_email');
  });
});
