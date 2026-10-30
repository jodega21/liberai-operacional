import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createServerSessionClient } from '@/lib/supabase/session';
import { CHAVES, type Chave } from './chaves';

// Permissoes do usuario da sessao, lidas de acesso.minhas_permissoes() — a
// funcao resolve o usuario por auth.uid() la dentro, entao nao ha como pedir as
// permissoes de outra pessoa por aqui.
//
// FAIL-CLOSED: sem sessao, erro da RPC (devolvido ou lancado) ou resposta fora
// do formato (array de string) -> []. Lista vazia nao passa em `pode` nenhum, e o (app)/layout barra
// com <SemAcesso/> quem chega sem nenhuma permissao.
//
// `cache()`: layout, abas, pagina e controles pedem a lista no mesmo render;
// uma ida ao banco por request basta.
export const getPermissoes = cache(async (): Promise<string[]> => {
  const client = await createServerSessionClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return [];

  try {
    const { data, error } = await client.schema('acesso').rpc('minhas_permissoes');
    if (error || !Array.isArray(data) || !data.every((c) => typeof c === 'string')) {
      return [];
    }
    // O app so enxerga as proprias chaves (CHAVES): a RPC devolve todas as do
    // usuario, e chaves de outros sistemas sao ignoradas — senao quem so tem
    // chave de outro app passaria pelo layout com menu vazio.
    return (data as string[]).filter((c) => (CHAVES as readonly string[]).includes(c));
  } catch {
    // Excecao (rede, fetch abortado) = mesmo destino do erro devolvido.
    return [];
  }
});

// Uma chave ou um CONJUNTO de chaves. Semantica do conjunto: possui QUALQUER
// uma delas (OU, nao E).
export async function pode(chave: Chave | readonly Chave[]): Promise<boolean> {
  const permissoes = await getPermissoes();
  const exigidas: readonly Chave[] = typeof chave === 'string' ? [chave] : chave;
  return exigidas.some((c) => permissoes.includes(c));
}

// Gate de PAGINA (Server Component). Em Server Action usar `pode` e devolver
// { ok:false }: o redirect() daqui, numa action, lanca NEXT_REDIRECT e navega o
// cliente em vez de devolver o erro — matando o aviso inline.
//
// Destino /sem-permissao: a pagina nao tem gate proprio, entao o redirect nunca
// entra em loop, qualquer que seja o conjunto de permissoes de quem chega.
export async function exigir(chave: Chave | readonly Chave[]): Promise<void> {
  if (!(await pode(chave))) {
    redirect('/sem-permissao');
  }
}
