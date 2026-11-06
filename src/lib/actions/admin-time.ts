"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { audit } from "@/lib/server/audit";
import { errMsg } from "@/lib/server/log";
import { definirSenhaProvisoria } from "@/lib/server/senha-provisoria";
import { supabaseAdmin } from "@/lib/supabase/server";

export type TimeState = { ok?: boolean; erro?: string; msg?: string; senha?: string; email?: string } | null;

const membro = z.object({
  nome: z.string().trim().min(2, "Nome curto demais").max(80),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  papel: z.enum(["admin", "suporte", "conteudo"]),
});

/** Admin → Time: cria alguém do time (login + papel). Login novo ganha senha provisória; quem já tinha login mantém a senha. */
export async function criarMembro(_p: TimeState, form: FormData): Promise<TimeState> {
  const admin = await requireAdmin(["admin"]);
  const r = membro.safeParse({ nome: form.get("nome"), email: form.get("email"), papel: form.get("papel") });
  if (!r.success) return { erro: r.error.issues[0]?.message };
  const { nome, email, papel } = r.data;
  try {
    const sb = supabaseAdmin();
    const criado = await sb.auth.admin.createUser({ email, email_confirm: true });
    let authUserId = criado.data.user?.id ?? null;
    let senha: string | undefined;
    if (authUserId) senha = await definirSenhaProvisoria(authUserId);
    else {
      const link = await sb.auth.admin.generateLink({ type: "magiclink", email });
      authUserId = link.data.user?.id ?? null;
    }
    await db()
      .insert(schema.adminUsers)
      .values({ email, nome, papel, authUserId })
      .onConflictDoUpdate({ target: schema.adminUsers.email, set: { nome, papel, ativo: true, ...(authUserId ? { authUserId } : {}) } });
    await audit(admin.id, "time.criar", { tipo: "admin", id: email }, { papel, loginNovo: Boolean(senha) });
    revalidatePath("/admin/time");
    return { ok: true, email, senha, msg: senha ? "Pronto. Mande o e-mail e a senha provisória pra pessoa: ela entra em /admin/entrar." : "Pronto. Essa pessoa já tinha login: entra em /admin/entrar com a senha que já usa." };
  } catch (e) {
    return { erro: errMsg(e) };
  }
}

export async function mudarMembro(id: string, mudanca: { papel?: "admin" | "suporte" | "conteudo"; ativo?: boolean }): Promise<{ ok?: boolean; erro?: string }> {
  const admin = await requireAdmin(["admin"]);
  const uid = z.string().uuid().parse(id);
  if (uid === admin.id && (mudanca.ativo === false || (mudanca.papel && mudanca.papel !== "admin"))) return { erro: "Você não pode tirar o seu próprio acesso de admin." };
  const m = z.object({ papel: z.enum(["admin", "suporte", "conteudo"]).optional(), ativo: z.boolean().optional() }).parse(mudanca);
  // sempre sobra pelo menos um admin ativo
  if (m.ativo === false || (m.papel && m.papel !== "admin")) {
    const outros = await db().select({ n: sql<number>`count(*)::int` }).from(schema.adminUsers).where(and(eq(schema.adminUsers.papel, "admin"), eq(schema.adminUsers.ativo, true), ne(schema.adminUsers.id, uid)));
    if (!outros[0]?.n) return { erro: "Precisa sobrar pelo menos um admin ativo." };
  }
  await db().update(schema.adminUsers).set(m).where(eq(schema.adminUsers.id, uid));
  await audit(admin.id, "time.mudar", { tipo: "admin", id: uid }, m);
  revalidatePath("/admin/time");
  return { ok: true };
}
