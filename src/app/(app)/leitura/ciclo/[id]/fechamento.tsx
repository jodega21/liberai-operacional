'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { excluirCiclo, fecharCiclo, reabrirCiclo } from '../../actions';

// So Administrador (operacional.leitura.fechar). Fechar grava as cobrancas; com unidade sem leitura
// pede confirmacao (R3-B). Reabrir apaga as cobrancas do mes (so o ultimo ciclo).
export function Fechamento({
  cicloId,
  aberto,
  faltam,
  lidas,
  condominioId,
}: {
  cicloId: string;
  aberto: boolean;
  faltam: number;
  lidas: number;
  condominioId: string;
}) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function executar(acao: 'fechar' | 'reabrir', aceitarFaltantes = false) {
    setEnviando(true);
    try {
      const r = acao === 'fechar' ? await fecharCiclo(cicloId, aceitarFaltantes) : await reabrirCiclo(cicloId);
      if (!r.ok) {
        if (r.faltamLeituras) setConfirmar(true);
        toast.error(r.erro);
        return;
      }
      setConfirmar(false);
      toast.success(acao === 'fechar' ? 'Ciclo fechado. Cobranças geradas.' : 'Ciclo reaberto.');
      router.refresh();
    } catch {
      toast.error('Não foi possível concluir. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  async function excluir() {
    setEnviando(true);
    try {
      const r = await excluirCiclo(cicloId);
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      toast.success('Ciclo excluído.');
      router.push(`/leitura/condominio/${condominioId}`);
    } catch {
      toast.error('Não foi possível excluir. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  // Ciclo aberto e vazio (mes errado): pode sair.
  if (aberto && lidas === 0) {
    return (
      <div className="flex justify-end">
        <Button type="button" variant="ghost" disabled={enviando} onClick={excluir} className="h-10 px-4 text-destructive">
          {enviando && <Loader2 className="animate-spin" />}
          Excluir este ciclo (aberto por engano)
        </Button>
      </div>
    );
  }

  if (!aberto) {
    return (
      <div className="flex justify-end">
        <Button type="button" variant="outline" disabled={enviando} onClick={() => executar('reabrir')} className="h-10 px-4">
          {enviando && <Loader2 className="animate-spin" />}
          Reabrir ciclo
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-end gap-2 rounded-[12px] border border-border bg-card p-4">
      {confirmar || faltam > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {faltam} unidade(s) sem leitura: ficam sem cobrança neste mês e o consumo vai para o próximo.
          </p>
          <Button type="button" disabled={enviando} onClick={() => executar('fechar', true)} className="h-10 px-4">
            {enviando && <Loader2 className="animate-spin" />}
            Fechar mesmo assim
          </Button>
        </>
      ) : (
        <Button type="button" disabled={enviando} onClick={() => executar('fechar')} className="h-10 px-4">
          {enviando && <Loader2 className="animate-spin" />}
          Fechar ciclo e gerar cobranças
        </Button>
      )}
    </div>
  );
}
