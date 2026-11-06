/**
 * Etapas de cada pasta (docs/App_SDM_Fluxo_Ideal.pdf). Regra pura e testável:
 * recebe o estado da pasta e devolve feita / agora / bloqueada (com o motivo).
 */
export type TipoPasta = "vitrine" | "sdm" | "proprio";
export type EtapaDef = { slug: string; nome: string; aula?: string; entenda: string };
export type EtapaStatus = EtapaDef & { ok: boolean; agora: boolean; travada: string | null };

/** Estado mínimo que as regras leem (vem de student_products + itens gerados + ebook). */
export type EstadoPasta = {
  tipo: TipoPasta;
  dados: Record<string, unknown>;
  divulgacao: string | null;
  temEbookPronto: boolean;
  temPagina: boolean;
  temCriativos: boolean;
  temRoteiros: boolean;
  temNumeros: boolean;
  temVenda: boolean;
};

const d = (e: EstadoPasta, k: string) => e.dados[k];
const marcado = (e: EstadoPasta, k: string) => Boolean((e.dados.feito as Record<string, unknown> | undefined)?.[k]);

export const ETAPAS_SDM: EtapaDef[] = [
  { slug: "entenda", nome: "Entenda", aula: "A1.1", entenda: "Como você ganha sendo afiliada do SDM, o que você faz e o que o time faz por você." },
  { slug: "afiliacao", nome: "Pedir afiliação", aula: "A1.3", entenda: "Você pede pra ser afiliada do SDM. O time confere e aprova; aí você recebe o seu link." },
  { slug: "link", nome: "Meu link", aula: "A1.3", entenda: "O link que marca que a venda veio de você, com uma versão pra cada canal." },
  { slug: "kit", nome: "Kit de divulgação", aula: "A1.4", entenda: "Peças prontas do time. Você nunca começa do zero: a IA só adapta pro seu país, sem mudar a promessa." },
  { slug: "conta", nome: "Conta pra receber", aula: "A1.5", entenda: "A conta em dólar onde a comissão cai." },
  { slug: "regras", nome: "Regras da afiliação", aula: "A1.6", entenda: "Regras curtas que protegem a sua conta e a marca." },
];

export const ETAPAS_PROPRIO: EtapaDef[] = [
  { slug: "entenda", nome: "Entenda", aula: "B1.1", entenda: "O que vai acontecer nos próximos passos: a IA faz o trabalho pesado, você escolhe, revisa e aprova." },
  { slug: "ideias", nome: "Ideias de produto", aula: "B1.3", entenda: "A IA sugere 3 ideias ligadas ao que você conhece. Você escolhe entre opções explicadas, não numa tela em branco." },
  { slug: "ficha", nome: "Ficha do produto", aula: "B1.3", entenda: "Poucas perguntas sobre o que você sabe. A IA completa a ficha: público, dor, promessa, provas reais e objeções." },
  { slug: "oferta", nome: "Oferta", aula: "B1.5", entenda: "Nome, promessa, preço sugerido com o porquê, bônus reais e garantia." },
  { slug: "mercado", nome: "Idioma e país", aula: "B1.5", entenda: "Até aqui tudo foi em português, pra você entender cada detalhe. Agora você escolhe pra quem vai vender: o país e o idioma. O ebook e a página saem nesse idioma, sempre com a tradução do lado." },
  { slug: "ebook", nome: "Ebook", aula: "B1.6", entenda: "Sumário, capítulos um por um (com tradução), capa e estilo, e o PDF final." },
  { slug: "revisao", nome: "Revisão", aula: "B1.7", entenda: "Um checklist antes de vender: entrega o que promete, sem promessa de cura ou ganho, nada copiado." },
  { slug: "pagina", nome: "Página de vendas", aula: "B2.2", entenda: "A IA escreve a página bloco por bloco, com o porquê de cada bloco. Você edita e aprova." },
  { slug: "plataforma", nome: "Plataforma de venda", aula: "B2.4", entenda: "Onde o cliente paga: criar a conta, cadastrar o produto, subir o ebook e pegar o link do checkout." },
  { slug: "conta", nome: "Conta pra receber", aula: "B2.5", entenda: "A conta em dólar onde o dinheiro das vendas cai." },
  { slug: "teste", nome: "Teste até a compra", aula: "B2.6", entenda: "Você faz o caminho do cliente: abre a página, clica, chega no checkout e confere se o ebook chega." },
];

export const ETAPAS_DIVULGACAO_BASE: EtapaDef[] = [{ slug: "divulgar", nome: "Como você vai divulgar?", aula: "3.4", entenda: "Anúncio pago ou vídeo orgânico (ou os dois). Cada um tem custo, tempo e velocidade diferentes." }];
export const ETAPAS_PAGO: EtapaDef[] = [
  { slug: "base-anuncios", nome: "Pago · Base de anúncios", aula: "P1.1", entenda: "Facebook seguro, portfólio, conta de anúncios, forma de pagamento e limite de gasto." },
  { slug: "criativos", nome: "Pago · Criativos", aula: "P2.1", entenda: "3 anúncios de imagem e o texto de cada um, prontos pra baixar." },
  { slug: "pixel", nome: "Pago · Pixel", aula: "P3.1", entenda: "O pixel conta quem clicou e quem comprou. Sem ele a Meta não aprende." },
  { slug: "numeros", nome: "Pago · Números", aula: "P5.1", entenda: "Você digita os números da campanha e o app responde com o próximo passo." },
];
export const ETAPAS_ORG: EtapaDef[] = [
  { slug: "perfil", nome: "Orgânico · Rede e perfil", aula: "O1.1", entenda: "Bio, nome, link da bio com contagem de cliques e o aquecimento do perfil." },
  { slug: "roteiros", nome: "Orgânico · Roteiros e ideias", aula: "O2.1", entenda: "Roteiros por tipo (atrai, ensina, prova, vende), sem precisar aparecer." },
  { slug: "numeros-org", nome: "Orgânico · Números", aula: "O5.1", entenda: "Visualizações e cliques de cada vídeo: o app aponta o campeão." },
];

