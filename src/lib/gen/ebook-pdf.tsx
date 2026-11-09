import "server-only";
import path from "node:path";
import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { limparTitulo, TEMAS, type CapEbook, type ExtrasEbook, type TemaKey } from "@/lib/domain/temas";

/* ---------- fontes (OFL, em public/fonts) ---------- */
let fontesOk = false;
export function registrarFontes() {
  if (fontesOk) return;
  const f = (n: string) => path.join(process.cwd(), "public", "fonts", `${n}.ttf`);
  Font.register({ family: "Jakarta", fonts: [{ src: f("Jakarta-Regular") }, { src: f("Jakarta-Italic"), fontStyle: "italic" }, { src: f("Jakarta-Bold"), fontWeight: 700 }, { src: f("Jakarta-ExtraBold"), fontWeight: 800 }] });
  Font.register({ family: "Lora", fonts: [{ src: f("Lora-Regular") }, { src: f("Lora-Italic"), fontStyle: "italic" }, { src: f("Lora-Bold"), fontWeight: 700 }] });
  Font.register({ family: "Playfair", fonts: [{ src: f("Playfair-Bold"), fontWeight: 700 }, { src: f("Playfair-ExtraBold"), fontWeight: 800 }, { src: f("Playfair-Italic"), fontStyle: "italic" }, { src: f("Playfair-Bold") }] });
  Font.registerHyphenationCallback((w) => [w]); // sem hifenização estranha
  fontesOk = true;
}

/* ---------- textos fixos por idioma ---------- */
const L = {
  en: { cap: "CHAPTER", sum: "Contents", intro: "Introduction", usar: "How to use this ebook", pratica: "In practice", erros: "Common mistakes", lembrar: "Key takeaways", exerc: "Your turn", concl: "Conclusion", prox: "Your next steps", obrigada: "Thank you for reading", direitos: "All rights reserved.", ebook: "EBOOK", por: "by", aviso: "" },
  es: { cap: "CAPÍTULO", sum: "Contenido", intro: "Introducción", usar: "Cómo usar este ebook", pratica: "En la práctica", erros: "Errores comunes", lembrar: "Para recordar", exerc: "Tu turno", concl: "Conclusión", prox: "Tus próximos pasos", obrigada: "Gracias por leer", direitos: "Todos los derechos reservados.", ebook: "EBOOK", por: "por", aviso: "" },
  pt: { cap: "CAPÍTULO", sum: "Sumário", intro: "Introdução", usar: "Como usar este ebook", pratica: "Na prática", erros: "Erros comuns", lembrar: "Pra lembrar", exerc: "Sua vez", concl: "Conclusão", prox: "Seus próximos passos", obrigada: "Obrigada por ler", direitos: "Todos os direitos reservados.", ebook: "EBOOK", por: "por", aviso: "Versão em português só pra você conferir. Não venda esta versão." },
} as const;

type Dados = {
  titulo: string;
  subtitulo: string;
  autora: string;
  idioma: string;
  pt: boolean;
  tema: string;
  capitulos: CapEbook[];
  extras: ExtrasEbook | null;
};

