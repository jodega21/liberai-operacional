'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatarData } from '@/lib/leitura/modelo';
import { ROTULO_MOTIVO, type MotivoSemEnvio } from '@/lib/envio/modelo';
import { enviarDemonstrativos } from '../../envio-actions';

// Envio do demonstrativo por e-mail (LEI5 fatia 2, G5): resumo antes de confirmar, situacao por unidade
// e Reenviar por unidade. Nada sai sem clique.
export type AlvoTela = {
  chave: string;
  rotulo: string;
  para: string | null;
  motivo: MotivoSemEnvio | null;
  comComunicado: boolean;
  ultimo: { status: 'enviado' | 'falhou'; enviado_em: string; erro: string | null } | null;
};

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
const dia = (iso: string) => formatarData(new Date(new Date(iso).getTime() - 3 * 3_600_000).toISOString());

export function Envio({ cicloId, alvos }: { cicloId: string; alvos: AlvoTela[] }) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState<string | null>(null);

  const podem = alvos.filter((a) => a.para);
  const pendentes = podem.filter((a) => a.ultimo?.status !== 'enviado');
  const comComunicado = pendentes.filter((a) => a.comComunicado).length;
  const enviados = podem.filter((a) => a.ultimo?.status === 'enviado').length;
  const semEnvio = alvos.filter((a) => !a.para);

  async function enviar(chaves?: string[]) {
    setEnviando(chaves ? chaves[0] : 'todos');
    try {
      const r = await enviarDemonstrativos(cicloId, chaves);
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      setConfirmar(false);
      if (r.falharam.length === 0) toast.success(`${r.enviados} e-mail(s) enviado(s).`);
      else {
        toast.error(`${r.enviados} enviado(s), ${r.falharam.length} com falha.`, {
          description: r.falharam.map((f) => `${f.rotulo} (${f.para}): ${f.erro}`).join(' · '),
        });
      }
      router.refresh();
    } catch {
      toast.error('Não foi possível enviar. Tente de novo.');
    } finally {
      setEnviando(null);
    }
  }

  return (
    <section className="space-y-3 rounded-[12px] border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Mail className="h-5 w-5" /> Envio por e-mail
          </h2>
          <p className="text-sm text-muted-foreground">
            {pendentes.length} a enviar{comComunicado > 0 ? ` (${comComunicado} com o comunicado do primeiro mês)` : ''} · {enviados} já enviado(s) ·{' '}
            {semEnvio.length} sem envio por e-mail
          </p>
        </div>
        {!confirmar ? (
          <Button type="button" disabled={pendentes.length === 0 || !!enviando} onClick={() => setConfirmar(true)}>
            Enviar {pendentes.length} e-mail(s)
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm">Enviar {pendentes.length} e-mail(s) agora?</span>
            <Button type="button" disabled={!!enviando} onClick={() => enviar()}>
              {enviando === 'todos' && <Loader2 className="animate-spin" />} Confirmar
            </Button>
            <Button type="button" variant="outline" disabled={!!enviando} onClick={() => setConfirmar(false)}>
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <ul className="divide-y divide-border text-sm">
        {alvos.map((a) => (
          <li key={a.chave} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <span className="font-medium">{a.rotulo}</span>{' '}
              <span className="text-muted-foreground">{a.para ?? (a.motivo ? ROTULO_MOTIVO[a.motivo] : '')}</span>
            </div>
            <div className="flex items-center gap-2">
              {a.ultimo?.status === 'enviado' && (
                <span className="text-xs text-emerald-700">enviado {dia(a.ultimo.enviado_em)} {hora(a.ultimo.enviado_em)}</span>
              )}
              {a.ultimo?.status === 'falhou' && (
                <span className="text-xs text-destructive" title={a.ultimo.erro ?? ''}>falhou {dia(a.ultimo.enviado_em)} {hora(a.ultimo.enviado_em)}</span>
              )}
              {a.para && !a.ultimo && <span className="text-xs text-muted-foreground">a enviar</span>}
              {a.para && a.ultimo && (
                <Button type="button" variant="outline" className="h-7 px-2 text-xs" disabled={!!enviando} onClick={() => enviar([a.chave])}>
                  {enviando === a.chave && <Loader2 className="animate-spin" />} Reenviar
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
