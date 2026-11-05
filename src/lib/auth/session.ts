import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import { canEnterApp } from "@/lib/domain/entitlements";
import { supabaseServer } from "@/lib/supabase/server";

export const getAuthUser = cache(async () => {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

/**
 * Aluna da sessão, com entitlements. Liga auth_user_id no 1º login (por e-mail).
 * Sem sessão → A01. Sem SDM ativo ou desativada → A02.
 */
export const requireStudent = cache(async () => {
  const user = await getAuthUser();
  if (!user?.email) redirect("/app/a01");

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
