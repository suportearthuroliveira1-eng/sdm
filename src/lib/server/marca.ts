import "server-only";
import { cache } from "react";
import { marcaSchema, type Marca } from "@/lib/domain/marca";
import { getSetting } from "./settings";

/** Marca do app (setting `marca`). Inválida ou sem banco: vazia (o app usa o padrão). */
export const marcaApp = cache(async (): Promise<Marca> => {
  try {
    const r = marcaSchema.safeParse(await getSetting<unknown>("marca", {}));
    return r.success ? r.data : {};
  } catch {
    return {};
  }
});
