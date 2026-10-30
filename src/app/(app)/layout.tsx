import { AppShell } from '@/components/app-shell';
import { BotaoAjuda } from '@/components/apontamentos/botao-ajuda';
import { CHAVE_CRIAR } from '@/lib/apontamentos/modelo';
import { SemAcesso } from '@/components/sem-acesso';
import { getPermissoes } from '@/lib/acesso/permissoes';
import { createServerSessionClient } from '@/lib/supabase/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const permissoes = await getPermissoes();

  // Fail-closed: sem sessao, sem papel ou erro na leitura -> lista vazia.
  if (permissoes.length === 0) {
    return <SemAcesso />;
  }

  const sessionClient = await createServerSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  const userEmail = user?.email ?? null;

  // Apontamentos: este app so aponta (botao de ajuda); a caixa de quem resolve fica no LiberAi Cadastros.

  return (
    <AppShell
      permissoes={permissoes}
      userEmail={userEmail}
      botaoAjuda={permissoes.includes(CHAVE_CRIAR) ? <BotaoAjuda areaPadrao="leitura" /> : null}
    >
      {children}
    </AppShell>
  );
}
