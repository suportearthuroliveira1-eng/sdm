import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminHead } from "../../head";
import { getAdmin, requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { isActive, PRODUCTS, PRODUCT_LABEL } from "@/lib/domain/entitlements";
import { StudentActions } from "./student-actions";
import { ZerarAluna } from "./zerar";

export const metadata = { title: "Ficha da aluna" };

// AD03 · Ficha (Fase 1: dados, acessos, link). Conversas, pastas e impersonar entram depois.
export default async function AD03({ params }: PageProps<"/admin/alunas/[id]">) {
  await requireAdmin(["suporte"]);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const student = await db().query.students.findFirst({ where: eq(schema.students.id, id) });
  if (!student) notFound();
  const [ents, links, admin, [cont]] = await Promise.all([
    db().query.entitlements.findMany({ where: eq(schema.entitlements.studentId, id) }),
    db().query.accessLinks.findMany({ where: eq(schema.accessLinks.studentId, id), orderBy: desc(schema.accessLinks.createdAt), limit: 5 }),
    getAdmin(),
    db()
      .select({
        pastas: sql<number>`(select count(*)::int from student_products where student_id = ${id})`,
        aulas: sql<number>`(select count(*)::int from lesson_progress where student_id = ${id})`,
        conversas: sql<number>`(select count(*)::int from chat_messages where student_id = ${id})`,
      })
      .from(sql`(select 1) as x`),
  ]);
  const active = Object.fromEntries(PRODUCTS.map((p) => [p, ents.some((e) => e.produto === p && isActive(e))])) as Record<(typeof PRODUCTS)[number], boolean>;
  const fmt = (d: Date | null) => (d ? d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—");

  return (
    <section className="flex max-w-4xl flex-col gap-6">
      <Link href="/admin/alunas" className="text-sm text-muted hover:text-text">← Alunas</Link>
      <AdminHead id="AD03" t="Ficha da aluna" d={`${student.nome} · ${student.code}`} />
      <div>
        <p className="mu text-[13px]">{student.email}{student.whatsapp ? ` · ${student.whatsapp}` : ""}{student.paisMora ? ` · mora em ${student.paisMora}` : ""}</p>
      </div>

      <dl className="acd grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div><dt className="text-muted">Status</dt><dd>{student.ativo ? "ativa" : "desativada"}</dd></div>
        <div><dt className="text-muted">Criada</dt><dd>{fmt(student.criadoEm)}</dd></div>
        <div><dt className="text-muted">Último acesso</dt><dd>{fmt(student.ultimoAcesso)}</dd></div>
        <div><dt className="text-muted">Instalou</dt><dd>{fmt(student.instaladoEm)}</dd></div>
      </dl>

      <StudentActions studentId={student.id} ativo={student.ativo} active={active} labels={PRODUCT_LABEL} />

      <dl className="acd grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div><dt className="text-muted">Primeiro acesso</dt><dd>{student.diagnosticoEm ? "feito" : student.boasVindasEm ? "em andamento" : "não começou"}</dd></div>
        <div><dt className="text-muted">Caminho</dt><dd>{student.caminho ?? "—"}</dd></div>
        <div><dt className="text-muted">Pastas</dt><dd>{cont?.pastas ?? 0}</dd></div>
        <div><dt className="text-muted">Aulas vistas</dt><dd>{cont?.aulas ?? 0}</dd></div>
      </dl>

      <div className="acd">
        <h2 className="mb-3 font-semibold">Links recentes</h2>
        {links.length === 0 ? <p className="text-sm text-muted">Nenhum link gerado.</p> : (
          <ul className="flex flex-col gap-2 text-sm">
            {links.map((l) => (
              <li key={l.jti} className="flex flex-wrap justify-between gap-2 border-b border-line/60 pb-2 last:border-0">
                <span className="text-muted">criado {fmt(l.createdAt)}</span>
                <span>{l.usedAt ? `usado ${fmt(l.usedAt)}` : l.revokedAt ? "trocado/revogado" : l.expiresAt < new Date() ? "vencido" : `vale até ${fmt(l.expiresAt)}`}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {admin?.papel === "admin" ? (
        <ZerarAluna
          studentId={student.id}
          nome={student.nome}
          resumo={`${cont?.pastas ?? 0} pasta(s), ${cont?.aulas ?? 0} aula(s) vista(s), ${cont?.conversas ?? 0} mensagem(ns) com a Professora, primeiro acesso ${student.diagnosticoEm ? "feito" : "não feito"}.`}
        />
      ) : null}
    </section>
  );
}
