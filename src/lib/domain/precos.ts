/**
 * Preço de ebook curto: sugestão, faixa e teto por moeda. Regra, não chute da IA
 * (regra 6: nada inventado). Editável no admin (setting `precos_ebook`).
 */
export type Moeda = "USD" | "EUR" | "GBP" | "BRL";
export type FaixaPreco = { sugerido: number; min: number; max: number; teto: number };

export const PRECOS_PADRAO: Record<Moeda, FaixaPreco> = {
  USD: { sugerido: 9, min: 7, max: 17, teto: 27 },
  EUR: { sugerido: 9, min: 7, max: 17, teto: 27 },
  GBP: { sugerido: 8, min: 6, max: 15, teto: 24 },
  BRL: { sugerido: 27, min: 19, max: 47, teto: 67 },
};

export const SIMBOLO: Record<Moeda, string> = { USD: "US$", EUR: "€", GBP: "£", BRL: "R$" };

const MOEDA_PAIS: Record<string, Moeda> = { eua: "USD", latam: "USD", uk: "GBP", esp: "EUR", br: "BRL" };
export const moedaDoPais = (pais: string | null | undefined): Moeda => MOEDA_PAIS[pais ?? ""] ?? "USD";

export const fmtPreco = (v: number, m: Moeda) => `${SIMBOLO[m]} ${Number.isInteger(v) ? v : v.toFixed(2).replace(".", ",")}`;

export function faixa(m: Moeda, tabela: Partial<Record<Moeda, FaixaPreco>> = {}): FaixaPreco {
  return tabela[m] ?? PRECOS_PADRAO[m];
}

/** Erro se o preço for inválido ou alto demais pra ebook curto; null se ok. */
export function checarPreco(v: number, m: Moeda, tabela: Partial<Record<Moeda, FaixaPreco>> = {}): string | null {
  const f = faixa(m, tabela);
  if (!Number.isFinite(v) || v <= 0) return "Coloque um preço.";
  if (v > f.teto) return `Preço alto pra ebook curto. O máximo aqui é ${fmtPreco(f.teto, m)} (sugerido: ${fmtPreco(f.sugerido, m)}).`;
  return null;
}

export const porqueDoPreco = (m: Moeda, f: FaixaPreco) =>
  `Preço de entrada: fácil de comprar no impulso, sem pensar muito. Pra ebook curto, a faixa que costuma funcionar é ${fmtPreco(f.min, m)} a ${fmtPreco(f.max, m)}. Você pode mudar, até ${fmtPreco(f.teto, m)}.`;
