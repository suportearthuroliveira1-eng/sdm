"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { audit } from "@/lib/server/audit";

/** Pedidos de afiliação ao SDM: aprovar (com o link dela) ou recusar (com o motivo). */
export async function decidirAfiliacao(pastaId: string, _p: { ok?: boolean; erro?: string } | null, form: FormData) {
  const admin = await requireAdmin(["suporte"]);
  const id = z.string().uuid().parse(pastaId);
  const decisao = z.enum(["aprovar", "recusar"]).parse(form.get("decisao"));
  const link = String(form.get("link") ?? "").trim();
  const motivo = String(form.get("motivo") ?? "").trim();
  if (decisao === "aprovar" && !/^https:\/\/\S+$/.test(link)) return { erro: "Cole o link de afiliada dela (começa com https://)." };
  if (decisao === "recusar" && motivo.length < 5) return { erro: "Escreva o motivo da recusa." };
  const af = decisao === "aprovar" ? { status: "aprovada", link, decididoEm: new Date().toISOString() } : { status: "recusada", motivo, decididoEm: new Date().toISOString() };
  await db().update(schema.studentProducts).set({ dados: sql`${schema.studentProducts.dados} || ${JSON.stringify({ afiliacao: af })}::jsonb` }).where(eq(schema.studentProducts.id, id));
  await audit(admin.id, `afiliacao.${decisao}`, { tipo: "student_product", id }, decisao === "aprovar" ? { link } : { motivo });
  revalidatePath("/admin/afiliacao");
  return { ok: true };
}

const peca = z.object({
  tipo: z.enum(["anuncio", "video", "texto", "story", "pagina"]),
  titulo: z.string().trim().min(2).max(200),
  texto: z.string().trim().max(4000).optional(),
  idioma: z.enum(["pt", "en", "es"]).default("pt"),
  ordem: z.coerce.number().int().default(0),
});

export async function salvarPeca(_p: { ok?: boolean; erro?: string } | null, form: FormData) {
  const admin = await requireAdmin(["conteudo"]);
  const v = peca.safeParse(Object.fromEntries(form));
  if (!v.success) return { erro: "Confira tipo, título e texto." };
  const [p] = await db().insert(schema.kitPieces).values({ ...v.data, texto: v.data.texto || null }).returning({ id: schema.kitPieces.id });
  await audit(admin.id, "kit.criar", { tipo: "kit_piece", id: p!.id }, { titulo: v.data.titulo });
  revalidatePath("/admin/kit");
  return { ok: true };
}

export async function alternarPeca(id: string, ativo: boolean) {
  const admin = await requireAdmin(["conteudo"]);
  await db().update(schema.kitPieces).set({ ativo }).where(eq(schema.kitPieces.id, z.string().uuid().parse(id)));
  await audit(admin.id, ativo ? "kit.ativar" : "kit.pausar", { tipo: "kit_piece", id });
  revalidatePath("/admin/kit");
}
