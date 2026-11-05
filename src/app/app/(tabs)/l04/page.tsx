import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/app/ui";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";

export const metadata: Metadata = { title: "Glossário" };

// L04 · Glossário (32 termos oficiais + 7 do app).
export default async function L04() {
  await requireStudent();
  const termos = await db().select().from(schema.glossary).orderBy(asc(schema.glossary.termo));
  return (
    <>
      <PageTitle k="Aulas">Glossário</PageTitle>
      <dl className="m-0 grid gap-2 lg:grid-cols-2">
        {termos.map((g) => (
          <div key={g.id} className="cd">
            <dt className="flex items-center justify-between gap-2 text-sm font-bold">
              {g.termo}
              {!g.oficial ? <span className="rounded-lg bg-sel px-2 py-0.5 text-[10px] font-bold text-accent-2">DO APP</span> : null}
            </dt>
            <dd className="m-0 tx">{g.definicao}</dd>
            {g.aula ? <Link href={`/app/l02/${encodeURIComponent(g.aula)}`} className="mu self-start">Aula {g.aula}</Link> : null}
          </div>
        ))}
      </dl>
    </>
  );
}
