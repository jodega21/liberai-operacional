import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
const R = new URL('../../../', import.meta.url); // pasta AI Liber
export async function novoBanco() {
  const db = new PGlite();
  await db.exec(fs.readFileSync(new URL('./stubs.sql', import.meta.url), 'utf8'));
  for (const f of ['liberai-cadastros/supabase/migrations/20261028120000_leitura_cadastro.sql',
                   'liberai-cadastros/supabase/migrations/20261029120000_leitura_minimo_cobranca.sql',
                   'liberai-operacional/supabase/migrations/20261029130000_leitura_lancamento.sql',
                   'liberai-operacional/supabase/migrations/20261029171000_leitura_ajustes_validacao.sql',
                   'liberai-operacional/supabase/migrations/20261029180000_leitura_em_aberto_e_historico.sql',
                   'liberai-operacional/supabase/migrations/20261030120000_leitura_faturamento.sql']) {
    try { await db.exec(fs.readFileSync(new URL(f, R), 'utf8')); }
    catch (e) { console.error('FALHA ao aplicar', f, e.message); throw e; }
  }
  return db;
}
