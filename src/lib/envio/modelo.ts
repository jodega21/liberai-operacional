// Envio do demonstrativo da leitura por e-mail (LEI5 fatia 2; Daniel 31/10 E1-E9, 04/11 G1-G6).
// Modulo PURO: decide quem recebe o que. Quem le o banco e quem envia ficam em carregar.ts e ses.ts.
//
// G1-A: morador recebe o demonstrativo so da cobranca A COBRAR com documento lancado (boleto, NF-e ou
// recibo; 'planilha' e historico) e so com canal de correspondencia "E-mail" e e-mail preenchido (CAD33).
// G2: condominio que paga (um documento no ciclo) recebe o resumo nos e-mails da configuracao da leitura.
// E9-A: o comunicado do primeiro mes vai junto no primeiro demonstrativo enviado a cada pessoa.

export const ORIGEM_COBRANCA = 'leitura_cobranca';
export const ORIGEM_CICLO = 'leitura_ciclo';
export type OrigemTipo = typeof ORIGEM_COBRANCA | typeof ORIGEM_CICLO;

export type EnvioRegistrado = {
  origem_tipo: OrigemTipo;
  origem_id: string;
  destinatario: string;
  cliente_id: string | null;
  status: 'enviado' | 'falhou';
  erro: string | null;
  enviado_em: string;
};

export type Contato = { cliente_id: string; nome: string; email: string | null; canal: string | null };

// Unidade a cobrar do ciclo fechado, com o que o envio precisa saber.
export type UnidadeCobrada = {
  unidade_id: string;
  identificacao: string;
  cobranca_id: string;
  documento: { tipo: string; numero: string | null } | null;
  morador: Contato | null;
};

export type MotivoSemEnvio = 'sem_documento' | 'sem_morador' | 'canal' | 'sem_email';

export const ROTULO_MOTIVO: Record<MotivoSemEnvio, string> = {
  sem_documento: 'documento não lançado',
  sem_morador: 'sem morador',
  canal: 'canal não é e-mail',
  sem_email: 'sem e-mail',
};

export type Alvo = {
  origem_tipo: OrigemTipo;
  origem_id: string;
  rotulo: string;                    // "Unidade 401" | "Condomínio"
  para: string | null;               // e-mail; null quando nao da para enviar
  contato: Contato | null;
  motivo: MotivoSemEnvio | null;
  com_comunicado: boolean;
  ultimo: EnvioRegistrado | null;    // ultima tentativa para esta origem e este e-mail
};

const RE_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function documentoLancado(doc: UnidadeCobrada['documento']): boolean {
  return !!doc && doc.tipo !== 'planilha' && !!doc.numero;
}

function ultimoDe(envios: EnvioRegistrado[], origem_id: string, para: string | null): EnvioRegistrado | null {
  const daOrigem = envios.filter((e) => e.origem_id === origem_id && (para === null || e.destinatario === para));
  return daOrigem.sort((a, b) => b.enviado_em.localeCompare(a.enviado_em))[0] ?? null;
}

// Alvos do demonstrativo do morador (G1-A). O comunicado (E9-A) vai quando a pessoa ainda nao recebeu
// nenhum demonstrativo com sucesso.
export function alvosMoradores(unidades: UnidadeCobrada[], envios: EnvioRegistrado[]): Alvo[] {
  const jaRecebeu = new Set(
    envios.filter((e) => e.origem_tipo === ORIGEM_COBRANCA && e.status === 'enviado' && e.cliente_id).map((e) => e.cliente_id!),
  );
  return unidades.map((u) => {
    const rotulo = `Unidade ${u.identificacao}`;
    const base = { origem_tipo: ORIGEM_COBRANCA, origem_id: u.cobranca_id, rotulo, contato: u.morador } as const;
    let motivo: MotivoSemEnvio | null = null;
    if (!documentoLancado(u.documento)) motivo = 'sem_documento';
    else if (!u.morador) motivo = 'sem_morador';
    else if (u.morador.canal !== 'email') motivo = 'canal';
    else if (!u.morador.email || !RE_EMAIL.test(u.morador.email)) motivo = 'sem_email';
    const para = motivo ? null : u.morador!.email!;
    return {
      ...base,
      para,
      motivo,
      com_comunicado: !motivo && !jaRecebeu.has(u.morador!.cliente_id),
      ultimo: ultimoDe(envios, u.cobranca_id, para),
    };
  });
}

// Resumo do condominio que paga (G2): um alvo por e-mail da configuracao; documento do ciclo lancado.
export function alvosCondominio(
  cicloId: string,
  documento: { tipo: string; numero: string | null } | null,
  emails: string[],
  envios: EnvioRegistrado[],
): Alvo[] {
  const base = { origem_tipo: ORIGEM_CICLO, origem_id: cicloId, rotulo: 'Condomínio', contato: null, com_comunicado: false } as const;
  if (!documentoLancado(documento)) return [{ ...base, para: null, motivo: 'sem_documento', ultimo: null }];
  const validos = emails.map((e) => e.trim().toLowerCase()).filter((e) => RE_EMAIL.test(e));
  if (validos.length === 0) return [{ ...base, para: null, motivo: 'sem_email', ultimo: null }];
  return [...new Set(validos)].map((para) => ({ ...base, para, motivo: null, ultimo: ultimoDe(envios, cicloId, para) }));
}

// Na tela "Enviar": so vai quem pode e ainda nao tem envio com sucesso. Reenvio e por alvo (botao proprio).
export function pendentes(alvos: Alvo[]): Alvo[] {
  return alvos.filter((a) => a.para && a.ultimo?.status !== 'enviado');
}

export function chaveAlvo(a: Pick<Alvo, 'origem_id' | 'para'>): string {
  return `${a.origem_id}|${a.para ?? ''}`;
}
