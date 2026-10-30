import { formatarData, formatarM3, formatarMoeda, ROTULO_DOCUMENTO, rotuloMes, type CicloCompleto } from '@/lib/leitura/modelo';

// Folha do faturamento: so aparece na impressao (hidden print:block). Uma linha por unidade A COBRAR, com a
// composicao (acumulados/em aberto) para justificar ao morador e a coluna do documento (em branco para
// escrever quando ainda nao lancado). Cobrado do condominio: um documento so, no total.
export function Impressao({ dados }: { dados: CicloCompleto }) {
  const { ciclo, condominio, linhas, vencimento } = dados;
  const cobrar = linhas.filter((l) => l.situacao === 'cobrar');
  const acumulam = linhas.filter((l) => l.situacao === 'acumula');
  const total = cobrar.reduce((s, l) => s + (l.valor ?? 0), 0);
  const doc = (d: { tipo: keyof typeof ROTULO_DOCUMENTO; numero: string | null } | null) =>
    d ? `${ROTULO_DOCUMENTO[d.tipo]}${d.numero ? ` ${d.numero}` : ''}` : '';
  const th = 'border border-black px-1.5 py-1 text-left font-semibold';
  const td = 'border border-black px-1.5 py-1 align-top';
  return (
    <div className="hidden text-[11px] text-black print:block">
      <div className="mb-2 flex items-end justify-between border-b-2 border-black pb-1">
        <div>
          <div className="text-[15px] font-bold">Leitura de gás — {condominio.nome}</div>
          <div>
            Referência {rotuloMes(ciclo.referencia)} · leitura {formatarData(ciclo.data_leitura)}
            {vencimento && ` · vencimento ${formatarData(vencimento)}`}
            {condominio.codigo_bs && ` · cód. BS ${condominio.codigo_bs}`}
          </div>
        </div>
        <div className="text-right">
          <div>LiberAi Operacional — Libergás</div>
          <div>Mínimo de cobrança {formatarMoeda(ciclo.minimo_cobranca ?? condominio.minimo_cobranca)}</div>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Apto</th>
            <th className={th}>Morador</th>
            <th className={th}>Cód. BS</th>
            <th className={`${th} text-right`}>Anterior</th>
            <th className={`${th} text-right`}>Atual</th>
            <th className={`${th} text-right`}>m³</th>
            <th className={th}>Inclui</th>
            <th className={`${th} text-right`}>R$/m³</th>
            <th className={`${th} text-right`}>Valor</th>
            {!condominio.cobra_condominio && <th className={`${th} w-36`}>Nº do boleto</th>}
          </tr>
        </thead>
        <tbody>
          {cobrar.map((l) => (
            <tr key={l.unidade_id} className="break-inside-avoid">
              <td className={`${td} font-semibold`}>{l.identificacao}</td>
              <td className={td}>{l.morador ?? 'vaga'}</td>
              <td className={td}>{l.codigo_bs ?? ''}</td>
              <td className={`${td} text-right tabular-nums`}>{formatarM3(l.base_valor)}</td>
              <td className={`${td} text-right tabular-nums`}>{formatarM3(l.leitura?.valor ?? null)}</td>
              <td className={`${td} text-right tabular-nums`}>{formatarM3(l.consumo)}</td>
              <td className={td}>{l.composicao.join('; ')}</td>
              <td className={`${td} text-right tabular-nums`}>{l.preco_m3 !== null ? l.preco_m3.toFixed(2).replace('.', ',') : ''}</td>
              <td className={`${td} text-right tabular-nums font-semibold`}>{formatarMoeda(l.valor)}</td>
              {!condominio.cobra_condominio && <td className={td}>{doc(l.documento)}</td>}
            </tr>
          ))}
          <tr>
            <td className={`${td} font-bold`} colSpan={8}>
              Total a cobrar — {cobrar.length} unidade(s)
              {condominio.cobra_condominio && <> · Documento do condomínio: {doc(ciclo.documento) || '______________________'}</>}
            </td>
            <td className={`${td} text-right font-bold tabular-nums`}>{formatarMoeda(total)}</td>
            {!condominio.cobra_condominio && <td className={td} />}
          </tr>
        </tbody>
      </table>

      {acumulam.length > 0 && (
        <p className="mt-2">
          <span className="font-semibold">Acumulam (abaixo do mínimo, entram na próxima cobrança):</span>{' '}
          {acumulam.map((l) => `${l.identificacao} (${formatarM3(l.ficou_em_aberto ?? l.consumo)} m³)`).join(' · ')}
        </p>
      )}
      <p className="mt-6 flex justify-between">
        <span>Conferido por: ______________________________</span>
        <span>Data: ____/____/______</span>
      </p>
    </div>
  );
}
