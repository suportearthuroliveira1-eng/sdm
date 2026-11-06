import { renderToBuffer } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import type { CapEbook, ExtrasEbook } from "@/lib/domain/temas";
import { EbookPdf } from "@/lib/gen/ebook-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * PDF do ebook (B4 parte 4): montagem em src/lib/gen/ebook-pdf.tsx (capa, créditos,
 * sumário clicável, introdução, abertura por capítulo, caixas, conclusão). ?lang=pt baixa a versão
 * em português, só pra ela conferir.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/ebook/[id]">) {
  const user = await getAuthUser();
  if (!user) return new Response("não autorizado", { status: 401 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return new Response("não encontrado", { status: 404 });
  const student = await db().query.students.findFirst({ where: eq(schema.students.authUserId, user.id) });
  if (!student) return new Response("não autorizado", { status: 401 });
  const eb = await db().query.ebooks.findFirst({ where: and(eq(schema.ebooks.studentProductId, id), eq(schema.ebooks.studentId, student.id)) });
  if (!eb) return new Response("não encontrado", { status: 404 });

  const pt = new URL(req.url).searchParams.get("lang") === "pt";
  const ideia = (eb.ideia ?? {}) as { titulo?: { x: string; pt: string }; subtitulo?: { x: string; pt: string }; extras?: ExtrasEbook };
  const titulo = (pt ? ideia.titulo?.pt : ideia.titulo?.x) ?? eb.titulo ?? "";
  const sub = (pt ? ideia.subtitulo?.pt : ideia.subtitulo?.x) ?? "";
  const doc = EbookPdf({ titulo, subtitulo: sub, autora: student.nome, idioma: eb.idioma ?? "en", pt, tema: eb.temaVisual ?? "lilas", capitulos: (eb.capitulos ?? []) as CapEbook[], extras: ideia.extras ?? null });
  const buf = await renderToBuffer(doc);
  const nome = (titulo || "ebook").replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 60);
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `${new URL(req.url).searchParams.get("baixar") ? "attachment" : "inline"}; filename="${nome}${pt ? "-pt" : ""}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
