import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks (declarados antes do hoisting dos vi.mock) ──────────────────
const { redirectMock, getUserMock, rpcMock, schemaMock } = vi.hoisted(() => {
  const redirectMock = vi.fn();
  const getUserMock = vi.fn();
  const rpcMock = vi.fn();
  const schemaMock = vi.fn(() => ({ rpc: rpcMock }));
  return { redirectMock, getUserMock, rpcMock, schemaMock };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({ redirect: redirectMock }));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    schema: schemaMock,
  })),
}));

import { getPermissoes, pode, exigir } from '@/lib/acesso/permissoes';
import type { Chave } from '@/lib/acesso/chaves';

// Chave fora do catalogo (so para testar ausencia e o OU). O RPC devolve texto
// livre, e o tipo `Chave` do app so conhece operacional.leitura.lancar.
const OUTRA = 'operacional.outra' as unknown as Chave;

function comUsuario(resposta: { data: unknown; error: unknown }) {
  getUserMock.mockResolvedValue({ data: { user: { id: 'uid' } } });
  rpcMock.mockResolvedValue(resposta);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getPermissoes', () => {
  it('sem usuario -> [] e nem chama a RPC', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect(await getPermissoes()).toEqual([]);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('erro da RPC -> [] (fail-closed)', async () => {
    comUsuario({ data: null, error: { message: 'permission denied for schema acesso' } });
    expect(await getPermissoes()).toEqual([]);
  });

  it('RPC lanca excecao -> [] (fail-closed)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'uid' } } });
    rpcMock.mockRejectedValue(new Error('fetch failed'));
    expect(await getPermissoes()).toEqual([]);
  });

  it('data que nao e array -> []', async () => {
    comUsuario({ data: 'operacional.leitura.lancar', error: null });
    expect(await getPermissoes()).toEqual([]);
  });

  it('array com item que nao e string -> []', async () => {
    comUsuario({ data: ['operacional.leitura.lancar', { chave: 'operacional.outra' }], error: null });
    expect(await getPermissoes()).toEqual([]);
  });

  it('caso ok: devolve as chaves lidas de acesso.minhas_permissoes', async () => {
    comUsuario({ data: ['operacional.leitura.lancar'], error: null });
    expect(await getPermissoes()).toEqual(['operacional.leitura.lancar']);
    expect(schemaMock).toHaveBeenCalledWith('acesso');
    expect(rpcMock).toHaveBeenCalledWith('minhas_permissoes');
  });

  // Chaves reais do outro app do RBAC (mesmo schema `acesso`).
  const CHAVES_OUTRO_APP = ['contas.ver', 'transacoes.ver', 'regras.gerenciar'];

  it('so chaves do outro app -> [] (chaves de outros sistemas sao ignoradas)', async () => {
    comUsuario({ data: CHAVES_OUTRO_APP, error: null });
    expect(await getPermissoes()).toEqual([]);
  });

  it('chaves do outro app + operacional.leitura.lancar -> so a do cadastros', async () => {
    comUsuario({
      data: ['contas.ver', 'operacional.leitura.lancar', 'transacoes.ver', 'regras.gerenciar'],
      error: null,
    });
    expect(await getPermissoes()).toEqual(['operacional.leitura.lancar']);
  });

  it('chave fora do catalogo e ignorada', async () => {
    comUsuario({ data: ['operacional.leitura.lancar', 'operacional.outra'], error: null });
    expect(await getPermissoes()).toEqual(['operacional.leitura.lancar']);
  });
});

describe('pode', () => {
  it('chave unica presente -> true', async () => {
    comUsuario({ data: ['operacional.leitura.lancar'], error: null });
    expect(await pode('operacional.leitura.lancar')).toBe(true);
  });

  it('chave unica ausente -> false', async () => {
    comUsuario({ data: ['operacional.outra'], error: null });
    expect(await pode('operacional.leitura.lancar')).toBe(false);
  });

  it('array: basta UMA das chaves (OU)', async () => {
    comUsuario({ data: ['operacional.leitura.lancar'], error: null });
    expect(await pode([OUTRA, 'operacional.leitura.lancar'])).toBe(true);
  });

  it('array: nenhuma das chaves -> false', async () => {
    comUsuario({ data: ['operacional.leitura.lancar'], error: null });
    expect(await pode([OUTRA])).toBe(false);
  });

  it('array vazio -> false', async () => {
    comUsuario({ data: ['operacional.leitura.lancar'], error: null });
    expect(await pode([])).toBe(false);
  });

  it('sessao expirada -> false', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect(await pode('operacional.leitura.lancar')).toBe(false);
  });
});

describe('exigir', () => {
  it('nao redireciona quando tem a chave', async () => {
    comUsuario({ data: ['operacional.leitura.lancar'], error: null });
    await exigir('operacional.leitura.lancar');
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redireciona para /sem-permissao quando nao tem a chave', async () => {
    comUsuario({ data: ['operacional.outra'], error: null });
    await exigir('operacional.leitura.lancar');
    expect(redirectMock).toHaveBeenCalledWith('/sem-permissao');
  });

  it('array: nao redireciona com QUALQUER chave do conjunto', async () => {
    comUsuario({ data: ['operacional.leitura.lancar'], error: null });
    await exigir([OUTRA, 'operacional.leitura.lancar']);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('sem permissao nenhuma (erro da RPC) redireciona', async () => {
    comUsuario({ data: null, error: { message: 'boom' } });
    await exigir('operacional.leitura.lancar');
    expect(redirectMock).toHaveBeenCalledWith('/sem-permissao');
  });
});
