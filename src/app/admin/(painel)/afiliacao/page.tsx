import { desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { AdminHead } from "../head";
import { Decidir } from "./decidir";

export const metadata = { title: "Pedidos de afiliação" };

// Pedidos de afiliação ao SDM (caminho A1): o time aprova com o link dela ou recusa com o motivo.
export default async function Afiliacao() {
  await requireAdmin(["suporte"]);
  const rows = await db()
    .select({ id: schema.studentProducts.id, code: schema.studentProducts.code, dados: schema.studentProducts.dados, nome: schema.students.nome, email: schema.students.email, aluna: schema.students.code })
    .from(schema.studentProducts)
    .innerJoin(schema.students, eq(schema.students.id, schema.studentProducts.studentId))
    .where(sql`${schema.studentProducts.tipo} = 'sdm' and ${schema.studentProducts.dados} ? 'afiliacao'`)
    .orderBy(desc(schema.studentProducts.updatedAt));
  const st = (d: unknown) => ((d as { afiliacao?: { status?: string } }).afiliacao?.status ?? "");
  const pend = rows.filter((r) => st(r.dados) === "analise");
  const resto = rows.filter((r) => st(r.dados) !== "analise");
  return (
    <>
      <AdminHead id="AFILIAÇÃO" t="Pedidos de afiliação ao SDM" d={`${pend.length} em análise`} />
      {pend.length === 0 ? <p className="mu text-[13px]">Nenhum pedido esperando.</p> : null}
      <div className="grid gap-3 xl:grid-cols-2">
        {pend.map((r) => (
          <div key={r.id} className="acd">
            <span className="kk">{r.aluna} · {r.code}</span>
            <span className="text-base font-bold">{r.nome}</span>
            <span className="mu text-[13px]">{r.email} · pediu em {new Date((r.dados as { afiliacao: { pedidoEm: string } }).afiliacao.pedidoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
            <Decidir pastaId={r.id} />
          </div>
        ))}
      </div>
      {resto.length ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full border-collapse text-[13px]">
            <thead><tr>{["Aluna", "Status", "Link / motivo"].map((h) => <th key={h} className="border-b border-line px-3 py-2.5 text-left font-semibold text-muted">{h}</th>)}</tr></thead>
            <tbody>
              {resto.map((r) => {
                const a = (r.dados as { afiliacao: { status: string; link?: string; motivo?: string } }).afiliacao;
                return (
                  <tr key={r.id}>
                    <td className="border-b border-line-3 p-3">{r.nome} <span className="mu">{r.aluna}</span></td>
                    <td className={`border-b border-line-3 p-3 font-semibold ${a.status === "aprovada" ? "text-ok" : "text-danger"}`}>{a.status}</td>
                    <td className="break-all border-b border-line-3 p-3 text-muted">{a.link ?? a.motivo}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
