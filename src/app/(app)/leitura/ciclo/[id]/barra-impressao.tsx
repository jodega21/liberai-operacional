'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Barra das telas de impressao (LEI4): volta ao ciclo e imprime (ou salva em PDF) pelo navegador.
// comunicado (opcional, so nos demonstrativos): caixa "Incluir comunicado" (E9), liga ?comunicado=1 na URL.
export function BarraImpressao({
  voltar,
  rotulo,
  quantas,
  comunicado,
}: {
  voltar: string;
  rotulo: string;
  quantas: string;
  comunicado?: boolean;
}) {
  const router = useRouter();
  const alternar = (ligar: boolean) => {
    const url = new URL(window.location.href);
    const q = url.searchParams;
    if (ligar) q.set('comunicado', '1');
    else q.delete('comunicado');
    router.replace(url.pathname + url.search);
  };
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
      <div>
        <Link href={voltar} className="text-sm text-muted-foreground hover:text-foreground">← Voltar ao ciclo</Link>
        <h1 className="text-xl font-semibold text-foreground">{rotulo}</h1>
        <p className="text-sm text-muted-foreground">{quantas} · A4 retrato</p>
      </div>
      <div className="flex items-center gap-4">
        {comunicado !== undefined && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={comunicado}
              onChange={(e) => alternar(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Incluir comunicado
          </label>
        )}
        <Button type="button" onClick={() => window.print()} className="h-9 px-3">
          <Printer className="h-4 w-4" /> Imprimir
        </Button>
      </div>
    </div>
  );
}
