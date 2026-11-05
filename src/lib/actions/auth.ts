"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { passwordSchema, signupSchema } from "@/lib/domain/password";
import { rateLimit } from "@/lib/server/rate-limit";
import { errMsg, log } from "@/lib/server/log";
import { getSetting } from "@/lib/server/settings";
import { createStudent, findStudentByEmail } from "@/lib/server/students";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

export type FormState = { ok?: boolean; error?: string; to?: string };

async function ip() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}
const hora = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), senha: z.string().min(1) });

/** Login com e-mail e senha (aluna ou time). Sem código, sem e-mail. */
export async function login(mode: "aluna" | "admin", _p: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: form.get("email"), senha: form.get("senha") });
  if (!parsed.success) return { error: "Digite e-mail e senha." };
  const { email, senha } = parsed.data;

  const [a, b] = await Promise.all([rateLimit(`login:ip:${await ip()}`, 20, 900), rateLimit(`login:em:${email}`, 8, 900)]);
  if (!a.ok || !b.ok) return { error: `Muitas tentativas. Tente de novo às ${hora((a.ok ? b : a).retryAt)}.` };

  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email, password: senha });
  if (error) {
    log("info", "login recusado", { mode, motivo: error.message });
    return { error: "E-mail ou senha incorretos. Se você nunca criou senha, entre pelo link de acesso ou fale com o time." };
  }
  return { ok: true, to: mode === "admin" ? "/admin" : "/app" };
}

/**
 * Criar conta (e-mail + senha, sem confirmação por e-mail).
 * Com `cadastro_aberto` = true (padrão), já libera o acesso SDM.
 * E-mail que já existe NÃO pode ser cadastrado de novo (evita tomar a conta de outra pessoa).
 */
export async function signup(_p: FormState, form: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    nome: form.get("nome"),
    email: form.get("email"),
    senha: form.get("senha"),
    confirmar: form.get("confirmar"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  const { nome, email, senha } = parsed.data;

  if (!(await getSetting<boolean>("cadastro_aberto", true))) {
    return { error: "O cadastro está fechado no momento. Use o e-mail da compra ou fale com o time." };
  }
  const rl = await rateLimit(`signup:ip:${await ip()}`, 5, 3600);
  if (!rl.ok) return { error: `Muitas contas criadas daqui. Tente de novo às ${hora(rl.retryAt)}.` };

  const existing = await findStudentByEmail(email);
  const created = await supabaseAdmin().auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome } });
  if (created.error || !created.data.user) {
    const ja = /already|registered|exists/i.test(created.error?.message ?? "");
    if (!ja) log("error", "createUser falhou", { err: created.error?.message });
    return {
      error: ja || existing
        ? "Esse e-mail já tem conta. Entre com sua senha, ou use o link de acesso que o time mandou pra criar a senha."
        : "Não conseguimos criar sua conta agora. Tente de novo em instantes.",
    };
  }
  try {
    const { student } = await createStudent({ nome, email, whatsapp: undefined, pais: undefined, acessos: ["sdm"] });
    await db().update(schema.students).set({ authUserId: created.data.user.id }).where(eq(schema.students.id, student.id));
  } catch (e) {
    log("error", "aluna não criada após cadastro", { err: errMsg(e) });
    return { error: "Conta criada, mas houve um erro ao liberar o acesso. Fale com o time." };
  }
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email, password: senha });
  if (error) return { error: "Conta criada. Agora entre com seu e-mail e senha." };
  return { ok: true, to: "/app" };
}

/** Definir ou trocar a senha de quem já está logado (ex.: entrou pelo link de acesso). */
export async function setPassword(_p: FormState, form: FormData): Promise<FormState> {
  const senha = passwordSchema.safeParse(form.get("senha"));
  if (!senha.success) return { error: senha.error.issues[0]?.message };
  if (senha.data !== form.get("confirmar")) return { error: "As duas senhas não são iguais." };
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) return { error: "Sua sessão acabou. Entre de novo." };
  const { error } = await sb.auth.updateUser({ password: senha.data });
  if (error) {
    log("error", "updateUser senha falhou", { err: error.message });
    return { error: /different|same/i.test(error.message) ? "Escolha uma senha diferente da atual." : "Não deu pra salvar a senha agora. Tente de novo." };
  }
  return { ok: true, to: String(form.get("to") ?? "/app").startsWith("/admin") ? "/admin" : "/app" };
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
}
