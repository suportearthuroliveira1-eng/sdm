import { count, isNotNull, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";

export const metadata = { title: "Visão geral" };

// AD01 · Visão geral (Fase 1: contagens reais; funil completo e custos na Fase 8).
export default async function AD01() {
  await requireAdmin();
  const d = db();
  const [[ativas], [comLogin], [instalaram], [abertos]] = await Promise.all([
    d.select({ n: count() }).from(schema.students).where(sql`${schema.students.ativo}`),
    d.select({ n: count() }).from(schema.students).where(isNotNull(schema.students.ultimoAcesso)),
    d.select({ n: count() }).from(schema.students).where(isNotNull(schema.students.instaladoEm)),
    d.select({ n: count() }).from(schema.supportTickets).where(sql`${schema.supportTickets.status} = 'aberto'`),
  ]);
  const cards = [
    { label: "Alunas ativas", v: ativas?.n ?? 0 },
    { label: "Já entraram", v: comLogin?.n ?? 0 },
    { label: "Instalaram o app", v: instalaram?.n ?? 0 },
    { label: "Tickets abertos", v: abertos?.n ?? 0 },
  ];
  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Visão geral</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-2 text-3xl font-bold">{c.v}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">Funil da jornada, abandono por aula, dúvidas e custo de IA entram nas próximas fases.</p>
    </section>
  );
}
