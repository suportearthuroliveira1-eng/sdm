import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import type { Bi, Lang, ProdutoBase } from "@/lib/gen/modelo";

export type Pais = { k: string; nome: string; curto: string; lang: string; idioma: string; moeda: string };

export async function paises(): Promise<Pais[]> {
  const row = await db().query.contentBlocks.findFirst({ where: eq(schema.contentBlocks.key, "app.paises") });
  return (row?.data as Pais[] | undefined) ?? [];
}

/** Pasta da aluna logada (404 se não for dela). */
export async function getPasta(id: string) {
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { student } = await requireStudent();
  const [row] = await db()
    .select({ pasta: schema.studentProducts, vit: schema.vitrineProducts })
    .from(schema.studentProducts)
    .leftJoin(schema.vitrineProducts, eq(schema.vitrineProducts.id, schema.studentProducts.vitrineProductId))
    .where(and(eq(schema.studentProducts.id, id), eq(schema.studentProducts.studentId, student.id)));
  if (!row) notFound();
  return { student, pasta: row.pasta, vit: row.vit };
}

export type PastaCompleta = Awaited<ReturnType<typeof getPasta>>;

export async function itensDaPasta(pastaId: string) {
  return db().select().from(schema.generatedItems).where(eq(schema.generatedItems.studentProductId, pastaId)).orderBy(desc(schema.generatedItems.createdAt));
}

export async function imagensDaPasta(pastaId: string) {
  return db().select().from(schema.images).where(eq(schema.images.studentProductId, pastaId)).orderBy(asc(schema.images.createdAt));
}

/** Ficha do produto no formato do motor de geração. */
export function produtoBase(vit: NonNullable<PastaCompleta["vit"]>): ProdutoBase {
  const e = (vit.extra ?? {}) as Partial<{ lang: Lang; aX: string; aPt: string; quem: Bi; dor: Bi; oque: Bi; prom: Bi; hooks: { x: string[]; pt: string[] } }>;
  const bi = (b: Bi | undefined, pt: string | null) => b ?? { x: pt ?? "", pt: pt ?? "" };
  return {
    nome: vit.nome,
    lang: (e.lang ?? (vit.idioma === "es" ? "es" : "en")) as Lang,
    aX: e.aX ?? vit.assunto ?? "",
    aPt: e.aPt ?? vit.assunto ?? "",
    quem: bi(e.quem, vit.publico),
    dor: bi(e.dor, vit.dor),
    oque: bi(e.oque, vit.oQueE),
    prom: bi(e.prom, vit.promessa),
    hooks: e.hooks ?? { x: (vit.ganchosBase as string[]) ?? [], pt: (vit.ganchosBase as string[]) ?? [] },
    img: vit.promptImagem ?? "",
    tags: vit.tags.join(" "),
  };
}

export type Etapa = { n: number; nome: string; ok: boolean; href: string | null; travada: string | null };

export function etapas(p: PastaCompleta["pasta"], temItens: { kit: boolean; criativos: boolean }): Etapa[] {
  const e0 = p.paisConfirmado;
  const e1 = Boolean((p.linkTeste as { ok?: boolean } | null)?.ok);
  const e2 = p.funil === "direto" ? e1 : temItens.kit;
  const e3 = temItens.criativos;
  return [
    { n: 0, nome: "País e idioma", ok: e0, href: `/app/v07/${p.id}`, travada: null },
    { n: 1, nome: "Produto e link", ok: e1, href: e0 ? `/app/v08/${p.id}` : null, travada: e0 ? null : "Abre quando você confirmar o país (etapa 0)." },
    { n: 2, nome: "Estrutura (funil)", ok: e2, href: e1 ? (p.funil ? `/app/f04/${p.id}` : `/app/f02/${p.id}`) : null, travada: e1 ? null : "Abre quando o seu link de afiliada estiver testado (etapa 1)." },
    { n: 3, nome: "Divulgação", ok: e3, href: e2 ? `/app/dv01/${p.id}` : null, travada: e2 ? null : "Abre quando a sua estrutura (funil) estiver pronta (etapa 2)." },
    { n: 4, nome: "Números", ok: false, href: null, travada: e3 ? "Chega na próxima atualização do app." : "Abre quando sua campanha ou seu 1º post estiver no ar (etapa 3)." },
    { n: 5, nome: "Dinheiro", ok: false, href: null, travada: "Chega na próxima atualização do app." },
    { n: 6, nome: "Escalar", ok: false, href: null, travada: "Abre depois da 1ª venda." },
  ];
}

type FichaIA = { nome: string; publico: Bi; dor: Bi; promessa: Bi; o_que_e: Bi; ganchos: Bi[]; prompt_imagem: string; tags: string[] };

/** Base de geração de qualquer pasta: vitrine (ficha da vitrine), produto próprio (ficha da IA) ou SDM (ficha cadastrada pelo time). */
export async function baseDaPasta(c: PastaCompleta): Promise<ProdutoBase | null> {
  if (c.vit) return produtoBase(c.vit);
  const lang: Lang = ["latam", "esp"].includes(c.pasta.paisVenda ?? "") ? "es" : "en";
  const dados = (c.pasta.dados ?? {}) as { ficha?: FichaIA };
  let f = dados.ficha;
  if (!f && c.pasta.tipo === "sdm") {
    const row = await db().query.contentBlocks.findFirst({ where: eq(schema.contentBlocks.key, `sdm.ficha.${lang}`) });
    f = row?.data as FichaIA | undefined;
  }
  if (!f) return null;
  return {
    nome: f.nome,
    lang,
    aX: f.publico.x,
    aPt: f.publico.pt,
    quem: f.publico,
    dor: f.dor,
    oque: f.o_que_e,
    prom: f.promessa,
    hooks: { x: f.ganchos.map((g) => g.x), pt: f.ganchos.map((g) => g.pt) },
    img: f.prompt_imagem,
    tags: (f.tags ?? []).join(" "),
  };
}
