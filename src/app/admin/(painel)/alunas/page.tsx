import { desc, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { NewStudentForm, ImportCsvForm } from "./forms";

export const metadata = { title: "Alunas" };

// AD02 · Alunas: busca, nova aluna, importar CSV.
export default async function AD02({ searchParams }: PageProps<"/admin/alunas">) {
  await requireAdmin(["suporte"]);
  const q = String((await searchParams).q ?? "").trim();
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const rows = await db()
    .select()
    .from(schema.students)
    .where(q ? or(ilike(schema.students.nome, like), ilike(schema.students.email, like), ilike(schema.students.code, like)) : undefined)
    .orderBy(desc(schema.students.criadoEm))
    .limit(100);

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Alunas</h1>
        <form className="flex gap-2" role="search">
          <label htmlFor="q" className="sr-only">Buscar</label>
          <input id="q" name="q" defaultValue={q} placeholder="Nome, e-mail ou ALN-" className="field w-64" />
          <button className="btn-ghost">Buscar</button>
        </form>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <NewStudentForm />
        <ImportCsvForm />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Último acesso</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-muted">Nenhuma aluna {q ? "encontrada" : "cadastrada ainda"}.</td></tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3"><Link className="text-accent underline-offset-4 hover:underline" href={`/admin/alunas/${s.id}`}>{s.code}</Link></td>
                  <td className="px-4 py-3">{s.nome}</td>
                  <td className="px-4 py-3 text-muted">{s.email}</td>
                  <td className="px-4 py-3">{s.ativo ? <span className="text-ok">ativa</span> : <span className="text-danger">desativada</span>}</td>
                  <td className="px-4 py-3 text-muted">{s.ultimoAcesso ? s.ultimoAcesso.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
