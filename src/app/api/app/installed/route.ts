import { eq, isNull, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/session";

/** Marca o 1º "instalou" da aluna (funil do AD01). */
export async function POST() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  await db()
    .update(schema.students)
    .set({ instaladoEm: new Date() })
    .where(and(eq(schema.students.authUserId, user.id), isNull(schema.students.instaladoEm)));
  return NextResponse.json({ ok: true });
}
