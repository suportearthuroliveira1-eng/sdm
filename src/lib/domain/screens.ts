/** Telas da aluna que já existem como rota (o resto entra nas próximas fases). */
export const BUILT_SCREENS = new Set(["A02", "A03", "V01", "V02", "L01", "L04", "Q01", "U01"]);

/** Telas que vivem dentro da pasta do produto (precisam do id da pasta). */
const DA_PASTA: Record<string, string> = {
  V05: "v05", V06: "v06", V07: "v07", V08: "v08", V09: "v09",
  EN0: "v07", EN1: "v08", F01: "f02", F02: "f02", F03: "f04", F04: "f04",
  DV01: "dv01", PG01: "dv01", PG02: "dv01", OG02: "dv01", OG05: "dv01", OG07: "dv01",
};

export const screenHref = (id: string) => (id === "I01" ? "/app" : `/app/${id.toLowerCase()}`);

export function agoraFacaLink(alvo: string | null, pastaId?: string | null): { href: string } | null {
  if (!alvo || alvo === "fora" || alvo === "pergunta") return null;
  if (DA_PASTA[alvo]) return { href: pastaId ? `/app/${DA_PASTA[alvo]}/${pastaId}` : "/app/v02" };
  return BUILT_SCREENS.has(alvo) ? { href: screenHref(alvo) } : null;
}
