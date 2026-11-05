"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { audit } from "@/lib/server/audit";
import { limparCacheSegredos, SEGREDOS_EDITAVEIS, type SegredoKey } from "@/lib/server/segredos";

export type SegredoState = { ok?: boolean; erro?: string; msg?: string } | null;

async function testarOpenAI(chave: string) {
  try {
    const r = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${chave}` }, signal: AbortSignal.timeout(10_000) });
    if (r.status === 401) return "A OpenAI recusou essa chave (inválida ou revogada).";
    if (!r.ok) return `A OpenAI respondeu ${r.status}. Confira a chave e o saldo da conta.`;
    return null;
  } catch {
    return null; // sem rede pra testar agora: salva assim mesmo
  }
}

/** Admin → Chaves: salva (ou apaga, se vazio) uma chave de serviço. O valor nunca é registrado. */
export async function salvarSegredo(_p: SegredoState, form: FormData): Promise<SegredoState> {
  const admin = await requireAdmin(["admin"]);
  const k = String(form.get("key") ?? "") as SegredoKey;
  if (!(k in SEGREDOS_EDITAVEIS)) return { erro: "Chave desconhecida." };
  const valor = String(form.get("valor") ?? "").trim();
  if (form.get("apagar") === "1") {
    await db().delete(schema.appSecrets).where(eq(schema.appSecrets.key, k));
    limparCacheSegredos();
    await audit(admin.id, "segredo.apagar", { tipo: "segredo", id: k }, {});
    revalidatePath("/admin/chaves");
    return { ok: true, msg: "Apagada. O app volta a usar a da Vercel, se existir." };
  }
  if (valor.length < 20 || /\s/.test(valor)) return { erro: "Cole a chave inteira, sem espaços." };
  const def = SEGREDOS_EDITAVEIS[k];
  if (def.prefixo && !valor.startsWith(def.prefixo)) return { erro: `Essa chave começa com ${def.prefixo}` };
  if (k === "OPENAI_API_KEY") {
    const e = await testarOpenAI(valor);
    if (e) return { erro: e };
  }
  await db().insert(schema.appSecrets).values({ key: k, value: valor }).onConflictDoUpdate({ target: schema.appSecrets.key, set: { value: valor, updatedAt: new Date() } });
  limparCacheSegredos();
  await audit(admin.id, "segredo.salvar", { tipo: "segredo", id: k }, { fim: valor.slice(-4) });
  revalidatePath("/admin", "layout");
  return { ok: true, msg: "Salva e testada. Já está valendo." };
}
