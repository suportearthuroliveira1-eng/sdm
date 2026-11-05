/** 6 temas visuais do ebook (capa e PDF): cores e fontes. */
export const TEMAS = {
  lilas: { nome: "Lilás", fundo: "#F6F2FF", capa: "#2A2240", destaque: "#7C5CE0", texto: "#1E1A2B", fonte: "Helvetica" },
  terra: { nome: "Terra", fundo: "#FBF6EF", capa: "#5C3B2F", destaque: "#B5652F", texto: "#2B1E17", fonte: "Times-Roman" },
  oceano: { nome: "Oceano", fundo: "#F1F7FA", capa: "#1F3B4D", destaque: "#2F7EA6", texto: "#14232D", fonte: "Helvetica" },
  folha: { nome: "Folha", fundo: "#F2F8F3", capa: "#244A35", destaque: "#3E8E5E", texto: "#17261C", fonte: "Helvetica" },
  rosa: { nome: "Rosa", fundo: "#FFF3F5", capa: "#5C2F45", destaque: "#C2547E", texto: "#2B1720", fonte: "Times-Roman" },
  grafite: { nome: "Grafite", fundo: "#F5F5F4", capa: "#1C1C1E", destaque: "#C9A227", texto: "#1C1C1E", fonte: "Courier" },
} as const;
export type TemaKey = keyof typeof TEMAS;

export const TONS = ["amiga", "profissional", "inspirador", "didático", "persuasivo"] as const;

type Bi = { x: string; pt: string };
type Texto = { titulo: string; paragrafos: string[]; lista: string[]; destaque: string | null; exercicio: string | null };
export type CapEbook = { titulo: Bi; objetivo: string; texto?: (Texto & { pt: Texto }) | null };
