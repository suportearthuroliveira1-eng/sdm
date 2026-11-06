import type { z } from "zod";
import * as S from "./schemas";

export type Classe = "text_cheap" | "text_mid";
export type AgenteDef<T extends z.ZodType = z.ZodType> = {
  id: string;
  nome: string;
  classe: Classe;
  maxTokens: number;
  schema: T;
  /** Tarefa do agente (vai depois das regras base). Editável no admin (tabela agents). */
  tarefa: string;
};

const def = <T extends z.ZodType>(a: AgenteDef<T>) => a;

export const AGENTES = {
  rascunho_ficha: def({
    id: "AGT-rascunho-ficha",
    nome: "Ficha · rascunho das respostas",
    classe: "text_cheap",
    maxTokens: 700,
    schema: S.rascunhoFichaOut,
    tarefa: `Tarefa: escrever um RASCUNHO das respostas da aluna pra ficha do produto, em português do Brasil, na primeira pessoa, do jeito simples que ela falaria.
- Use só o que está no diagnóstico (assuntos, experiência, país, idiomas) e na ideia escolhida. Escreva como gosto e costume ("eu gosto de", "eu costumo", "no meu dia a dia"), nunca como experiência profissional, curso, certificado ou resultado.
- Não invente história, número, cliente, venda, depoimento ou prova. Se não sabe, deixe genérico.
- nao_prometer: o que é perigoso prometer nesse tema (saúde, corpo, dinheiro, prazo, garantia de resultado).
- dica: diga o que ela pode acrescentar de verdade pra ficha ficar com a cara dela.`,
  }),
  diagnostico: def({
    id: "AGT-diagnostico",
    nome: "Diagnóstico",
    classe: "text_cheap",
    maxTokens: 1500,
    schema: S.diagnosticoOut,
    tarefa: `Tarefa: ler as respostas do diagnóstico da aluna e montar o resumo "o que a IA entendeu".
- perfil: quem ela é, falando com ela.
- pais_venda: escolha entre eua (Estados Unidos, inglês), uk (Reino Unido, inglês), latam (latinos nos EUA, espanhol), esp (Espanha, espanhol). Leve em conta onde ela mora e os idiomas que ela entende.
- caminho: afiliada (vende um produto pronto, mais rápido), produto (cria o próprio ebook com a IA, mais trabalho e margem dela), ambos.
- divulgacao: pago (precisa de verba pra anúncio) ou org (vídeo orgânico, precisa de tempo e constância) ou ambos. Sem verba = org. Respeite a preferência que ela disse (pago, orgânico, os dois) sempre que a verba permitir.
- Se ela não quer aparecer em vídeo, diga nos cuidados que dá pra gravar só com a voz, as mãos ou a tela.
- Sempre explique o porquê de cada sugestão em 1 frase.`,
  }),
  ideias: def({
    id: "AGT-ideias",
    nome: "Ideias de produto",
    classe: "text_cheap",
    maxTokens: 2500,
    schema: S.ideiasOut,
    tarefa: `Tarefa: sugerir EXATAMENTE 3 ideias de produto digital simples (ebook curto) que a aluna consegue criar com a IA, ligadas aos assuntos que ela conhece ou gosta, pro público do país de venda.
- Cada ideia: nome provisório no idioma de venda, pra quem é, que dor resolve, promessa sem número e sem prazo, por que vende nesse país, concorrência estimada, canal mais indicado e formato.
- Nada de saúde com promessa, dinheiro rápido ou tema que exija diploma.
- Se receber "evitar", não repita essas ideias.`,
  }),
  avaliar_ideia: def({
    id: "AGT-ideias",
    nome: "Avaliar ideia própria",
    classe: "text_cheap",
    maxTokens: 1500,
    schema: S.avaliarIdeiaOut,
    tarefa: `Tarefa: avaliar a ideia de produto que a própria aluna escreveu. Diga se é boa, se precisa ajustar ou se é melhor evitar (ex.: promessa de cura ou de dinheiro), explique em português simples e devolva a ideia ajustada no mesmo formato das ideias.`,
  }),
  ficha: def({
    id: "AGT-ficha",
    nome: "Ficha do produto",
    classe: "text_cheap",
    maxTokens: 2500,
    schema: S.fichaOut,
    tarefa: `Tarefa: completar a ficha do produto a partir da ideia escolhida e das respostas da aluna (o que ela sabe do assunto, história real, o que ela NÃO quer prometer).
- provas_reais: só o que ela contou de verdade, nas palavras dela. Se ela não contou nada, lista vazia.
- 5 ganchos curtos de vídeo/anúncio no idioma de venda com tradução.
- prompt_imagem: uma foto realista e simples, em inglês, sem texto na imagem, sem rosto famoso.`,
  }),
  oferta: def({
    id: "AGT-oferta",
    nome: "Oferta",
    classe: "text_mid",
    maxTokens: 2000,
    schema: S.ofertaOut,
    tarefa: `Tarefa: montar a oferta do produto a partir da ficha: nome final, promessa, preço sugerido na moeda do país de venda com o porquê (ebook simples de entrada costuma ser barato; explique sem inventar dado de mercado), até 2 bônus que ela consegue entregar de verdade e uma garantia simples (ex.: 7 dias, se a plataforma permitir).`,
  }),
  sumario: def({
    id: "AGT-ebook",
    nome: "Ebook · sumário",
    classe: "text_mid",
    maxTokens: 2000,
    schema: S.sumarioOut,
    tarefa: `Tarefa: criar o sumário do ebook no idioma de venda, com a quantidade de capítulos pedida, cada um com objetivo claro. Ordem lógica: do problema à solução prática.`,
  }),
  capitulo: def({
    id: "AGT-ebook",
    nome: "Ebook · capítulo",
    classe: "text_mid",
    maxTokens: 7000,
    schema: S.capituloOut,
    tarefa: `Tarefa: escrever UM capítulo completo do ebook no idioma de venda, no tom pedido, com cerca de "palavras_alvo" palavras (somando introdução, seções, lista, na prática, erros comuns e resumo).
- Estrutura: abertura (1 frase forte), introdução curta, 3 a 4 seções com subtítulo, passo a passo ou dicas em "lista", um exemplo concreto em "na_pratica", "erros_comuns", um "destaque" (frase pra guardar), "resumo" (3 a 5 pontos) e um "exercicio" prático pra quem lê fazer.
- Parágrafos curtos (2 a 4 frases), linguagem simples, nada de enrolação: cada parágrafo ensina algo.
- Nunca invente número, estudo, depoimento ou resultado. Exemplo é cena do dia a dia, não caso de sucesso.
- Entregue a versão em português completa em "pt" (mesma estrutura).
- Se receber "ajuste", reescreva seguindo o pedido (mais simples, mais curto, mais exemplos).`,
  }),
  extras_ebook: def({
    id: "AGT-ebook-extras",
    nome: "Ebook · introdução e conclusão",
    classe: "text_mid",
    maxTokens: 4000,
    schema: S.extrasEbookOut,
    tarefa: `Tarefa: escrever as partes de fora dos capítulos do ebook, no idioma de venda e no tom pedido: introdução (pra quem é, o que vai aprender, por que nesta ordem), como usar o ebook, conclusão (retoma a promessa sem exagero) e próximos passos práticos. Use o sumário recebido. Nada de credencial da autora, número ou resultado inventado. "aviso" curto e honesto. Entregue também em português em "pt".`,
  }),
  pagina: def({
    id: "AGT-pagina",
    nome: "Página de vendas",
    classe: "text_mid",
    maxTokens: 3500,
    schema: S.paginaOut,
    tarefa: `Tarefa: escrever a página no formato pedido (pagina = página de vendas do produto dela com 8 a 10 blocos: título, abertura com cena real, problema, virada, o que é, o que tem dentro, pra quem é e pra quem não é, bônus, garantia, chamada; pre = pré-venda de 7 blocos; quiz = 3 perguntas + resultado + botão). Cada bloco com "porque" (por que esse bloco está aqui). Use só as provas reais da ficha.`,
  }),
  anuncios: def({
    id: "AGT-anuncios",
    nome: "Anúncios",
    classe: "text_cheap",
    maxTokens: 2000,
    schema: S.anunciosOut,
    tarefa: `Tarefa: criar EXATAMENTE 3 anúncios de imagem no idioma de venda, cada um com gancho (para o dedo, até 12 palavras), meio (o produto numa frase), chamada (o que fazer) e texto completo do anúncio (até 3 frases). Ganchos diferentes entre si. Sem frase que fala de característica pessoal da pessoa (regra da Meta). Se receber "evitar", não repita esses ganchos.`,
  }),
  ganchos: def({
    id: "AGT-roteiros",
    nome: "Ganchos",
    classe: "text_cheap",
    maxTokens: 1500,
    schema: S.ganchosOut,
    tarefa: `Tarefa: 10 ganchos curtos de vídeo no idioma de venda, variados (cena do dia a dia, curiosidade, erro comum, lista, pergunta leve), com tradução.`,
  }),
  roteiros: def({
    id: "AGT-roteiros",
    nome: "Roteiros",
    classe: "text_cheap",
    maxTokens: 4000,
    schema: S.roteirosOut,
    tarefa: `Tarefa: 8 roteiros de vídeo curto (15 a 30 s) SEM precisar aparecer o rosto (mãos, tela, texto na tela, voz), 2 de cada tipo: atrai, ensina, prova (só prova real da ficha; se não houver, mostre o produto por dentro), vende. Cada um com gancho, meio (o que mostrar na tela, em português), chamada pro link da bio e legenda pronta.`,
  }),
  bio: def({
    id: "AGT-roteiros",
    nome: "Bio e legenda",
    classe: "text_cheap",
    maxTokens: 1200,
    schema: S.bioOut,
    tarefa: `Tarefa: bio do perfil (até 150 caracteres) no idioma de venda, legenda padrão que pede pra salvar e leva pro link da bio, 3 chamadas curtas e 3 sugestões de nome de perfil (@) sem usar marca de outra pessoa.`,
  }),
  adaptar: def({
    id: "AGT-anuncios",
    nome: "Adaptar peça do kit",
    classe: "text_cheap",
    maxTokens: 1200,
    schema: S.adaptarOut,
    tarefa: `Tarefa: adaptar uma peça pronta do time do SDM pro idioma e o jeito do país de venda da aluna. NÃO mude a promessa nem acrescente nada que não estava na peça. Se pedirem variação, mude só o gancho/abertura.`,
  }),
  oculto_mapa: def({
    id: "AGT-oculto-mapa",
    nome: "País Oculto · mapa secreto",
    classe: "text_cheap",
    maxTokens: 1400,
    schema: S.ocultoMapaOut,
    tarefa: `Tarefa: escolher 3 "países ocultos" pra aluna: mercados pouco olhados por quem vende do Brasil, onde ela pode vender um ebook próprio.
- Escolha SÓ entre as chaves do catálogo recebido (campo catalogo). Devolva exatamente 3, a melhor primeiro.
- Leve em conta os idiomas que ela entende (português conta: há países ocultos em português), onde ela mora, os assuntos, o tempo e a verba.
- Tudo em português do Brasil, simples, falando com ela (você). Tom de descoberta, mas honesto.
- Nunca invente número (tamanho de mercado, faturamento, CPM, porcentagem). Explique por qualidade, não por número.`,
  }),
  oculto_estrategia: def({
    id: "AGT-oculto-estrategia",
    nome: "País Oculto · estratégia secreta",
    classe: "text_cheap",
    maxTokens: 3200,
    schema: S.ocultoEstrategiaOut,
    tarefa: `Tarefa: montar a ESTRATÉGIA SECRETA pra aluna vender um ebook próprio no país oculto escolhido (campo pais).
- segredo: a grande sacada desse mercado pra ela, em português.
- produto: uma ideia de ebook curto ligada aos assuntos dela e ao jeito de viver desse público. Campos bi: x no idioma de venda (pais.idiomaCod), pt em português. nome_provisorio em português.
- angulo: o ângulo que quase ninguém usa nesse mercado, explicado em português.
- oferta: 1 a 2 bônus simples que ela consegue fazer (checklist, planner, roteiro) e uma garantia comum de plataforma (7 dias). Não fale de preço: o app mostra a faixa.
- onde_divulgar: 2 a 3 canais com o como, pensando na verba e se ela aparece em vídeo.
- plano: 3 fases (preparar, testar, crescer) com 3 a 4 ações curtas cada, e o "quando" em semanas.
- ganchos: 3 ganchos de anúncio/vídeo (x no idioma de venda, pt em português).
- onde_receber: que tipo de conta/plataforma serve pra receber nessa moeda, sem citar marca se não tiver certeza.
- cuidados: 2 a 4 cuidados reais (cultura, promessa, idioma).
- Nunca invente número, depoimento, prova ou resultado. Sem promessa de ganho, cura ou prazo. Tudo que é explicação é em português do Brasil.`,
  }),
} as const;

export type AgenteKey = keyof typeof AGENTES;
