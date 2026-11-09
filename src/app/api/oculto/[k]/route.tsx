import { renderToBuffer } from "@react-pdf/renderer";
import { eq } from "drizzle-orm";
import { getAdmin } from "@/lib/auth/admin";
import { getAuthUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { CATALOGO_OCULTO, liberadaNoOculto, type DadosOculto } from "@/lib/domain/pais-oculto";
import { faixa, fmtPreco } from "@/lib/domain/precos";
import { DossieOcultoPdf, type EstrategiaPdf } from "@/lib/gen/oculto-pdf";
import { tabelaPrecos } from "@/lib/server/config-app";
import { configOculto } from "@/lib/server/pais-oculto";

export const runtime = "nodejs";
export const maxDuration = 60;

/** PDF do dossiê da estratégia secreta de um país (só pra quem tem acesso ao País Oculto). */
export async function GET(_req: Request, ctx: RouteContext<"/api/oculto/[k]">) {
  const user = await getAuthUser();
  if (!user) return new Response("não autorizado", { status: 401 });
  const { k } = await ctx.params;
  const pais = CATALOGO_OCULTO.find((p) => p.k === k);
  if (!pais) return new Response("não encontrado", { status: 404 });
  const student = await db().query.students.findFirst({ where: eq(schema.students.authUserId, user.id) });
  if (!student) return new Response("não autorizado", { status: 401 });
  const [cfg, admin] = await Promise.all([configOculto(), getAdmin()]);
  if (!liberadaNoOculto(cfg, student.id, Boolean(admin))) return new Response("não encontrado", { status: 404 });
  const est = ((((student.cartoes ?? {}) as { oculto?: DadosOculto }).oculto?.estrategias ?? {})[k]) as EstrategiaPdf | undefined;
  if (!est) return new Response("Gere a estratégia antes.", { status: 404 });
  const f = faixa(pais.moedaPreco, await tabelaPrecos());
  const preco = `${fmtPreco(f.sugerido, pais.moedaPreco)} (faixa ${fmtPreco(f.min, pais.moedaPreco)} a ${fmtPreco(f.max, pais.moedaPreco)})`;
  const buf = await renderToBuffer(DossieOcultoPdf({ e: est, pais: pais.nome, idioma: pais.idioma, moeda: pais.moeda, preco, aluna: student.nome }));
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="estrategia-secreta-${pais.k}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
