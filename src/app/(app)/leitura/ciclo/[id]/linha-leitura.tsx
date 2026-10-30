'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { FotoInput } from '@/components/foto-input';
import { reduzirFoto } from '@/lib/leitura/foto';
import {
  formatarData,
  formatarM3,
  formatarM3Campo,
  formatarMoeda,
  lerValorM3,
  previaDigitada,
  ROTULO_SITUACAO,
  type LinhaCiclo,
} from '@/lib/leitura/modelo';
import { cn } from '@/lib/utils';
import { registrarLeitura, removerLeitura } from '../../actions';

const COR_SITUACAO = {
  cobrar: 'bg-destaque text-destaque-contraste',
  acumula: 'bg-amber-100 text-amber-900',
  sem_leitura: 'bg-muted text-muted-foreground',
  lida: 'bg-muted text-foreground',
} as const;

// Uma unidade do ciclo. Sem leitura: campo aberto. Com leitura: fica travada e so muda pelo botao
// "Corrigir" (Daniel, 29/10: anexar outra foto nao pode sobrescrever a leitura sem querer).
export function LinhaLeitura({
  linha,
  cicloId,
  editavel,
  fotoObrigatoria,
  documento = null,
}: {
  linha: LinhaCiclo;
  cicloId: string;
  editavel: boolean;
  fotoObrigatoria: boolean;
  documento?: React.ReactNode;
}) {
  const router = useRouter();
  const l = linha.leitura;
  const [editando, setEditando] = useState(!l);
  const [valor, setValor] = useState(l ? formatarM3Campo(l.valor) : '');
  const [foto, setFoto] = useState<File | null>(null);
  const [observacao, setObservacao] = useState(l?.observacao ?? '');
  const [alto, setAlto] = useState(false);
  const [conferido, setConferido] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const numero = lerValorM3(valor);
  const previaBase = previaDigitada(numero, linha.anterior?.valor ?? null, linha.base_valor, linha.preco_m3);
  // em aberto de meses anteriores entra na cobranca deste mes
  const previa =
    previaBase.aCobrar !== null && linha.em_aberto > 0 && linha.preco_m3 !== null
      ? { ...previaBase, aCobrar: Math.round((previaBase.aCobrar + linha.em_aberto) * 1000) / 1000, valor: Math.round((previaBase.aCobrar + linha.em_aberto) * linha.preco_m3 * 100) / 100 }
      : previaBase;
  const temFoto = !!foto || !!l?.foto_url;
  const faltaFoto = fotoObrigatoria && !temFoto;
  const precisaConferir = alto || previa.alto;
  const podeSalvar = numero !== null && !previa.menor && !faltaFoto && (!precisaConferir || conferido) && !enviando;

  const selo = l && linha.situacao === 'sem_leitura' ? 'lida' : linha.situacao;
  const rotuloSelo = selo === 'lida' ? 'Lida' : ROTULO_SITUACAO[linha.situacao];

  function cancelar() {
    setEditando(false);
    setValor(l ? formatarM3Campo(l.valor) : '');
    setObservacao(l?.observacao ?? '');
    setFoto(null);
    setAlto(false);
    setConferido(false);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!linha.medidor_id || !podeSalvar) return;
    setEnviando(true);
    try {
      const f = new FormData();
      f.set('cicloId', cicloId);
      f.set('medidorId', linha.medidor_id);
      f.set('valor', valor);
      f.set('data', '');
      f.set('observacao', observacao);
      f.set('conferido', conferido ? '1' : '0');
      if (foto) f.set('foto', await reduzirFoto(foto), 'foto.jpg');
      const r = await registrarLeitura(f);
      if (!r.ok) {
        if (r.consumoAlto) setAlto(true);
        toast.error(r.erro);
        return;
      }
      setFoto(null);
      setAlto(false);
      setConferido(false);
      setEditando(false);
      toast.success(`Unidade ${linha.identificacao} salva.`);
      router.refresh();
    } catch {
      toast.error('Não foi possível salvar. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    if (!l) return;
    setEnviando(true);
    try {
      const r = await removerLeitura(l.id);
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      setValor('');
      setObservacao('');
      setEditando(true);
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <li className={cn('rounded-[12px] border bg-card p-3 sm:p-4', editando && editavel ? 'border-destaque' : 'border-border')}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <span className="font-heading text-lg font-bold tabular-nums">{linha.identificacao}</span>{' '}
          <span className="truncate text-sm text-muted-foreground">{linha.morador ?? 'vaga'}</span>
        </div>
        <span className={cn('rounded-full px-2 text-[11px] leading-5 font-semibold', COR_SITUACAO[selo])}>{rotuloSelo}</span>
      </div>

      <div className="mt-1 text-sm tabular-nums">
        {linha.anterior ? (
          <>
            <span className="text-muted-foreground">Anterior </span>
            <span className="font-semibold">{formatarM3(linha.anterior.valor)}</span>
            <span className="text-muted-foreground"> em {formatarData(linha.anterior.data)}</span>
            {linha.base_valor !== null && linha.base_valor !== linha.anterior.valor && (
              <span className="text-muted-foreground"> · última cobrada {formatarM3(linha.base_valor)}</span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">Sem medidor</span>
        )}
      </div>

      {/* Leitura salva (travada) */}
      {l && !editando && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm tabular-nums">
          <span>
            Leitura <span className="font-semibold">{formatarM3(l.valor)}</span>
          </span>
          {linha.consumo !== null && linha.situacao !== 'acumula' && (
            <span>
              Consumo <span className="font-semibold">{formatarM3(linha.consumo)} m³</span> ·{' '}
              <span className="font-semibold">{formatarMoeda(linha.valor)}</span>
            </span>
          )}
          {/* Acumula: o consumo desde a ultima cobranca vai para a proxima. "Em aberto" = a planilha pulou
              este consumo numa cobranca seguinte; ele fica guardado a parte e entra na proxima tambem. */}
          {linha.consumo !== null && linha.situacao === 'acumula' && (
            <span className="rounded bg-amber-100 px-1.5 text-amber-900">
              {formatarM3(linha.ficou_em_aberto ?? linha.consumo)} m³ não cobrados — entram na próxima cobrança
            </span>
          )}
          {linha.situacao === 'cobrar' && linha.composicao.length > 0 && (
            <span className="rounded bg-amber-100 px-1.5 text-amber-900">inclui {linha.composicao.join(' · ')}</span>
          )}
          {l.foto_url && (
            <a href={l.foto_url} target="_blank" rel="noreferrer" className="text-destaque-texto underline-offset-2 hover:underline">
              ver foto
            </a>
          )}
          {l.observacao && <span className="text-muted-foreground">{l.observacao}</span>}
          {documento && <span className="basis-full sm:ml-auto sm:basis-auto">{documento}</span>}
          {editavel && (
            <span className="ml-auto flex gap-1">
              <Button type="button" variant="outline" disabled={enviando} onClick={() => setEditando(true)} className="h-9 px-3">
                <Pencil className="h-4 w-4" /> Corrigir
              </Button>
              <Button type="button" variant="ghost" disabled={enviando} onClick={remover} aria-label="Remover a leitura" className="h-9 px-2">
                <Trash2 className="h-4 w-4" />
              </Button>
            </span>
          )}
        </div>
      )}

      {/* Lancamento / correcao */}
      {editavel && linha.medidor_id && editando && (
        <form onSubmit={salvar} className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={valor}
              onChange={(e) => {
                setValor(e.target.value);
                setAlto(false);
                setConferido(false);
              }}
              inputMode="decimal"
              placeholder="Leitura (m³)"
              aria-label={`Leitura da unidade ${linha.identificacao}`}
              className="h-11 w-44 text-lg tabular-nums"
            />
            <FotoInput valor={foto} onChange={setFoto} atual={l?.foto_url} obrigatoria={fotoObrigatoria} disabled={enviando} />
            <Input
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observação"
              maxLength={500}
              className="h-10 min-w-0 flex-1 basis-40"
            />
          </div>

          {/* O que o numero digitado significa, antes de salvar */}
          {valor.trim() !== '' && (
            <p
              className={cn(
                'rounded-md px-3 py-2 text-sm tabular-nums',
                numero === null || previa.menor
                  ? 'bg-destructive/10 text-destructive'
                  : previa.alto
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-muted text-foreground',
              )}
            >
              {numero === null
                ? 'Leitura inválida: use até 3 casas depois da vírgula (ex.: 2014,281).'
                : previa.menor
                  ? `Menor que a anterior (${formatarM3(linha.anterior?.valor ?? null)}).`
                  : (
                      <>
                        Consumo <strong>{formatarM3(previa.consumo)} m³</strong>
                        {previa.valor !== null && (
                          <>
                            {' '}· a cobrar desde a última cobrada{linha.em_aberto > 0 && ` (com ${formatarM3(linha.em_aberto)} m³ em aberto)`} {formatarM3(previa.aCobrar)} m³ ≈ <strong>{formatarMoeda(previa.valor)}</strong>
                          </>
                        )}
                        {previa.alto && ' — consumo alto: confira a vírgula.'}
                      </>
                    )}
            </p>
          )}

          {precisaConferir && numero !== null && !previa.menor && (
            <label className="flex items-center gap-2 text-sm font-medium text-destaque-texto">
              <Checkbox checked={conferido} onCheckedChange={(m) => setConferido(Boolean(m))} />
              Conferi a leitura na foto
            </label>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={!podeSalvar} className="h-10 px-5">
              {enviando && <Loader2 className="animate-spin" />}
              {l ? 'Salvar correção' : 'Salvar leitura'}
            </Button>
            {l && (
              <Button type="button" variant="ghost" disabled={enviando} onClick={cancelar} className="h-10 px-3">
                Cancelar
              </Button>
            )}
            {faltaFoto && numero !== null && !previa.menor && (
              <span className="text-sm text-destaque-texto">Tire a foto do relógio para salvar.</span>
            )}
          </div>
        </form>
      )}
    </li>
  );
}
