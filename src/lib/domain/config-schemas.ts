import { z } from "zod";

/** Schemas das configurações editáveis no admin. Tudo opcional cai no padrão do código. */
const caminho = z.enum(["afiliada", "produto", "ambos"]);
const divulgacao = z.enum(["pago", "org", "ambos"]);

export const perguntaSchema = z.object({
  k: z.string().regex(/^[a-z0-9_]{1,30}$/, "Código: só letras minúsculas, números e _"),
  q: z.string().min(3).max(200),
  p: z.string().max(300).default(""),
  o: z.array(z.string().min(1).max(120)).max(20),
  tipo: z.enum(["unica", "multipla", "texto"]).default("unica"),
  outro: z.boolean().optional(),
  regras: z.record(z.string(), z.object({ caminho: caminho.optional(), divulgacao: divulgacao.optional(), peso: z.number().min(0).max(10).optional() })).optional(),
});

export const configDiagnosticoSchema = z.object({
  perguntas: z
    .array(perguntaSchema)
    .min(1)
    .max(20)
    .refine((l) => new Set(l.map((p) => p.k)).size === l.length, "Duas perguntas com o mesmo código")
    .refine((l) => l.every((p) => p.tipo === "texto" || p.o.length >= 1), "Pergunta de opção precisa de pelo menos 1 opção")
    .refine((l) => l.every((p) => new Set(p.o).size === p.o.length), "Opção repetida na mesma pergunta"),
  decisao: z.object({ modo: z.enum(["regras", "ia"]), caminhoPadrao: caminho, divulgacaoPadrao: divulgacao }),
});

export const cartaoCaminhoSchema = z.object({
  t: z.string().min(1).max(80),
  o: z.string().max(300),
  tempo: z.string().max(200),
  dinheiro: z.string().max(200),
  quem: z.string().max(200),
});

export const textosAppSchema = z.object({
  boasVindas: z.object({ titulo: z.string().max(120), texto: z.string().max(600), videoUrl: z.string().max(400) }).partial().default({}),
  combinado: z.object({ titulo: z.string().max(120), sdmFaz: z.array(z.string().max(200)).max(10), voceFaz: z.array(z.string().max(200)).max(10) }).partial().default({}),
  caminhos: z.object({ afiliada: cartaoCaminhoSchema, produto: cartaoCaminhoSchema, ambos: cartaoCaminhoSchema }).partial().default({}),
  etapas: z.record(z.string(), z.object({ nome: z.string().max(80).optional(), entenda: z.string().max(400).optional() })).default({}),
});
export type TextosApp = z.infer<typeof textosAppSchema>;

export const fluxoSchema = z.object({
  /** a aluna precisa terminar o primeiro acesso (boas-vindas, combinado, diagnóstico, caminho) antes de usar o app */
  onboardingObrigatorio: z.boolean().default(true),
  /** mostra "Decidir depois" na escolha do caminho */
  permitirDecidirDepois: z.boolean().default(false),
  /** pula a tela de boas-vindas */
  pularBoasVindas: z.boolean().default(false),
  /** pula a tela do combinado */
  pularCombinado: z.boolean().default(false),
});
export type Fluxo = z.infer<typeof fluxoSchema>;
