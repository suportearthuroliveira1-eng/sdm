import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { primeiraPendente, type Respostas } from "@/lib/domain/diagnostico";
import { configDiagnostico } from "@/lib/server/config-app";
import { Diagnostico } from "./diagnostico";

export const metadata: Metadata = { title: "Diagnóstico" };

// Tela 5 · perguntas do admin (padrão: 8), uma por tela, com "por que eu pergunto". Cada resposta confirmada salva na hora.
export default async function A05({ searchParams }: PageProps<"/app/a05">) {
  const [{ student }, cfg] = await Promise.all([requireStudent(), configDiagnostico()]);
  const PERGUNTAS = cfg.perguntas;
  const d = await db().query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, student.id), orderBy: desc(schema.diagnostics.versao) });
  const respostas = ((d && !d.resultado ? d.respostas : d?.respostas) ?? {}) as Respostas;
  const q = Number((await searchParams).q);
  const inicio = Number.isInteger(q) && q >= 0 && q < PERGUNTAS.length ? q : d?.resultado ? 0 : primeiraPendente(respostas, PERGUNTAS);
  return <Diagnostico key={d?.id ?? "novo"} perguntas={PERGUNTAS} inicial={respostas} inicio={inicio} />;
}
