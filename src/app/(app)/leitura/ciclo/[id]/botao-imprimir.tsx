'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Impressao pelo navegador (imprimir ou salvar em PDF), como no vale-gas. Sem lib de PDF.
export function BotaoImprimir() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()} className="h-9 px-3">
      <Printer className="h-4 w-4" /> Imprimir para o faturamento
    </Button>
  );
}
