import { z } from "zod";

/** Marca do app (Admin → Marca): foto da Amanda, ícone do app e nome que aparece. */
const url = z.string().max(300).refine((u) => u.startsWith("/api/publico/") || u.startsWith("https://"), "URL de imagem inválida");
export const marcaSchema = z.object({
  fotoAmanda: url.optional(),
  icone: url.optional(),
  nomeAmanda: z.string().trim().min(2).max(60).optional(),
  recado: z.string().trim().max(240).optional(),
});
export type Marca = z.infer<typeof marcaSchema>;
export const NOME_AMANDA_PADRAO = "Amanda Gomes";
