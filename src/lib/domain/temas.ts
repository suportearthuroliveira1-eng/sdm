/** 6 temas visuais do ebook (capa e PDF): cores e fontes. */
export const TEMAS = {
  lilas: { nome: "Lilás", fundo: "#F6F2FF", capa: "#2A2240", destaque: "#7C5CE0", texto: "#1E1A2B", fonte: "Helvetica", corpo: "Jakarta", titulos: "Playfair" },
  terra: { nome: "Terra", fundo: "#FBF6EF", capa: "#5C3B2F", destaque: "#B5652F", texto: "#2B1E17", fonte: "Times-Roman", corpo: "Lora", titulos: "Playfair" },
  oceano: { nome: "Oceano", fundo: "#F1F7FA", capa: "#1F3B4D", destaque: "#2F7EA6", texto: "#14232D", fonte: "Helvetica", corpo: "Jakarta", titulos: "Jakarta" },
  folha: { nome: "Folha", fundo: "#F2F8F3", capa: "#244A35", destaque: "#3E8E5E", texto: "#17261C", fonte: "Helvetica", corpo: "Lora", titulos: "Playfair" },
  rosa: { nome: "Rosa", fundo: "#FFF3F5", capa: "#5C2F45", destaque: "#C2547E", texto: "#2B1720", fonte: "Times-Roman", corpo: "Lora", titulos: "Playfair" },
  grafite: { nome: "Grafite", fundo: "#F5F5F4", capa: "#1C1C1E", destaque: "#C9A227", texto: "#1C1C1E", fonte: "Courier", corpo: "Jakarta", titulos: "Jakarta" },
} as const;
export type TemaKey = keyof typeof TEMAS;

export const TONS = ["amiga", "profissional", "inspirador", "didático", "persuasivo"] as const;

type Bi = { x: string; pt: string };
type Texto = {
  titulo: string;
  paragrafos: string[];
  lista: string[];
  destaque: string | null;
  exercicio: string | null;
  // estrutura nova (capítulos antigos não têm):
  abertura?: string;
  secoes?: { titulo: string; paragrafos: string[] }[];
  na_pratica?: string | null;
  erros_comuns?: string[];
  resumo?: string[];
};
type TextoExtras = { introducao: { titulo: string; paragrafos: string[] }; como_usar: string[]; conclusao: { titulo: string; paragrafos: string[] }; proximos_passos: string[]; aviso: string };
export type ExtrasEbook = TextoExtras & { pt: TextoExtras };

/** Tamanho do ebook (páginas de conteúdo, aproximado) → palavras por capítulo. */
export const TAMANHOS = [
  { v: 5, nome: "Curto", paginas: "uns 8 páginas" },
  { v: 10, nome: "Médio", paginas: "uns 15 páginas" },
  { v: 20, nome: "Grande", paginas: "uns 25 páginas" },
  { v: 30, nome: "Completo", paginas: "uns 35 páginas" },
] as const;
export function palavrasPorCapitulo(tamanho: number, capitulos: number) {
  return Math.max(450, Math.min(1500, Math.round((tamanho * 330) / Math.max(1, capitulos))));
}
export type CapEbook = { titulo: Bi; objetivo: string; texto?: (Texto & { pt: Texto }) | null };

/** Tira numeração que a IA às vezes põe no título ("1. ", "Capítulo 2: ", "Chapter 3 -"). O PDF já numera. */
export function limparTitulo(t: string) {
  const sem = t.replace(/^\s*(cap[ií]tulo|chapter)\s*\d+\s*[.:)\-–—]?\s*/i, "").replace(/^\s*\d+\s*[.:)\-–—]\s+/, "");
  return sem.trim() || t.trim();
}
