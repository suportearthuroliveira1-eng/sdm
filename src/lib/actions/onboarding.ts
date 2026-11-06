"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { rodar, erroIa } from "@/lib/ai/run";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { completo, decidir, resultadoPorRegras, tipoDe, validarResposta, type Respostas, type Resultado } from "@/lib/domain/diagnostico";
import { configDiagnostico, configFluxo } from "@/lib/server/config-app";
import { depoisDe } from "@/lib/domain/onboarding";
import { errMsg, log } from "@/lib/server/log";

const reval = () => revalidatePath("/app", "layout");

/** A04 · boas-vindas vistas (assistiu ou pulou). */
export async function boasVindas(destino: "a07" | "l02") {
  const { student } = await requireStudent();
  await db().update(schema.students).set({ boasVindasEm: new Date() }).where(eq(schema.students.id, student.id));
  reval();
  redirect(destino === "l02" ? "/app/l02/0.1" : depoisDe("a04", await configFluxo()));
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

/** A05 · salva UMA resposta confirmada (dá pra parar e continuar depois). */
export async function salvarResposta(k: string, valor: string | string[]): Promise<{ ok: boolean; erro?: string }> {
  const cfg = await configDiagnostico();
  const p = cfg.perguntas.find((x) => x.k === k);
  if (!p) return { ok: false, erro: "Pergunta não encontrada. Recarregue a página." };
  const v = validarResposta(p, valor);
  if (v === null) return { ok: false, erro: tipoDe(p) === "multipla" ? "Marque pelo menos uma opção." : "Escolha uma opção (ou escreva a sua)." };
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

/** A05 → A06 · fecha o diagnóstico. Modo "regras": caminho e divulgação das regras do admin, IA explica. Modo "ia": IA decide. */
export async function concluirDiagnostico(): Promise<{ ok: boolean; erro?: string }> {
  const { student } = await requireStudent();
  const cfg = await configDiagnostico();
  const atual = await diagnosticoAtual(student.id);
  const r = (atual?.respostas ?? {}) as Respostas;
  if (!atual || !completo(r, cfg.perguntas)) return { ok: false, erro: "Faltam respostas." };
  const regras = resultadoPorRegras(r, cfg);
  const d = decidir(r, cfg);
  let resultado: Resultado;
  try {
    const entrada = {
      perguntas_e_respostas: cfg.perguntas.map((p) => ({ pergunta: p.q, resposta: r[p.k] ?? null })),
      ...(cfg.decisao.modo === "regras"
        ? { decisao_do_time: { caminho: d.caminho, divulgacao: d.divulgacao, aviso: "Use exatamente esse caminho e essa divulgação; explique o porquê a partir das respostas." } }
        : { orientacao_do_time: { caminho_sugerido_pelas_regras: d.caminho, divulgacao_sugerida_pelas_regras: d.divulgacao } }),
    };
    const out = await rodar("diagnostico", entrada, { studentId: student.id });
    resultado = { ...out.saida, motor: "ia" };
    if (cfg.decisao.modo === "regras") {
      if (resultado.caminho.valor !== d.caminho) resultado.caminho = regras.caminho;
      if (resultado.divulgacao.valor !== d.divulgacao) resultado.divulgacao = regras.divulgacao;
    }
  } catch (e) {
    log("warn", "diagnóstico sem IA, usando regras", { err: errMsg(e), aviso: erroIa(e) });
    resultado = regras;
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
      aparecer: r.aparecer ? String(r.aparecer) : null,
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
  if (c === "depois" && !(await configFluxo()).permitirDecidirDepois) redirect("/app/caminho");
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
