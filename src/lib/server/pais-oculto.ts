import "server-only";
import { CONFIG_OCULTO_PADRAO, configOcultoSchema, liberadaNoOculto, type ConfigOculto } from "@/lib/domain/pais-oculto";
import { getSetting } from "./settings";

/** Config do País Oculto (setting `pais_oculto`), sempre válida. */
export async function configOculto(): Promise<ConfigOculto> {
  const v = await getSetting<unknown>("pais_oculto", null);
  const r = configOcultoSchema.safeParse(v ?? CONFIG_OCULTO_PADRAO);
  return r.success ? r.data : CONFIG_OCULTO_PADRAO;
}

export async function alunaNoOculto(studentId: string) {
  return liberadaNoOculto(await configOculto(), studentId);
}
