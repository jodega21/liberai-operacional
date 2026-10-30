'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CircleHelp, Flag, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  AREAS,
  MOTIVO_OUTRO,
  MOTIVOS,
  ROTULO_AREA,
  type Area,
  type NovoApontamento,
} from '@/lib/apontamentos/modelo';
import { criarApontamento } from '@/app/(app)/apontamentos/actions';

// Botao flutuante de ajuda (G3 de Daniel, 23/10): "Perguntar a IA" (fatia
// propria, ainda desligada) e "Apontar problema", que congela a tela, deixa
// clicar em qualquer lugar e abre o formulario. A tela diz o que e o registro
// por atributos no HTML:
//   data-apontar-area="cadastros"                  area padrao do trecho
//   data-apontar-tipo="cliente" data-apontar-id="…" registro (tipo + id)
//   data-apontar-resumo="Fulano — NFe 123"          retrato guardado no apontamento
// Sem atributo, guarda o texto e o caminho do elemento clicado.

const UI = 'data-apontamentos-ui';

type Captura = {
  area: Area;
  entidade: { tipo: string; id: string } | null;
  retrato: string | null;
  alvo: NonNullable<NovoApontamento['alvo']>;
  caixa: { top: number; left: number; width: number; height: number };
};

const CLASSE_CAMPO =
  'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

