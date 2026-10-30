import { CHAVES } from '@/lib/acesso/chaves';

// Listas de permissao para os testes. "admin" tem todo o catalogo; "operador"
// so lanca leituras (fechar/reabrir ciclo e do Administrador). Qualquer outro
// nome — e sessao sem papel — nao tem chave nenhuma.
export const CHAVES_ADMIN: readonly string[] = CHAVES;

export const CHAVES_OPERADOR: readonly string[] = ['operacional.leitura.lancar', 'apontamentos.criar'];

export function chavesDoPapel(papel: string | null): string[] {
  if (papel === 'admin') return [...CHAVES_ADMIN];
  if (papel === 'operador') return [...CHAVES_OPERADOR];
  return [];
}
