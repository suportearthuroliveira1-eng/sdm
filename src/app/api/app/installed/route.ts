import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/session";

/**
 * "Já instalei" (A03): marca instalado_em e o "Agora faça" da aula 0.1
 * (instalar o app na tela), que aponta pra A03 no protótipo.
 */
export async function POST() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const student = await db().query.students.findFirst({ where: eq(schema.students.authUserId, user.id) });
  if (!student) return NextResponse.json({ ok: false }, { status: 401 });
  const now = new Date();
  await db()
    .update(schema.students)
    .set({ instaladoEm: now })
    .where(and(eq(schema.students.id, student.id), isNull(schema.students.instaladoEm)));
  const lesson = await db().query.lessons.findFirst({ where: eq(schema.lessons.id, "0.1") });
  if (lesson) {
    await db()
      .insert(schema.lessonProgress)
      .values({ studentId: student.id, lessonId: "0.1", agoraFacaEm: now, como: "tela" })
      .onConflictDoUpdate({ target: [schema.lessonProgress.studentId, schema.lessonProgress.lessonId], set: { agoraFacaEm: now, como: "tela" } });
  }
  return NextResponse.json({ ok: true });
}
