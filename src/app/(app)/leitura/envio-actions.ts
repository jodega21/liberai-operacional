'use server';

import { revalidatePath } from 'next/cache';
import { pode } from '@/lib/acesso/permissoes';
import { TENANT_ID } from '@/lib/constants';
import { createServerSessionClient } from '@/lib/supabase/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { idSchema, ROTULO_QUEM_LE } from '@/lib/leitura/modelo';
import { carregarEnvio } from '@/lib/envio/carregar';
import { emailDemonstrativo, emailResumoCondominio, type Email } from '@/lib/envio/email';
import { chaveAlvo, ORIGEM_COBRANCA, pendentes, type Alvo } from '@/lib/envio/modelo';
import { enviarEmail } from '@/lib/envio/ses';

// Envio do demonstrativo por e-mail (LEI5 fatia 2). G4: so quem fecha o ciclo (Administrador). G5: o
// envio parte sempre de um clique; sem `chaves` vao os pendentes (nunca enviados com sucesso); com
// `chaves` (Reenviar) so os alvos escolhidos. Cada tentativa vira uma linha em comunicacao.envios.

export type ResultadoEnvio =
  | { ok: true; enviados: number; falharam: { rotulo: string; para: string; erro: string }[] }
  | { ok: false; erro: string };

const URL_BASE = process.env.URL_PUBLICA_OPERACIONAL || 'https://liberai-operacional.vercel.app';
const LOTE = 5;

export async function enviarDemonstrativos(cicloId: unknown, chaves?: unknown): Promise<ResultadoEnvio> {
  if (!(await pode('operacional.leitura.fechar'))) return { ok: false, erro: 'Você não tem permissão para esta ação.' };
  const id = idSchema.safeParse(cicloId);
  if (!id.success) return { ok: false, erro: 'Ciclo inválido.' };
  const escolhidas = Array.isArray(chaves) ? new Set(chaves.filter((c): c is string => typeof c === 'string')) : null;

  const sessao = await createServerSessionClient();
  const { data: { user } } = await sessao.auth.getUser();
  if (!user) return { ok: false, erro: 'Sessão expirada. Entre de novo.' };

  const r = await carregarEnvio(id.data);
  if (!r.ok) return { ok: false, erro: 'Não foi possível carregar o ciclo. Tente de novo.' };
  if (!r.d) return { ok: false, erro: 'Ciclo não encontrado ou ainda aberto.' };
  const { dados, alvos } = r.d;

  const lista = escolhidas ? alvos.filter((a) => a.para && escolhidas.has(chaveAlvo(a))) : pendentes(alvos);
  if (lista.length === 0) return { ok: false, erro: 'Nada para enviar.' };

  const { ciclo: completo } = dados;
  const demonstrativoDaCobranca = new Map(
    completo.linhas.filter((l) => l.cobranca_id).map((l) => [l.cobranca_id!, dados.demonstrativos.find((d) => d.unidade_id === l.unidade_id)]),
  );
  const minimo = completo.ciclo.minimo_cobranca ?? completo.condominio.minimo_cobranca;

  function montar(a: Alvo): Email | null {
    if (a.origem_tipo === ORIGEM_COBRANCA) {
      const d = demonstrativoDaCobranca.get(a.origem_id);
      if (!d) return null;
      return emailDemonstrativo({
        d, condominio: completo.condominio.nome, referencia: completo.ciclo.referencia, vencimento: completo.vencimento,
        minimo, quemLe: ROTULO_QUEM_LE[completo.condominio.quem_le], comComunicado: a.com_comunicado, urlBase: URL_BASE,
      });
    }
    return emailResumoCondominio({
      resumo: dados.resumo, condominio: completo.condominio.nome, referencia: completo.ciclo.referencia,
      vencimento: completo.vencimento, documento: completo.ciclo.documento, urlBase: URL_BASE,
    });
  }

  const db = createServiceRoleClient().schema('comunicacao');
  let enviados = 0;
  const falharam: { rotulo: string; para: string; erro: string }[] = [];

  async function um(a: Alvo) {
    const email = montar(a);
    const res = email ? await enviarEmail(a.para!, email) : { ok: false as const, erro: 'Demonstrativo da unidade não encontrado.' };
    const { error } = await db.from('envios').insert({
      tenant_id: TENANT_ID,
      canal: 'email',
      destinatario: a.para!,
      cliente_id: a.contato?.cliente_id ?? null,
      cliente_nome: a.contato?.nome ?? null,
      origem_tipo: a.origem_tipo,
      origem_id: a.origem_id,
      assunto: email?.assunto ?? '(sem e-mail montado)',
      com_comunicado: res.ok && a.com_comunicado,
      status: res.ok ? 'enviado' : 'falhou',
      provedor_id: res.ok ? res.id : null,
      erro: res.ok ? null : res.erro,
      enviado_por: user!.id,
    });
    if (error) console.error('[enviarDemonstrativos] registro do envio:', error.message);
    if (res.ok) enviados++;
    else falharam.push({ rotulo: a.rotulo, para: a.para!, erro: res.erro });
  }

  for (let i = 0; i < lista.length; i += LOTE) {
    await Promise.all(lista.slice(i, i + LOTE).map(um));
  }
  revalidatePath(`/leitura/ciclo/${id.data}`);
  return { ok: true, enviados, falharam };
}
