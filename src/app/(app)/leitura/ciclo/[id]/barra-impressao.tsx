'use client';

import Link from 'next/link';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Barra das telas de impressao (LEI4): volta ao ciclo e imprime (ou salva em PDF) pelo navegador.
export function BarraImpressao({ voltar, rotulo, quantas }: { voltar: string; rotulo: string; quantas: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
      <div>
        <Link href={voltar} className="text-sm text-muted-foreground hover:text-foreground">← Voltar ao ciclo</Link>
        <h1 className="text-xl font-semibold text-foreground">{rotulo}</h1>
        <p className="text-sm text-muted-foreground">{quantas} · A4 retrato</p>
      </div>
      <Button type="button" onClick={() => window.print()} className="h-9 px-3">
        <Printer className="h-4 w-4" /> Imprimir
      </Button>
    </div>
  );
}
