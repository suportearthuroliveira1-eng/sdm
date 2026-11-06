import type { NomeIcone } from "@/components/ui/icone";

/** Cor (variável CSS) e ícone de cada etapa: cada passo tem a sua cara, não só o roxo. */
const V: Record<string, { cor: string; icone: NomeIcone }> = {
  entenda: { cor: "var(--accent)", icone: "info" },
  afiliacao: { cor: "var(--c-sky)", icone: "pessoa" },
  link: { cor: "var(--c-teal)", icone: "link" },
  kit: { cor: "var(--c-amber)", icone: "kit" },
  regras: { cor: "var(--c-orange)", icone: "regras" },
  ideias: { cor: "var(--c-amber)", icone: "lampada" },
  ficha: { cor: "var(--c-teal)", icone: "ficha" },
  oferta: { cor: "var(--c-pink)", icone: "etiqueta" },
  mercado: { cor: "var(--c-sky)", icone: "globo" },
  ebook: { cor: "var(--ok)", icone: "livro" },
  revisao: { cor: "var(--c-orange)", icone: "escudo" },
  pagina: { cor: "var(--accent-2)", icone: "pagina" },
  plataforma: { cor: "var(--c-sky)", icone: "carrinho" },
  conta: { cor: "var(--c-teal)", icone: "carteira" },
  teste: { cor: "var(--c-amber)", icone: "teste" },
  divulgar: { cor: "var(--c-pink)", icone: "megafone" },
  "base-anuncios": { cor: "var(--c-sky)", icone: "pessoa" },
  criativos: { cor: "var(--c-pink)", icone: "olho" },
  pixel: { cor: "var(--c-teal)", icone: "grafico" },
  numeros: { cor: "var(--ok)", icone: "grafico" },
  perfil: { cor: "var(--c-amber)", icone: "pessoa" },
  roteiros: { cor: "var(--c-orange)", icone: "play" },
  "numeros-org": { cor: "var(--ok)", icone: "grafico" },
};

export function visualEtapa(slug: string) {
  return V[slug] ?? { cor: "var(--accent)", icone: "passos" as NomeIcone };
}
