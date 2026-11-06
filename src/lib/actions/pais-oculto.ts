"use server";

import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { erroIa, rodar } from "@/lib/ai/run";
import { requireAdmin } from "@/lib/auth/admin";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { catalogoAtivo, configOcultoSchema, type DadosOculto } from "@/lib/domain/pais-oculto";
import { audit } from "@/lib/server/audit";
import { configOculto } from "@/lib/server/pais-oculto";

type R = { ok?: boolean; erro?: string };

async function aluna() {
  const { student } = await requireStudent();
  const cfg = await configOculto();
  if (!cfg.ligado || !cfg.alunas.includes(student.id)) throw new Error("sem acesso");
  return { student, cfg };
}

/** Grava um pedaço de students.cartoes.oculto sem apagar o resto (atômico, no banco). caminho: 1 ou 2 níveis. */
async function salvarOculto(studentId: string, caminho: [string] | [string, string], valor: unknown) {
  const v = JSON.stringify(valor);
  const oculto = sql`coalesce(cartoes->'oculto', '{}'::jsonb)`;
  const novo =
    caminho.length === 1
      ? sql`${oculto} || jsonb_build_object(${caminho[0]}::text, ${v}::jsonb)`
      : sql`${oculto} || jsonb_build_object(${caminho[0]}::text, coalesce(cartoes->'oculto'->${caminho[0]}, '{}'::jsonb) || jsonb_build_object(${caminho[1]}::text, ${v}::jsonb))`;
  await db().execute(sql`update students set cartoes = coalesce(cartoes, '{}'::jsonb) || jsonb_build_object('oculto', ${novo}) where id = ${studentId}`);
}

async function diagnostico(studentId: string) {
  const d = await db().query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, studentId), orderBy: (t, { desc }) => desc(t.versao) });
  return (d?.respostas ?? {}) as Record<string, unknown>;
}

export async function abrirPortao(): Promise<R> {
  const { student } = await aluna();
  const atual = ((student.cartoes ?? {}) as { oculto?: DadosOculto }).oculto;
  if (!atual?.abertoEm) await salvarOculto(student.id, ["abertoEm"], new Date().toISOString());
  return { ok: true };
}

/** A IA escolhe 3 países ocultos pra ela. */
export async function revelarMapa(deNovo = false): Promise<R> {
  try {
    const { student, cfg } = await aluna();
    const catalogo = catalogoAtivo(cfg);
    const r = await rodar(
      "oculto_mapa",
      { diagnostico: await diagnostico(student.id), catalogo: catalogo.map(({ k, nome, idioma, moeda, porque, cuidado }) => ({ k, nome, idioma, moeda, porque, cuidado })) },
      { studentId: student.id, semCache: deNovo },
    );
    const validos = r.saida.paises.filter((p) => catalogo.some((c) => c.k === p.k));
    const unicos = validos.filter((p, i) => validos.findIndex((x) => x.k === p.k) === i).slice(0, 3);
    if (!unicos.length) return { erro: "A IA não achou um país agora. Tente de novo." };
    await salvarOculto(student.id, ["mapa"], { paises: unicos, segredo_geral: r.saida.segredo_geral });
    revalidatePath("/app/oculto");
    return { ok: true };
  } catch (e) {
    return { erro: e instanceof Error && e.message === "sem acesso" ? "Essa área não está liberada pra você." : erroIa(e) };
  }
}

/** Estratégia secreta pra um país do mapa. */
export async function gerarEstrategia(k: string, deNovo = false): Promise<R> {
  try {
    const { student, cfg } = await aluna();
    const pais = catalogoAtivo(cfg).find((p) => p.k === z.string().max(40).parse(k));
    if (!pais) return { erro: "País inválido." };
    const r = await rodar("oculto_estrategia", { pais, diagnostico: await diagnostico(student.id) }, { studentId: student.id, semCache: deNovo });
    await salvarOculto(student.id, ["estrategias", pais.k], r.saida);
    revalidatePath("/app/oculto");
    return { ok: true };
  } catch (e) {
    return { erro: e instanceof Error && e.message === "sem acesso" ? "Essa área não está liberada pra você." : erroIa(e) };
  }
}

