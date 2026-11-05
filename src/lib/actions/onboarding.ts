"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { rodar, erroIa } from "@/lib/ai/run";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { completo, PERGUNTAS, resultadoPorRegras, type Respostas, type Resultado } from "@/lib/domain/diagnostico";
import { errMsg, log } from "@/lib/server/log";

const reval = () => revalidatePath("/app", "layout");

/** A04 · boas-vindas vistas (assistiu ou pulou). */
export async function boasVindas(destino: "a07" | "l02") {
  const { student } = await requireStudent();
  await db().update(schema.students).set({ boasVindasEm: new Date() }).where(eq(schema.students.id, student.id));
  reval();
  redirect(destino === "l02" ? "/app/l02/0.1" : "/app/a07");
}

/** A07 · o nosso combinado (registra a data). */
export async function combinar() {
  const { student } = await requireStudent();
  await db().update(schema.students).set({ combinadoEm: new Date() }).where(eq(schema.students.id, student.id));
  reval();
  redirect("/app/a05");
}

async function diagnosticoAtual(studentId: string) {
  return db().query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, studentId), orderBy: desc(schema.diagnostics.versao) });
}

/** A05 · salva UMA resposta na hora (dá pra parar e continuar depois). */
export async function salvarResposta(k: string, valor: string | string[]) {
  const p = PERGUNTAS.find((x) => x.k === k);
  if (!p) throw new Error("pergunta inválida");
  const v = p.multi ? z.array(z.string().max(80)).max(10).parse(valor) : z.string().max(120).parse(valor);
  const { student } = await requireStudent();
  const atual = await diagnosticoAtual(student.id);
  // Diagnóstico já concluído e refeito: começa uma versão nova (o histórico fica).
  if (!atual || atual.resultado) {
    await db().insert(schema.diagnostics).values({ studentId: student.id, versao: (atual?.versao ?? 0) + 1, respostas: { ...((atual?.respostas as Respostas) ?? {}), [k]: v } });
  } else {
    await db().update(schema.diagnostics).set({ respostas: { ...(atual.respostas as Respostas), [k]: v } }).where(eq(schema.diagnostics.id, atual.id));
  }
  return { ok: true };
}

/** A05 → A06 · fecha o diagnóstico: IA monta o resumo (ou a regra de reserva). */
export async function concluirDiagnostico(): Promise<{ ok: boolean; erro?: string }> {
  const { student } = await requireStudent();
  const atual = await diagnosticoAtual(student.id);
  const r = (atual?.respostas ?? {}) as Respostas;
  if (!atual || !completo(r)) return { ok: false, erro: "Faltam respostas." };
  let resultado: Resultado;
  try {
    const out = await rodar("diagnostico", { respostas: r }, { studentId: student.id });
    resultado = { ...out.saida, motor: "ia" };
  } catch (e) {
    log("warn", "diagnóstico sem IA, usando regras", { err: errMsg(e), aviso: erroIa(e) });
    resultado = resultadoPorRegras(r);
  }
  const lista = (v: unknown) => (Array.isArray(v) ? (v as string[]) : v ? [String(v)] : []);
  await db().update(schema.diagnostics).set({ resultado }).where(eq(schema.diagnostics.id, atual.id));
  await db()
    .update(schema.students)
    .set({
      diagnosticoEm: new Date(),
      paisMora: String(r.pais ?? ""),
      idiomas: lista(r.idiomas),
      tempoDia: String(r.tempo ?? ""),
      verba: String(r.verba ?? ""),
      assuntos: lista(r.assuntos),
      experiencia: String(r.exp ?? ""),
    })
    .where(eq(schema.students.id, student.id));
  reval();
  return { ok: true };
}

/** Cria (ou devolve) a pasta de um tipo pro caminho escolhido. */
async function garantirPasta(studentId: string, tipo: "sdm" | "proprio", paisVenda: string | null) {
  const ja = await db().query.studentProducts.findFirst({ where: and(eq(schema.studentProducts.studentId, studentId), eq(schema.studentProducts.tipo, tipo)) });
  if (ja) return ja.id;
  const [p] = await db()
    .insert(schema.studentProducts)
    .values({
      studentId,
      tipo,
      nome: tipo === "sdm" ? "SDM · afiliada" : "Meu produto",
      paisVenda,
      paisConfirmado: Boolean(paisVenda),
      bioCode: randomBytes(5).toString("base64url").toLowerCase(),
    })
    .returning({ id: schema.studentProducts.id });
  return p!.id;
}

/** Tela 7 · escolha do caminho: cria a pasta certa em Produtos e leva pro Início. */
export async function escolherCaminho(caminho: string) {
  const c = z.enum(["afiliada", "produto", "ambos", "depois"]).parse(caminho);
  const { student } = await requireStudent();
  const diag = await diagnosticoAtual(student.id);
  const pais = (diag?.resultado as Resultado | null)?.pais_venda?.k ?? null;
  let ativa: string | null = null;
  if (c === "afiliada" || c === "ambos") ativa = await garantirPasta(student.id, "sdm", pais);
  if (c === "produto" || c === "ambos") {
    const id = await garantirPasta(student.id, "proprio", pais);
    ativa = ativa ?? id;
  }
  await db().update(schema.students).set({ caminho: c, ...(ativa ? { produtoAtivo: ativa } : {}) }).where(eq(schema.students.id, student.id));
  reval();
  redirect("/app");
}