/** Mistura uma cor #RRGGBB com branco (0 = cor, 1 = branco). */
function clarear(hex: string, t: number) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `#${c.map((v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

export function EbookPdf(d: Dados) {
  registrarFontes();
  const tema = TEMAS[(d.tema as TemaKey) ?? "lilas"] ?? TEMAS.lilas;
  const t = d.pt ? L.pt : d.idioma === "es" ? L.es : L.en;
  const corpo = tema.corpo;
  const tit = tema.titulos;
  const suave = clarear(tema.destaque, 0.88);
  const caps = d.capitulos.filter((c) => c.texto);
  const ex = d.extras ? (d.pt ? d.extras.pt : d.extras) : null;
  const ano = new Date().getFullYear();

  const s = StyleSheet.create({
    pag: { backgroundColor: "#FFFFFF", color: tema.texto, fontFamily: corpo, fontSize: 11.5, lineHeight: 1.65, paddingTop: 70, paddingBottom: 70, paddingHorizontal: 62 },
    cab: { position: "absolute", top: 28, left: 62, right: 62, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#8A8494", borderBottomWidth: 0.6, borderBottomColor: clarear(tema.destaque, 0.6), paddingBottom: 6, letterSpacing: 0.6 },
    rod: { position: "absolute", bottom: 30, left: 62, right: 62, flexDirection: "row", justifyContent: "center", alignItems: "center" },
    rodN: { fontSize: 9, color: tema.destaque, fontFamily: corpo, fontWeight: 700 },
    h1: { fontFamily: tit, fontWeight: 800, fontSize: 30, lineHeight: 1.15, color: tema.capa, marginBottom: 16 },
    h2: { fontFamily: tit, fontWeight: 700, fontSize: 17, lineHeight: 1.25, color: tema.capa, marginTop: 18, marginBottom: 8 },
    p: { marginBottom: 10, textAlign: "justify" },
    kicker: { fontSize: 9, letterSpacing: 2, color: tema.destaque, fontWeight: 700, marginBottom: 8 },
    caixa: { borderRadius: 10, padding: 16, marginVertical: 12 },
    caixaT: { fontWeight: 700, fontSize: 10, letterSpacing: 1.2, marginBottom: 8 },
  });

  const cabecalho = (dir: string) => (
    <View style={s.cab} fixed>
      <Text>{d.titulo.toUpperCase().slice(0, 60)}</Text>
      <Text>{dir.slice(0, 50)}</Text>
    </View>
  );
  const rodape = () => (
    <View style={s.rod} fixed>
      <View style={{ width: 18, height: 1, backgroundColor: clarear(tema.destaque, 0.5), marginRight: 8 }} />
      <Text style={s.rodN} render={({ pageNumber }) => String(pageNumber)} />
      <View style={{ width: 18, height: 1, backgroundColor: clarear(tema.destaque, 0.5), marginLeft: 8 }} />
    </View>
  );
  const lista = (itens: string[], cor: string, marca: "num" | "check" | "box" | "ponto" = "num") => (
    <View>
      {itens.map((x, i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: 7 }} wrap={false}>
          {marca === "num" ? (
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: cor, marginRight: 10, marginTop: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: 700, lineHeight: 1 }}>{i + 1}</Text>
            </View>
          ) : marca === "box" ? (
            <View style={{ width: 13, height: 13, borderWidth: 1.4, borderColor: cor, borderRadius: 3, marginRight: 10, marginTop: 3 }} />
          ) : marca === "check" ? (
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: cor, marginRight: 10, marginTop: 3 }} />
          ) : (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cor, marginRight: 10, marginTop: 7 }} />
          )}
          <Text style={{ flex: 1 }}>{x}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <Document title={d.titulo} author={d.autora} language={d.pt ? "pt" : d.idioma}>
      {/* CAPA */}
      <Page size="A4" style={{ backgroundColor: tema.capa, color: "#FFFFFF", fontFamily: corpo, padding: 0 }}>
        <View style={{ position: "absolute", top: -120, right: -120, width: 380, height: 380, borderRadius: 190, backgroundColor: tema.destaque, opacity: 0.35 }} />
        <View style={{ position: "absolute", top: 60, right: 40, width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: clarear(tema.destaque, 0.4), opacity: 0.6 }} />
        <View style={{ position: "absolute", bottom: -80, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: clarear(tema.capa, 0.12) }} />
        <View style={{ flex: 1, justifyContent: "flex-end", paddingHorizontal: 64, paddingBottom: 110 }}>
          <Text style={{ fontSize: 10, letterSpacing: 4, color: clarear(tema.destaque, 0.5), fontWeight: 700, marginBottom: 18 }}>{t.ebook}</Text>
          <View style={{ width: 70, height: 6, backgroundColor: tema.destaque, marginBottom: 26, borderRadius: 3 }} />
          <Text style={{ fontFamily: tit, fontWeight: 800, fontSize: d.titulo.length > 50 ? 36 : 44, lineHeight: 1.08, marginBottom: 20 }}>{d.titulo}</Text>
          {d.subtitulo ? <Text style={{ fontSize: 15, lineHeight: 1.5, opacity: 0.88, maxWidth: 400 }}>{d.subtitulo}</Text> : null}
          <Text style={{ marginTop: 46, fontSize: 11, letterSpacing: 1.5, opacity: 0.8 }}>{t.por.toUpperCase()} {d.autora.toUpperCase()}</Text>
          {d.pt ? <Text style={{ marginTop: 18, fontSize: 9, opacity: 0.7 }}>{L.pt.aviso}</Text> : null}
        </View>
      </Page>

      {/* CRÉDITOS */}
      <Page size="A4" style={[s.pag, { justifyContent: "flex-end" }]}>
        <Text style={{ fontFamily: tit, fontWeight: 700, fontSize: 14, color: tema.capa, marginBottom: 6 }}>{d.titulo}</Text>
        <Text style={{ fontSize: 9, color: "#6E6878", marginBottom: 14 }}>© {ano} {d.autora}. {t.direitos}</Text>
        {ex?.aviso ? <Text style={{ fontSize: 9, color: "#6E6878", lineHeight: 1.5 }}>{ex.aviso}</Text> : null}
      </Page>

      {/* SUMÁRIO */}
      <Page size="A4" style={s.pag}>
        <Text style={s.kicker}>{t.sum.toUpperCase()}</Text>
        <Text style={[s.h1, { marginBottom: 26 }]}>{t.sum}</Text>
        {ex ? (
          <Link src="#intro" style={{ textDecoration: "none", color: tema.texto }}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.6, borderBottomColor: "#E6E1EC" }}>
              <Text style={{ width: 46, fontFamily: tit, fontWeight: 800, fontSize: 18, color: clarear(tema.destaque, 0.35) }}>—</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{ex.introducao.titulo || t.intro}</Text>
            </View>
          </Link>
        ) : null}
        {caps.map((c, i) => (
          <Link key={i} src={`#cap-${i + 1}`} style={{ textDecoration: "none", color: tema.texto }}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.6, borderBottomColor: "#E6E1EC" }}>
              <Text style={{ width: 46, fontFamily: tit, fontWeight: 800, fontSize: 22, color: tema.destaque }}>{String(i + 1).padStart(2, "0")}</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{limparTitulo(d.pt ? c.texto!.pt.titulo : c.texto!.titulo)}</Text>
            </View>
          </Link>
        ))}
        {ex ? (
          <Link src="#fim" style={{ textDecoration: "none", color: tema.texto }}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10 }}>
              <Text style={{ width: 46, fontFamily: tit, fontWeight: 800, fontSize: 18, color: clarear(tema.destaque, 0.35) }}>—</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{ex.conclusao.titulo || t.concl}</Text>
            </View>
          </Link>
        ) : null}
        {rodape()}
      </Page>

      {/* INTRODUÇÃO */}
      {ex ? (
        <Page size="A4" style={s.pag} id="intro">
          {cabecalho(t.intro)}
          <Text style={s.kicker}>{t.intro.toUpperCase()}</Text>
          <Text style={s.h1}>{ex.introducao.titulo || t.intro}</Text>
          {ex.introducao.paragrafos.map((p, i) => <Text key={i} style={s.p}>{p}</Text>)}
          {ex.como_usar.length ? (
            <View style={[s.caixa, { backgroundColor: suave }]} wrap={false}>
              <Text style={[s.caixaT, { color: tema.capa }]}>{t.usar.toUpperCase()}</Text>
              {lista(ex.como_usar, tema.destaque)}
            </View>
          ) : null}
          {rodape()}
        </Page>
      ) : null}

      {/* CAPÍTULOS */}
      {caps.flatMap((c, i) => {
        const x = d.pt ? c.texto!.pt : c.texto!;
        return [
          <Page key={`a${i}`} size="A4" id={`cap-${i + 1}`} style={{ backgroundColor: tema.capa, color: "#FFFFFF", fontFamily: corpo, padding: 64, justifyContent: "center" }}>
            <View style={{ position: "absolute", bottom: -100, right: -100, width: 320, height: 320, borderRadius: 160, backgroundColor: tema.destaque, opacity: 0.25 }} />
            <Text style={{ fontFamily: tit, fontWeight: 800, fontSize: 130, lineHeight: 1, color: tema.destaque, opacity: 0.9 }}>{String(i + 1).padStart(2, "0")}</Text>
            <Text style={{ fontSize: 10, letterSpacing: 3, marginTop: 12, marginBottom: 12, opacity: 0.8, fontWeight: 700 }}>{t.cap} {i + 1}</Text>
            <Text style={{ fontFamily: tit, fontWeight: 800, fontSize: 32, lineHeight: 1.15, marginBottom: 22 }}>{limparTitulo(x.titulo)}</Text>
            {x.abertura ? (
              <View style={{ borderLeftWidth: 3, borderLeftColor: tema.destaque, paddingLeft: 14, maxWidth: 420 }}>
                <Text style={{ fontStyle: "italic", fontSize: 14, lineHeight: 1.5, opacity: 0.92 }}>{x.abertura}</Text>
              </View>
            ) : null}
          </Page>,
          <Page key={`c${i}`} size="A4" style={s.pag}>
            {cabecalho(`${t.cap} ${i + 1}`)}
            {x.paragrafos.map((p, k) => (
              <Text key={k} style={k === 0 ? [s.p, { fontSize: 13.5, lineHeight: 1.6, color: tema.capa }] : s.p}>{p}</Text>
            ))}
            {(x.secoes ?? []).map((sc, k) => (
              <View key={`s${k}`}>
                {/* subtítulo preso ao 1º parágrafo: nunca fica sozinho no pé da página */}
                <View wrap={false}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 8 }}>
                    <View style={{ width: 4, height: 18, backgroundColor: tema.destaque, borderRadius: 2, marginRight: 10 }} />
                    <Text style={[s.h2, { marginTop: 0, marginBottom: 0, flex: 1 }]}>{sc.titulo}</Text>
                  </View>
                  {sc.paragrafos[0] ? <Text style={s.p}>{sc.paragrafos[0]}</Text> : null}
                </View>
                {sc.paragrafos.slice(1).map((p, j) => <Text key={j} style={s.p}>{p}</Text>)}
              </View>
            ))}
            {x.lista.length ? (
              <View style={{ marginTop: 6 }}>
                {lista(x.lista, tema.destaque)}
              </View>
            ) : null}
            {x.destaque ? (
              <View style={{ marginVertical: 18, paddingVertical: 14, paddingHorizontal: 22, borderTopWidth: 1, borderBottomWidth: 1, borderColor: clarear(tema.destaque, 0.55) }} wrap={false}>
                <Text style={{ fontFamily: tit, fontSize: 40, lineHeight: 0.8, color: tema.destaque, marginBottom: 2 }}>“</Text>
                <Text style={{ fontFamily: tit, fontStyle: "italic", fontSize: 16, lineHeight: 1.45, color: tema.capa, textAlign: "center" }}>{x.destaque}</Text>
              </View>
            ) : null}
            {x.na_pratica ? (
              <View style={[s.caixa, { backgroundColor: suave }]} wrap={false}>
                <Text style={[s.caixaT, { color: tema.capa }]}>{t.pratica.toUpperCase()}</Text>
                <Text>{x.na_pratica}</Text>
              </View>
            ) : null}
            {x.erros_comuns?.length ? (
              <View style={[s.caixa, { backgroundColor: "#FFF6E8", borderLeftWidth: 4, borderLeftColor: "#E3A33B" }]} wrap={false}>
                <Text style={[s.caixaT, { color: "#9A6510" }]}>{t.erros.toUpperCase()}</Text>
                {lista(x.erros_comuns, "#E3A33B", "ponto")}
              </View>
            ) : null}
            {x.resumo?.length ? (
              <View style={[s.caixa, { backgroundColor: tema.capa, color: "#FFFFFF" }]} wrap={false}>
                <Text style={[s.caixaT, { color: clarear(tema.destaque, 0.5) }]}>{t.lembrar.toUpperCase()}</Text>
                {lista(x.resumo, tema.destaque, "check")}
              </View>
            ) : null}
            {x.exercicio ? (
              <View style={[s.caixa, { borderWidth: 1.4, borderColor: tema.destaque }]} wrap={false}>
                <Text style={[s.caixaT, { color: tema.destaque }]}>{t.exerc.toUpperCase()}</Text>
                <Text style={{ marginBottom: 10 }}>{x.exercicio}</Text>
                {[0, 1, 2, 3, 4].map((k) => <View key={k} style={{ borderBottomWidth: 0.7, borderBottomColor: "#D9D3E2", height: 22 }} />)}
              </View>
            ) : null}
            {rodape()}
          </Page>,
        ];
      })}

      {/* CONCLUSÃO */}
      {ex ? (
        <Page size="A4" style={s.pag} id="fim">
          {cabecalho(t.concl)}
          <Text style={s.kicker}>{t.concl.toUpperCase()}</Text>
          <Text style={s.h1}>{ex.conclusao.titulo || t.concl}</Text>
          {ex.conclusao.paragrafos.map((p, i) => <Text key={i} style={s.p}>{p}</Text>)}
          {ex.proximos_passos.length ? (
            <View style={[s.caixa, { backgroundColor: suave }]} wrap={false}>
              <Text style={[s.caixaT, { color: tema.capa }]}>{t.prox.toUpperCase()}</Text>
              {lista(ex.proximos_passos, tema.destaque, "box")}
            </View>
          ) : null}
          {rodape()}
        </Page>
      ) : null}

      {/* FIM */}
      <Page size="A4" style={{ backgroundColor: tema.capa, color: "#FFFFFF", fontFamily: corpo, padding: 64, justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: 50, height: 4, backgroundColor: tema.destaque, borderRadius: 2, marginBottom: 22 }} />
        <Text style={{ fontFamily: tit, fontWeight: 800, fontSize: 30, textAlign: "center", marginBottom: 14 }}>{t.obrigada}</Text>
        <Text style={{ fontSize: 12, opacity: 0.85, textAlign: "center", maxWidth: 360 }}>{d.titulo}</Text>
        <Text style={{ fontSize: 10, opacity: 0.7, marginTop: 30, letterSpacing: 1.5 }}>{d.autora.toUpperCase()}</Text>
      </Page>
    </Document>
  );
}
