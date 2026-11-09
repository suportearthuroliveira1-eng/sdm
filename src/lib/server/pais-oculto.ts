import "server-only";
import { CONFIG_OCULTO_PADRAO, configOcultoSchema, liberadaNoOculto, type ConfigOculto } from "@/lib/domain/pais-oculto";
import { getAdmin } from "@/lib/auth/admin";
import { getSetting } from "./settings";
import { log } from "./log";

/** Config do País Oculto (setting `pais_oculto`), sempre válida. */
export async function configOculto(): Promise<ConfigOculto> {
  const v = await getSetting<unknown>("pais_oculto", null);
  const r = configOcultoSchema.safeParse(v ?? CONFIG_OCULTO_PADRAO);
  if (r.success) return r.data;
  // valor salvo com algum campo estranho: não perde a lista de quem tem acesso
  log("warn", "pais_oculto inválido, usando o que dá", { err: r.error.issues[0]?.message });
  const o = (v ?? {}) as Partial<ConfigOculto>;
  return {
    ...CONFIG_OCULTO_PADRAO,
    ligado: o.ligado !== false,
    alunas: Array.isArray(o.alunas) ? o.alunas.filter((a): a is string => typeof a === "string") : [],
    desligados: Array.isArray(o.desligados) ? o.desligados.filter((a): a is string => typeof a === "string") : [],
    convite: typeof o.convite === "string" ? o.convite : "",
  };
}

/** Pode entrar no País Oculto: liberada pelo time, ou é do time (admin, suporte, conteúdo). */
export async function podeEntrarNoOculto(studentId: string) {
  const [cfg, admin] = await Promise.all([configOculto(), getAdmin()]);
  return { cfg, pode: liberadaNoOculto(cfg, studentId, Boolean(admin)) };
}
