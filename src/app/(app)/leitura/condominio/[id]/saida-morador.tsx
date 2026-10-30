'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DoorOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Campo, Escolha } from '@/components/campos';
import { FotoInput } from '@/components/foto-input';
import { reduzirFoto } from '@/lib/leitura/foto';
import {
  formatarData,
  formatarM3,
  formatarMoeda,
  lerValorM3,
  previaDigitada,
  ROTULO_QUEM_LE,
  type QuemLe,
  type UnidadeSaida,
} from '@/lib/leitura/modelo';
import { cn } from '@/lib/utils';
import { registrarSaida } from '../../actions';

// Saida de morador (R4-A). Fica fechada atras de um botao vermelho para nao ser confundida com o
// lancamento do mes (Daniel lancou aqui por engano em 29/10).
export function SaidaMorador({ unidades, quemLe, hoje }: { unidades: UnidadeSaida[]; quemLe: QuemLe; hoje: string }) {
  const [aberta, setAberta] = useState(false);
  const [unidade, setUnidade] = useState<UnidadeSaida | null>(null);
  if (unidades.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma unidade ativa.</p>;
  return (
    <>
      {!aberta ? (
        <Button type="button" variant="outline" onClick={() => setAberta(true)} className="h-10 border-destructive/50 px-4 text-destructive hover:bg-destructive/5">
          <DoorOpen className="h-4 w-4" /> Registrar saída de morador (mudança)
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm font-semibold text-destructive">
            Escolha o apartamento do morador que está SAINDO. Isto NÃO é a leitura do mês.
          </p>
          <div className="flex flex-wrap gap-2">
            {unidades.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={!u.tem_medidor}
                onClick={() => setUnidade(u)}
                title={u.morador ?? 'Vaga'}
                className="h-9 rounded-lg border border-input bg-card px-3 text-sm tabular-nums hover:bg-muted disabled:opacity-40"
              >
                {u.identificacao}
              </button>
            ))}
          </div>
          <Button type="button" variant="ghost" onClick={() => setAberta(false)} className="h-8 px-2 text-sm">
            Cancelar
          </Button>
        </div>
      )}
      {unidade && <Dialogo unidade={unidade} quemLePadrao={quemLe} hoje={hoje} fechar={() => setUnidade(null)} />}
    </>
  );
}

function Dialogo({ unidade, quemLePadrao, hoje, fechar }: { unidade: UnidadeSaida; quemLePadrao: QuemLe; hoje: string; fechar: () => void }) {
  const router = useRouter();
  const [data, setData] = useState(hoje);
  const [valor, setValor] = useState('');
  const [quemLeu, setQuemLeu] = useState<QuemLe>(quemLePadrao);
  const [foto, setFoto] = useState<File | null>(null);
  const [observacao, setObservacao] = useState('');
  const [alto, setAlto] = useState(false);
  const [conferido, setConferido] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const numero = lerValorM3(valor);
  const previa = previaDigitada(numero, unidade.ultima?.valor ?? null, unidade.ultima_cobrada, unidade.preco_m3);
  const faltaFoto = quemLeu === 'libergas' && !foto;
  const precisaConferir = alto || previa.alto;
  const podeSalvar = numero !== null && !previa.menor && !faltaFoto && (!precisaConferir || conferido) && !enviando;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!podeSalvar) return;
    setEnviando(true);
    try {
      const f = new FormData();
      f.set('unidadeId', unidade.id);
      f.set('data', data);
      f.set('valor', valor);
      f.set('quemLeu', quemLeu);
      f.set('observacao', observacao);
      f.set('conferido', conferido ? '1' : '0');
      if (foto) f.set('foto', await reduzirFoto(foto), 'foto.jpg');
      const r = await registrarSaida(f);
      if (!r.ok) {
        if (r.consumoAlto) setAlto(true);
        toast.error(r.erro);
        return;
      }
      toast.success(`Saída da unidade ${unidade.identificacao} cobrada.`);
      router.refresh();
      fechar();
    } catch {
      toast.error('Não foi possível salvar. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && fechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Saída de morador — unidade {unidade.identificacao}</DialogTitle>
          <DialogDescription>
            Cobra agora tudo o que está em aberto, mesmo abaixo do mínimo. Depois troque o ocupante no Cadastros.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 text-sm tabular-nums">
          <p>Morador: <span className="font-medium">{unidade.morador ?? 'unidade vaga'}</span></p>
          {unidade.ultima && (
            <p>
              Última leitura <span className="font-semibold">{formatarM3(unidade.ultima.valor)}</span> em {formatarData(unidade.ultima.data)}
              {unidade.ultima_cobrada !== null && unidade.ultima_cobrada !== unidade.ultima.valor && (
                <span className="text-muted-foreground"> · última cobrada {formatarM3(unidade.ultima_cobrada)}</span>
              )}
            </p>
          )}
        </div>
        <form onSubmit={salvar} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Data da saída">
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="h-10" />
            </Campo>
            <Campo rotulo="Quem leu">
              <Escolha valor={quemLeu} opcoes={['libergas', 'sindico'] as const} rotulos={ROTULO_QUEM_LE} onChange={setQuemLeu} />
            </Campo>
          </div>
          <Campo rotulo="Leitura (m³)">
            <Input value={valor} onChange={(e) => { setValor(e.target.value); setAlto(false); setConferido(false); }} inputMode="decimal" placeholder="0000,000" className="h-11 text-lg tabular-nums" autoFocus />
          </Campo>
          {valor.trim() !== '' && (
            <p className={cn('rounded-md px-3 py-2 text-sm tabular-nums', numero === null || previa.menor ? 'bg-destructive/10 text-destructive' : previa.alto ? 'bg-amber-100 text-amber-900' : 'bg-muted')}>
              {numero === null
                ? 'Leitura inválida: use até 3 casas depois da vírgula.'
                : previa.menor
                  ? `Menor que a última leitura (${formatarM3(unidade.ultima?.valor ?? null)}).`
                  : <>A cobrar {formatarM3(previa.aCobrar)} m³ ≈ <strong>{formatarMoeda(previa.valor)}</strong>{previa.alto && ' — consumo alto: confira a vírgula.'}</>}
            </p>
          )}
          <FotoInput valor={foto} onChange={setFoto} obrigatoria={quemLeu === 'libergas'} disabled={enviando} />
          <Campo rotulo="Observação">
            <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} maxLength={500} className="h-10" />
          </Campo>
          {precisaConferir && numero !== null && !previa.menor && (
            <label className="flex items-center gap-2 text-sm font-medium text-destaque-texto">
              <Checkbox checked={conferido} onCheckedChange={(m) => setConferido(Boolean(m))} />
              Conferi a leitura na foto
            </label>
          )}
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={!podeSalvar} className="h-10 px-4">
              {enviando && <Loader2 className="animate-spin" />}
              Registrar saída e cobrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
