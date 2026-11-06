"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { erroIa, rodar } from "@/lib/ai/run";
import type { capituloOut } from "@/lib/ai/schemas";
import { db, schema } from "@/lib/db";
import { pastaDaAluna } from "@/lib/server/pastas";
import { idiomaDaPasta } from "./caminhos";
import { limparTitulo, palavrasPorCapitulo, TONS } from "@/lib/domain/temas";

export type R = { ok?: boolean; erro?: string };
type Bi = { x: string; pt: string };
type Cap = { titulo: Bi; objetivo: string; texto?: z.infer<typeof capituloOut> | null };
const reval = () => revalidatePath("/app", "layout");


async function ctx(pastaId: string) {
  if (!z.string().uuid().safeParse(pastaId).success) throw new Error("pasta inválida");
  const p = await pastaDaAluna(pastaId);
  if (!p) throw new Error("pasta não encontrada");
  const eb = await db().query.ebooks.findFirst({ where: and(eq(schema.ebooks.studentProductId, p.pasta.id), eq(schema.ebooks.studentId, p.student.id)) });
  return { ...p, eb };
}

/** Sumário (parte 1): cria ou refaz o ebook com N capítulos. */
export async function gerarSumario(pastaId: string, _p: R | null, form: FormData): Promise<R> {
  const { pasta, student, eb } = await ctx(pastaId);
  const dados = pasta.dados as { ficha?: unknown; oferta?: unknown };
  if (!dados.ficha) return { erro: "Complete a ficha do produto antes." };
  const n = z.coerce.number().int().min(4).max(10).catch(6).parse(form.get("capitulos"));
  const tom = z.enum(TONS).catch("amiga").parse(form.get("tom"));
  const tamanho = z.coerce.number().int().refine((v) => [5, 10, 20, 30].includes(v)).catch(20).parse(form.get("tamanho"));
  const idioma = await idiomaDaPasta(pasta.paisVenda);
  try {
    const r = await rodar("sumario", { idioma_venda: idioma, capitulos: n, tom, ficha: dados.ficha, oferta: dados.oferta ?? null }, { studentId: student.id, semCache: Boolean(eb) });
    const capitulos: Cap[] = r.saida.capitulos.slice(0, n).map((c) => ({ titulo: { x: limparTitulo(c.titulo.x), pt: limparTitulo(c.titulo.pt) }, objetivo: c.objetivo, texto: null }));
    const vals = { titulo: r.saida.titulo.x, idioma, tamanho, tom, capitulos, ideia: { titulo: r.saida.titulo, subtitulo: r.saida.subtitulo, sumarioAprovado: false }, status: "fila" as const, progresso: 0 };
    if (eb) await db().update(schema.ebooks).set(vals).where(eq(schema.ebooks.id, eb.id));
    else await db().insert(schema.ebooks).values({ ...vals, studentId: student.id, studentProductId: pasta.id, temaVisual: "lilas" });
    reval();
    return { ok: true };
  } catch (e) {
    return { erro: erroIa(e) };
  }
}

/** Sumário: renomear, tirar, adicionar, mudar a ordem e aprovar. */
export async function salvarSumario(pastaId: string, caps: { titulo: string; objetivo: string }[], aprovar: boolean): Promise<R> {
  const { eb } = await ctx(pastaId);
  if (!eb) return { erro: "Gere o sumário antes." };
  const lista = z.array(z.object({ titulo: z.string().trim().min(2).max(200), objetivo: z.string().max(400) })).min(4, "Mínimo 4 capítulos.").max(10, "Máximo 10 capítulos.").safeParse(caps);
  if (!lista.success) return { erro: lista.error.issues[0]?.message };
  const antigos = (eb.capitulos ?? []) as Cap[];
  const novos: Cap[] = lista.data.map((c) => {
    const igual = antigos.find((a) => a.titulo.x === c.titulo);
    return igual ? { ...igual, objetivo: c.objetivo } : { titulo: { x: c.titulo, pt: c.titulo }, objetivo: c.objetivo, texto: null };
  });
  const feitos = novos.filter((c) => c.texto).length;
  await db()
    .update(schema.ebooks)
    .set({ capitulos: novos, ideia: { ...((eb.ideia as object) ?? {}), sumarioAprovado: aprovar || Boolean((eb.ideia as { sumarioAprovado?: boolean })?.sumarioAprovado) }, progresso: Math.round((feitos / novos.length) * 100), status: feitos === novos.length ? eb.status : "fila" })
    .where(eq(schema.ebooks.id, eb.id));
  reval();
  return { ok: true };
}

