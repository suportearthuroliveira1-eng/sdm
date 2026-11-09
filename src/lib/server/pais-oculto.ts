import "server-only";
import { sql } from "drizzle-orm";
import { getAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { CONFIG_OCULTO_PADRAO, configOcultoSchema, liberadaNoOculto, VENDA_PADRAO, vendaOcultoSchema, type ConfigOculto } from "@/lib/domain/pais-oculto";
import { getSetting } from "./settings";
import { log } from "./log";

const DESCRICAO = "País Oculto: quem tem acesso, países, convite e venda (Admin → País Oculto).";

/** Config do País Oculto (setting `pais_oculto`), sempre válida. */
export async function configOculto(): Promise<ConfigOculto> {
  const v = await getSetting<unknown>("pais_oculto", null);
  const r = configOcultoSchema.safeParse(v ?? CONFIG_OCULTO_PADRAO);
  if (r.success) return r.data;
  // valor salvo com algum campo estranho: não perde a lista de quem tem acesso
  log("warn", "pais_oculto inválido, usando o que dá", { err: r.error.issues[0]?.message });
  const o = (v ?? {}) as Partial<ConfigOculto>;
  const venda = vendaOcultoSchema.safeParse(o.venda ?? VENDA_PADRAO);
  return {
    ...CONFIG_OCULTO_PADRAO,
    ligado: o.ligado !== false,
    alunas: Array.isArray(o.alunas) ? o.alunas.filter((a): a is string => typeof a === "string") : [],
    desligados: Array.isArray(o.desligados) ? o.desligados.filter((a): a is string => typeof a === "string") : [],
    convite: typeof o.convite === "string" ? o.convite : "",
    venda: venda.success ? venda.data : VENDA_PADRAO,
  };
}

/** Pode entrar no País Oculto: liberada pelo time, ou é do time (admin, suporte, conteúdo). */
export async function podeEntrarNoOculto(studentId: string) {
  const [cfg, admin] = await Promise.all([configOculto(), getAdmin()]);
  return { cfg, pode: liberadaNoOculto(cfg, studentId, Boolean(admin)), doTime: Boolean(admin) };
}

/** Coloca alunas na lista (atômico no banco: duas compras ao mesmo tempo não se apagam). */
export async function adicionarAoOculto(ids: string[]) {
  if (!ids.length) return;
  const inicial = JSON.stringify({ ...CONFIG_OCULTO_PADRAO, alunas: [...new Set(ids)] });
  const novos = JSON.stringify(ids);
  await db().execute(sql`insert into settings (key, value, grupo, descricao, pendente) values ('pais_oculto', ${inicial}::jsonb, 'acesso', ${DESCRICAO}, false)
    on conflict (key) do update set value = jsonb_set(settings.value, '{alunas}', (
      select coalesce(jsonb_agg(distinct x), '[]'::jsonb) from jsonb_array_elements_text(coalesce(settings.value->'alunas', '[]'::jsonb) || ${novos}::jsonb) as t(x)
    ), true)`);
}

/** Tira uma aluna da lista (reembolso, chargeback ou o time). */
export async function tirarDoOculto(id: string) {
  await db().execute(sql`update settings set value = jsonb_set(value, '{alunas}', (
      select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements_text(coalesce(value->'alunas', '[]'::jsonb)) as t(x) where x <> ${id}
    ), true) where key = 'pais_oculto'`);
}
