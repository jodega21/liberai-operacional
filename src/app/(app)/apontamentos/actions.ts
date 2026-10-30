'use server';

import { getPermissoes } from '@/lib/acesso/permissoes';
import { TENANT_ID } from '@/lib/constants';
import { createServerSessionClient } from '@/lib/supabase/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { CHAVE_CRIAR, criarSchema } from '@/lib/apontamentos/modelo';

export type ResultadoAcao = { ok: true } | { ok: false; erro: string };

async function usuarioId(): Promise<string | null> {
  const sessao = await createServerSessionClient();
  const {
    data: { user },
  } = await sessao.auth.getUser();
  return user?.id ?? null;
}

// Botao de ajuda > "Apontar problema" (G3). Qualquer papel com apontamentos.criar.
export async function criarApontamento(entrada: unknown): Promise<ResultadoAcao> {
  if (!(await getPermissoes()).includes(CHAVE_CRIAR)) {
    return { ok: false, erro: 'Você não tem permissão para apontar problemas.' };
  }
  const v = criarSchema.safeParse(entrada);
  if (!v.success) return { ok: false, erro: v.error.issues[0]?.message ?? 'Dados inválidos.' };
  const por = await usuarioId();
  if (!por) return { ok: false, erro: 'Sessão expirada. Entre de novo.' };

  const d = v.data;
  const { error } = await createServiceRoleClient()
    .schema('apontamentos')
    .from('apontamentos')
    .insert({
      tenant_id: TENANT_ID,
      area: d.area,
      app: 'operacional',
      url: d.url,
      entidade_tipo: d.entidade?.tipo ?? null,
      entidade_id: d.entidade?.id ?? null,
      retrato: d.retrato || null,
      alvo: d.alvo,
      motivo: d.motivo,
      nota: d.nota || null,
      origem: 'usuario',
      criado_por: por,
    });
  if (error) {
    console.error('[criarApontamento] erro:', error.message);
    return { ok: false, erro: 'Não foi possível salvar o apontamento. Tente de novo.' };
  }
  return { ok: true };
}
