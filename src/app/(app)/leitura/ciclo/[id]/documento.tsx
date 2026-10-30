'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Escolha } from '@/components/campos';
import { ROTULO_DOCUMENTO, TIPOS_DOCUMENTO, type TipoDocumento } from '@/lib/leitura/modelo';
import { faturarCiclo, faturarCobranca } from '../../actions';

// Documento de cobranca ("fechar a conta", como no vale-gas). alvo 'cobranca' = do morador; 'ciclo' = do
// condominio inteiro (quem paga e o condominio). Sem permissao: so mostra.
export function Documento({
  alvo,
  id,
  atual,
  tipoPadrao,
  podeLancar,
}: {
  alvo: 'cobranca' | 'ciclo';
  id: string;
  atual: { tipo: TipoDocumento; numero: string | null } | null;
  tipoPadrao: (typeof TIPOS_DOCUMENTO)[number];
  podeLancar: boolean;
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<(typeof TIPOS_DOCUMENTO)[number]>(tipoPadrao);
  const [numero, setNumero] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function gravar(t: (typeof TIPOS_DOCUMENTO)[number] | null) {
    setEnviando(true);
    try {
      const entrada = { id, tipo: t, numero: t ? numero : '' };
      const r = alvo === 'cobranca' ? await faturarCobranca(entrada) : await faturarCiclo(entrada);
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      toast.success(t ? 'Documento lançado.' : 'Documento desfeito.');
      setNumero('');
      router.refresh();
    } catch {
      toast.error('Não foi possível salvar. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  if (atual) {
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <span className="rounded bg-emerald-100 px-1.5 font-medium text-emerald-900">
          {ROTULO_DOCUMENTO[atual.tipo]}
          {atual.numero ? ` nº ${atual.numero}` : ''}
        </span>
        {podeLancar && atual.tipo !== 'planilha' && (
          <Button type="button" variant="ghost" disabled={enviando} onClick={() => gravar(null)} className="h-8 px-2 text-muted-foreground print:hidden" aria-label="Desfazer o documento">
            <Undo2 className="h-4 w-4" />
          </Button>
        )}
      </span>
    );
  }
  if (!podeLancar) return <span className="text-sm text-muted-foreground">sem documento</span>;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        gravar(tipo);
      }}
      className="inline-flex flex-wrap items-center gap-2 print:hidden"
    >
      <div className="w-32">
        <Escolha valor={tipo} opcoes={TIPOS_DOCUMENTO} rotulos={ROTULO_DOCUMENTO} onChange={setTipo} />
      </div>
      <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Nº do documento" maxLength={60} className="h-10 w-44" />
      <Button type="submit" disabled={enviando || !numero.trim()} className="h-10 px-4">
        {enviando && <Loader2 className="animate-spin" />}
        Lançar
      </Button>
    </form>
  );
}