/** Capítulos (parte 2): gera UM capítulo (ou refaz com ajuste). A tela chama em sequência e mostra o progresso real. */
export async function gerarCapitulo(pastaId: string, idx: number, ajuste: string | null): Promise<R & { progresso?: number }> {
  const { pasta, student, eb } = await ctx(pastaId);
  if (!eb) return { erro: "Gere o sumário antes." };
  const caps = (eb.capitulos ?? []) as Cap[];
  const cap = caps[idx];
  if (!cap) return { erro: "Capítulo inválido." };
  const aj = ajuste ? z.enum(["mais simples", "mais curto", "mais exemplos"]).parse(ajuste) : null;
  await db().update(schema.ebooks).set({ status: "gerando" }).where(eq(schema.ebooks.id, eb.id));
  try {
    const r = await rodar(
      "capitulo",
      {
        idioma_venda: eb.idioma,
        tom: eb.tom,
        tamanho: String(eb.tamanho),
        palavras_alvo: aj === "mais curto" ? Math.round(palavrasPorCapitulo(eb.tamanho ?? 10, caps.length) * 0.6) : palavrasPorCapitulo(eb.tamanho ?? 10, caps.length),
        ebook: (eb.ideia as { titulo?: Bi })?.titulo ?? eb.titulo,
        sumario: caps.map((c) => c.titulo.x),
        capitulo: { numero: idx + 1, titulo: cap.titulo.x, objetivo: cap.objetivo },
        ficha: (pasta.dados as { ficha?: unknown }).ficha ?? null,
        ajuste: aj,
        texto_atual: aj ? cap.texto : null,
      },
      { studentId: student.id, semCache: Boolean(aj) },
    );
    // relê pra não pisar em outro capítulo gerado ao mesmo tempo
    const atual = await db().query.ebooks.findFirst({ where: eq(schema.ebooks.id, eb.id) });
    const lista = ((atual?.capitulos ?? caps) as Cap[]).map((c, i) => (i === idx ? { ...c, texto: r.saida } : c));
    const feitos = lista.filter((c) => c.texto).length;
    const progresso = Math.round((feitos / lista.length) * 100);
    await db().update(schema.ebooks).set({ capitulos: lista, progresso, status: feitos === lista.length ? "pronto" : "gerando", erro: null }).where(eq(schema.ebooks.id, eb.id));
    reval();
    return { ok: true, progresso };
  } catch (e) {
    await db().update(schema.ebooks).set({ status: "erro", erro: erroIa(e) }).where(eq(schema.ebooks.id, eb.id));
    return { erro: erroIa(e) };
  }
}

/** Estilo (parte 3): tema visual da capa e do PDF. */
export async function escolherTema(pastaId: string, tema: string): Promise<R> {
  const { eb } = await ctx(pastaId);
  if (!eb) return { erro: "Gere o sumário antes." };
  await db().update(schema.ebooks).set({ temaVisual: z.string().max(20).parse(tema) }).where(eq(schema.ebooks.id, eb.id));
  reval();
  return { ok: true };
}

/** Introdução, como usar, conclusão e próximos passos (depois dos capítulos). Entra no PDF. */
export async function gerarExtras(pastaId: string): Promise<R> {
  const { pasta, student, eb } = await ctx(pastaId);
  if (!eb) return { erro: "Gere o sumário antes." };
  const caps = (eb.capitulos ?? []) as Cap[];
  try {
    const r = await rodar(
      "extras_ebook",
      { idioma_venda: eb.idioma, tom: eb.tom, ebook: (eb.ideia as { titulo?: Bi })?.titulo ?? eb.titulo, sumario: caps.map((c) => c.titulo.x), ficha: (pasta.dados as { ficha?: unknown }).ficha ?? null },
      { studentId: student.id },
    );
    await db().update(schema.ebooks).set({ ideia: { ...((eb.ideia as object) ?? {}), extras: r.saida } }).where(eq(schema.ebooks.id, eb.id));
    reval();
    return { ok: true };
  } catch (e) {
    return { erro: erroIa(e) };
  }
}
