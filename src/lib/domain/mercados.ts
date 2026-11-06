/** Mercados da etapa "Idioma e país" (produto próprio). */
export const MERCADOS = ["eua", "uk", "latam", "esp", "br"] as const;
export type Mercado = (typeof MERCADOS)[number];

export const INFO_MERCADO: Record<Mercado, { nome: string; idioma: string; moeda: string; porque: string }> = {
  eua: { nome: "Estados Unidos", idioma: "Inglês", moeda: "Dólar (USD)", porque: "O maior público que compra em inglês. Recebe em dólar." },
  uk: { nome: "Reino Unido", idioma: "Inglês", moeda: "Libra (GBP)", porque: "Compra em inglês, público exigente. Bom se você mora na Europa." },
  latam: { nome: "Latinos nos EUA", idioma: "Espanhol", moeda: "Dólar (USD)", porque: "Milhões de latinos compram em espanhol e recebem em dólar." },
  esp: { nome: "Espanha", idioma: "Espanhol", moeda: "Euro (EUR)", porque: "Compra em espanhol e paga em euro. Bom se você mora lá." },
  br: { nome: "Brasil", idioma: "Português", moeda: "Real (BRL)", porque: "Você vende na sua língua, mas recebe em real, não em dólar." },
};
