import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { destinoDaBio } from "@/lib/server/bio";
import { trackingProvider } from "@/lib/integrations/tracking";

/** Botão principal da página de links: conta o clique e manda pro produto (checkout, página ou link de afiliada). */
export async function GET(req: Request, ctx: RouteContext<"/l/[code]/ir">) {
  const { code } = await ctx.params;
  if (!/^[a-z0-9_-]{4,20}$/i.test(code)) return new NextResponse("Link não encontrado.", { status: 404 });
  const p = await db().query.studentProducts.findFirst({ where: eq(schema.studentProducts.bioCode, code.toLowerCase()) });
  const destino = p ? destinoDaBio(p) : null;
  if (!p || !destino) return NextResponse.redirect(new URL(`/l/${code}`, req.url), { status: 302 });
  await trackingProvider().track({ type: "bio_click", studentProductCode: p.code, rede: "botao", ts: new Date() }).catch(() => {});
  return NextResponse.redirect(destino, { status: 302, headers: { "Cache-Control": "no-store" } });
}
