"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AGENTES, type AgenteKey } from "@/lib/ai/agentes";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { configDiagnosticoSchema, fluxoSchema, textosAppSchema } from "@/lib/domain/config-schemas";
import { audit } from "@/lib/server/audit";

export type ConfigState = { ok?: boolean; erro?: string; msg?: string } | null;

const iaSchema = z.object({
  regrasBase: z.string().max(20000).optional(),
  professora: z.string().max(6000).optional(),
  desligados: z.array(z.string().max(40)).max(40).optional(),
  agentes: z.record(z.string(), z.object({ classe: z.enum(["text_cheap", "text_mid"]).optional(), maxTokens: z.number().int().min(200).max(16000).optional() })).optional(),
});
const modelosSchema = z.object({ text_cheap: z.string().max(80), text_mid: z.string().max(80), image: z.string().max(80), embedding: z.string().max(80).optional() });

/** Cada configuração do "Personalizar" com o seu schema, grupo e descrição. */
const CONFIGS = {
  diagnostico: { schema: configDiagnosticoSchema, grupo: "personalizar", descricao: "Perguntas do diagnóstico e regras de decisão do caminho (Admin → Diagnóstico)." },
  fluxo: { schema: fluxoSchema, grupo: "personalizar", descricao: "Regras do primeiro acesso (Admin → Fluxo e textos)." },
  textos_app: { schema: textosAppSchema, grupo: "personalizar", descricao: "Textos editáveis do app (Admin → Fluxo e textos)." },
  ia: { schema: iaSchema, grupo: "ia", descricao: "Regras base, Professora, agentes ligados, modelo e limite por agente (Admin → IA)." },
  ai_models: { schema: modelosSchema, grupo: "ia", descricao: "Modelos da OpenAI por classe." },
  quota_ia_dia: { schema: z.number().int().min(1).max(5000), grupo: "ia", descricao: "Usos de IA por aluna por dia." },
  quota_professora_dia: { schema: z.number().int().min(1).max(1000), grupo: "ia", descricao: "Perguntas à Professora por aluna por dia." },
  cadastro_aberto: { schema: z.boolean(), grupo: "acesso", descricao: "Qualquer pessoa pode criar conta." },
} as const;
export type ConfigKey = keyof typeof CONFIGS;

/** Salva uma configuração (JSON validado). Usado pelas telas de Personalizar. */
export async function salvarConfig(key: ConfigKey, valor: unknown): Promise<ConfigState> {
  const admin = await requireAdmin(["admin"]);
  const def = CONFIGS[key];
  if (!def) return { erro: "Configuração desconhecida." };
  const r = def.schema.safeParse(valor);
  if (!r.success) {
    const i = r.error.issues[0];
    return { erro: `${i?.path.join(" › ") || "valor"}: ${i?.message ?? "inválido"}` };
  }
  const old = await db().query.settings.findFirst({ where: eq(schema.settings.key, key) });
  await db()
    .insert(schema.settings)
    .values({ key, value: r.data as object, grupo: def.grupo, descricao: def.descricao, pendente: false })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: r.data as object, pendente: false } });
  await audit(admin.id, "config.salvar", { tipo: "setting", id: key }, { de: old?.value ?? null, para: r.data as object });
  revalidatePath("/admin", "layout");
  revalidatePath("/app", "layout");
  return { ok: true, msg: "Salvo. Já vale pras alunas." };
}

/** Volta uma configuração pro padrão do código (apaga o valor salvo). */
export async function restaurarConfig(key: ConfigKey): Promise<ConfigState> {
  const admin = await requireAdmin(["admin"]);
  if (!(key in CONFIGS)) return { erro: "Configuração desconhecida." };
  const old = await db().query.settings.findFirst({ where: eq(schema.settings.key, key) });
  await db().delete(schema.settings).where(eq(schema.settings.key, key));
  await audit(admin.id, "config.restaurar", { tipo: "setting", id: key }, { de: old?.value ?? null });
  revalidatePath("/admin", "layout");
  revalidatePath("/app", "layout");
  return { ok: true, msg: "Voltou pro padrão." };
}

/** Admin → IA: salva o prompt (tarefa) de um agente como versão nova e ativa. Vazio = volta pro padrão do código. */
export async function salvarPromptAgente(key: string, texto: string): Promise<ConfigState> {
  const admin = await requireAdmin(["admin", "conteudo"]);
  if (!(key in AGENTES)) return { erro: "Agente desconhecido." };
  const a = AGENTES[key as AgenteKey];
  const t = texto.trim();
  if (t.length > 20000) return { erro: "Texto grande demais (máx. 20 mil caracteres)." };
  await db().update(schema.agents).set({ ativo: false }).where(eq(schema.agents.id, a.id));
  if (!t || t === a.tarefa.trim()) {
    await audit(admin.id, "agente.padrao", { tipo: "agente", id: a.id });
    revalidatePath("/admin/ia");
    return { ok: true, msg: "Usando o texto padrão do app." };
  }
  const ult = await db().query.agents.findFirst({ where: eq(schema.agents.id, a.id), orderBy: desc(schema.agents.versao) });
  const versao = (ult?.versao ?? 0) + 1;
  await db().insert(schema.agents).values({ id: a.id, versao, nome: a.nome, modelo: a.classe, promptSistema: t, maxTokens: a.maxTokens, ativo: true, createdBy: admin.id });
  await audit(admin.id, "agente.prompt", { tipo: "agente", id: a.id }, { versao });
  revalidatePath("/admin/ia");
  return { ok: true, msg: `Versão ${versao} salva e ativa.` };
}

/** Admin → IA: volta pra uma versão antiga do prompt. */
export async function ativarVersaoAgente(key: string, versao: number): Promise<ConfigState> {
  const admin = await requireAdmin(["admin", "conteudo"]);
  if (!(key in AGENTES)) return { erro: "Agente desconhecido." };
  const a = AGENTES[key as AgenteKey];
  const v = await db().query.agents.findFirst({ where: and(eq(schema.agents.id, a.id), eq(schema.agents.versao, versao)) });
  if (!v || v.promptSistema.startsWith("[PENDENTE]")) return { erro: "Versão não encontrada." };
  await db().update(schema.agents).set({ ativo: false }).where(eq(schema.agents.id, a.id));
  await db().update(schema.agents).set({ ativo: true }).where(and(eq(schema.agents.id, a.id), eq(schema.agents.versao, versao)));
  await audit(admin.id, "agente.versao", { tipo: "agente", id: a.id }, { versao });
  revalidatePath("/admin/ia");
  return { ok: true, msg: `Versão ${versao} ativa.` };
}
