"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { canEnterApp } from "@/lib/domain/entitlements";
import { rateLimit } from "@/lib/server/rate-limit";
import { errMsg, log } from "@/lib/server/log";
import { findStudentByEmail, ensureAuthUser } from "@/lib/server/students";
import { supabaseServer } from "@/lib/supabase/server";

export type AuthState =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; error?: string; info?: string }
  | { step: "done"; to: string }
  | { step: "sem_acesso" };

const emailSchema = z.string().trim().toLowerCase().email();
const codeSchema = z.string().trim().regex(/^\d{6}$/);

async function ip() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

const minutes = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/** Passo 1: confere cadastro e manda o código de 6 dígitos pelo Supabase Auth. */
export async function requestCode(mode: "aluna" | "admin", _prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success) return { step: "email", error: "Confira o e-mail digitado." };
  const email = parsed.data;

  const [byIp, byEmail] = await Promise.all([rateLimit(`otp:ip:${await ip()}`, 10, 900), rateLimit(`otp:em:${email}`, 4, 900)]);
  if (!byIp.ok || !byEmail.ok) {
    const at = (byIp.ok ? byEmail : byIp).retryAt;
    return { step: "email", error: `Muitas tentativas. Tente de novo às ${minutes(at)}.` };
  }

  if (mode === "aluna") {
    const student = await findStudentByEmail(email);
    if (!student || !student.ativo) return { step: "sem_acesso" };
    const ents = await db().query.entitlements.findMany({ where: eq(schema.entitlements.studentId, student.id) });
    if (!canEnterApp(ents)) return { step: "sem_acesso" };
    if (!student.authUserId) {
      const id = await ensureAuthUser(email);
      if (id) await db().update(schema.students).set({ authUserId: id }).where(eq(schema.students.id, student.id));
    }
  } else {
    let admin = await db().query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) });
    // 1º acesso: o e-mail de ADMIN_EMAIL (variável do servidor) vira admin sozinho.
    // Dispensa rodar `pnpm seed:admin` no deploy.
    if (!admin && email === env().ADMIN_EMAIL?.trim().toLowerCase()) {
      [admin] = await db().insert(schema.adminUsers).values({ email, papel: "admin" }).onConflictDoNothing().returning();
      log("info", "admin inicial criado pelo ADMIN_EMAIL");
    }
    // Resposta igual para não revelar quem é admin.
    if (!admin || !admin.ativo) return { step: "code", email, info: "Se o e-mail tiver acesso, o código chega em instantes." };
    await ensureAuthUser(email);
  }

  try {
    const sb = await supabaseServer();
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) throw error;
  } catch (e) {
    log("error", "signInWithOtp falhou", { mode, err: errMsg(e) });
    return { step: "email", error: "Não conseguimos enviar o código agora. Tente de novo em instantes." };
  }
  return { step: "code", email, info: `Mandamos um código de 6 dígitos para ${email}.` };
}

/** Passo 2: confere o código e cria a sessão. */
export async function verifyCode(mode: "aluna" | "admin", prev: AuthState, form: FormData): Promise<AuthState> {
  const email = prev.step === "code" ? prev.email : "";
  const code = codeSchema.safeParse(String(form.get("code") ?? "").replace(/\D/g, ""));
  if (!email) return { step: "email" };
  if (!code.success) return { step: "code", email, error: "O código tem 6 números." };

  const rl = await rateLimit(`otpv:${email}`, 8, 900);
  if (!rl.ok) return { step: "code", email, error: `Muitas tentativas. Tente de novo às ${minutes(rl.retryAt)}.` };

  const sb = await supabaseServer();
  const { error } = await sb.auth.verifyOtp({ email, token: code.data, type: "email" });
  if (error) return { step: "code", email, error: "Código errado ou vencido. Confira ou peça outro." };
  return { step: "done", to: mode === "admin" ? "/admin" : "/app" };
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
}

/** Ação única do formulário: o campo "intent" decide o passo. */
export async function authStep(mode: "aluna" | "admin", prev: AuthState, form: FormData): Promise<AuthState> {
  const intent = String(form.get("intent") ?? "");
  if (intent === "reset") return { step: "email" };
  if (intent === "verify") return verifyCode(mode, prev, form);
  return requestCode(mode, prev, form);
}
