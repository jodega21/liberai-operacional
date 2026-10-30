import type { Chave } from '@/lib/acesso/chaves';

// Filtro de navegacao por permissao (RBAC, schema `acesso`).
//
// COSMETICO, nao seguranca. Esconder um item de menu ou uma aba nao protege
// nada: a autorizacao de verdade e o `exigir` no topo de cada rota, que roda no
// servidor e segue valendo mesmo se alguem digitar a URL na mao. O que isto
// resolve e o item morto — o operador via "Transações" no menu e clicava para
// ser devolvido.
//
// A `chave` de cada item e a MESMA do `exigir` da pagina para onde ele leva;
// assim o item aparece exatamente para quem a rota deixa entrar. Conjunto de
// chaves = OU (item visivel se o usuario tem QUALQUER uma) — e o caso do item
// de menu do Vale-Gas, que leva a uma casca com abas de chaves diferentes.
export interface ItemNavegavel {
  chave: Chave | readonly Chave[];
}

export function visiveisPara<T extends ItemNavegavel>(itens: T[], permissoes: readonly string[]): T[] {
  return itens.filter((item) => {
    const chaves: readonly Chave[] = typeof item.chave === 'string' ? [item.chave] : item.chave;
    return chaves.some((c) => permissoes.includes(c));
  });
}
