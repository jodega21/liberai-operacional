import 'server-only';
import { TENANT_ID } from '@/lib/constants';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { carregarDemonstrativos, type DadosDemonstrativos } from '@/lib/leitura/carregar';
import {
  alvosCondominio,
  alvosMoradores,
  ORIGEM_COBRANCA,
  type Alvo,
  type Contato,
  type EnvioRegistrado,
  type UnidadeCobrada,
} from './modelo';

// Le o que o envio do ciclo precisa: demonstrativos (mesmos da impressao), morador atual de cada
// unidade com e-mail e canal (CAD33), e-mails do condominio e o historico de envios. Service role: so
// chamar depois do gate (operacional.leitura.fechar).

type Db = ReturnType<typeof createServiceRoleClient>;

function falha(onde: string, e: { message: string } | null): void {
  if (e) throw new Error(`${onde}: ${e.message}`);
}

export type EnvioDoCiclo = { dados: DadosDemonstrativos; alvos: Alvo[] };

async function contatosDasUnidades(db: Db, unidadeIds: string[]): Promise<Map<string, Contato>> {
  if (unidadeIds.length === 0) return new Map();
  const o = await db.schema('leitura').from('unidade_ocupantes').select('unidade_id, cliente_id')
    .eq('tenant_id', TENANT_ID).is('ate', null).in('unidade_id', unidadeIds);
  falha('unidade_ocupantes', o.error);
  const ocs = (o.data ?? []) as { unidade_id: string; cliente_id: string }[];
  if (ocs.length === 0) return new Map();
  const c = await db.from('clientes').select('id, nome, email, canal_correspondencia')
    .eq('tenant_id', TENANT_ID).in('id', [...new Set(ocs.map((x) => x.cliente_id))]);
  falha('clientes', c.error);
  const porId = new Map(((c.data ?? []) as { id: string; nome: string; email: string | null; canal_correspondencia: string | null }[])
    .map((p) => [p.id, p]));
  const r = new Map<string, Contato>();
  for (const x of ocs) {
    const p = porId.get(x.cliente_id);
    if (p) r.set(x.unidade_id, { cliente_id: p.id, nome: p.nome, email: p.email, canal: p.canal_correspondencia });
  }
  return r;
}

async function envios(db: Db, origemIds: string[], clienteIds: string[]): Promise<EnvioRegistrado[]> {
  const sel = 'origem_tipo, origem_id, destinatario, cliente_id, status, erro, enviado_em';
  const [porOrigem, porCliente] = await Promise.all([
    origemIds.length
      ? db.schema('comunicacao').from('envios').select(sel).eq('tenant_id', TENANT_ID).in('origem_id', origemIds)
      : Promise.resolve({ data: [], error: null }),
    clienteIds.length
      ? db.schema('comunicacao').from('envios').select(sel).eq('tenant_id', TENANT_ID)
          .eq('origem_tipo', ORIGEM_COBRANCA).eq('status', 'enviado').in('cliente_id', clienteIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  falha('envios', porOrigem.error);
  falha('envios dos moradores', porCliente.error);
  return [...(porOrigem.data ?? []), ...(porCliente.data ?? [])] as EnvioRegistrado[];
}

export async function carregarEnvio(cicloId: string): Promise<{ ok: true; d: EnvioDoCiclo | null } | { ok: false }> {
  const r = await carregarDemonstrativos(cicloId);
  if (!r.ok) return r;
  if (!r.d) return { ok: true, d: null };
  try {
    const db = createServiceRoleClient();
    const { ciclo: completo } = r.d;
    if (completo.condominio.cobra_condominio) {
      const c = await db.schema('leitura').from('condominios').select('emails_demonstrativo')
        .eq('tenant_id', TENANT_ID).eq('id', completo.condominio.id).maybeSingle();
      falha('condominios', c.error);
      const emails = ((c.data as { emails_demonstrativo: string[] } | null)?.emails_demonstrativo ?? []);
      const hist = await envios(db, [completo.ciclo.id], []);
      return { ok: true, d: { dados: r.d, alvos: alvosCondominio(completo.ciclo.id, completo.ciclo.documento, emails, hist) } };
    }
    const cobrar = completo.linhas.filter((l) => l.situacao === 'cobrar' && l.cobranca_id);
    const contatos = await contatosDasUnidades(db, cobrar.map((l) => l.unidade_id));
    const unidades: UnidadeCobrada[] = cobrar.map((l) => ({
      unidade_id: l.unidade_id,
      identificacao: l.identificacao,
      cobranca_id: l.cobranca_id!,
      documento: l.documento,
      morador: contatos.get(l.unidade_id) ?? null,
    }));
    const hist = await envios(db, unidades.map((u) => u.cobranca_id), [...new Set([...contatos.values()].map((c) => c.cliente_id))]);
    return { ok: true, d: { dados: r.d, alvos: alvosMoradores(unidades, hist) } };
  } catch (err) {
    console.error('[carregarEnvio]', err instanceof Error ? err.message : 'desconhecida');
    return { ok: false };
  }
}
