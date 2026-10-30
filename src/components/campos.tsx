'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Pecas pequenas dos formularios da leitura.

export function Campo({ rotulo, children, ajuda }: { rotulo: string; children: React.ReactNode; ajuda?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{rotulo}</span>
      {children}
      {ajuda && <span className="block text-xs text-muted-foreground">{ajuda}</span>}
    </label>
  );
}

export function Escolha<T extends string>({
  valor,
  opcoes,
  rotulos,
  onChange,
  disabled,
}: {
  valor: T;
  opcoes: readonly T[];
  rotulos: Record<T, string>;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  const itens = opcoes.map((o) => ({ value: o, label: rotulos[o] }));
  return (
    <Select items={itens} value={valor} disabled={disabled} onValueChange={(v) => v && onChange(v as T)}>
      <SelectTrigger className="w-full data-[size=default]:h-10">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {itens.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
