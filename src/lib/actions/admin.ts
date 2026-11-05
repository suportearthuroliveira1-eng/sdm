"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { parseStudentsCsv, studentInputSchema } from "@/lib/domain/csv";
import { PRODUCTS, type Product } from "@/lib/domain/entitlements";
import { audit } from "@/lib/server/audit";
import { createStudent, ensureAuthUser, issueAccessLink, upsertEntitlements } from "@/lib/server/students";
import { passwordSchema } from "@/lib/domain/password";
import { supabaseAdmin } from "@/lib/supabase/server";
import { errMsg } from "@/lib/server/log";

export type LinkResult = { ok: true; url: string; message: string; expiresAt: string; studentId: string } | { ok: false; error: string };

const acessosFrom = (form: FormData) => PRODUCTS.filter((p) => form.get(`acesso_${p}`) === "on");

/** AD02 · Nova aluna: cria, libera acessos e já gera o link. */
export async function createStudentAction(_p: LinkResult | null, form: FormData): Promise<LinkResult> {
  const admin = await requireAdmin(["suporte"]);
  const parsed = studentInputSchema.safeParse({
    nome: form.get("nome"),
    email: form.get("email"),
    whatsapp: form.get("whatsapp") || undefined,
    pais: form.get("pais") || undefined,
    acessos: acessosFrom(form),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  try {
    const { student, created } = await createStudent(parsed.data);
    const link = await issueAccessLink(student.id, admin.id);
    await audit(admin.id, created ? "aluna.criar" : "aluna.atualizar_acessos", { tipo: "student", id: student.code }, { acessos: parsed.data.acessos });
    revalidatePath("/admin/alunas");
    return { ok: true, url: link.url, message: link.message, expiresAt: link.expiresAt.toISOString(), studentId: student.id };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export type ImportResult = { ok: boolean; criadas: number; atualizadas: number; erros: { line: number; error: string }[] };

/** AD02 · Importar CSV (nome, email, whatsapp, pais, acessos). Não gera link em massa. */
export async function importCsvAction(_p: ImportResult | null, form: FormData): Promise<ImportResult> {
  const admin = await requireAdmin(["suporte"]);
  const file = form.get("arquivo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, criadas: 0, atualizadas: 0, erros: [{ line: 0, error: "Escolha um arquivo .csv" }] };
  if (file.size > 2_000_000) return { ok: false, criadas: 0, atualizadas: 0, erros: [{ line: 0, error: "Arquivo maior que 2 MB" }] };
  const rows = parseStudentsCsv(await file.text());
  let criadas = 0;
  let atualizadas = 0;
  const erros: ImportResult["erros"] = [];
  for (const r of rows) {
    if (!r.ok) {
      erros.push({ line: r.line, error: r.error });
      continue;
    }
    try {
      const { created } = await createStudent(r.data);
      if (created) criadas++;
      else atualizadas++;
    } catch (e) {
      erros.push({ line: r.line, error: errMsg(e) });
    }
  }
  await audit(admin.id, "aluna.importar_csv", undefined, { criadas, atualizadas, erros: erros.length });
  revalidatePath("/admin/alunas");
  return { ok: erros.length === 0, criadas, atualizadas, erros };
}

/** AD03 · Gerar novo link (revoga os anteriores). */
export async function newLinkAction(studentId: string): Promise<LinkResult> {
  const admin = await requireAdmin(["suporte"]);
  const id = z.string().uuid().parse(studentId);
  const link = await issueAccessLink(id, admin.id);
  await audit(admin.id, "aluna.gerar_link", { tipo: "student", id });
  return { ok: true, url: link.url, message: link.message, expiresAt: link.expiresAt.toISOString(), studentId: id };
}

/** AD03 · Liga/desliga um entitlement manual. */
export async function setEntitlementAction(studentId: string, produto: Product, on: boolean) {
  const admin = await requireAdmin(["suporte"]);
  const id = z.string().uuid().parse(studentId);
  z.enum(PRODUCTS).parse(produto);
  await upsertEntitlements(id, [produto], "manual", on ? "active" : "revoked");
  await audit(admin.id, on ? "entitlement.liberar" : "entitlement.revogar", { tipo: "student", id }, { produto });
  revalidatePath(`/admin/alunas/${id}`);
}

/** AD03 · Desativar / reativar aluna. Desativada não entra e perde links pendentes. */
export async function setStudentActiveAction(studentId: string, ativo: boolean) {
  const admin = await requireAdmin(["suporte"]);
  const id = z.string().uuid().parse(studentId);
  await db().update(schema.students).set({ ativo }).where(eq(schema.students.id, id));
  if (!ativo) {
    await db().update(schema.accessLinks).set({ revokedAt: new Date() }).where(eq(schema.accessLinks.studentId, id));
  }
  await audit(admin.id, ativo ? "aluna.reativar" : "aluna.desativar", { tipo: "student", id });
  revalidatePath(`/admin/alunas/${id}`);
}

/** AD08 · Mapa produto externo → entitlement. */
export async function upsertProductMapAction(form: FormData) {
  const admin = await requireAdmin(["admin"]);
  const data = z
    .object({
      provider: z.enum(["hubla", "hotmart"]),
      externalProductId: z.string().trim().min(1),
      produto: z.enum(PRODUCTS),
      descricao: z.string().trim().optional(),
    })
    .parse({
      provider: form.get("provider"),
      externalProductId: form.get("externalProductId"),
      produto: form.get("produto"),
      descricao: form.get("descricao") || undefined,
    });
  await db()
    .insert(schema.hublaProductMap)
    .values(data)
    .onConflictDoUpdate({ target: [schema.hublaProductMap.provider, schema.hublaProductMap.externalProductId], set: { produto: data.produto, descricao: data.descricao, ativo: true } });
  await audit(admin.id, "mapa_produto.salvar", { tipo: "hubla_product_map", id: `${data.provider}:${data.externalProductId}` }, data);
  revalidatePath("/admin/acessos");
}

export async function deleteProductMapAction(id: string) {
  const admin = await requireAdmin(["admin"]);
  await db().delete(schema.hublaProductMap).where(eq(schema.hublaProductMap.id, z.string().uuid().parse(id)));
  await audit(admin.id, "mapa_produto.apagar", { tipo: "hubla_product_map", id });
  revalidatePath("/admin/acessos");
}

/** AD08 · Reprocessar um evento de webhook. */
export async function reprocessEventAction(id: string) {
  const admin = await requireAdmin(["admin"]);
  const { processStoredEvent } = await import("@/lib/integrations/purchases");
  const r = await processStoredEvent(z.string().uuid().parse(id));
  await audit(admin.id, "evento.reprocessar", { tipo: "event", id }, { resultado: r });
  revalidatePath("/admin/acessos");
}

/** AD11 · Salvar uma configuração (valor JSON). */
export async function saveSettingAction(_p: { ok: boolean; error?: string } | null, form: FormData) {
  const admin = await requireAdmin(["admin"]);
  const key = z.string().min(1).parse(form.get("key"));
  let value: unknown;
  try {
    value = JSON.parse(String(form.get("value") ?? ""));
  } catch {
    return { ok: false, error: "Valor precisa ser JSON válido (texto entre aspas, true/false, número, objeto)." };
  }
  const old = await db().query.settings.findFirst({ where: eq(schema.settings.key, key) });
  if (!old) return { ok: false, error: "Configuração não existe." };
  await db().update(schema.settings).set({ value: value as object, pendente: false }).where(and(eq(schema.settings.key, key)));
  await audit(admin.id, "config.salvar", { tipo: "setting", id: key }, { de: old.value, para: value });
  revalidatePath("/admin/config");
  return { ok: true };
}

/** AD03 · Admin define a senha da aluna (ela entra com e-mail e essa senha). */
export async function setStudentPasswordAction(studentId: string, _p: { ok?: boolean; error?: string } | null, form: FormData) {
  const admin = await requireAdmin(["suporte"]);
  const id = z.string().uuid().parse(studentId);
  const senha = passwordSchema.safeParse(form.get("senha"));
  if (!senha.success) return { error: senha.error.issues[0]?.message };
  const student = await db().query.students.findFirst({ where: eq(schema.students.id, id) });
  if (!student) return { error: "Aluna não encontrada." };
  let authId = student.authUserId;
  if (!authId) {
    authId = await ensureAuthUser(student.email);
    if (authId) await db().update(schema.students).set({ authUserId: authId }).where(eq(schema.students.id, id));
  }
  if (!authId) return { error: "Não deu pra criar o login dessa aluna agora." };
  const { error } = await supabaseAdmin().auth.admin.updateUserById(authId, { password: senha.data, email_confirm: true });
  if (error) return { error: "Não deu pra salvar a senha: " + error.message };
  await audit(admin.id, "aluna.definir_senha", { tipo: "student", id: student.code }); // nunca grava a senha
  return { ok: true };
}
