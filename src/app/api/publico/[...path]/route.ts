import { lerImagemPublica } from "@/lib/server/imagens";

/** Imagens públicas do app (capas, banners, foto da Amanda, ícone). Nome do arquivo nunca muda: cache longo. */
export async function GET(_req: Request, ctx: RouteContext<"/api/publico/[...path]">) {
  const { path } = await ctx.params;
  const r = await lerImagemPublica(path);
  if (!r) return new Response("não encontrado", { status: 404 });
  return new Response(r.blob, { headers: { "content-type": r.tipo, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
}
