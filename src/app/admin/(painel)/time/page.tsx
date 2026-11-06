import { asc } from "drizzle-orm";
import { AdminHead } from "../head";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { MembroLinha, NovoMembro } from "./forms";

export const metadata = { title: "Time" };

/** Quem entra no admin e o que cada um pode fazer. */
export default async function AdminTime() {
  const eu = await requireAdmin(["admin"]);
  const time = await db().select().from(schema.adminUsers).orderBy(asc(schema.adminUsers.createdAt));
  return (
    <section className="flex max-w-5xl flex-col gap-6">
      <AdminHead id="ACESSO" t="Time do admin" d="Admin pode tudo. Suporte cuida das alunas e dos acessos. Conteúdo cuida das aulas e da IA." />
      <NovoMembro />
      <div className="acd gap-2">
        <h2 className="m-0 text-base font-bold">Quem tem acesso ({time.length})</h2>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {time.map((m) => <MembroLinha key={m.id} id={m.id} nome={m.nome ?? ""} email={m.email} papel={m.papel} ativo={m.ativo} eu={m.id === eu.id} />)}
        </ul>
      </div>
    </section>
  );
}
