import "server-only";
import { cache } from "react";
import { CONFIG_PADRAO, type ConfigDiagnostico } from "@/lib/domain/diagnostico";
import { configDiagnosticoSchema, fluxoSchema, textosAppSchema, type Fluxo, type TextosApp } from "@/lib/domain/config-schemas";
import { getSetting } from "@/lib/server/settings";

/** Configurações do app editáveis no admin. Valor inválido ou ausente → padrão do código. */
export const configDiagnostico = cache(async (): Promise<ConfigDiagnostico> => {
  const v = await getSetting<unknown>("diagnostico", null);
  const r = configDiagnosticoSchema.safeParse(v);
  return r.success ? (r.data as ConfigDiagnostico) : CONFIG_PADRAO;
});

export const configFluxo = cache(async (): Promise<Fluxo> => {
  const v = await getSetting<unknown>("fluxo", {});
  const r = fluxoSchema.safeParse(v ?? {});
  return r.success ? r.data : fluxoSchema.parse({});
});

export const textosApp = cache(async (): Promise<TextosApp> => {
  const v = await getSetting<unknown>("textos_app", {});
  const r = textosAppSchema.safeParse(v ?? {});
  return r.success ? r.data : textosAppSchema.parse({});
});