function textoDe(el: Element): string {
  const alvo = el.closest('tr, li, [data-apontar-tipo]') ?? el;
  return ((alvo as HTMLElement).innerText ?? alvo.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function caminhoDe(el: Element): string {
  const partes: string[] = [];
  let atual: Element | null = el;
  while (atual && atual !== document.body && partes.length < 6) {
    const id = atual.id ? `#${atual.id}` : '';
    const slot = atual.getAttribute('data-slot');
    partes.unshift(atual.tagName.toLowerCase() + id + (slot ? `[${slot}]` : ''));
    atual = atual.parentElement;
  }
  return partes.join(' > ').slice(0, 500);
}

function capturar(el: Element, x: number, y: number, areaPadrao: Area): Captura {
  const registro = el.closest<HTMLElement>('[data-apontar-tipo]');
  const doTrecho = el.closest<HTMLElement>('[data-apontar-area]')?.dataset.apontarArea;
  const area = (AREAS as readonly string[]).includes(doTrecho ?? '')
    ? (doTrecho as Area)
    : areaPadrao;
  const tipo = registro?.dataset.apontarTipo;
  const id = registro?.dataset.apontarId;
  const r = (registro ?? el).getBoundingClientRect();
  return {
    area,
    entidade: tipo && id ? { tipo, id } : null,
    retrato: registro?.dataset.apontarResumo?.slice(0, 2000) ?? null,
    alvo: { texto: textoDe(el), caminho: caminhoDe(el), x: Math.round(x), y: Math.round(y) },
    caixa: { top: r.top, left: r.left, width: r.width, height: r.height },
  };
}

export function BotaoAjuda({ areaPadrao }: { areaPadrao: Area }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [apontando, setApontando] = useState(false);
  const [captura, setCaptura] = useState<Captura | null>(null);
  const [area, setArea] = useState<Area>(areaPadrao);
  const [motivo, setMotivo] = useState('');
  const [nota, setNota] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const camada = useRef<HTMLDivElement>(null);

  const fechar = useCallback(() => {
    setApontando(false);
    setCaptura(null);
    setMotivo('');
    setNota('');
    setErro(null);
  }, []);

  // Esc cancela o modo apontar.
  useEffect(() => {
    if (!apontando) return;
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && fechar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [apontando, fechar]);

  function clicouNaTela(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    // A camada cobre a tela; por um instante ela deixa o clique passar para
    // descobrir o elemento de baixo.
    const c = camada.current;
    if (!c) return;
    c.style.pointerEvents = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    c.style.pointerEvents = '';
    if (!el || el.closest(`[${UI}]`)) return;
    const cap = capturar(el, e.clientX, e.clientY, areaPadrao);
    setCaptura(cap);
    setArea(cap.area);
    setMotivo('');
  }

  async function salvar() {
    if (!captura) return;
    setSalvando(true);
    setErro(null);
    const entrada: NovoApontamento = {
      area,
      url: window.location.pathname + window.location.search,
      entidade: captura.entidade,
      retrato: captura.retrato,
      alvo: captura.alvo,
      motivo,
      nota: nota.trim(),
    };
    try {
      const r = await criarApontamento(entrada);
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      toast.success('Problema apontado. Obrigado!');
      fechar();
      router.refresh();
    } catch {
      setErro('Falha de comunicação. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  const motivos = MOTIVOS[area];
  const exigeNota = motivo === MOTIVO_OUTRO;

  return (
    <>
      {/* Modo apontar: congela a tela; o clique escolhe o ponto do problema. */}
      {apontando && !captura && (
        <div
          ref={camada}
          {...{ [UI]: '' }}
          onClick={clicouNaTela}
          className="fixed inset-0 z-[60] cursor-crosshair bg-destaque/5"
        >
          <div className="pointer-events-none fixed top-4 left-1/2 -translate-x-1/2 rounded-full bg-destaque px-4 py-2 text-sm text-destaque-contraste shadow-lg">
            Clique onde está o problema · Esc para cancelar
          </div>
        </div>
      )}

      {/* Destaque do ponto escolhido, atras do formulario. */}
      {captura && (
        <div
          {...{ [UI]: '' }}
          className="pointer-events-none fixed z-[55] rounded-md ring-2 ring-destaque ring-offset-2"
          style={captura.caixa}
        />
      )}

      <Dialog open={captura !== null} onOpenChange={(aberto) => !aberto && fechar()}>
        <DialogContent className="sm:max-w-md" {...{ [UI]: '' }}>
          <DialogHeader>
            <DialogTitle>Apontar problema</DialogTitle>
          </DialogHeader>
          {captura && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted px-3 py-2 text-[13px]">
                <div className="text-muted-foreground">O que você marcou</div>
                <div className="line-clamp-3">{captura.retrato || captura.alvo.texto || '—'}</div>
              </div>
              <label className="block space-y-1">
                <span className="text-[13px] font-medium">Área</span>
                <select
                  className={CLASSE_CAMPO}
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value as Area);
                    setMotivo('');
                  }}
                >
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {ROTULO_AREA[a]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-[13px] font-medium">Motivo</span>
                <select
                  className={CLASSE_CAMPO}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                >
                  <option value="" disabled>
                    Escolha…
                  </option>
                  {motivos.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-[13px] font-medium">
                  O que está errado{' '}
                  {!exigeNota && (
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  )}
                </span>
                <textarea
                  className={cn(CLASSE_CAMPO, 'min-h-24')}
                  value={nota}
                  maxLength={2000}
                  onChange={(e) => setNota(e.target.value)}
                />
              </label>
              {erro && <p className="text-[13px] text-destructive">{erro}</p>}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={fechar} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={salvar}
              disabled={salvando || !motivo || (exigeNota && nota.trim() === '')}
            >
              {salvando && <Loader2 className="size-4 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Botao e menu */}
      {!apontando && (
        <div
          {...{ [UI]: '' }}
          className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2 md:right-[104px] md:bottom-28"
        >
          {menu && (
            <div className="w-64 overflow-hidden rounded-xl border border-border bg-card text-sm shadow-lg">
              <button
                type="button"
                disabled
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-muted-foreground"
                title="Em breve"
              >
                <Sparkles className="size-4" />
                <span>
                  Perguntar à IA <span className="text-[12px]">(em breve)</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  setApontando(true);
                }}
                className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left hover:bg-muted"
              >
                <Flag className="size-4 text-destaque-texto" />
                Apontar problema
              </button>
            </div>
          )}
          <button
            type="button"
            aria-label={menu ? 'Fechar ajuda' : 'Ajuda'}
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
            className="flex size-12 items-center justify-center rounded-full bg-destaque text-destaque-contraste shadow-lg transition-colors hover:bg-destaque-forte"
          >
            {menu ? <X className="size-5" /> : <CircleHelp className="size-6" />}
          </button>
        </div>
      )}
    </>
  );
}
