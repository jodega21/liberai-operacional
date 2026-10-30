import { describe, it, expect } from 'vitest';
import { CHAVES } from '@/lib/acesso/chaves';

/**
 * Catalogo do app: igualdade exata. Chave a mais no codigo = `pode` que nunca
 * passa enquanto o banco nao a tiver; chave a menos = permissao do banco
 * ignorada pelo filtro de getPermissoes.
 */
describe('catalogo de permissoes', () => {
  it('CHAVES contem exatamente as chaves do operacional, nesta ordem', () => {
    expect([...CHAVES]).toEqual([
      'operacional.leitura.lancar',
      'operacional.leitura.fechar',
      'apontamentos.criar',
    ]);
  });
});
