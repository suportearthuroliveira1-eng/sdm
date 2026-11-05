"use server";

import { z } from "zod";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { rateLimit } from "@/lib/server/rate-limit";

/** Q03 · chamado pro time quando a IA não resolve. */
export async function abrirChamado(_p: { ok?: boolean; erro?: string } | null, form: FormData) {
  const { student } = await requireStudent();
  const t = z.string().trim().min(5).max(2000).safeParse(form.get("texto"));
  if (!t.success) return { erro: "Conte o que aconteceu em pelo menos uma frase." };
  const rl = await rateLimit(`chamado:${student.id}`, 5, 3600);
  if (!rl.ok) return { erro: "Você já abriu vários chamados agora. Aguarde a resposta do time." };
  await db().insert(schema.supportTickets).values({ studentId: student.id, emailContato: student.email, texto: t.data });
  return { ok: true };
}
