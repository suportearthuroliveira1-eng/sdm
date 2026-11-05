import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import { isActive, type Product } from "@/lib/domain/entitlements";
import { lessonLock, moduleLock, type LockReason, type UnlockCtx } from "@/lib/domain/unlock";
import { requireStudent } from "@/lib/auth/session";

export type AulaView = {
  id: string;
  titulo: string;
  tipo: string | null;
  minutos: number | null;
  agoraFacaTexto: string | null;
  agoraFacaAlvo: string | null;
  po: boolean;
  vista: boolean;
  feita: boolean;
  lock: LockReason;
};
export type ModuloView = { id: string; nome: string; parte: string | null; objetivo: string | null; lock: LockReason; aulas: AulaView[] };

/** Tudo que as abas Início e Aulas precisam, numa leitura só por request. */
export const getJornada = cache(async () => {
  const { student, entitlements } = await requireStudent();
  const d = db();
  const [mods, aulas, prog, venda] = await Promise.all([
    d.select().from(schema.modules).orderBy(asc(schema.modules.ordem)),
    d.select().from(schema.lessons).where(eq(schema.lessons.publicada, true)).orderBy(asc(schema.lessons.ordem)),
    d.select().from(schema.lessonProgress).where(eq(schema.lessonProgress.studentId, student.id)),
    d
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.sales)
      .innerJoin(schema.studentProducts, eq(schema.studentProducts.id, schema.sales.studentProductId))
      .where(and(eq(schema.studentProducts.studentId, student.id))),
  ]);
  const produtos = entitlements.filter((e) => isActive(e)).map((e) => e.produto as Product);
  const ctx: UnlockCtx = { trilhaPago: student.trilhaPago, trilhaOrg: student.trilhaOrg, temVenda: (venda[0]?.n ?? 0) > 0, produtos };
  const pmap = new Map(prog.map((p) => [p.lessonId, p]));

  const modulos: ModuloView[] = mods.map((m) => ({
    id: m.id,
    nome: m.nome,
    parte: m.parte,
    objetivo: m.objetivo,
    lock: moduleLock(m.regraLiberacao, ctx),
    aulas: aulas
      .filter((a) => a.moduleId === m.id)
      .map((a) => {
        const p = pmap.get(a.id);
        return {
          id: a.id,
          titulo: a.titulo,
          tipo: a.tipo,
          minutos: a.minutos,
          agoraFacaTexto: a.agoraFacaTexto,
          agoraFacaAlvo: a.agoraFacaAlvo,
          po: a.requerEntitlements.length > 0,
          vista: Boolean(p?.vistaEm),
          feita: Boolean(p?.agoraFacaEm),
          lock: lessonLock(a.requerEntitlements as Product[], m.regraLiberacao, ctx),
        };
      }),
  }));
  const todas = modulos.flatMap((m) => m.aulas);
  const reais = todas.filter((a) => !a.po);
  const vistas = reais.filter((a) => a.vista).length;
  const proxima = todas.find((a) => !a.vista && !a.lock.travado) ?? null;
  const pendentes = todas.filter((a) => a.vista && !a.feita && a.agoraFacaAlvo && a.agoraFacaAlvo !== "fora").slice(0, 3);
  return { student, produtos, ctx, modulos, total: reais.length, vistas, proxima, pendentes };
});
