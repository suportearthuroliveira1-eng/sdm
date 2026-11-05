"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { getJornada } from "@/lib/server/aluna";

/** Marca a aula como vista e/ou o "Agora faça" como feito (como = ja_fiz). Só aulas liberadas. */
export async function marcarAula(id: string, oque: "vista" | "feita") {
  const lessonId = z.string().min(1).max(20).parse(id);
  const j = await getJornada();
  const aula = j.modulos.flatMap((m) => m.aulas).find((a) => a.id === lessonId);
  if (!aula || aula.lock.travado) return { ok: false };
  const now = new Date();
  const set = oque === "vista" ? { vistaEm: now, pctAssistido: 100 } : { agoraFacaEm: now, como: "ja_fiz" as const, vistaEm: now };
  await db()
    .insert(schema.lessonProgress)
    .values({ studentId: j.student.id, lessonId, ...set })
    .onConflictDoUpdate({ target: [schema.lessonProgress.studentId, schema.lessonProgress.lessonId], set });
  revalidatePath("/app", "layout");
  return { ok: true };
}
