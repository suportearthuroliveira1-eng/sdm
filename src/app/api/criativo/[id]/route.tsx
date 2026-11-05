import { and, eq } from "drizzle-orm";
import { ImageResponse } from "next/og";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { CORES, type Anuncio } from "@/lib/gen/modelo";
import { urlsAssinadas } from "@/lib/server/storage";

const TAM: Record<string, [number, number]> = { "1:1": [1080, 1080], "4:5": [1080, 1350], "9:16": [1080, 1920] };

/** PNG do criativo de um anúncio (gancho + chamada sobre cor ou imagem da pasta). Só a dona baixa. */
export async function GET(req: Request, ctx: RouteContext<"/api/criativo/[id]">) {
  const user = await getAuthUser();
  if (!user) return new Response("não autorizado", { status: 401 });
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return new Response("não encontrado", { status: 404 });
  const student = await db().query.students.findFirst({ where: eq(schema.students.authUserId, user.id) });
  if (!student) return new Response("não autorizado", { status: 401 });
  const item = await db().query.generatedItems.findFirst({ where: and(eq(schema.generatedItems.id, id), eq(schema.generatedItems.studentId, student.id)) });
  if (!item || item.tipo !== "anuncio") return new Response("não encontrado", { status: 404 });

  const sp = new URL(req.url).searchParams;
  const f = TAM[sp.get("f") ?? "1:1"] ? (sp.get("f") ?? "1:1") : "1:1";
  const [w, h] = TAM[f]!;
  let fundo: string | undefined;
  const imgId = sp.get("img");
  if (imgId && z.string().uuid().safeParse(imgId).success) {
    const img = await db().query.images.findFirst({ where: and(eq(schema.images.id, imgId), eq(schema.images.studentId, student.id)) });
    if (img?.storagePath) fundo = (await urlsAssinadas([img.storagePath], 300))[img.storagePath];
  }
  const a = item.conteudo as Anuncio;
  const grande = a.gancho.x.length > 70 ? 64 : 80;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: CORES[a.cor % 4], fontFamily: "sans-serif" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        {fundo ? <img src={fundo} width={w} height={h} style={{ position: "absolute", inset: 0, objectFit: "cover" }} /> : null}
        <div style={{ position: "absolute", left: 64, right: 64, bottom: 96, display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", background: "#0E0C13", color: "#F4F1F8", fontSize: grande, fontWeight: 700, lineHeight: 1.2, padding: "24px 32px", borderRadius: 24 }}>{a.gancho.x}</div>
          <div style={{ display: "flex", alignSelf: "flex-start", background: "#A98BFF", color: "#140F1F", fontSize: 40, fontWeight: 700, padding: "16px 28px", borderRadius: 999 }}>{a.chamada.x}</div>
        </div>
      </div>
    ),
    { width: w, height: h, headers: { "Content-Disposition": `attachment; filename="${item.code}-${f.replace(":", "x")}.png"`, "Cache-Control": "private, no-store" } },
  );
}
