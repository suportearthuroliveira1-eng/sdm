import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import { canEnterApp } from "@/lib/domain/entitlements";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Usuária da sessão. `getClaims()` confere a assinatura do JWT localmente
 * (chaves ES256 do projeto, JWKS em cache), sem ir ao Supabase a cada pedido.
 */
export const getAuthUser = cache(async (): Promise<{ id: string; email: string | null; trocarSenha: boolean } | null> => {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getClaims();
  const c = data?.claims;
  if (error || !c?.sub) return null;
  const meta = (c.user_metadata ?? {}) as { trocar_senha?: boolean };
  return { id: c.sub, email: typeof c.email === "string" ? c.email : null, trocarSenha: meta.trocar_senha === true };
});

/**
 * Aluna da sessão, com entitlements. Liga auth_user_id no 1º login (por e-mail).
 * Sem sessão → A01. Sem SDM ativo ou desativada → A02.
 */
export const requireStudent = cache(async () => {
  const user = await getAuthUser();
  if (!user?.email) redirect("/app/a01");
  // entrou com a senha provisória (compra pela Hubla / admin): cria a definitiva antes de tudo
  if (user.trocarSenha) redirect("/app/senha?primeiro=1");

  let student = await db().query.students.findFirst({
    where: eq(schema.students.authUserId, user.id),
  });
  if (!student) {
    const [linked] = await db()
      .update(schema.students)
      .set({ authUserId: user.id })
      .where(and(sql`lower(${schema.students.email}) = ${user.email.toLowerCase()}`, isNull(schema.students.authUserId)))
      .returning();
    student = linked;
  }
  if (!student || !student.ativo) redirect("/app/a02");

  const ents = await db().query.entitlements.findMany({ where: eq(schema.entitlements.studentId, student.id) });
  if (!canEnterApp(ents)) redirect("/app/a02");

  await db().update(schema.students).set({ ultimoAcesso: new Date() }).where(eq(schema.students.id, student.id));
  return { student, entitlements: ents };
});
