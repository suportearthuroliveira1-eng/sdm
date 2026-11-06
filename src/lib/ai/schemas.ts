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

const textoCap = {
  titulo: z.string(),
  abertura: z.string().describe("Uma frase forte de abertura do capítulo (vai em destaque na página de abertura)."),
  paragrafos: z.array(z.string()).describe("Introdução do capítulo: 2 a 3 parágrafos curtos."),
  secoes: z.array(z.object({ titulo: z.string(), paragrafos: z.array(z.string()) })).describe("3 a 4 seções com subtítulo, cada uma com 2 a 4 parágrafos curtos."),
  lista: z.array(z.string()).describe("Passo a passo ou dicas práticas (pode ser vazia)."),
  na_pratica: z.string().nullable().describe("Um exemplo concreto do dia a dia. Sem número, depoimento ou resultado inventado."),
  erros_comuns: z.array(z.string()).describe("2 a 4 erros comuns e como evitar."),
  destaque: z.string().nullable(),
  resumo: z.array(z.string()).describe("3 a 5 pontos pra lembrar."),
  exercicio: z.string().nullable(),
};
export const capituloOut = z.object({
  ...textoCap,
  pt: z.object(textoCap),
  checagem,
});

/** Introdução, como usar, conclusão e próximos passos do ebook. */
const textoExtras = {
  introducao: z.object({ titulo: z.string(), paragrafos: z.array(z.string()) }),
  como_usar: z.array(z.string()).describe("3 a 5 dicas de como aproveitar o ebook."),
  conclusao: z.object({ titulo: z.string(), paragrafos: z.array(z.string()) }),
  proximos_passos: z.array(z.string()).describe("3 a 6 ações práticas pra quem terminou de ler."),
  aviso: z.string().describe("Aviso curto e honesto: o ebook é educativo, não substitui profissional quando o tema pedir (saúde, dinheiro, direito). Sem promessa."),
};
export const extrasEbookOut = z.object({ ...textoExtras, pt: z.object(textoExtras), checagem });

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

/** Rascunho das respostas da ficha (a aluna confere e muda antes de gerar). */
export const rascunhoFichaOut = z.object({
  o_que_sabe: z.string().describe("Primeira pessoa, 2 a 4 frases, em português, só a partir do diagnóstico e da ideia. Sem inventar experiência, número ou certificado."),
  nao_prometer: z.string().describe("O que não prometer nesse tema, separado por vírgula."),
  dica: z.string().describe("Uma frase pra aluna: o que ela pode acrescentar com as palavras dela pra ficha ficar mais forte."),
});

/** País Oculto · mapa: 3 países do catálogo que combinam com ela. */
export const ocultoMapaOut = z.object({
  paises: z.array(
    z.object({
      k: z.string().describe("Chave do país no catálogo recebido."),
      por_que_voce: z.string().describe("Por que esse país combina com ELA (assuntos, idiomas, tempo). Português, 1 a 2 frases."),
      vantagem: z.string().describe("A vantagem escondida desse mercado, sem números."),
      primeiro_passo: z.string().describe("O primeiro passo prático, em 1 frase."),
    }),
  ),
  segredo_geral: z.string().describe("O segredo por trás dessa escolha, em 1 a 2 frases, falando com ela."),
  checagem,
});

/** País Oculto · estratégia secreta pra um país. */
export const ocultoEstrategiaOut = z.object({
  segredo: z.string().describe("A grande sacada, em 2 a 3 frases, falando com ela."),
  produto: z.object({
    nome_provisorio: z.string(),
    publico: bi,
    dor: bi,
    promessa: bi,
    por_que_vende: z.string(),
    concorrencia: z.enum(["baixa", "media", "alta"]),
    canal: z.enum(["anuncio", "organico", "ambos"]),
    formato: z.string(),
  }),
  angulo: z.object({ titulo: z.string(), explicacao: z.string() }),
  oferta: z.object({ bonus: z.array(z.string()), garantia: z.string() }),
  onde_divulgar: z.array(z.object({ canal: z.string(), como: z.string() })),
  plano: z.array(z.object({ fase: z.string(), quando: z.string(), acoes: z.array(z.string()) })),
  ganchos: z.array(bi),
  onde_receber: z.string(),
  cuidados: z.array(z.string()),
  checagem,
});
