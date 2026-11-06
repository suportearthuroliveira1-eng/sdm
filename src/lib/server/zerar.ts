import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { log } from "@/lib/server/log";
import { apagarArquivo } from "@/lib/server/storage";

/**
 * Zera uma aluna: apaga o progresso (pastas, diagnóstico, aulas vistas, conversas, ebooks,
 * imagens, chamados, avisos) e volta pro primeiro acesso, como conta nova.
 * MANTÉM: login, e-mail, nome, WhatsApp, acessos liberados (entitlements), papel de admin
 * e o histórico de custo da IA (ai_usage).
 */
export async function zerarAluna(studentId: string) {
  const d = db();
  const imgs = await d.select({ a: schema.images.storagePath, b: schema.images.previewPath }).from(schema.images).where(eq(schema.images.studentId, studentId));
  const contagem = await d.transaction(async (tx) => {
    const del = async (t: Parameters<typeof tx.delete>[0] & { studentId: unknown }) => (await tx.delete(t).where(eq(t.studentId as never, studentId)).returning()).length;
    const n = {
      pastas: await del(schema.studentProducts), // leva junto itens, ebooks, imagens, cliques, números e vendas da pasta
      diagnosticos: await del(schema.diagnostics),
      aulas: await del(schema.lessonProgress),
      conversas: await del(schema.chatMessages),
      ebooks: await del(schema.ebooks),
      itens: await del(schema.generatedItems),
      imagens: await del(schema.images),
      favoritos: await del(schema.favorites),
      avisos: await del(schema.notifications),
      semanas: await del(schema.profitWeeks),
      chamados: await del(schema.supportTickets),
    };
    await tx
      .update(schema.students)
      .set({
        boasVindasEm: null,
        combinadoEm: null,
        diagnosticoEm: null,
        caminho: null,
        produtoAtivo: null,
        trilhaPago: false,
        trilhaOrg: false,
        paisMora: null,
        idiomas: [],
        trabalho: null,
        tempoDia: null,
        verba: null,
        assuntos: [],
        aparecer: null,
        experiencia: null,
        cartoes: {},
        rotinaHora: null,
        rotinaOn: false,
      })
      .where(eq(schema.students.id, studentId));
    return n;
  });
  // arquivos no Storage: depois do banco (se falhar, sobra só arquivo órfão, nada quebra)
  for (const p of imgs.flatMap((i) => [i.a, i.b]).filter((x): x is string => Boolean(x))) {
    await apagarArquivo(p).catch((e) => log("warn", "zerar: arquivo não apagado", { p, err: String(e) }));
  }
  return contagem;
}
