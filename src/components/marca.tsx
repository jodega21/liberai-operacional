import { Gauge } from 'lucide-react';

// Marca do app: circulo laranja (laranja da marca Libergas) com o icone e o nome em Maven Pro, a
// fonte do logotipo. Usada no menu lateral, na barra do celular e no login.
export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destaque">
        <Gauge className="h-4 w-4 text-destaque-contraste" aria-hidden />
      </span>
      <span className="font-heading leading-tight">
        <span className="block text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">LiberAi</span>
        <span className={compacta ? 'block text-base font-bold text-foreground' : 'block text-lg font-bold text-foreground'}>
          Operacional
        </span>
      </span>
    </span>
  );
}