/** Uma etapa "está pronta"? */
export function pronta(slug: string, e: EstadoPasta): boolean {
  const af = d(e, "afiliacao") as { status?: string; link?: string } | undefined;
  switch (slug) {
    case "entenda": return marcado(e, "entenda");
    case "afiliacao": return af?.status === "aprovada";
    case "link": return marcado(e, "link");
    case "kit": return marcado(e, "kit");
    case "conta": return marcado(e, "conta");
    case "regras": return marcado(e, "regras");
    case "ideias": return Boolean(d(e, "ideia"));
    case "ficha": return Boolean(d(e, "ficha"));
    case "oferta": return Boolean((d(e, "oferta") as { aprovada?: boolean } | undefined)?.aprovada);
    case "mercado": return Boolean(d(e, "mercado"));
    case "ebook": return e.temEbookPronto;
    case "revisao": return marcado(e, "revisao");
    case "pagina": return e.temPagina;
    case "plataforma": return Boolean((d(e, "checkout") as { ok?: boolean } | undefined)?.ok);
    case "teste": return marcado(e, "teste");
    case "divulgar": return Boolean(e.divulgacao);
    case "base-anuncios": return marcado(e, "base-anuncios");
    case "criativos": return e.temCriativos || marcado(e, "criativos");
    case "pixel": return marcado(e, "pixel");
    case "numeros": case "numeros-org": return e.temNumeros;
    case "perfil": return marcado(e, "perfil");
    case "roteiros": return e.temRoteiros || marcado(e, "roteiros");
    default: return false;
  }
}

/** Lista de etapas da pasta, na ordem, com o status de cada uma. */
export function etapasDaPasta(e: EstadoPasta, textos: Record<string, { nome?: string; entenda?: string }> = {}): EtapaStatus[] {
  const estrutura = e.tipo === "sdm" ? ETAPAS_SDM : e.tipo === "proprio" ? ETAPAS_PROPRIO : [];
  const div = [
    ...ETAPAS_DIVULGACAO_BASE,
    ...(e.divulgacao === "pago" || e.divulgacao === "ambos" ? ETAPAS_PAGO : []),
    ...(e.divulgacao === "org" || e.divulgacao === "ambos" ? ETAPAS_ORG : []),
  ];
  const todas = [...estrutura, ...div];
  let agoraMarcado = false;
  // Enquanto o time analisa a afiliação, link e kit esperam; conta e regras já dá pra fazer.
  const esperaAfiliacao = (slug: string) => slug === "afiliacao" || ((slug === "link" || slug === "kit") && !pronta("afiliacao", e));
  const emAnalise = (d(e, "afiliacao") as { status?: string } | undefined)?.status === "analise";
  return todas.map((def) => {
    const ok = pronta(def.slug, e);
    let travada: string | null = null;
    // Divulgação só abre com a estrutura pronta (afiliada: regras; produto: teste até a compra).
    if (def.slug === "divulgar" && estrutura.length && !estrutura.every((x) => pronta(x.slug, e))) {
      const falta = estrutura.find((x) => !pronta(x.slug, e))!;
      travada = `Abre quando a estrutura estiver pronta. Falta: ${falta.nome}.`;
    } else if (def.slug === "link" && !pronta("afiliacao", e)) {
      travada = "Abre quando o time aprovar a sua afiliação.";
    } else if (def.slug === "kit" && !pronta("afiliacao", e)) {
      travada = "Abre quando o time aprovar a sua afiliação.";
    } else if (estrutura.includes(def) && def.slug !== "afiliacao") {
      // trava em cadeia: qualquer etapa anterior da estrutura que não esteja pronta
      const falta = estrutura.slice(0, estrutura.indexOf(def)).find((x) => !esperaAfiliacao(x.slug) && !pronta(x.slug, e));
      if (falta) travada = `Termine a etapa anterior: ${falta.nome}.`;
    }
    const agora = !ok && !travada && !agoraMarcado && !(def.slug === "afiliacao" && emAnalise);
    if (agora) agoraMarcado = true;
    const t = textos[def.slug];
    const st: EtapaStatus = { ...def, ...(t?.nome ? { nome: t.nome } : {}), ...(t?.entenda ? { entenda: t.entenda } : {}), ok, agora, travada };
    return st;
  });
}

/** Progresso em 7 fases (Início · Meu caminho). */
export const FASES = ["Entender", "Produto", "Estrutura", "Divulgação", "Números", "Dinheiro", "Escalar"] as const;
export function faseAtual(e: EstadoPasta): number {
  if (e.temVenda) return 5;
  if (e.temNumeros) return 4;
  if (e.divulgacao) return 3;
  const est = e.tipo === "sdm" ? ETAPAS_SDM : ETAPAS_PROPRIO;
  if (e.tipo !== "vitrine" && est.slice(1).some((x) => pronta(x.slug, e))) return 2;
  if (pronta("entenda", e)) return 1;
  return 0;
}