/** Cria o produto próprio a partir da estratégia (a ideia já vem escolhida) e devolve a pasta. */
export async function criarProdutoOculto(k: string): Promise<R & { pastaId?: string }> {
  try {
    const { student, cfg } = await aluna();
    const pais = catalogoAtivo(cfg).find((p) => p.k === z.string().max(40).parse(k));
    const est = (((student.cartoes ?? {}) as { oculto?: DadosOculto }).oculto?.estrategias ?? {})[k] as { produto?: { nome_provisorio: string } } | undefined;
    if (!pais || !est?.produto) return { erro: "Gere a estratégia antes." };
    const ideia = est.produto;
    const [p] = await db()
      .insert(schema.studentProducts)
      .values({
        studentId: student.id,
        tipo: "proprio",
        nome: ideia.nome_provisorio,
        dados: { feito: { entenda: true }, ideias: [ideia], ideia, oculto: { k: pais.k, nome: pais.nome, idioma: pais.idioma, moeda: pais.moeda, estrategia: est } },
        bioCode: randomBytes(5).toString("base64url").toLowerCase(),
      })
      .returning({ id: schema.studentProducts.id });
    await db().update(schema.students).set({ produtoAtivo: p!.id, ...(student.caminho ? {} : { caminho: "produto" }) }).where(eq(schema.students.id, student.id));
    revalidatePath("/app", "layout");
    return { ok: true, pastaId: p!.id };
  } catch (e) {
    return { erro: e instanceof Error && e.message === "sem acesso" ? "Essa área não está liberada pra você." : "Não deu pra criar agora. Tente de novo." };
  }
}

// ---------- admin ----------

async function salvarCfg(v: unknown) {
  const r = configOcultoSchema.safeParse(v);
  if (!r.success) throw new Error(r.error.issues[0]?.message ?? "inválido");
  await db()
    .insert(schema.settings)
    .values({ key: "pais_oculto", value: r.data, grupo: "acesso", descricao: "País Oculto: quem tem acesso e quais países aparecem (Admin → País Oculto).", pendente: false })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: r.data, pendente: false } });
  revalidatePath("/admin/pais-oculto");
  revalidatePath("/app", "layout");
}

/** Libera uma ou várias alunas pelo e-mail (um por linha ou separados por vírgula). */
export async function liberarOculto(_p: R & { msg?: string } | null, form: FormData): Promise<R & { msg?: string }> {
  const admin = await requireAdmin(["admin", "suporte"]);
  const emails = String(form.get("emails") ?? "").split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean).slice(0, 500);
  if (!emails.length) return { erro: "Escreva pelo menos um e-mail." };
  const cfg = await configOculto();
  const achadas: string[] = [];
  const faltam: string[] = [];
  for (const e of emails) {
    const s = await db().query.students.findFirst({ where: sql`lower(${schema.students.email}) = ${e}`, columns: { id: true } });
    if (s) achadas.push(s.id);
    else faltam.push(e);
  }
  await salvarCfg({ ...cfg, alunas: [...new Set([...cfg.alunas, ...achadas])] });
  await audit(admin.id, "oculto.liberar", { tipo: "setting", id: "pais_oculto" }, { alunas: achadas.length });
  return { ok: true, msg: `${achadas.length} liberada(s).${faltam.length ? ` Não achei: ${faltam.join(", ")}` : ""}` };
}

export async function removerOculto(studentId: string): Promise<R> {
  const admin = await requireAdmin(["admin", "suporte"]);
  const cfg = await configOculto();
  await salvarCfg({ ...cfg, alunas: cfg.alunas.filter((a) => a !== studentId) });
  await audit(admin.id, "oculto.remover", { tipo: "student", id: studentId });
  return { ok: true };
}

export async function salvarOpcoesOculto(_p: R & { msg?: string } | null, form: FormData): Promise<R & { msg?: string }> {
  const admin = await requireAdmin(["admin"]);
  const cfg = await configOculto();
  const ligados = form.getAll("pais").map(String);
  const { CATALOGO_OCULTO } = await import("@/lib/domain/pais-oculto");
  try {
    await salvarCfg({ ...cfg, ligado: form.get("ligado") === "on", convite: String(form.get("convite") ?? ""), desligados: CATALOGO_OCULTO.map((p) => p.k).filter((k) => !ligados.includes(k)) });
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "inválido" };
  }
  await audit(admin.id, "oculto.opcoes", { tipo: "setting", id: "pais_oculto" });
  return { ok: true, msg: "Salvo." };
}
