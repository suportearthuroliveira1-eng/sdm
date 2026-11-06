import "server-only";
import type { InferSelectModel } from "drizzle-orm";
import type { schema } from "@/lib/db";

type Pasta = InferSelectModel<typeof schema.studentProducts>;
export type BioPagina = { nome?: string; frase?: string; botao?: string; links?: { texto: string; url: string }[] };

/** Destino do botão principal da página de links (produto da pasta), ou null. */
export function destinoDaBio(p: Pasta): string | null {
  const d = (p.dados ?? {}) as { afiliacao?: { link?: string }; checkout?: { url?: string; ok?: boolean }; paginaUrl?: string; bioPagina?: BioPagina };
  const destino = p.tipo === "sdm" ? d.afiliacao?.link : p.tipo === "proprio" ? (d.paginaUrl ?? (d.checkout?.ok ? d.checkout.url : undefined)) : p.linkAfiliada;
  return destino && /^https?:\/\//.test(destino) ? destino : null;
}
