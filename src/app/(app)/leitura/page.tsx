import Link from 'next/link';
import { exigir } from '@/lib/acesso/permissoes';
import { listarCondominios } from '@/lib/leitura/carregar';
import { ROTULO_QUEM_LE, rotuloMes } from '@/lib/leitura/modelo';
import { cn } from '@/lib/utils';

export default async function LeituraPage() {
  await exigir(['operacional.leitura.lancar', 'operacional.leitura.fechar']);
  const r = await listarCondominios();

  return (
    <div className="max-w-5xl space-y-5" data-apontar-area="leitura">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Leitura</h1>
        <p className="text-sm text-muted-foreground">Condomínios com o módulo Leitura ativo no Cadastros.</p>
      </header>
      {!r.ok && <p className="text-sm text-destructive">Não foi possível carregar os condomínios. Tente de novo.</p>}
      {r.ok && r.itens.length === 0 && <p className="text-sm text-muted-foreground">Nenhum condomínio com leitura ativa.</p>}
      {r.ok && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {r.itens.map((c) => (
            <li key={c.id}>
              <Link
                href={`/leitura/condominio/${c.id}`}
                className="block rounded-[12px] border border-border bg-card p-4 transition-colors hover:border-destaque"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-foreground">{c.nome}</span>
                  {c.ciclo && (
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 text-[11px] leading-5 font-semibold',
                        c.ciclo.status === 'aberto' ? 'bg-destaque text-destaque-contraste' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {rotuloMes(c.ciclo.referencia)} · {c.ciclo.status === 'aberto' ? 'aberto' : 'fechado'}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.unidades} unidade(s) · lê: {ROTULO_QUEM_LE[c.quem_le]} · dia {c.dia_leitura}
                  {c.ciclo?.status === 'aberto' && ` · ${c.lidas}/${c.unidades} lidas`}
                  {!c.ciclo && ' · nenhum ciclo ainda'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
