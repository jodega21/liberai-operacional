import { ShieldOff } from 'lucide-react';

// Destino do redirect de `exigir` (lib/acesso/permissoes.ts). SEM gate de
// proposito: se esta pagina exigisse qualquer permissao, quem nao a tem seria
// redirecionado para ela mesma — loop. Quem nao tem permissao NENHUMA nem chega
// aqui: o (app)/layout ja responde com <SemAcesso/>.
export default function SemPermissaoPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <ShieldOff className="h-10 w-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Você não tem permissão para acessar esta tela.
      </p>
      <p className="text-sm text-muted-foreground">
        Use o menu para ir a uma tela que você tem permissão para acessar.
      </p>
    </div>
  );
}
