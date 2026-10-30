import { describe, it, expect, vi, beforeEach } from 'vitest';

const { podeMock, getUserMock, rpcMock, schemaMock, uploadMock, removeMock, revalidatePathMock } = vi.hoisted(() => {
  const rpcMock = vi.fn();
  return {
    podeMock: vi.fn(),
    getUserMock: vi.fn(),
    rpcMock,
    schemaMock: vi.fn(() => ({ rpc: rpcMock })),
    uploadMock: vi.fn(),
    removeMock: vi.fn(),
    revalidatePathMock: vi.fn(),
  };
});
vi.mock('@/lib/acesso/permissoes', () => ({ pode: podeMock }));
vi.mock('@/lib/supabase/session', () => ({
  createServerSessionClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(() => ({
    schema: schemaMock,
    storage: { from: vi.fn(() => ({ upload: uploadMock, remove: removeMock })) },
  })),
}));
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));

import { abrirCiclo, fecharCiclo, registrarLeitura, registrarSaida, reabrirCiclo } from '@/app/(app)/leitura/actions';
import { TENANT_ID } from '@/lib/constants';

const UID = '11111111-2222-4333-8444-555555555555';
const CI = 'aaaaaaaa-1111-4222-8333-444444444444';
const ME = 'bbbbbbbb-1111-4222-8333-444444444444';

function formLeitura(extra: Record<string, string | Blob> = {}) {
  const f = new FormData();
  f.set('cicloId', CI);
  f.set('medidorId', ME);
  f.set('valor', '2014,281');
  f.set('data', '');
  f.set('observacao', '');
  f.set('conferido', '0');
  for (const [k, v] of Object.entries(extra)) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  podeMock.mockResolvedValue(true);
  getUserMock.mockResolvedValue({ data: { user: { id: UID } } });
  rpcMock.mockResolvedValue({ data: 'id-novo', error: null });
  uploadMock.mockResolvedValue({ error: null });
  removeMock.mockResolvedValue({ error: null });
});

describe('actions da leitura', () => {
  it('lancar exige operacional.leitura.lancar e nao chama o banco sem ela', async () => {
    podeMock.mockResolvedValue(false);
    expect((await registrarLeitura(formLeitura())).ok).toBe(false);
    expect(podeMock).toHaveBeenCalledWith('operacional.leitura.lancar');
    expect(rpcMock).not.toHaveBeenCalled();
  });
  it('fechar e reabrir exigem operacional.leitura.fechar', async () => {
    podeMock.mockResolvedValue(false);
    await fecharCiclo(CI, false);
    await reabrirCiclo(CI);
    expect(podeMock.mock.calls.map((c) => c[0])).toEqual(['operacional.leitura.fechar', 'operacional.leitura.fechar']);
    expect(rpcMock).not.toHaveBeenCalled();
  });
  it('tenant e autoria vem do app e da sessao', async () => {
    expect(await registrarLeitura(formLeitura())).toEqual({ ok: true, id: 'id-novo' });
    expect(schemaMock).toHaveBeenCalledWith('leitura');
    expect(rpcMock).toHaveBeenCalledWith('registrar_leitura', expect.objectContaining({
      p_tenant: TENANT_ID, p_ciclo: CI, p_medidor: ME, p_valor: 2014.281, p_data: null, p_foto_path: null, p_por: UID,
    }));
  });
  it('foto sobe antes e sai do bucket se o banco recusar', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'Leitura menor que a anterior (2982.289 em 10/10/2026)' } });
    const r = await registrarLeitura(formLeitura({ foto: new File([new Uint8Array([1, 2, 3])], 'f.jpg', { type: 'image/jpeg' }) }));
    expect(r).toMatchObject({ ok: false, erro: 'Leitura menor que a anterior (2.982,289 em 10/10/2026).' });
    const caminho = uploadMock.mock.calls[0][0] as string;
    expect(caminho.startsWith(`${TENANT_ID}/${CI}/`)).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith('registrar_leitura', expect.objectContaining({ p_foto_path: caminho }));
    expect(removeMock).toHaveBeenCalledWith([caminho]);
  });
  it('arquivo que nao e imagem e recusado sem subir', async () => {
    const r = await registrarLeitura(formLeitura({ foto: new File(['x'], 'a.pdf', { type: 'application/pdf' }) }));
    expect(r).toEqual({ ok: false, erro: 'A foto precisa ser uma imagem.' });
    expect(uploadMock).not.toHaveBeenCalled();
  });
  it('consumo alto e faltam leituras viram sinal para a tela', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'CONSUMO_ALTO: 60.000 m3 (esperado cerca de 7.1 m3). Confira a leitura.' } });
    expect(await registrarLeitura(formLeitura())).toMatchObject({ ok: false, consumoAlto: true });
    rpcMock.mockResolvedValue({ data: null, error: { message: 'FALTAM_LEITURAS: 2 unidade(s) sem leitura' } });
    expect(await fecharCiclo(CI, false)).toMatchObject({ ok: false, faltamLeituras: true });
  });
  it('abrir ciclo valida o mes', async () => {
    expect((await abrirCiclo({ condominioId: CI, referencia: '2026-11-15', dataLeitura: '2026-11-10' })).ok).toBe(false);
    expect(await abrirCiclo({ condominioId: CI, referencia: '2026-11-01', dataLeitura: '2026-11-10' })).toEqual({ ok: true, id: 'id-novo' });
  });
  it('saida manda quem leu', async () => {
    const f = new FormData();
    for (const [k, v] of Object.entries({ unidadeId: ME, data: '2026-10-29', valor: '10,5', quemLeu: 'sindico', observacao: '', conferido: '0' })) f.set(k, v);
    expect((await registrarSaida(f)).ok).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith('registrar_saida', expect.objectContaining({ p_unidade: ME, p_valor: 10.5, p_quem_leu: 'sindico', p_por: UID }));
  });
  it('sessao expirada', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    expect(await registrarLeitura(formLeitura())).toEqual({ ok: false, erro: 'Sessão expirada. Entre de novo.' });
  });
});
