import { z } from "zod";
import type { Moeda } from "./precos";

/**
 * País Oculto: área secreta, liberada pelo admin só pra algumas alunas.
 * A IA escolhe mercados pouco olhados por quem vende do Brasil e entrega o produto + a estratégia.
 * Regra 6: nada de número inventado. Os "porquês" são qualitativos; preço vem da tabela do app.
 */
export type PaisOculto = {
  k: string;
  nome: string;
  sigla: string;
  idioma: string;
  idiomaCod: "en" | "pt" | "es";
  moeda: string;
  moedaPreco: Moeda;
  porque: string;
  cuidado: string;
  cor: string;
};

export const CATALOGO_OCULTO: PaisOculto[] = [
  { k: "portugal", nome: "Portugal", sigla: "PT", idioma: "Português", idiomaCod: "pt", moeda: "Euro", moedaPreco: "EUR", porque: "Você vende na sua língua e recebe em euro. Pouca gente do Brasil olha pra lá.", cuidado: "O português de Portugal tem palavras diferentes: a IA ajusta o texto.", cor: "var(--ok)" },
  { k: "br_eua", nome: "Brasileiras nos EUA", sigla: "US", idioma: "Português", idiomaCod: "pt", moeda: "Dólar", moedaPreco: "USD", porque: "Comunidade grande que compra em português e paga em dólar.", cuidado: "Fale da vida de quem mora fora: saudade, rotina corrida, adaptação.", cor: "var(--c-sky)" },
  { k: "br_europa", nome: "Brasileiras na Europa", sigla: "EU", idioma: "Português", idiomaCod: "pt", moeda: "Euro", moedaPreco: "EUR", porque: "Irlanda, Portugal, Itália, Espanha: muita brasileira que compra em português e recebe em euro.", cuidado: "Anuncie por interesse e idioma, não por um país só.", cor: "var(--c-teal)" },
  { k: "irlanda", nome: "Irlanda", sigla: "IE", idioma: "Inglês", idiomaCod: "en", moeda: "Euro", moedaPreco: "EUR", porque: "Compra em inglês e paga em euro, com bem menos concorrência que os EUA.", cuidado: "Público menor: o ângulo precisa ser bem específico.", cor: "var(--ok)" },
  { k: "canada", nome: "Canadá", sigla: "CA", idioma: "Inglês", idiomaCod: "en", moeda: "Dólar canadense", moedaPreco: "USD", porque: "Hábitos parecidos com os dos EUA, mas menos disputado por quem vende de fora.", cuidado: "Evite referências só americanas (feriados, marcas).", cor: "var(--c-pink)" },
  { k: "australia", nome: "Austrália", sigla: "AU", idioma: "Inglês", idiomaCod: "en", moeda: "Dólar australiano", moedaPreco: "USD", porque: "Público que compra online em inglês e é pouco olhado por quem vende do Brasil.", cuidado: "Fuso horário bem diferente: programe os anúncios.", cor: "var(--c-amber)" },
  { k: "nz", nome: "Nova Zelândia", sigla: "NZ", idioma: "Inglês", idiomaCod: "en", moeda: "Dólar neozelandês", moedaPreco: "USD", porque: "Mercado pequeno e quieto: quem chega primeiro aparece mais.", cuidado: "Público pequeno: bom pra testar com pouca verba.", cor: "var(--c-sky)" },
  { k: "holanda", nome: "Holanda", sigla: "NL", idioma: "Inglês", idiomaCod: "en", moeda: "Euro", moedaPreco: "EUR", porque: "Muita gente lê e compra em inglês, e paga em euro.", cuidado: "Texto direto e prático: esse público não gosta de exagero.", cor: "var(--c-orange)" },
  { k: "nordicos", nome: "Países nórdicos", sigla: "SE", idioma: "Inglês", idiomaCod: "en", moeda: "Coroa (paga no cartão)", moedaPreco: "EUR", porque: "Suécia, Noruega e Dinamarca leem em inglês e têm moeda forte.", cuidado: "Promessa honesta e simples: exagero afasta.", cor: "var(--accent-2)" },
  { k: "emirados", nome: "Emirados Árabes", sigla: "AE", idioma: "Inglês", idiomaCod: "en", moeda: "Dirham", moedaPreco: "USD", porque: "Muita gente de fora morando lá, comprando em inglês.", cuidado: "Respeite a cultura local: nada de tema sensível.", cor: "var(--c-amber)" },
  { k: "singapura", nome: "Singapura", sigla: "SG", idioma: "Inglês", idiomaCod: "en", moeda: "Dólar de Singapura", moedaPreco: "USD", porque: "Compra online em inglês, quase ninguém do Brasil anuncia lá.", cuidado: "Público prático: mostre o passo a passo.", cor: "var(--c-pink)" },
];

export const configOcultoSchema = z.object({
  ligado: z.boolean(),
  /** ids (uuid) das alunas que podem entrar */
  alunas: z.array(z.string().uuid()).max(5000),
  /** países do catálogo que o time escondeu */
  desligados: z.array(z.string().max(40)).max(40).default([]),
  /** frase do convite no Início */
  convite: z.string().trim().max(200).default(""),
});
export type ConfigOculto = z.infer<typeof configOcultoSchema>;
export const CONFIG_OCULTO_PADRAO: ConfigOculto = { ligado: true, alunas: [], desligados: [], convite: "" };

export function liberadaNoOculto(cfg: ConfigOculto, studentId: string) {
  return cfg.ligado && cfg.alunas.includes(studentId);
}

export function catalogoAtivo(cfg: ConfigOculto) {
  return CATALOGO_OCULTO.filter((p) => !cfg.desligados.includes(p.k));
}

/** O que fica salvo na aluna (students.cartoes.oculto). */
export type DadosOculto = {
  abertoEm?: string;
  mapa?: { paises: { k: string; por_que_voce: string; vantagem: string; primeiro_passo: string }[]; segredo_geral: string };
  estrategias?: Record<string, unknown>;
};
