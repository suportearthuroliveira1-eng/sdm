import "server-only";
import { cache } from "react";
import { CONFIG_PADRAO, type ConfigDiagnostico } from "@/lib/domain/diagnostico";
import { configDiagnosticoSchema, fluxoSchema, textosAppSchema, type Fluxo, type TextosApp } from "@/lib/domain/config-schemas";
import { getSetting } from "@/lib/server/settings";
import { temaSchema, type Tema } from "@/lib/domain/tema";
import { precosSchema } from "@/lib/domain/config-schemas";
import type { FaixaPreco, Moeda } from "@/lib/domain/precos";

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

/** Aparência salva no admin (null = visual padrão do protótipo). Nunca derruba a página. */
export const temaApp = cache(async (): Promise<Tema | null> => {
  try {
    const v = await getSetting<unknown>("tema", null);
    const r = temaSchema.safeParse(v);
    return r.success ? r.data : null;
  } catch {
    return null;
  }
});

/** Tabela de preço do ebook (setting `precos_ebook`), por cima do padrão do código. */
export const tabelaPrecos = cache(async (): Promise<Partial<Record<Moeda, FaixaPreco>>> => {
  const v = await getSetting<unknown>("precos_ebook", null);
  const r = precosSchema.safeParse(v);
  return r.success ? (r.data as Partial<Record<Moeda, FaixaPreco>>) : {};
});
