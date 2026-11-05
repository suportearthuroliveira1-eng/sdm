import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { accessUrl, DEFAULT_WHATSAPP_TEMPLATE, signAccessToken, whatsappAccessMessage, ACCESS_LINK_HOURS } from "@/lib/auth/access-link";
import type { StudentInput } from "@/lib/domain/csv";
import type { EntitlementLike, Product } from "@/lib/domain/entitlements";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSetting } from "./settings";
import { log, errMsg } from "./log";

/** Garante um usuário no Supabase Auth (sem senha) para o OTP funcionar com shouldCreateUser=false. */
export async function ensureAuthUser(email: string): Promise<string | null> {
  const sb = supabaseAdmin();
  const created = await sb.auth.admin.createUser({ email, email_confirm: true });
  if (created.data.user) return created.data.user.id;
  // Já existe: gerar link devolve o usuário sem enviar e-mail.
  const link = await sb.auth.admin.generateLink({ type: "magiclink", email });
  if (link.data.user) return link.data.user.id;
  log("warn", "ensureAuthUser falhou", { err: created.error?.message ?? link.error?.message });
  return null;
}

export async function findStudentByEmail(email: string) {
  return db().query.students.findFirst({ where: sql`lower(${schema.students.email}) = ${email.toLowerCase()}` });
}

export async function upsertEntitlements(
  studentId: string,
  products: Product[],
  origem: "manual" | "hubla" | "hotmart",
  status: EntitlementLike["status"] = "active",
  externalRef?: string,
) {
  for (const produto of products) {
    await db()
      .insert(schema.entitlements)
      .values({ studentId, produto, origem, status, externalRef })
      .onConflictDoUpdate({
        target: [schema.entitlements.studentId, schema.entitlements.produto],
        set: { status, origem, externalRef, updatedAt: new Date(), ...(status === "active" ? { fimEm: null } : { fimEm: new Date() }) },
      });
  }
}

/** Cria (ou reaproveita pelo e-mail) a aluna, o usuário de auth e os acessos. */
export async function createStudent(input: StudentInput) {
  const existing = await findStudentByEmail(input.email);
  let student = existing;
  if (!student) {
    [student] = await db()
      .insert(schema.students)
      .values({ email: input.email, nome: input.nome, whatsapp: input.whatsapp, paisMora: input.pais })
      .returning();
  }
  if (!student) throw new Error("falha ao criar aluna");
  if (!student.authUserId) {
    try {
      const authId = await ensureAuthUser(input.email);
      if (authId) {
        await db().update(schema.students).set({ authUserId: authId }).where(eq(schema.students.id, student.id));
        student = { ...student, authUserId: authId };
      }
    } catch (e) {
      log("error", "auth user não criado (o login vincula depois)", { student: student.code, err: errMsg(e) });
    }
  }
  await upsertEntitlements(student.id, input.acessos, "manual");
  return { student, created: !existing };
}

/** Gera link novo e revoga os anteriores ainda não usados. */
export async function issueAccessLink(studentId: string, createdBy?: string | null) {
  const student = await db().query.students.findFirst({ where: eq(schema.students.id, studentId) });
  if (!student) throw new Error("aluna não encontrada");
  await db()
    .update(schema.accessLinks)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.accessLinks.studentId, studentId), isNull(schema.accessLinks.usedAt), isNull(schema.accessLinks.revokedAt)));
  const jti = randomUUID();
  const hours = await getSetting<number>("access_link_hours", ACCESS_LINK_HOURS);
  const { token, expiresAt } = await signAccessToken({ studentId, jti, hours }, env().ACCESS_LINK_SECRET);
  await db().insert(schema.accessLinks).values({ jti, studentId, expiresAt, createdBy: createdBy ?? null });
  const url = accessUrl(env().APP_URL, token);
  const template = await getSetting<string>("msg_acesso_whatsapp", DEFAULT_WHATSAPP_TEMPLATE);
  const message = whatsappAccessMessage(template, { nome: student.nome, link: url, horas: hours });
  return { url, message, expiresAt };
}

/** Marca o jti como usado de forma atômica. Devolve a aluna se o link vale. */
export async function consumeAccessLink(jti: string, studentId: string) {
  const [row] = await db()
    .update(schema.accessLinks)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(schema.accessLinks.jti, jti),
        eq(schema.accessLinks.studentId, studentId),
        isNull(schema.accessLinks.usedAt),
        isNull(schema.accessLinks.revokedAt),
        sql`${schema.accessLinks.expiresAt} > now()`,
      ),
    )
    .returning();
  if (!row) return null;
  return db().query.students.findFirst({ where: eq(schema.students.id, studentId) });
}
