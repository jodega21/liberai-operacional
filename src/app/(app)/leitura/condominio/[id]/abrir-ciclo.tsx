'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Campo } from '@/components/campos';
import { rotuloMes } from '@/lib/leitura/modelo';
import { abrirCiclo } from '../../actions';

export function AbrirCiclo({ condominioId, referencia, dataLeitura }: { condominioId: string; referencia: string; dataLeitura: string }) {
  const router = useRouter();
  const [mes, setMes] = useState(referencia.slice(0, 7));
  const [data, setData] = useState(dataLeitura);
  const [enviando, setEnviando] = useState(false);

  async function abrir(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const r = await abrirCiclo({ condominioId, referencia: `${mes}-01`, dataLeitura: data });
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      toast.success(`Ciclo de ${rotuloMes(`${mes}-01`)} aberto.`);
      if (r.id) router.push(`/leitura/ciclo/${r.id}`);
      else router.refresh();
    } catch {
      toast.error('Não foi possível abrir o ciclo. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={abrir} className="flex flex-wrap items-end gap-3">
      <Campo rotulo="Mês">
        <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="h-10 w-40" />
      </Campo>
      <Campo rotulo="Data da leitura">
        <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="h-10 w-44" />
      </Campo>
      <Button type="submit" disabled={enviando || !mes || !data} className="h-10 px-4">
        {enviando && <Loader2 className="animate-spin" />}
        Abrir ciclo
      </Button>
    </form>
  );
}
