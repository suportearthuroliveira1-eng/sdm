import type { NomeIcone } from "@/components/ui/icone";

/**
 * As etapas agrupadas em poucas fases (o topo de cada etapa mostra as fases, não 13 etiquetas).
 * Divulgação (pago/orgânico) é sempre a última fase.
 */
export type Fase = { k: string; nome: string; icone: NomeIcone; cor: string; slugs: string[] };

const DIVULGAR = ["divulgar", "base-anuncios", "criativos", "pixel", "numeros", "perfil", "roteiros", "numeros-org"];

export const FASES_PASTA: Record<"proprio" | "sdm", Fase[]> = {
  proprio: [
    { k: "comecar", nome: "Começar", icone: "info", cor: "var(--accent)", slugs: ["entenda"] },
    { k: "criar", nome: "Criar", icone: "lampada", cor: "var(--c-amber)", slugs: ["ideias", "ficha", "oferta", "mercado"] },
    { k: "ebook", nome: "Ebook", icone: "livro", cor: "var(--ok)", slugs: ["ebook", "revisao"] },
    { k: "vender", nome: "Vender", icone: "carrinho", cor: "var(--c-sky)", slugs: ["pagina", "plataforma", "conta", "teste"] },
    { k: "divulgar", nome: "Divulgar", icone: "megafone", cor: "var(--c-pink)", slugs: DIVULGAR },
  ],
  sdm: [
    { k: "comecar", nome: "Começar", icone: "info", cor: "var(--accent)", slugs: ["entenda"] },
    { k: "afiliar", nome: "Afiliação", icone: "link", cor: "var(--c-teal)", slugs: ["afiliacao", "link", "kit"] },
    { k: "preparar", nome: "Preparar", icone: "carteira", cor: "var(--c-amber)", slugs: ["conta", "regras"] },
    { k: "divulgar", nome: "Divulgar", icone: "megafone", cor: "var(--c-pink)", slugs: DIVULGAR },
  ],
};

export function fasesDa(tipo: string): Fase[] {
  return tipo === "sdm" ? FASES_PASTA.sdm : FASES_PASTA.proprio;
}

/** Índice da fase de uma etapa (desconhecida: a última). */
export function indiceDaFase(fases: Fase[], slug: string) {
  const i = fases.findIndex((f) => f.slugs.includes(slug));
  return i < 0 ? fases.length - 1 : i;
}
