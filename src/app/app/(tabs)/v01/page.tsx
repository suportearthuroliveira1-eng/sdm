import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/app/ui";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";

export const metadata: Metadata = { title: "Meus produtos" };

// V01 · Meus produtos (protótipo, com estado vazio). Criar a pasta entra na Fase 3.
export default async function V01() {
  const { student } = await requireStudent();
  const pastas = await db()
    .select({ id: schema.studentProducts.id, code: schema.studentProducts.code, pais: schema.studentProducts.paisVenda, funil: schema.studentProducts.funil, nome: schema.vitrineProducts.nome })
    .from(schema.studentProducts)
    .leftJoin(schema.vitrineProducts, eq(schema.vitrineProducts.id, schema.studentProducts.vitrineProductId))
    .where(eq(schema.studentProducts.studentId, student.id))
    .orderBy(desc(schema.studentProducts.criadoEm));
  return (
    <>
      <PageTitle>Meus produtos</PageTitle>
      <div className="flex flex-col gap-3.5 lg:max-w-2xl">
        {pastas.length === 0 ? (
          <div className="cd items-center gap-2.5 border border-line px-[18px] py-[22px] text-center">
            <span className="text-lg font-bold">Você ainda não tem produto</span>
            <span className="tx text-muted">Aqui, cada produto que você divulga ganha uma pasta: o país, o seu link, o seu funil, os anúncios, os vídeos e os números. Tudo junto.</span>
            <Link href="/app/v02" className="b1 no-underline">Começar meu primeiro produto</Link>
          </div>
        ) : (
          pastas.map((p) => (
            <Link key={p.id} href={`/app/v05/${p.id}`} className="flex flex-col gap-2 rounded-[14px] border border-line bg-surface p-4 text-text no-underline hover:border-accent">
              <span className="kk">{p.code}</span>
              <span className="text-[17px] font-bold">{p.nome ?? "[produto]"}</span>
              <span className="mu">{p.pais ? `Vende pra ${p.pais.toUpperCase()}` : "País a escolher"}{p.funil ? ` · funil ${p.funil}` : ""}</span>
              <span className="text-[13px] font-semibold text-accent-2">Abrir a pasta</span>
            </Link>
          ))
        )}
        <Link href="/app/v02" className="b2 no-underline">Ver a vitrine de produtos</Link>
      </div>
    </>
  );
}
