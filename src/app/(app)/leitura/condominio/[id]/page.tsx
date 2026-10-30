import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigir, pode } from '@/lib/acesso/permissoes';
import { carregarCondominio } from '@/lib/leitura/carregar';
import {
  dataSugerida,
  formatarData,
  formatarM3,
  formatarMoeda,
  hojeSaoPaulo,
  idSchema,
  proximaReferencia,
  ROTULO_QUEM_LE,
  rotuloMes,
} from '@/lib/leitura/modelo';
import { AbrirCiclo } from './abrir-ciclo';
import { SaidaMorador } from './saida-morador';

const CARTAO = 'rounded-[12px] border border-border bg-card p-4 sm:p-5';
const TITULO = 'mb-3 text-xs tracking-wide text-muted-foreground uppercase';

export default async function CondominioPage({ params }: { params: Promise<{ id: string }> }) {
  await exigir(['operacional.leitura.lancar', 'operacional.leitura.fechar']);
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const r = await carregarCondominio(id.data);
  if (r.ok && !r.d) notFound();
  if (!r.ok || !r.d) return <p className="text-sm text-destructive">Não foi possível carregar o condomínio. Tente de novo.</p>;

  const { condominio, ciclos, unidades, saidas } = r.d;
  const podeLancar = await pode('operacional.leitura.lancar');
  const aberto = ciclos.find((c) => c.status === 'aberto') ?? null;
  const referencia = proximaReferencia(ciclos[0]?.referencia ?? null, hojeSaoPaulo());

  return (
    <div
      className="max-w-5xl space-y-5"
      data-apontar-area="leitura"
      data-apontar-tipo="condominio_leitura"
      data-apontar-id={condominio.id}
      data-apontar-resumo={`${condominio.nome} — leitura`}
    >
      <header className="space-y-1">
        <Link href="/leitura" className="text-sm text-muted-foreground hover:text-foreground">
          ← Condomínios
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{condominio.nome}</h1>
        <p className="text-sm text-muted-foreground">
          Lê: {ROTULO_QUEM_LE[condominio.quem_le]} · dia {condominio.dia_leitura} · mínimo de cobrança{' '}
          {formatarMoeda(condominio.minimo_cobranca)}
        </p>
      </header>

      <section className={CARTAO}>
        <h2 className={TITULO}>Ciclos</h2>
        {aberto ? (
          <Link href={`/leitura/ciclo/${aberto.id}`} className="mb-4 flex h-11 items-center justify-center rounded-lg bg-destaque px-4 text-sm font-semibold text-destaque-contraste hover:bg-destaque-forte">
            Lançar leituras de {rotuloMes(aberto.referencia)}
          </Link>
        ) : (
          podeLancar && (
            <div className="mb-4">
              <AbrirCiclo condominioId={condominio.id} referencia={referencia} dataLeitura={dataSugerida(referencia, condominio.dia_leitura)} />
            </div>
          )
        )}
        {ciclos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum ciclo ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {ciclos.map((c) => (
              <li key={c.id}>
                <Link href={`/leitura/ciclo/${c.id}`} className="flex items-center justify-between py-2.5 text-sm hover:text-destaque-texto">
                  <span className="font-medium">{rotuloMes(c.referencia)}</span>
                  <span className="text-muted-foreground">
                    leitura {formatarData(c.data_leitura)} · {c.status === 'aberto' ? 'aberto' : 'fechado'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {podeLancar && (
        <section className={CARTAO}>
          <h2 className={TITULO}>Mudança de morador</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Só quando um morador sai: leitura no dia da mudança, cobrada na hora. A leitura do mês é no botão laranja acima.
          </p>
          <SaidaMorador unidades={unidades} quemLe={condominio.quem_le} hoje={hojeSaoPaulo()} />
        </section>
      )}

      {saidas.length > 0 && (
        <section className={CARTAO}>
          <h2 className={TITULO}>Saídas cobradas</h2>
          <ul className="divide-y divide-border text-sm">
            {saidas.map((s, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  <span className="font-medium">{s.unidade}</span> {s.morador && <span className="text-muted-foreground">· {s.morador}</span>}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {s.data && formatarData(s.data)} · {formatarM3(s.valor_leitura)} · {formatarM3(s.consumo)} m³ ·{' '}
                  <span className="font-medium text-foreground">{formatarMoeda(s.valor)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
