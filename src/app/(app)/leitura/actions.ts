'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { pode } from '@/lib/acesso/permissoes';
import type { Chave } from '@/lib/acesso/chaves';
import { TENANT_ID } from '@/lib/constants';
import { createServerSessionClient } from '@/lib/supabase/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  abrirCicloSchema,
  BUCKET_FOTOS,
  documentoSchema,
  ehConsumoAlto,
  ehFaltamLeituras,
  FOTO_MAX_BYTES,
  idSchema,
  leituraSchema,
  mensagemErro,
  saidaSchema,
} from '@/lib/leitura/modelo';

// Server Actions: alcancaveis por POST direto, entao checam a chave e validam de novo. Tenant e
// autoria nunca vem da entrada: constante do app e uid da sessao. A regra de negocio (ordem das
// leituras, foto obrigatoria, consumo alto, minimo) mora no banco (20261029130000).

export type Resultado =
  | { ok: true; id?: string }
  | { ok: false; erro: string; consumoAlto?: boolean; faltamLeituras?: boolean };

const SEM_PERMISSAO = 'Você não tem permissão para esta ação.';
const ERRO_SALVAR = 'Não foi possível salvar. Tente de novo.';

async function autor(): Promise<string | null> {
  const sessao = await createServerSessionClient();
  const {
    data: { user },
  } = await sessao.auth.getUser();
  return user?.id ?? null;
}

async function preparar(chave: Chave): Promise<{ por: string } | { erro: Resultado }> {
  if (!(await pode(chave))) return { erro: { ok: false, erro: SEM_PERMISSAO } };
  const por = await autor();
  if (!por) return { erro: { ok: false, erro: 'Sessão expirada. Entre de novo.' } };
  return { por };
}

async function rpc(nome: string, args: Record<string, unknown>): Promise<Resultado> {
  const { data, error } = await createServiceRoleClient().schema('leitura').rpc(nome, args);
  if (error) {
    console.error(`[leitura.${nome}] erro da RPC:`, error.message);
    return {
      ok: false,
      erro: mensagemErro(error.message, ERRO_SALVAR),
      consumoAlto: ehConsumoAlto(error.message) || undefined,
      faltamLeituras: ehFaltamLeituras(error.message) || undefined,
    };
  }
  return { ok: true, id: typeof data === 'string' ? data : undefined };
}

function revalidar() {
  revalidatePath('/leitura', 'layout');
}

// Foto: sobe antes da RPC (o banco so guarda o caminho). Se a RPC recusar, a foto sai do bucket.
async function subirFoto(arquivo: FormDataEntryValue | null, pasta: string): Promise<{ caminho: string | null } | { erro: string }> {
  if (!(arquivo instanceof File) || arquivo.size === 0) return { caminho: null };
  if (!arquivo.type.startsWith('image/')) return { erro: 'A foto precisa ser uma imagem.' };
  if (arquivo.size > FOTO_MAX_BYTES) return { erro: 'Foto grande demais (máximo 3 MB).' };
  const caminho = `${TENANT_ID}/${pasta}/${randomUUID()}.jpg`;
  const { error } = await createServiceRoleClient()
    .storage.from(BUCKET_FOTOS)
    .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
  if (error) {
    console.error('[leitura] upload da foto:', error.message);
    return { erro: 'Não foi possível enviar a foto. Tente de novo.' };
  }
  return { caminho };
}
async function apagarFoto(caminho: string | null) {
  if (!caminho) return;
  const { error } = await createServiceRoleClient().storage.from(BUCKET_FOTOS).remove([caminho]);
  if (error) console.error('[leitura] remover foto orfa:', error.message);
}

const texto = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === 'string' ? v : '';
};

export async function abrirCiclo(entrada: unknown): Promise<Resultado> {
  const p = await preparar('operacional.leitura.lancar');
  if ('erro' in p) return p.erro;
  const v = abrirCicloSchema.safeParse(entrada);
  if (!v.success) return { ok: false, erro: v.error.issues[0]?.message ?? 'Dados inválidos.' };
  const r = await rpc('abrir_ciclo', {
    p_tenant: TENANT_ID,
    p_condominio: v.data.condominioId,
    p_referencia: v.data.referencia,
    p_data_leitura: v.data.dataLeitura,
    p_por: p.por,
  });
  if (r.ok) revalidar();
  return r;
}

export async function registrarLeitura(f: FormData): Promise<Resultado> {
  const p = await preparar('operacional.leitura.lancar');
  if ('erro' in p) return p.erro;
  const v = leituraSchema.safeParse({
    cicloId: texto(f, 'cicloId'),
    medidorId: texto(f, 'medidorId'),
    valor: texto(f, 'valor'),
    data: texto(f, 'data'),
    observacao: texto(f, 'observacao'),
    conferido: texto(f, 'conferido') === '1',
  });
  if (!v.success) return { ok: false, erro: v.error.issues[0]?.message ?? 'Dados inválidos.' };
  const foto = await subirFoto(f.get('foto'), v.data.cicloId);
  if ('erro' in foto) return { ok: false, erro: foto.erro };
  const r = await rpc('registrar_leitura', {
    p_tenant: TENANT_ID,
    p_ciclo: v.data.cicloId,
    p_medidor: v.data.medidorId,
    p_data: v.data.data,
    p_valor: v.data.valor,
    p_foto_path: foto.caminho,
    p_observacao: v.data.observacao || null,
    p_conferido: v.data.conferido,
    p_por: p.por,
  });
  if (!r.ok) await apagarFoto(foto.caminho);
  else revalidar();
  return r;
}

