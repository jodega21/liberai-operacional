// O PostgREST do Supabase devolve no maximo 1.000 linhas por consulta e corta sem avisar. Consultas que
// crescem com o tempo (leituras, cobrancas, ciclos) leem todas as paginas por aqui. Mesmo padrao do
// lerPaginado do liberai-financeiro (src/lib/valegas/coleta.ts).
//
// Pagina por OFFSET exige ordem TOTAL: a consulta tem que terminar numa coluna unica (id). Ordem so por
// coluna repetida (data, referencia) deixa o banco devolver os empates em ordem diferente a cada pagina:
// linha lida duas vezes e linha nunca lida, sem erro.
export const TAMANHO_PAGINA = 1000;

type Resposta = { data: unknown; error: { message: string } | null };

export async function lerPaginado<T = unknown>(
  consulta: (de: number, ate: number) => PromiseLike<Resposta>,
  rotulo: string,
): Promise<T[]> {
  const linhas: T[] = [];
  for (let de = 0; ; de += TAMANHO_PAGINA) {
    const { data, error } = await consulta(de, de + TAMANHO_PAGINA - 1);
    if (error) throw new Error(`${rotulo}: ${error.message}`);
    const lote = (data ?? []) as T[];
    linhas.push(...lote);
    if (lote.length < TAMANHO_PAGINA) return linhas;
  }
}
