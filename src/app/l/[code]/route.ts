import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { trackingProvider } from "@/lib/integrations/tracking";
import { rateLimit } from "@/lib/server/rate-limit";

/**
 * Link da bio: /l/[código]?r=instagram → conta o clique e manda pro destino da pasta
 * (link de afiliada, link do SDM aprovado ou checkout do produto próprio).
 */
export async function GET(req: Request, ctx: RouteContext<"/l/[code]">) {
  const { code } = await ctx.params;
  if (!/^[a-z0-9_-]{4,20}$/i.test(code)) return new NextResponse("Link não encontrado.", { status: 404 });
  const p = await db().query.studentProducts.findFirst({ where: eq(schema.studentProducts.bioCode, code.toLowerCase()) });
  if (!p) return new NextResponse("Link não encontrado.", { status: 404 });
  const d = (p.dados ?? {}) as { afiliacao?: { link?: string }; checkout?: { url?: string; ok?: boolean }; paginaUrl?: string };
  const destino = p.tipo === "sdm" ? d.afiliacao?.link : p.tipo === "proprio" ? (d.paginaUrl ?? (d.checkout?.ok ? d.checkout.url : undefined)) : p.linkAfiliada;
  if (!destino || !/^https?:\/\//.test(destino)) return new NextResponse("Esse link ainda não foi configurado.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });

  const url = new URL(req.url);
  const ua = req.headers.get("user-agent") ?? "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const bot = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|slack|discord|telegram/i.test(ua);
  // não conta robô nem clique repetido da mesma pessoa no mesmo minuto
  if (!bot && (await rateLimit(`bio:${p.id}:${createHash("sha256").update(ip + ua).digest("hex").slice(0, 16)}`, 1, 60)).ok) {
    await db().insert(schema.linkClicks).values({ studentProductId: p.id, rede: url.searchParams.get("r")?.slice(0, 30) ?? null, post: url.searchParams.get("p")?.slice(0, 60) ?? null, uaHash: createHash("sha256").update(ua).digest("hex").slice(0, 32) });
    await trackingProvider().track({ type: "bio_click", studentProductCode: p.code, rede: url.searchParams.get("r") ?? undefined, ts: new Date() });
  }
  return NextResponse.redirect(destino, { status: 302, headers: { "Cache-Control": "no-store" } });
}
