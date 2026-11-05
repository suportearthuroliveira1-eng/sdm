import { z } from "zod";

/** Saídas dos agentes. Structured outputs estrito: todo campo obrigatório (use nullable quando opcional). */
export const bi = z.object({ x: z.string(), pt: z.string() });
export const checagem = z.object({
  sem_cara_de_ia: z.boolean(),
  sem_prova_inventada: z.boolean(),
  regras_da_rede: z.boolean(),
  regras_sdm: z.boolean(),
});

export const diagnosticoOut = z.object({
  perfil: z.string().describe("Resumo de quem ela é, em 2 a 3 frases, em português simples, falando com ela (você)."),
  pais_venda: z.object({ k: z.enum(["eua", "uk", "latam", "esp"]), porque: z.string() }),
  caminho: z.object({ valor: z.enum(["afiliada", "produto", "ambos"]), porque: z.string() }),
  divulgacao: z.object({ valor: z.enum(["pago", "org", "ambos"]), porque: z.string() }),
  cuidados: z.array(z.string()).describe("Até 3 cuidados ou próximos passos práticos."),
});

export const ideiasOut = z.object({
  ideias: z.array(
    z.object({
      nome_provisorio: z.string(),
      publico: bi,
      dor: bi,
      promessa: bi,
      por_que_vende: z.string().describe("Por que vende no país de venda dela, em português."),
      concorrencia: z.enum(["baixa", "media", "alta"]),
      canal: z.enum(["anuncio", "organico", "ambos"]),
      formato: z.string().describe("Ex.: ebook de 10 páginas com checklist"),
    }),
  ),
  por_que_funciona: z.string(),
  checagem,
});

export const avaliarIdeiaOut = z.object({
  veredito: z.enum(["boa", "ajustar", "evitar"]),
  explicacao: z.string(),
  ideia_ajustada: ideiasOut.shape.ideias.element,
  checagem,
});

export const fichaOut = z.object({
  nome: z.string(),
  publico: bi,
  dor: bi,
  promessa: bi,
  o_que_e: bi,
  provas_reais: z.array(z.string()).describe("SÓ o que a aluna contou de verdade. Vazio se ela não contou nada."),
  objecoes: z.array(bi),
  nao_prometer: z.array(z.string()),
  ganchos: z.array(bi),
  prompt_imagem: z.string(),
  tags: z.array(z.string()),
  por_que_funciona: z.string(),
  checagem,
});

export const ofertaOut = z.object({
  nome: bi,
  promessa: bi,
  preco: z.object({ valor: z.number(), moeda: z.string(), porque: z.string() }),
  bonus: z.array(z.object({ titulo: bi, o_que_e: z.string() })).describe("Só bônus que ela consegue entregar de verdade (checklist, planilha, áudio)."),
  garantia: z.object({ texto: bi, porque: z.string() }),
  por_que_funciona: z.string(),
  checagem,
});

export const sumarioOut = z.object({
  titulo: bi,
  subtitulo: bi,
  capitulos: z.array(z.object({ titulo: bi, objetivo: z.string() })),
  por_que_funciona: z.string(),
  checagem,
});

export const capituloOut = z.object({
  titulo: z.string(),
  paragrafos: z.array(z.string()),
  lista: z.array(z.string()),
  destaque: z.string().nullable(),
  exercicio: z.string().nullable(),
  pt: z.object({ titulo: z.string(), paragrafos: z.array(z.string()), lista: z.array(z.string()), destaque: z.string().nullable(), exercicio: z.string().nullable() }),
  checagem,
});

export const paginaOut = z.object({
  blocos: z.array(z.object({ n: z.string(), porque: z.string(), x: z.string(), pt: z.string() })),
  prompt_imagem: z.string(),
  por_que_funciona: z.string(),
  checagem,
});

export const anunciosOut = z.object({
  anuncios: z.array(z.object({ gancho: bi, meio: bi, chamada: bi, texto: bi })),
  por_que_funciona: z.string(),
  checagem,
});

export const ganchosOut = z.object({ ganchos: z.array(bi), por_que_funciona: z.string(), checagem });

export const roteirosOut = z.object({
  roteiros: z.array(z.object({ tipo: z.enum(["atrai", "ensina", "prova", "vende"]), formato: z.string(), gancho: bi, meio: z.string(), chamada: bi, legenda: bi })),
  por_que_funciona: z.string(),
  checagem,
});

export const bioOut = z.object({
  bio: bi,
  legenda: z.object({ x: z.string(), pt: z.string(), tags: z.string() }),
  chamadas: z.array(bi),
  nomes_perfil: z.array(z.string()),
  por_que_funciona: z.string(),
  checagem,
});

export const adaptarOut = z.object({ texto: bi, por_que_funciona: z.string(), checagem });
