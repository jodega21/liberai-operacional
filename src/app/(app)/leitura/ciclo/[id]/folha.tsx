import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import { textoComunicado } from '@/lib/leitura/comunicado';
import { WHATSAPP, type Demonstrativo, type PontoHistorico } from '@/lib/leitura/demonstrativo';
import { formatarData, formatarM3, formatarMoeda, ROTULO_DOCUMENTO, rotuloMes } from '@/lib/leitura/modelo';

// Pecas das folhas impressas da leitura (LEI4): demonstrativo do morador (meia A4) e resumo do
// condominio (A4). Cores fixas da marca (manual: azul #557dbe, laranja #e1a064, cinza #8f929a) porque o
// papel nao segue o tema do app. Medidas em mm para a impressao bater com a folha.

export const AZUL = '#557dbe';
export const LARANJA = '#e1a064';

// A4 retrato so nestas telas (o faturamento do ciclo segue em paisagem, globals.css).
export function EstiloRetrato() {
  return <style>{'@media print { @page { size: A4 portrait; margin: 8mm; } }'}</style>;
}

export function Marca({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b-[0.8mm] pb-[2mm]" style={{ borderColor: AZUL }}>
      <Image src="/marca-libergas.jpg" alt="Libergás" width={1400} height={515} className="h-[13mm] w-auto" priority />
      <div className="text-right">
        <div className="text-[4.2mm] leading-tight font-bold">{titulo}</div>
        <div className="text-[3.2mm] text-neutral-600">{subtitulo}</div>
      </div>
    </div>
  );
}

export function Contato({ observacao }: { observacao: string }) {
  return (
    <div className="flex items-end justify-between gap-4 text-[2.8mm] leading-snug text-neutral-600">
      <p className="max-w-[120mm]">{observacao}</p>
      <div className="flex shrink-0 items-center gap-[2mm]">
        <div className="text-right">
          <div className="flex items-center justify-end gap-[1mm] text-[3.4mm] font-semibold text-neutral-800">
            <MessageCircle className="size-[3.6mm]" style={{ color: '#25a35a' }} aria-hidden />
            WhatsApp {WHATSAPP.rotulo}
          </div>
          <div>Aponte a câmera para falar com a Libergás</div>
        </div>
        <Image src="/whatsapp-qr.svg" alt={`QR code: conversa no WhatsApp ${WHATSAPP.rotulo}`} width={116} height={116} className="size-[17mm]" unoptimized />
      </div>
    </div>
  );
}

function Campo({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe: string }) {
  return (
    <div className="border-r border-neutral-300 px-[2.5mm] py-[1.8mm] last:border-r-0">
      <div className="text-[2.6mm] tracking-wide text-neutral-500 uppercase">{rotulo}</div>
      <div className="text-[3.9mm] font-semibold tabular-nums">{valor}</div>
      <div className="text-[2.8mm] text-neutral-500">{detalhe}</div>
    </div>
  );
}

