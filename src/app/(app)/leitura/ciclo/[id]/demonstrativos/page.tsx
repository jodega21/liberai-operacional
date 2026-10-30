import { notFound } from 'next/navigation';
import { exigir } from '@/lib/acesso/permissoes';
import { carregarDemonstrativos } from '@/lib/leitura/carregar';
import { emPares } from '@/lib/leitura/demonstrativo';
import { idSchema, ROTULO_QUEM_LE, rotuloMes } from '@/lib/leitura/modelo';
import { BarraImpressao } from '../barra-impressao';
import { DemonstrativoMorador, EstiloRetrato } from '../folha';

// Demonstrativos dos moradores do ciclo fechado (LEI4): meia folha A4 cada, dois por folha com linha de
// corte (D1-A); todas as unidades com leitura, inclusive as que acumulam (D2-A). ?unidade= imprime uma so.
export default async function DemonstrativosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigir(['operacional.leitura.lancar', 'operacional.leitura.fechar']);
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const sp = await searchParams;
  const unidade = typeof sp.unidade === 'string' ? sp.unidade : null;

  const r = await carregarDemonstrativos(id.data);
  if (!r.ok) return <p className="text-sm text-destructive">Não foi possível carregar os demonstrativos. Tente de novo.</p>;
  if (!r.d) notFound(); // ciclo inexistente ou ainda aberto

  const { ciclo: c, demonstrativos } = r.d;
  const lista = unidade ? demonstrativos.filter((d) => d.unidade_id === unidade) : demonstrativos;
  if (lista.length === 0) notFound();
  const minimo = c.ciclo.minimo_cobranca ?? c.condominio.minimo_cobranca;

  return (
    <div className="print:bg-white">
      <EstiloRetrato />
      <BarraImpressao
        voltar={`/leitura/ciclo/${c.ciclo.id}`}
        rotulo={`Demonstrativos — ${c.condominio.nome}, ${rotuloMes(c.ciclo.referencia)}`}
        quantas={`${lista.length} demonstrativo(s) em ${Math.ceil(lista.length / 2)} folha(s)`}
      />
      <div className="space-y-6 print:space-y-0">
        {emPares(lista).map((par, i) => (
          <section
            key={i}
            className="mx-auto w-[194mm] bg-white p-[2mm] text-black shadow-md print:w-auto print:p-0 print:shadow-none print:break-after-page"
          >
            {par.map((d, j) => (
              <div key={d.unidade_id}>
                {j === 1 && (
                  <div className="relative my-[2mm] border-t border-dashed border-neutral-400">
                    <span className="absolute -top-[2mm] left-1/2 -translate-x-1/2 bg-white px-[2mm] text-[2.6mm] text-neutral-500">✂ cortar</span>
                  </div>
                )}
                <DemonstrativoMorador
                  d={d}
                  condominio={c.condominio.nome}
                  referencia={c.ciclo.referencia}
                  vencimento={c.vencimento}
                  minimo={minimo}
                  cobraCondominio={c.condominio.cobra_condominio}
                  quemLe={ROTULO_QUEM_LE[c.condominio.quem_le]}
                />
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
