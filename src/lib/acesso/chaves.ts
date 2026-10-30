// Catalogo de permissoes do RBAC (schema `acesso`) usado por este app.
//
// Chave nova nasce no banco (acesso.permissoes) e aqui no mesmo PR; nunca so
// de um lado. tests/lib/acesso/catalogo.test.ts trava a lista.
//
// Modulo puro (sem server-only): o tipo `Chave` e usado tambem pela navegacao,
// que roda no cliente.
export const CHAVES = [
  // Leitura de medidores (LEI2): lancar leituras e saidas; fechar e reabrir ciclos.
  'operacional.leitura.lancar',
  'operacional.leitura.fechar',
  // Apontamentos (20261023140000): este app so aponta; a caixa fica no LiberAi Cadastros.
  'apontamentos.criar',
] as const;

export type Chave = (typeof CHAVES)[number];
