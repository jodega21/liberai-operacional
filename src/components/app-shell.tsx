'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Gauge, LogOut, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { visiveisPara, type ItemNavegavel } from '@/lib/nav';
import { Marca } from '@/components/marca';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

// Layout do LiberAi Operacional: menu na LATERAL DIREITA (decisao de Daniel, 29/10 - cada app com
// layout proprio: Cadastros com barra no topo, Financeiro com menu a esquerda). No celular o menu
// abre da direita pelo botao da barra.
//
// A `chave` de cada item e a mesma do `exigir` da pagina para onde ele leva (lib/nav.ts): o menu
// mostra exatamente o que a rota deixa entrar. Exportado para o teste de navegacao.
export const navItems: (ItemNavegavel & { href: string; label: string })[] = [
  { href: '/leitura', label: 'Leitura', chave: ['operacional.leitura.lancar', 'operacional.leitura.fechar'] },
];

const ICONES: Record<string, typeof Gauge> = { '/leitura': Gauge };

export function AppShell({
  children,
  permissoes,
  userEmail,
  botaoAjuda = null,
}: {
  children: React.ReactNode;
  permissoes: readonly string[];
  userEmail: string | null;
  botaoAjuda?: React.ReactNode;
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const visiveis = visiveisPara(navItems, permissoes);

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      {/* Barra do celular */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-lateral px-4 md:hidden print:hidden">
        <Marca compacta />
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir o menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Conteudo */}
      {/* pb-24 no celular: espaco para o botao de ajuda, que fica no canto. No computador ele fica no menu lateral. */}
      <main className="flex min-w-0 flex-1 flex-col px-4 pt-5 pb-24 sm:px-8 sm:pt-7 md:pb-7 print:p-0">{children}</main>

      {/* Menu lateral direito (computador) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-l border-border bg-lateral md:flex print:hidden">
        <Painel itens={visiveis} userEmail={userEmail} />
      </aside>

      {/* Menu do celular, abre da direita */}
      <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
        <SheetContent side="right" className="w-72 bg-lateral p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Painel itens={visiveis} userEmail={userEmail} aoNavegar={() => setMenuAberto(false)} />
        </SheetContent>
      </Sheet>

      <div className="print:hidden">{botaoAjuda}</div>
    </div>
  );
}

function Painel({
  itens,
  userEmail,
  aoNavegar,
}: {
  itens: { href: string; label: string }[];
  userEmail: string | null;
  aoNavegar?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSaindo(false);
      toast.error('Erro ao sair', { description: error.message });
      return;
    }
    router.replace('/login');
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Faixa laranja no topo do menu */}
      <div className="h-1.5 w-full shrink-0 bg-destaque" />
      <div className="px-5 pt-5 pb-6">
        <Marca />
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {itens.map(({ href, label }) => {
          const ativo = pathname.startsWith(href);
          const Icone = ICONES[href] ?? Gauge;
          return (
            <Link
              key={href}
              href={href}
              onClick={aoNavegar}
              aria-current={ativo ? 'page' : undefined}
              className={cn(
                'flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
                ativo
                  ? 'bg-destaque font-semibold text-destaque-contraste'
                  : 'text-muted-foreground hover:bg-destaque-suave hover:text-foreground',
              )}
            >
              <Icone className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border p-3">
        {userEmail && (
          <p className="truncate px-3 pb-2 text-xs text-muted-foreground" title={userEmail}>
            {userEmail}
          </p>
        )}
        <button
          type="button"
          onClick={sair}
          disabled={saindo}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {saindo ? 'Saindo…' : 'Sair'}
        </button>
      </div>
    </div>
  );
}
