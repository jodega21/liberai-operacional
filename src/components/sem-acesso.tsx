'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ShieldOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export function SemAcesso() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <ShieldOff className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-lg font-semibold text-foreground">Acesso não autorizado</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Você não tem acesso ao LiberAi Operacional. Peça ao administrador para liberar
          seu acesso.
        </p>
      </div>
      <button
        type="button"
        onClick={sair}
        disabled={saindo}
        className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {saindo ? 'Saindo…' : 'Sair'}
      </button>
    </div>
  );
}
