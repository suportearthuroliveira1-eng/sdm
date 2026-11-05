import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { criarPasta } from "@/lib/actions/pasta";
import type { Metadata } from "next";
import { PageTitle } from "@/components/app/ui";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";

export const metadata: Metadata = { title: "Vitrine" };

const FUNIL: Record<string, string> = { pre: "Pré-venda", quiz: "Quiz", direto: "Direto" };
const IDIOMA: Record<string, string> = { en: "Inglês", es: "Espanhol", pt: "Português" };

// V02 · Vitrine (dados do admin AD06; hoje os 6 exemplos do protótipo). Filtros, favoritos e pasta: Fase 3.
export default async function V02() {
  const { student } = await requireStudent();
  const prods = await db().select().from(schema.vitrineProducts).where(eq(schema.vitrineProducts.ativo, true)).orderBy(asc(schema.vitrineProducts.ordem));
  const minhas = await db().select({ id: schema.studentProducts.id, vit: schema.studentProducts.vitrineProductId }).from(schema.studentProducts).where(eq(schema.studentProducts.studentId, student.id));
  const pastaDe = new Map(minhas.map((m) => [m.vit, m.id]));
  return (
    <>
      <PageTitle k="Produtos">Vitrine</PageTitle>
      <p className="tx mb-4 text-muted">Produtos de outras pessoas que você pode divulgar como afiliada. A página de vendas e o checkout são do produtor.</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {prods.map((v) => (
          <article key={v.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="kk">{v.code}</span>
              {v.exemplo ? <span className="rounded-lg bg-warn-bg px-2 py-0.5 text-[10px] font-bold text-warn">EXEMPLO</span> : null}
            </div>
            <h2 className="m-0 text-base font-bold leading-snug">{v.nome}</h2>
            <span className="mu">{[v.assunto, v.idioma ? IDIOMA[v.idioma] ?? v.idioma : null, v.paises.join(", ")].filter(Boolean).join(" · ")}</span>
            {v.resumo ? <p className="tx m-0">{v.resumo}</p> : null}
            {v.promessa ? <p className="m-0 text-[13px] text-accent-2">&quot;{v.promessa}&quot;</p> : null}
            <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {v.seloOrg ? <span className="rounded-lg bg-ok-bg px-2 py-1 text-[11px] font-bold text-ok">Bom pra orgânico</span> : null}
              {v.seloAd ? <span className="rounded-lg bg-sel px-2 py-1 text-[11px] font-bold text-accent-2">Bom pra anúncio</span> : null}
              {v.funilIndicado ? <span className="rounded-lg border border-line-2 px-2 py-1 text-[11px] text-muted">Funil: {FUNIL[v.funilIndicado]}</span> : null}
            </div>
            <span className="mu">Comissão: {v.comissaoValor ? `${v.comissaoValor}${v.comissaoTipo === "pct" ? "%" : ""}` : "[valor]"}</span>
            {pastaDe.has(v.id) ? (
              <Link href={`/app/v05/${pastaDe.get(v.id)}`} className="b2 mt-1 no-underline">Abrir minha pasta</Link>
            ) : (
              <form action={criarPasta.bind(null, v.id)} className="mt-1">
                <button className="b1 min-h-[46px] text-sm">Divulgar este produto</button>
              </form>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
