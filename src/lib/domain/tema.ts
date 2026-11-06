import { z } from "zod";

/** Aparência do app (Admin → Aparência). Vazio = visual do protótipo (regra 8). */
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor no formato #RRGGBB");
export const temaSchema = z.object({
  preset: z.string().max(30).optional(),
  accent: hex,
  accent2: hex,
  bg: hex,
  surface: hex,
  teal: hex,
  amber: hex,
  pink: hex,
  sky: hex,
  orange: hex,
  raio: z.number().int().min(6).max(28),
  animacoes: z.boolean(),
});
export type Tema = z.infer<typeof temaSchema>;

export const TEMA_PADRAO: Tema = { preset: "lilas", accent: "#a98bff", accent2: "#c9b6ff", bg: "#0e0c13", surface: "#17141f", teal: "#5ee0cf", amber: "#ffc861", pink: "#ff8fc4", sky: "#7cc4ff", orange: "#ffa36b", raio: 14, animacoes: true };

export const PRESETS: { k: string; nome: string; t: Omit<Tema, "raio" | "animacoes" | "preset"> }[] = [
  { k: "lilas", nome: "Lilás (padrão)", t: { accent: "#a98bff", accent2: "#c9b6ff", bg: "#0e0c13", surface: "#17141f", teal: "#5ee0cf", amber: "#ffc861", pink: "#ff8fc4", sky: "#7cc4ff", orange: "#ffa36b" } },
  { k: "esmeralda", nome: "Esmeralda", t: { accent: "#3fd6a6", accent2: "#8cf0cf", bg: "#0a110f", surface: "#121c19", teal: "#7cc4ff", amber: "#ffc861", pink: "#ff8fc4", sky: "#a98bff", orange: "#ffa36b" } },
  { k: "coral", nome: "Coral", t: { accent: "#ff8a73", accent2: "#ffbcae", bg: "#120d0d", surface: "#1d1515", teal: "#5ee0cf", amber: "#ffc861", pink: "#c9a2ff", sky: "#7cc4ff", orange: "#ffd27a" } },
  { k: "oceano", nome: "Oceano", t: { accent: "#6aa8ff", accent2: "#acccff", bg: "#0a0e15", surface: "#121926", teal: "#5ee0cf", amber: "#ffc861", pink: "#ff8fc4", sky: "#a98bff", orange: "#ffa36b" } },
  { k: "ouro", nome: "Ouro", t: { accent: "#f2c14e", accent2: "#f8dd94", bg: "#0f0d09", surface: "#1a1711", teal: "#5ee0cf", amber: "#ff9f6b", pink: "#ff8fc4", sky: "#7cc4ff", orange: "#c9a2ff" } },
];

/** Contraste WCAG entre duas cores #RRGGBB (1 a 21). */
export function contraste(a: string, b: string) {
  const lum = (h: string) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

/** Variáveis CSS do tema (o resto das cores deriva destas). */
export function cssDoTema(t: Tema) {
  return `:root{--accent:${t.accent};--accent-2:${t.accent2};--bg:${t.bg};--side:color-mix(in srgb,${t.bg} 92%,#000);--surface:${t.surface};--surface-2:color-mix(in srgb,${t.surface} 88%,#fff 6%);--sel:color-mix(in srgb,${t.accent} 22%,${t.bg});--line:color-mix(in srgb,${t.surface} 78%,#fff 12%);--line-2:color-mix(in srgb,${t.surface} 70%,#fff 18%);--line-3:color-mix(in srgb,${t.surface} 88%,#fff 6%);--c-teal:${t.teal};--c-amber:${t.amber};--c-pink:${t.pink};--c-sky:${t.sky};--c-orange:${t.orange};--raio:${t.raio}px}`;
}
