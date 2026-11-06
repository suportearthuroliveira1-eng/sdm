import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { cache } from "react";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { etapasDaPasta, faseAtual, type EstadoPasta, type TipoPasta } from "@/lib/domain/etapas";
import { textosApp } from "@/lib/server/config-app";

export type PastaResumo = {
  id: string;
  code: string;
  tipo: TipoPasta;
  nome: string;
  estado: EstadoPasta;
  etapas: ReturnType<typeof etapasDaPasta>;
  fase: number;
  paisVenda: string | null;
};

/** Monta o estado de etapas de várias pastas com poucas consultas. */
export async function estadoDasPastas(ids: string[]) {
  if (!ids.length) return new Map<string, Omit<EstadoPasta, "tipo" | "dados" | "divulgacao">>();
  const d = db();
  const [itens, ebooks, nums, vendas] = await Promise.all([
    d.select({ sp: schema.generatedItems.studentProductId, tipo: schema.generatedItems.tipo, n: sql<number>`count(*)::int` }).from(schema.generatedItems).where(inArray(schema.generatedItems.studentProductId, ids)).groupBy(schema.generatedItems.studentProductId, schema.generatedItems.tipo),
    d.select({ sp: schema.ebooks.studentProductId, status: schema.ebooks.status }).from(schema.ebooks).where(inArray(schema.ebooks.studentProductId, ids)),
    d.select({ sp: schema.metricsEntries.studentProductId, n: sql<number>`count(*)::int` }).from(schema.metricsEntries).where(inArray(schema.metricsEntries.studentProductId, ids)).groupBy(schema.metricsEntries.studentProductId),
    d.select({ sp: schema.sales.studentProductId, n: sql<number>`count(*)::int` }).from(schema.sales).where(inArray(schema.sales.studentProductId, ids)).groupBy(schema.sales.studentProductId),
  ]);
  const out = new Map<string, Omit<EstadoPasta, "tipo" | "dados" | "divulgacao">>();
  for (const id of ids) {
    const tipos = new Set(itens.filter((i) => i.sp === id).map((i) => i.tipo));
    out.set(id, {
      temEbookPronto: ebooks.some((e) => e.sp === id && e.status === "pronto"),
      temPagina: tipos.has("kit_pre") || tipos.has("kit_quiz"),
      temCriativos: tipos.has("anuncio"),
      temRoteiros: tipos.has("roteiro"),
      temNumeros: nums.some((n) => n.sp === id),
      temVenda: vendas.some((n) => n.sp === id),
    });
  }
  return out;
}

export const minhasPastas = cache(async (): Promise<PastaResumo[]> => {
  const { student } = await requireStudent();
  const rows = await db()
    .select({ p: schema.studentProducts, vitNome: schema.vitrineProducts.nome })
    .from(schema.studentProducts)
    .leftJoin(schema.vitrineProducts, eq(schema.vitrineProducts.id, schema.studentProducts.vitrineProductId))
    .where(eq(schema.studentProducts.studentId, student.id))
    .orderBy(schema.studentProducts.criadoEm);
  const [est, tx] = await Promise.all([estadoDasPastas(rows.map((r) => r.p.id)), textosApp()]);
  return rows.map(({ p, vitNome }) => {
    const estado: EstadoPasta = { tipo: p.tipo as TipoPasta, dados: (p.dados ?? {}) as Record<string, unknown>, divulgacao: p.divulgacao, ...est.get(p.id)! };
    return { id: p.id, code: p.code, tipo: estado.tipo, nome: p.nome ?? vitNome ?? "[produto]", estado, etapas: etapasDaPasta(estado, tx.etapas), fase: faseAtual(estado), paisVenda: p.paisVenda };
  });
});

/** Uma pasta da aluna com tudo pra telas de etapa (404 se não for dela). */
export async function pastaDaAluna(id: string) {
  const { student } = await requireStudent();
  const p = await db().query.studentProducts.findFirst({ where: and(eq(schema.studentProducts.id, id), eq(schema.studentProducts.studentId, student.id)) });
  if (!p) return null;
  const [estados, tx] = await Promise.all([estadoDasPastas([p.id]), textosApp()]);
  const est = estados.get(p.id)!;
  const estado: EstadoPasta = { tipo: p.tipo as TipoPasta, dados: (p.dados ?? {}) as Record<string, unknown>, divulgacao: p.divulgacao, ...est };
  return { student, pasta: p, estado, etapas: etapasDaPasta(estado, tx.etapas), fase: faseAtual(estado) };
}

/** Href de uma etapa (pastas da vitrine continuam nas telas V07/V08/F02/DV01). */
export function hrefEtapa(pastaId: string, slug: string) {
  return `/app/p/${pastaId}/${slug}`;
}