export async function removerLeitura(leituraId: unknown): Promise<Resultado> {
  const p = await preparar('operacional.leitura.lancar');
  if ('erro' in p) return p.erro;
  const v = idSchema.safeParse(leituraId);
  if (!v.success) return { ok: false, erro: 'Leitura inválida.' };
  const r = await rpc('remover_leitura', { p_tenant: TENANT_ID, p_leitura: v.data, p_por: p.por });
  if (r.ok) revalidar();
  return r;
}

export async function fecharCiclo(cicloId: unknown, aceitarFaltantes: boolean): Promise<Resultado> {
  const p = await preparar('operacional.leitura.fechar');
  if ('erro' in p) return p.erro;
  const v = idSchema.safeParse(cicloId);
  if (!v.success) return { ok: false, erro: 'Ciclo inválido.' };
  const r = await rpc('fechar_ciclo', {
    p_tenant: TENANT_ID,
    p_ciclo: v.data,
    p_aceitar_faltantes: aceitarFaltantes === true,
    p_por: p.por,
  });
  if (r.ok) revalidar();
  return r.ok ? { ok: true } : r;
}

export async function reabrirCiclo(cicloId: unknown): Promise<Resultado> {
  const p = await preparar('operacional.leitura.fechar');
  if ('erro' in p) return p.erro;
  const v = idSchema.safeParse(cicloId);
  if (!v.success) return { ok: false, erro: 'Ciclo inválido.' };
  const r = await rpc('reabrir_ciclo', { p_tenant: TENANT_ID, p_ciclo: v.data, p_por: p.por });
  if (r.ok) revalidar();
  return r;
}

export async function excluirCiclo(cicloId: unknown): Promise<Resultado> {
  const p = await preparar('operacional.leitura.fechar');
  if ('erro' in p) return p.erro;
  const v = idSchema.safeParse(cicloId);
  if (!v.success) return { ok: false, erro: 'Ciclo inválido.' };
  const r = await rpc('excluir_ciclo', { p_tenant: TENANT_ID, p_ciclo: v.data, p_por: p.por });
  if (r.ok) revalidar();
  return r.ok ? { ok: true } : r;
}

// Documento de cobranca (faturamento, D1-A/D3): por cobranca do morador, ou no ciclo quando quem paga e o
// condominio. tipo null = desfazer.
export async function faturarCobranca(entrada: unknown): Promise<Resultado> {
  const p = await preparar('operacional.leitura.fechar');
  if ('erro' in p) return p.erro;
  const v = documentoSchema.safeParse(entrada);
  if (!v.success) return { ok: false, erro: v.error.issues[0]?.message ?? 'Dados inválidos.' };
  const r = await rpc('faturar_cobranca', { p_tenant: TENANT_ID, p_cobranca: v.data.id, p_tipo: v.data.tipo, p_numero: v.data.numero || null, p_por: p.por });
  if (r.ok) revalidar();
  return r.ok ? { ok: true } : r;
}

export async function faturarCiclo(entrada: unknown): Promise<Resultado> {
  const p = await preparar('operacional.leitura.fechar');
  if ('erro' in p) return p.erro;
  const v = documentoSchema.safeParse(entrada);
  if (!v.success) return { ok: false, erro: v.error.issues[0]?.message ?? 'Dados inválidos.' };
  const r = await rpc('faturar_ciclo', { p_tenant: TENANT_ID, p_ciclo: v.data.id, p_tipo: v.data.tipo, p_numero: v.data.numero || null, p_por: p.por });
  if (r.ok) revalidar();
  return r.ok ? { ok: true } : r;
}

export async function registrarSaida(f: FormData): Promise<Resultado> {
  const p = await preparar('operacional.leitura.lancar');
  if ('erro' in p) return p.erro;
  const v = saidaSchema.safeParse({
    unidadeId: texto(f, 'unidadeId'),
    data: texto(f, 'data'),
    valor: texto(f, 'valor'),
    quemLeu: texto(f, 'quemLeu'),
    observacao: texto(f, 'observacao'),
    conferido: texto(f, 'conferido') === '1',
  });
  if (!v.success) return { ok: false, erro: v.error.issues[0]?.message ?? 'Dados inválidos.' };
  const foto = await subirFoto(f.get('foto'), `saida/${v.data.unidadeId}`);
  if ('erro' in foto) return { ok: false, erro: foto.erro };
  const r = await rpc('registrar_saida', {
    p_tenant: TENANT_ID,
    p_unidade: v.data.unidadeId,
    p_data: v.data.data,
    p_valor: v.data.valor,
    p_quem_leu: v.data.quemLeu,
    p_foto_path: foto.caminho,
    p_observacao: v.data.observacao || null,
    p_conferido: v.data.conferido,
    p_por: p.por,
  });
  if (!r.ok) await apagarFoto(foto.caminho);
  else revalidar();
  return r;
}
