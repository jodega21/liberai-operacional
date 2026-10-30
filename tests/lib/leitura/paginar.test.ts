import { describe, it, expect, vi } from 'vitest';
import { lerPaginado, TAMANHO_PAGINA } from '@/lib/leitura/paginar';

// Fonte falsa com N linhas que respeita a faixa pedida, como o .range() do PostgREST.
function fonte(n: number) {
  const linhas = Array.from({ length: n }, (_, i) => ({ i }));
  return vi.fn(async (de: number, ate: number) => ({ data: linhas.slice(de, ate + 1), error: null }));
}

describe('lerPaginado', () => {
  it('le alem das 1.000 linhas', async () => {
    const f = fonte(2500);
    const r = await lerPaginado<{ i: number }>(f, 'x');
    expect(r).toHaveLength(2500);
    expect(r[2499].i).toBe(2499);
    expect(f.mock.calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });
  it('pagina exata pede mais uma e para no vazio', async () => {
    const f = fonte(TAMANHO_PAGINA);
    expect(await lerPaginado(f, 'x')).toHaveLength(TAMANHO_PAGINA);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it('uma pagina so quando cabe', async () => {
    const f = fonte(3);
    expect(await lerPaginado(f, 'x')).toHaveLength(3);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('data null vira vazio', async () => {
    expect(await lerPaginado(async () => ({ data: null, error: null }), 'x')).toEqual([]);
  });
  it('erro em qualquer pagina derruba com o rotulo', async () => {
    let n = 0;
    const f = async () => (++n === 2 ? { data: null, error: { message: 'timeout' } } : { data: Array(TAMANHO_PAGINA).fill({}), error: null });
    await expect(lerPaginado(f, 'historico de cobrancas')).rejects.toThrow('historico de cobrancas: timeout');
  });
});
