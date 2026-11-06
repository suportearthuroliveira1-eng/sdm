import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type OndeParou = { path: string; titulo: string; tipo: "etapa" | "aula"; em: string };

/** Guarda a última tela "de trabalho" (etapa ou aula) pra oferecer "continuar de onde parei". Nunca quebra a página. */
export async function marcarOndeParou(studentId: string, v: Omit<OndeParou, "em">) {
  await db()
    .update(schema.students)
    .set({ ultimaTela: { ...v, em: new Date().toISOString() } })
    .where(eq(schema.students.id, studentId))
    .catch(() => {});
}

/** Vale mostrar? Até 14 dias e diferente do próximo passo (aí o cartão de próximo passo já leva lá). */
export function ondeParouValido(v: unknown, proximoHref: string): OndeParou | null {
  const agora = Date.now();
  const o = v as OndeParou | null;
  if (!o?.path || !o.em) return null;
  if (agora - Date.parse(o.em) > 14 * 86400_000) return null;
  if (o.path === proximoHref) return null;
  return o;
}
