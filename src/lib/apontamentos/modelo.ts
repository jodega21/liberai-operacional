import { z } from 'zod';

// Apontamentos (20261023140000): problema apontado numa tela, para quem resolve
// a area. Modulo PURO (roda no cliente e no servidor): areas, motivos, chaves e
// validacao das actions. A leitura fica em carregar.ts; a gravacao, nas actions.

export const AREAS = ['cadastros', 'valegas', 'acerto', 'financeiro', 'leitura', 'geral'] as const;
export type Area = (typeof AREAS)[number];

export const ROTULO_AREA: Record<Area, string> = {
  cadastros: 'Cadastros',
  valegas: 'Vale-gás',
  acerto: 'Acerto',
  financeiro: 'Financeiro',
  leitura: 'Leitura',
  geral: 'Geral',
};

export const MOTIVO_OUTRO = 'Outro';
export const MOTIVO_FUSAO = 'Fusão a conferir';

// Lista curta por area (G6-A) + "Outro", que exige nota.
export const MOTIVOS: Record<Area, readonly string[]> = {
  cadastros: [
    'Endereço',
    'Telefone',
    'Nome',
    'CPF/CNPJ',
    'Duplicado (é o mesmo que outro)',
    'Fusão errada (são clientes diferentes)',
    MOTIVO_FUSAO,
    MOTIVO_OUTRO,
  ],
  valegas: ['Lançamento errado', 'Valor', 'Cliente/conveniado errado', 'Comprovante', MOTIVO_OUTRO],
  acerto: ['Lançamento errado', 'Valor', 'Cliente errado', MOTIVO_OUTRO],
  financeiro: ['Categoria', 'Valor', 'Transação duplicada ou faltando', MOTIVO_OUTRO],
  leitura: ['Leitura errada', 'Foto', 'Morador', 'Medidor', 'Cobrança', MOTIVO_OUTRO],
  geral: ['Erro na tela', 'Sugestão', MOTIVO_OUTRO],
};

export const STATUS = ['aberto', 'resolvido', 'descartado'] as const;
export type Status = (typeof STATUS)[number];

export const ROTULO_STATUS: Record<Status, string> = {
  aberto: 'Aberto',
  resolvido: 'Resolvido',
  descartado: 'Descartado',
};

export const CHAVE_CRIAR = 'apontamentos.criar';
export const chaveResolver = (area: Area) => `apontamentos.${area}.resolver` as const;

// Areas cuja caixa o usuario ve e resolve (G4-A).
export function areasQueResolve(permissoes: readonly string[]): Area[] {
  return AREAS.filter((a) => permissoes.includes(chaveResolver(a)));
}

// Elemento clicado no modo "apontar problema" (G3 de Daniel).
const alvoSchema = z
  .object({
    texto: z.string().max(500),
    caminho: z.string().max(500),
    x: z.number().int().min(0).max(100000),
    y: z.number().int().min(0).max(100000),
  })
  .nullable();

const entidadeSchema = z
  .object({
    tipo: z.string().regex(/^[a-z_]{1,40}$/),
    id: z.string().min(1).max(100),
  })
  .nullable();

export const criarSchema = z
  .object({
    area: z.enum(AREAS),
    // So caminho do proprio app (link da caixa); nunca URL de fora.
    url: z
      .string()
      .max(1000)
      .regex(/^\/(?!\/)/, 'Endereço inválido.'),
    entidade: entidadeSchema,
    retrato: z.string().trim().max(2000).nullable(),
    alvo: alvoSchema,
    motivo: z.string().min(1).max(80),
    nota: z.string().trim().max(2000),
  })
  .refine((d) => MOTIVOS[d.area].includes(d.motivo), {
    message: 'Escolha um motivo da lista.',
    path: ['motivo'],
  })
  .refine((d) => d.motivo !== MOTIVO_OUTRO || d.nota.length > 0, {
    message: 'Em "Outro", escreva o que está errado.',
    path: ['nota'],
  });

export type NovoApontamento = z.infer<typeof criarSchema>;

export const resolverSchema = z
  .object({
    id: z.guid(),
    status: z.enum(['resolvido', 'descartado']),
    solucao: z.string().trim().max(2000),
  })
  .refine((d) => d.status !== 'descartado' || d.solucao.length > 0, {
    message: 'Diga por que o apontamento foi descartado.',
    path: ['solucao'],
  });

// Filtros da caixa pela URL: situacao (padrao: abertos) e area (padrao: todas
// as que o usuario resolve).
export function parseCaixa(sp: Record<string, string | string[] | undefined>): {
  status: Status | 'todos';
  area: Area | null;
} {
  const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const s = um(sp.situacao);
  const a = um(sp.area);
  return {
    status:
      s === 'todos' || (STATUS as readonly string[]).includes(s ?? '')
        ? (s as Status | 'todos')
        : 'aberto',
    area: (AREAS as readonly string[]).includes(a ?? '') ? (a as Area) : null,
  };
}

export const LIMITE_CAIXA = 200;
