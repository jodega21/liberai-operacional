'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Foto do relogio: no celular abre a camera traseira (capture); no computador, escolhe o arquivo.
// Mostra a miniatura da escolhida; `atual` = foto ja salva (link para ampliar).
export function FotoInput({
  valor,
  onChange,
  atual,
  obrigatoria,
  disabled,
}: {
  valor: File | null;
  onChange: (f: File | null) => void;
  atual?: string | null;
  obrigatoria?: boolean;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (valor ? URL.createObjectURL(valor) : null), [valor]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const mostrar = preview ?? atual ?? null;
  return (
    <div className="flex items-center gap-2">
      {mostrar && (
        <a href={mostrar} target="_blank" rel="noreferrer" className="block h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element -- URL assinada/temporaria, fora do otimizador */}
          <img src={mostrar} alt="Foto do relógio" className="h-full w-full object-cover" />
        </a>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
        className={cn(
          'flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-colors hover:bg-muted disabled:opacity-50',
          obrigatoria && !mostrar ? 'border-destaque text-destaque-texto' : 'border-input text-foreground',
        )}
      >
        <Camera className="h-4 w-4" aria-hidden />
        {mostrar ? 'Trocar foto' : obrigatoria ? 'Foto (obrigatória)' : 'Foto'}
      </button>
      {valor && (
        <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-foreground" aria-label="Tirar a foto escolhida">
          <X className="h-4 w-4" />
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
    </div>
  );
}
