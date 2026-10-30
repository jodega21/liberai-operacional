import { describe, it, expect } from 'vitest';
import { CHAVES_ADMIN, chavesDoPapel } from '../helpers/permissoes';
import { visiveisPara } from '@/lib/nav';
import type { Chave } from '@/lib/acesso/chaves';

// Chave fora do catalogo, para exercitar o item que NAO aparece. O cast e so
// do teste: no app o tipo `Chave` impede item com chave inexistente.
const OUTRA = 'operacional.outra' as unknown as Chave;

describe('visiveisPara — o predicado', () => {
  const itens = [
    { id: 'leitura', chave: 'operacional.leitura.lancar' as const },
    { id: 'restrito', chave: OUTRA },
  ];

  it('mostra so o item cuja chave o usuario tem', () => {
    expect(visiveisPara(itens, CHAVES_ADMIN).map((i) => i.id)).toEqual(['leitura']);
  });

  it('sem permissao nenhuma, nada aparece', () => {
    expect(visiveisPara(itens, chavesDoPapel(null))).toEqual([]);
  });

  it('conjunto de chaves = OU: basta uma', () => {
    const conjunto = [{ id: 'x', chave: [OUTRA, 'operacional.leitura.lancar'] as const }];
    expect(visiveisPara(conjunto, CHAVES_ADMIN).map((i) => i.id)).toEqual(['x']);
  });

  it('preserva a ORDEM da lista original', () => {
    const muitos = [
      { id: 'a', chave: 'operacional.leitura.lancar' as const },
      { id: 'b', chave: OUTRA },
      { id: 'c', chave: 'operacional.leitura.lancar' as const },
    ];
    expect(visiveisPara(muitos, CHAVES_ADMIN).map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('nao muta a lista original', () => {
    const antes = itens.length;
    visiveisPara(itens, CHAVES_ADMIN);
    expect(itens).toHaveLength(antes);
  });
});
