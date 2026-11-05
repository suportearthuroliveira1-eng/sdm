import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { PERGUNTAS, primeiraPendente, type Respostas } from "@/lib/domain/diagnostico";
import { Diagnostico } from "./diagnostico";

export const metadata: Metadata = { title: "Diagnóstico" };

// Tela 5 · 8 perguntas, uma por tela, com "por que eu pergunto". Cada resposta salva na hora.
export default async function A05({ searchParams }: PageProps<"/app/a05">) {
  const { student } = await requireStudent();
  const d = await db().query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, student.id), orderBy: desc(schema.diagnostics.versao) });
  const respostas = ((d && !d.resultado ? d.respostas : d?.respostas) ?? {}) as Respostas;
  const q = Number((await searchParams).q);
  const inicio = Number.isInteger(q) && q >= 0 && q < PERGUNTAS.length ? q : d?.resultado ? 0 : primeiraPendente(respostas);
  return <Diagnostico perguntas={PERGUNTAS} inicial={respostas} inicio={inicio} />;
}
