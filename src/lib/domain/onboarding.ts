import type { Fluxo } from "./config-schemas";

type Aluna = { boasVindasEm: Date | null; combinadoEm: Date | null; diagnosticoEm: Date | null; caminho: string | null };

/** Próxima tela do primeiro acesso que falta, ou null se terminou. */
export function passoPendente(s: Aluna, f: Pick<Fluxo, "pularBoasVindas" | "pularCombinado" | "permitirDecidirDepois">): string | null {
  if (!s.boasVindasEm && !f.pularBoasVindas) return "/app/a04";
  if (!s.combinadoEm && !f.pularCombinado) return "/app/a07";
  if (!s.diagnosticoEm) return "/app/a05";
  if (!s.caminho || (s.caminho === "depois" && !f.permitirDecidirDepois)) return "/app/caminho";
  return null;
}

/** Depois da tela `de`, pra onde vai (respeitando as telas puladas). */
export function depoisDe(de: "a04" | "a07", f: Pick<Fluxo, "pularCombinado">): string {
  if (de === "a04" && !f.pularCombinado) return "/app/a07";
  return "/app/a05";
}
