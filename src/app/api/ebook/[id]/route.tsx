import { Document, Link, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { TEMAS, type CapEbook, type TemaKey } from "@/lib/domain/temas";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * PDF do ebook (B4 parte 4) com @react-pdf/renderer: capa no tema escolhido,
 * sumário clicável, capítulos com numeração de página. ?lang=pt baixa a versão
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
  const tema = TEMAS[(eb.temaVisual as TemaKey) ?? "lilas"] ?? TEMAS.lilas;
  const caps = ((eb.capitulos ?? []) as CapEbook[]).filter((c) => c.texto);
  const ideia = (eb.ideia ?? {}) as { titulo?: { x: string; pt: string }; subtitulo?: { x: string; pt: string } };
  const titulo = (pt ? ideia.titulo?.pt : ideia.titulo?.x) ?? eb.titulo ?? "";
  const sub = (pt ? ideia.subtitulo?.pt : ideia.subtitulo?.x) ?? "";
  const bold = tema.fonte === "Times-Roman" ? "Times-Bold" : tema.fonte === "Courier" ? "Courier-Bold" : "Helvetica-Bold";

  const s = StyleSheet.create({
    page: { backgroundColor: tema.fundo, color: tema.texto, fontFamily: tema.fonte, fontSize: 11.5, lineHeight: 1.55, paddingTop: 56, paddingBottom: 64, paddingHorizontal: 60 },
    capa: { backgroundColor: tema.capa, color: "#FFFFFF", padding: 64, justifyContent: "center", fontFamily: tema.fonte },
    capaT: { fontFamily: bold, fontSize: 34, lineHeight: 1.2, marginBottom: 18 },
    capaS: { fontSize: 15, opacity: 0.85, lineHeight: 1.4 },
    faixa: { width: 64, height: 6, backgroundColor: tema.destaque, marginBottom: 28 },
    h1: { fontFamily: bold, fontSize: 22, color: tema.capa, marginBottom: 14, lineHeight: 1.25 },
    n: { fontSize: 10, color: tema.destaque, fontFamily: bold, marginBottom: 6, letterSpacing: 1 },
    p: { marginBottom: 9 },
    li: { marginBottom: 5, paddingLeft: 12 },
    destaque: { backgroundColor: "#FFFFFF", borderLeftWidth: 4, borderLeftColor: tema.destaque, padding: 12, marginVertical: 10, fontFamily: bold },
    exerc: { borderWidth: 1, borderColor: tema.destaque, borderRadius: 6, padding: 12, marginTop: 10 },
    pagina: { position: "absolute", bottom: 28, left: 60, right: 60, fontSize: 9, color: "#888", textAlign: "center" },
    sumItem: { marginBottom: 8, color: tema.texto, textDecoration: "none" },
  });

  const doc = (
    <Document title={titulo} author={student.nome} language={pt ? "pt" : eb.idioma ?? "en"}>
      <Page size="A4" style={s.capa}>
        <View style={s.faixa} />
        <Text style={s.capaT}>{titulo}</Text>
        {sub ? <Text style={s.capaS}>{sub}</Text> : null}
        {pt ? <Text style={{ marginTop: 40, fontSize: 10, opacity: 0.7 }}>Versão em português só pra você conferir. Não venda esta versão.</Text> : null}
      </Page>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>{pt ? "Sumário" : eb.idioma === "es" ? "Contenido" : "Contents"}</Text>
        {caps.map((c, i) => (
          <Link key={i} src={`#cap-${i + 1}`} style={s.sumItem}>
            {i + 1}. {pt ? c.texto!.pt.titulo : c.texto!.titulo}
          </Link>
        ))}
        <Text style={s.pagina} render={({ pageNumber }) => String(pageNumber)} fixed />
      </Page>
      {caps.map((c, i) => {
        const t = pt ? c.texto!.pt : c.texto!;
        return (
          <Page key={i} size="A4" style={s.page} id={`cap-${i + 1}`}>
            <Text style={s.n}>{(pt ? "CAPÍTULO " : eb.idioma === "es" ? "CAPÍTULO " : "CHAPTER ") + (i + 1)}</Text>
            <Text style={s.h1}>{t.titulo}</Text>
            {t.paragrafos.map((p, k) => <Text key={k} style={s.p}>{p}</Text>)}
            {t.lista.map((l, k) => <Text key={`l${k}`} style={s.li}>• {l}</Text>)}
            {t.destaque ? <Text style={s.destaque}>{t.destaque}</Text> : null}
            {t.exercicio ? <View style={s.exerc}><Text style={{ fontFamily: bold, marginBottom: 4 }}>{pt ? "Exercício" : eb.idioma === "es" ? "Ejercicio" : "Exercise"}</Text><Text>{t.exercicio}</Text></View> : null}
            <Text style={s.pagina} render={({ pageNumber }) => String(pageNumber)} fixed />
          </Page>
        );
      })}
    </Document>
  );
  const buf = await renderToBuffer(doc);
  const nome = (titulo || "ebook").replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 60);
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `${new URL(req.url).searchParams.get("baixar") ? "attachment" : "inline"}; filename="${nome}${pt ? "-pt" : ""}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