function Historico({ pontos, referencia }: { pontos: PontoHistorico[]; referencia: string }) {
  const ano = referencia.slice(0, 4);
  const meses = Array.from({ length: 12 }, (_, i) => `${ano}-${String(i + 1).padStart(2, '0')}-01`);
  const porMes = new Map(pontos.map((p) => [p.referencia, p]));
  const max = Math.max(...pontos.map((p) => p.m3), 0.001);
  const temMarca = pontos.some((p) => p.marca);
  const reais = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div>
      <div className="mb-[1mm] text-[2.6mm] tracking-wide text-neutral-500 uppercase">
        Consumo da unidade em {ano}: m³ e valor do consumo (R$)
      </div>
      {/* m3 e R$ em cima de cada barra (Daniel, 30/10): '+' o mes acumulou e soma com o seguinte; '=' total
          cobrado no mes. O mes de referencia em destaque. pt reserva o espaco do rotulo da barra mais alta. */}
      <div className="flex h-[16mm] items-end gap-[1.2mm] border-b border-neutral-300 pt-[6.4mm]">
        {meses.map((m) => {
          const v = porMes.get(m);
          const atual = m === referencia;
          return (
            <div key={m} className="flex h-full flex-1 items-end">
              {v !== undefined && (
                <div
                  className="relative w-full rounded-t-[0.6mm]"
                  style={{ height: `${Math.max((v.m3 / max) * 100, 2)}%`, background: atual ? AZUL : '#c7d5ec' }}
                >
                  <span
                    className={`absolute -top-[6.2mm] left-1/2 -translate-x-1/2 text-center leading-[1.15] whitespace-nowrap tabular-nums ${atual ? 'text-[2.5mm] font-semibold text-neutral-900' : 'text-[2.2mm] text-neutral-600'}`}
                  >
                    {formatarM3(v.m3)}
                    <br />
                    {v.marca === '=' && v.valor_cobrado !== null
                      ? `= ${reais(v.valor_cobrado)}`
                      : v.valor !== null
                        ? `${reais(v.valor)}${v.marca === '+' ? ' +' : ''}`
                        : v.marca === '+' ? '+' : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-[0.5mm] flex gap-[1.2mm] text-[2.5mm] text-neutral-500">
        {meses.map((m) => (
          <span key={m} className="flex-1 text-center">{rotuloMes(m).slice(0, 3)}</span>
        ))}
      </div>
      {temMarca && (
        <div className="mt-[0.6mm] text-[2.4mm] text-neutral-500">
          + abaixo do mínimo, somou com o mês seguinte · = valor cobrado no mês, com o que tinha acumulado
        </div>
      )}
    </div>
  );
}

export function DemonstrativoMorador({
  d,
  condominio,
  referencia,
  vencimento,
  minimo,
  cobraCondominio,
  quemLe,
}: {
  d: Demonstrativo;
  condominio: string;
  referencia: string;
  vencimento: string | null;
  minimo: number;
  cobraCondominio: boolean;
  quemLe: string;
}) {
  const acumula = d.situacao === 'acumula';
  return (
    // [&>*]:shrink-0: com a linha "Inclui:" o conteudo passava da meia folha e o flex encolhia a caixa dos
    // quatro campos (overflow-hidden), cortando os valores. Agora nada encolhe; o espaco e mais justo.
    <article className="flex h-[133mm] flex-col gap-[1.6mm] overflow-hidden text-neutral-900 [&>*]:shrink-0">
      <Marca titulo="Demonstrativo de consumo de gás" subtitulo={`Referência ${rotuloMes(referencia)}`} />
      <div className="grid grid-cols-[1fr_auto] gap-x-[4mm] gap-y-[0.8mm] text-[3.3mm]">
        <div>
          <div className="text-[2.6mm] tracking-wide text-neutral-500 uppercase">Condomínio</div>
          <div className="font-semibold">{condominio}</div>
        </div>
        <div className="text-right">
          <div className="text-[2.6mm] tracking-wide text-neutral-500 uppercase">Unidade</div>
          <div className="text-[4.2mm] font-bold">{d.identificacao}</div>
        </div>
        <div>
          <div className="text-[2.6mm] tracking-wide text-neutral-500 uppercase">Morador</div>
          <div>{d.morador ?? '—'}</div>
        </div>
        <div className="text-right">
          <div className="text-[2.6mm] tracking-wide text-neutral-500 uppercase">Leitura feita por</div>
          <div>{quemLe}</div>
        </div>
      </div>
      <div className="grid grid-cols-4 overflow-hidden rounded-[1.2mm] border border-neutral-300">
        <Campo rotulo="Leitura anterior" valor={formatarM3(d.anterior.valor)} detalhe={`m³ · ${d.anterior.data ? formatarData(d.anterior.data) : 'última cobrada'}`} />
        <Campo rotulo="Leitura atual" valor={formatarM3(d.atual.valor)} detalhe={`m³ · ${formatarData(d.atual.data)}`} />
        <Campo rotulo={acumula ? 'Consumo acumulado' : 'Consumo'} valor={`${formatarM3(d.consumo)} m³`} detalhe={`≈ ${d.kg.toLocaleString('pt-BR')} kg de gás`} />
        <Campo
          rotulo="Preço do m³"
          valor={d.preco_m3 !== null ? formatarMoeda(d.preco_m3) : '—'}
          detalhe={d.dias !== null ? `${d.dias} dias` : ' '}
        />
      </div>
      {acumula ? (
        <div className="border-l-[1mm] px-[3mm] py-[2mm] text-[3.2mm]" style={{ borderColor: LARANJA, background: '#fdf4ea' }}>
          <b>Sem cobrança neste mês.</b> O consumo desde a última cobrança
          {d.valor ? ` (${formatarMoeda(d.valor)})` : ''} ficou abaixo do mínimo de {formatarMoeda(minimo)} e entra na próxima cobrança.
        </div>
      ) : (
        <div className="flex items-center justify-between border-l-[1mm] px-[3mm] py-[2mm]" style={{ borderColor: AZUL, background: '#f3f6fb' }}>
          <div className="text-[3.3mm]">
            {cobraCondominio ? (
              'Valor do consumo, rateado pelo condomínio'
            ) : vencimento ? (
              <>Vencimento <b>{formatarData(vencimento)}</b></>
            ) : (
              'Valor do consumo'
            )}
          </div>
          <div className="text-right">
            <div className="text-[6mm] leading-tight font-extrabold tabular-nums">{formatarMoeda(d.valor)}</div>
            {d.documento && d.documento.tipo !== 'planilha' && d.documento.numero && (
              <div className="text-[3mm] text-neutral-700">
                {ROTULO_DOCUMENTO[d.documento.tipo]} nº <b>{d.documento.numero}</b>
              </div>
            )}
          </div>
        </div>
      )}
      {d.composicao.length > 0 && <p className="text-[3mm] text-neutral-700">Inclui: {d.composicao.join('; ')}.</p>}
      {d.historico.length > 0 && <Historico pontos={d.historico} referencia={referencia} />}
      <div className="mt-auto">
        <Contato observacao={`Documento informativo, sem valor fiscal. Mínimo de cobrança ${formatarMoeda(minimo)}: abaixo dele o consumo acumula para o mês seguinte.`} />
      </div>
    </article>
  );
}

// Comunicado do primeiro mes impresso (caixa "Incluir comunicado", E9): meia A4, mesmo texto do e-mail.
export function ComunicadoMorador({ minimo, condominio, unidade }: { minimo: number; condominio: string; unidade: string }) {
  const t = textoComunicado(minimo);
  return (
    <article className="flex h-[133mm] flex-col gap-[2.6mm] overflow-hidden text-[3.5mm] leading-relaxed text-neutral-900">
      <Marca titulo={t.titulo} subtitulo={`${condominio} · ${unidade}`} />
      <p className="mt-[1mm]">{t.saudacao}</p>
      <div>
        <p>{t.abertura}</p>
        <ul className="mt-[1mm] list-disc pl-[6mm]">
          {t.itens.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
      {t.depois.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <p className="mt-auto">
        Atenciosamente,
        <br />
        {t.assinatura}
      </p>
    </article>
  );
}
