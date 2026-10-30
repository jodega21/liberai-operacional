import Link from 'next/link';
import { FileText } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { notFound } from 'next/navigation';
import { exigir, pode } from '@/lib/acesso/permissoes';
import { carregarCiclo } from '@/lib/leitura/carregar';
import { formatarData, formatarM3, formatarMoeda, idSchema, ROTULO_QUEM_LE, rotuloMes, type LinhaCiclo } from '@/lib/leitura/modelo';
import { BotaoImprimir } from './botao-imprimir';
import { Documento } from './documento';
import { Fechamento } from './fechamento';
import { Impressao } from './impressao';
import { LinhaLeitura } from './linha-leitura';

// Links das folhas impressas (LEI4) com o visual do botao outline do ciclo.
const LINK_BOTAO = buttonVariants({ variant: 'outline', className: 'h-9 px-3' });

export default async function CicloPage({ params }: { params: Promise<{ id: string }> }) {
  await exigir(['operacional.leitura.lancar', 'operacional.leitura.fechar']);
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const r = await carregarCiclo(id.data);
  if (r.ok && !r.d) notFound();
  if (!r.ok || !r.d) return <p className="text-sm text-destructive">Não foi possível carregar o ciclo. Tente de novo.</p>;

  const { ciclo, condominio, linhas, erroPrevia } = r.d;
  const [podeLancar, podeFechar] = await Promise.all([pode('operacional.leitura.lancar'), pode('operacional.leitura.fechar')]);
  const aberto = ciclo.status === 'aberto';
  const lidas = linhas.filter((l) => l.leitura).length;
  const minimo = ciclo.minimo_cobranca ?? condominio.minimo_cobranca;

  const cobrar = linhas.filter((l) => l.situacao === 'cobrar');
  const faturado = !aberto && (condominio.cobra_condominio ? !!ciclo.documento : cobrar.length > 0 && cobrar.every((l) => l.documento));

  return (
    <>
    <Impressao dados={r.d} />
    <div
      className="max-w-5xl space-y-4 print:hidden"
      data-apontar-area="leitura"
      data-apontar-tipo="ciclo_leitura"
      data-apontar-id={ciclo.id}
      data-apontar-resumo={`${condominio.nome} — leitura ${rotuloMes(ciclo.referencia)}`}
    >
      <header className="space-y-1">
        <Link href={`/leitura/condominio/${condominio.id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {condominio.nome}
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">
          Leitura de {rotuloMes(ciclo.referencia)}{' '}
          <span className={aberto ? 'text-destaque-texto' : faturado ? 'text-emerald-700' : 'text-muted-foreground'}>
            · {aberto ? 'aberto' : faturado ? 'faturado' : 'fechado'}
          </span>
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Data {formatarData(ciclo.data_leitura)} · lê: {ROTULO_QUEM_LE[condominio.quem_le]}
            {r.d.vencimento && ` · vencimento ${formatarData(r.d.vencimento)}`}
            {condominio.cobra_condominio && ' · cobrado do condomínio'}
          </p>
          {!aberto && (
            <div className="flex flex-wrap gap-2">
              <Link href={`/leitura/ciclo/${ciclo.id}/demonstrativos`} className={LINK_BOTAO}>
                <FileText className="h-4 w-4" /> Demonstrativos
              </Link>
              <Link href={`/leitura/ciclo/${ciclo.id}/resumo`} className={LINK_BOTAO}>
                <FileText className="h-4 w-4" /> Resumo do condomínio
              </Link>
              <BotaoImprimir />
            </div>
          )}
        </div>
      </header>

      <Resumo linhas={linhas} minimo={minimo} aberto={aberto}>
        {!aberto && condominio.cobra_condominio && cobrar.length > 0 && (
          <div className="col-span-2 flex items-center gap-2 px-3 py-2 sm:col-span-4">
            <span className="text-xs text-muted-foreground uppercase">Documento do condomínio</span>
            <Documento alvo="ciclo" id={ciclo.id} atual={ciclo.documento} tipoPadrao="boleto" podeLancar={podeFechar} />
          </div>
        )}
      </Resumo>

      {erroPrevia && <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{erroPrevia}</p>}

      <ul className="space-y-2">
        {linhas.map((l) => (
          <LinhaLeitura
            key={l.unidade_id}
            linha={l}
            cicloId={ciclo.id}
            editavel={aberto && podeLancar}
            fotoObrigatoria={condominio.quem_le === 'libergas'}
            documento={
              !aberto && l.leitura && l.situacao !== 'sem_leitura' ? (
                <span className="inline-flex flex-wrap items-center gap-2">
                  {l.situacao === 'cobrar' && l.cobranca_id && !condominio.cobra_condominio && (
                    <Documento alvo="cobranca" id={l.cobranca_id} atual={l.documento} tipoPadrao={l.tipo_padrao} podeLancar={podeFechar} />
                  )}
                  <Link href={`/leitura/ciclo/${ciclo.id}/demonstrativos?unidade=${l.unidade_id}`} className="text-xs text-destaque-texto hover:underline">
                    Demonstrativo
                  </Link>
                </span>
              ) : null
            }
          />
        ))}
      </ul>

      {podeFechar && (
        <Fechamento cicloId={ciclo.id} aberto={aberto} faltam={linhas.length - lidas} lidas={lidas} condominioId={condominio.id} />
      )}
    </div>
    </>
  );
}

// Resumo do ciclo, no topo: o que vai para o faturamento e o que fica para depois.
function Resumo({ linhas, minimo, aberto, children }: { linhas: LinhaCiclo[]; minimo: number; aberto: boolean; children?: React.ReactNode }) {
  const cobrar = linhas.filter((l) => l.situacao === 'cobrar');
  const acumula = linhas.filter((l) => l.situacao === 'acumula');
  const sem = linhas.filter((l) => !l.leitura);
  const total = cobrar.reduce((s, l) => s + (l.valor ?? 0), 0);
  const m3Cobrar = cobrar.reduce((s, l) => s + (l.consumo ?? 0), 0);
  const m3Acumula = acumula.reduce((s, l) => s + (l.ficou_em_aberto ?? l.consumo ?? 0), 0);
  const emAberto = cobrar.reduce((s, l) => s + l.em_aberto, 0);
  return (
    <section className="grid grid-cols-2 gap-1 rounded-[12px] border border-border bg-card p-2 sm:grid-cols-4">
      <Item forte rotulo={aberto ? 'A cobrar (prévia)' : 'A cobrar'} valor={formatarMoeda(total)} detalhe={`${cobrar.length} unidade(s) · ${formatarM3(m3Cobrar)} m³`} />
      <Item rotulo="Acumulam" valor={`${acumula.length}`} detalhe={`${formatarM3(m3Acumula)} m³ abaixo de ${formatarMoeda(minimo)}`} />
      <Item rotulo="Em aberto incluído" valor={`${formatarM3(emAberto)} m³`} detalhe="de meses anteriores" />
      <Item rotulo="Leituras" valor={`${linhas.length - sem.length}/${linhas.length}`} detalhe={sem.length ? `${sem.length} sem leitura` : 'todas lidas'} />
      {children}
    </section>
  );
}

function Item({ rotulo, valor, detalhe, forte }: { rotulo: string; valor: string; detalhe?: string; forte?: boolean }) {
  return (
    <div className={forte ? 'rounded-lg bg-destaque-suave px-3 py-2' : 'px-3 py-2'}>
      <div className="text-xs text-muted-foreground uppercase">{rotulo}</div>
      <div className={forte ? 'font-heading text-xl font-bold tabular-nums' : 'font-heading text-lg font-semibold tabular-nums'}>{valor}</div>
      {detalhe && <div className="text-xs text-muted-foreground tabular-nums">{detalhe}</div>}
    </div>
  );
}
