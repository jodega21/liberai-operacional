import { notFound } from 'next/navigation';
import { exigir } from '@/lib/acesso/permissoes';
import { carregarDemonstrativos } from '@/lib/leitura/carregar';
import { formatarData, formatarM3, formatarMoeda, idSchema, ROTULO_DOCUMENTO, rotuloMes } from '@/lib/leitura/modelo';
import { BarraImpressao } from '../barra-impressao';
import { AZUL, Contato, EstiloRetrato, LARANJA, Marca } from '../folha';

// Resumo da leitura para o condominio (LEI4): consumo da central no mes, uma linha por unidade com leitura
// e o total cobrado. A4 retrato.
export default async function ResumoPage({ params }: { params: Promise<{ id: string }> }) {
  await exigir(['operacional.leitura.lancar', 'operacional.leitura.fechar']);
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const r = await carregarDemonstrativos(id.data);
  if (!r.ok) return <p className="text-sm text-destructive">Não foi possível carregar o resumo. Tente de novo.</p>;
  if (!r.d) notFound();

  const { ciclo: c, resumo, fator } = r.d;
  const th = 'border-b-[0.5mm] border-neutral-900 px-[1.5mm] py-[1.2mm] text-left text-[2.6mm] font-semibold tracking-wide text-neutral-600 uppercase';
  const td = 'border-b border-neutral-300 px-[1.5mm] py-[1.2mm]';
  const doc = c.ciclo.documento;
  return (
    <div>
      <EstiloRetrato />
      <BarraImpressao
        voltar={`/leitura/ciclo/${c.ciclo.id}`}
        rotulo={`Resumo do condomínio — ${c.condominio.nome}, ${rotuloMes(c.ciclo.referencia)}`}
        quantas={`${resumo.unidades.length} unidade(s)`}
      />
      <section className="mx-auto flex min-h-[281mm] w-[194mm] flex-col gap-[3mm] bg-white p-[2mm] text-[3.2mm] text-black shadow-md print:min-h-0 print:w-auto print:p-0 print:shadow-none">
        <Marca
          titulo="Leitura de gás — resumo do condomínio"
          subtitulo={`Referência ${rotuloMes(c.ciclo.referencia)} · leitura ${formatarData(c.ciclo.data_leitura)}`}
        />
        <div className="flex justify-between gap-4">
          <div>
            <div className="text-[2.6mm] tracking-wide text-neutral-500 uppercase">Condomínio</div>
            <div className="text-[3.8mm] font-semibold">{c.condominio.nome}</div>
          </div>
          {c.vencimento && (
            <div className="text-right">
              <div className="text-[2.6mm] tracking-wide text-neutral-500 uppercase">Vencimento</div>
              <div className="text-[3.8mm] font-semibold">{formatarData(c.vencimento)}</div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-[2.5mm]">
          {[
            ['Consumo da central no mês', `${formatarM3(resumo.consumo_mes)} m³`],
            ['Em gás', `≈ ${resumo.kg_mes.toLocaleString('pt-BR')} kg`],
            ['Equivale a', `≈ ${resumo.p45_mes.toLocaleString('pt-BR')} P45`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-[1.2mm] border border-neutral-300 px-[2.5mm] py-[1.8mm]">
              <div className="text-[2.6mm] tracking-wide text-neutral-500 uppercase">{k}</div>
              <div className="text-[4.2mm] font-bold tabular-nums">{v}</div>
            </div>
          ))}
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Unid.</th>
              <th className={th}>Morador</th>
              <th className={`${th} text-right`}>Anterior</th>
              <th className={`${th} text-right`}>Atual</th>
              <th className={`${th} text-right`}>m³</th>
              <th className={th}>Situação</th>
              <th className={`${th} text-right`}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {resumo.unidades.map((d) => (
              <tr key={d.unidade_id} className="break-inside-avoid">
                <td className={`${td} font-semibold`}>{d.identificacao}</td>
                <td className={td}>{d.morador ?? '—'}</td>
                <td className={`${td} text-right tabular-nums`}>{formatarM3(d.anterior.valor)}</td>
                <td className={`${td} text-right tabular-nums`}>{formatarM3(d.atual.valor)}</td>
                <td className={`${td} text-right tabular-nums`}>{formatarM3(d.consumo)}</td>
                <td className={td}>
                  <span
                    className="rounded-full px-[1.6mm] py-[0.2mm] text-[2.7mm]"
                    style={d.situacao === 'cobrar' ? { background: '#eef2f9', color: AZUL } : { background: '#fdf4ea', color: '#9a5a1e' }}
                  >
                    {d.situacao === 'cobrar' ? 'cobrar' : 'acumula'}
                  </span>
                </td>
                <td className={`${td} text-right tabular-nums`}>{d.situacao === 'cobrar' ? formatarMoeda(d.valor) : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td className="border-t-[0.5mm] border-neutral-900 px-[1.5mm] py-[1.5mm]" colSpan={6}>
                {resumo.cobradas} unidade(s) cobrada(s){resumo.acumulam > 0 && ` · ${resumo.acumulam} acumula(m)`}
                {c.condominio.cobra_condominio && doc && ` · ${ROTULO_DOCUMENTO[doc.tipo]}${doc.numero ? ` ${doc.numero}` : ''}`}
              </td>
              <td className="border-t-[0.5mm] border-neutral-900 px-[1.5mm] py-[1.5mm] text-right tabular-nums">{formatarMoeda(resumo.total_valor)}</td>
            </tr>
          </tfoot>
        </table>
        {resumo.acumulam > 0 && (
          <p className="border-l-[1mm] px-[3mm] py-[1.5mm] text-[3mm]" style={{ borderColor: LARANJA, background: '#fdf4ea' }}>
            Acumula: consumo abaixo do mínimo de {formatarMoeda(c.ciclo.minimo_cobranca ?? c.condominio.minimo_cobranca)}; entra na próxima cobrança.
          </p>
        )}
        <div className="mt-auto pt-[4mm]">
          <Contato
            observacao={`${resumo.preco_m3 !== null ? `Preço do m³ ${formatarMoeda(resumo.preco_m3)} (P45 do condomínio ÷ 45 × ${fator.toLocaleString('pt-BR')} kg/m³). ` : ''}Documento informativo, sem valor fiscal.`}
          />
        </div>
      </section>
    </div>
  );
}
