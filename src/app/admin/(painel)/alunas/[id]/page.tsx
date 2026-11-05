import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminHead } from "../../head";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { isActive, PRODUCTS, PRODUCT_LABEL } from "@/lib/domain/entitlements";
import { StudentActions } from "./student-actions";

export const metadata = { title: "Ficha da aluna" };

// AD03 · Ficha (Fase 1: dados, acessos, link). Conversas, pastas e impersonar entram depois.
export default async function AD03({ params }: PageProps<"/admin/alunas/[id]">) {
  await requireAdmin(["suporte"]);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const student = await db().query.students.findFirst({ where: eq(schema.students.id, id) });
  if (!student) notFound();
  const [ents, links] = await Promise.all([
    db().query.entitlements.findMany({ where: eq(schema.entitlements.studentId, id) }),
    db().query.accessLinks.findMany({ where: eq(schema.accessLinks.studentId, id), orderBy: desc(schema.accessLinks.createdAt), limit: 5 }),
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
    </section>
  );
}
