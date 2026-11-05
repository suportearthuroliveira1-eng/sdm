import type { Anuncio, Bi, Bloco, Roteiro } from "./modelo";

export const NOME_TIPO: Record<string, string> = {
  kit_pre: "Kit pré-venda",
  kit_quiz: "Kit quiz",
  anuncio: "Anúncio",
  gancho: "Ganchos",
  roteiro: "Roteiros",
  bio: "Bio e legenda",
  imagem: "Imagem",
};

/** Texto pronto pra copiar (idioma de venda) de qualquer item gerado. */
export function textoDoItem(tipo: string, c: unknown): string {
  switch (tipo) {
    case "kit_pre":
    case "kit_quiz":
      return (c as { blocos: Bloco[] }).blocos.map((b) => `${b.n}\n${b.x}`).join("\n\n");
    case "anuncio": {
      const a = c as Anuncio;
      return a.texto.x;
    }
    case "gancho":
      return (c as { ganchos: Bi[] }).ganchos.map((g, i) => `${i + 1}. ${g.x}`).join("\n");
    case "roteiro":
      return (c as { roteiros: Roteiro[] }).roteiros.map((r, i) => `${i + 1}. [${r.formato}] ${r.gancho.x} — ${r.meio} — ${r.chamada.x}`).join("\n");
    case "bio": {
      const b = c as { bio: Bi; legenda: { x: string; tags: string } };
      return `BIO: ${b.bio.x}\n\nLEGENDA: ${b.legenda.x} ${b.legenda.tags}`;
    }
    default:
      return JSON.stringify(c);
  }
}
