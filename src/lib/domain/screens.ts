/** Telas da aluna que já existem como rota (o resto entra nas próximas fases). */
export const BUILT_SCREENS = new Set(["A02", "A03", "V01", "V02", "L01", "L04", "Q01", "U01"]);
export const screenHref = (id: string) => (id === "I01" ? "/app" : `/app/${id.toLowerCase()}`);
export function agoraFacaLink(alvo: string | null): { href: string } | null {
  if (!alvo || alvo === "fora" || alvo === "pergunta") return null;
  return BUILT_SCREENS.has(alvo) ? { href: screenHref(alvo) } : null;
}
