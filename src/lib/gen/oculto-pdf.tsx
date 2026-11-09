import "server-only";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { registrarFontes } from "./ebook-pdf";

type Bi = { x: string; pt: string };
export type EstrategiaPdf = {
  segredo: string;
  produto: { nome_provisorio: string; publico: Bi; dor: Bi; promessa: Bi; por_que_vende: string; formato: string };
  angulo: { titulo: string; explicacao: string };
  oferta: { bonus: string[]; garantia: string };
  onde_divulgar: { canal: string; como: string }[];
  plano: { fase: string; quando: string; acoes: string[] }[];
  ganchos: Bi[];
  onde_receber: string;
  cuidados: string[];
};

const OURO = "#E3A63B";
const NOITE = "#120D1F";
const TINTA = "#1E1A2B";
const CINZA = "#5E5870";

const s = StyleSheet.create({
  capa: { backgroundColor: NOITE, padding: 56, color: "#FFF4D6", fontFamily: "Jakarta", justifyContent: "space-between" },
  selo: { fontSize: 9, letterSpacing: 3, color: OURO, fontWeight: 700 },
  titulo: { fontFamily: "Playfair", fontWeight: 800, fontSize: 40, color: "#FFF4D6", marginTop: 14, lineHeight: 1.1 },
  pais: { fontSize: 18, color: OURO, marginTop: 10, fontWeight: 700 },
  segredoCapa: { fontFamily: "Lora", fontStyle: "italic", fontSize: 13, lineHeight: 1.6, color: "#E9E2F7", marginTop: 26, borderLeft: `3pt solid ${OURO}`, paddingLeft: 14 },
  rodapeCapa: { fontSize: 9, color: "#9C93B5" },
  pag: { padding: 48, paddingBottom: 60, fontFamily: "Jakarta", fontSize: 10.5, color: TINTA, lineHeight: 1.55 },
  cab: { position: "absolute", top: 22, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: CINZA, borderBottom: "0.5pt solid #DDD6EA", paddingBottom: 6 },
  rod: { position: "absolute", bottom: 26, left: 48, right: 48, fontSize: 8, color: CINZA, textAlign: "center" },
  secao: { marginBottom: 18 },
  rotulo: { fontSize: 8.5, letterSpacing: 2, color: OURO, fontWeight: 700, marginBottom: 4 },
  h: { fontFamily: "Playfair", fontWeight: 700, fontSize: 17, color: TINTA, marginBottom: 6 },
  p: { marginBottom: 4 },
  peq: { fontSize: 9, color: CINZA, fontStyle: "italic" },
  caixa: { backgroundColor: "#FBF5E6", borderRadius: 8, padding: 12, marginTop: 4 },
  linha: { flexDirection: "row", marginBottom: 3 },
  bola: { width: 18, height: 18, borderRadius: 9, backgroundColor: OURO, color: NOITE, fontSize: 9, fontWeight: 700, textAlign: "center", paddingTop: 3, marginRight: 8 },
  check: { width: 9, height: 9, border: `1pt solid ${CINZA}`, borderRadius: 2, marginRight: 7, marginTop: 3 },
});

function Bil({ r, v }: { r: string; v: Bi }) {
  return (
    <View style={{ marginBottom: 5 }}>
      <Text><Text style={{ fontWeight: 700 }}>{r}: </Text>{v.pt}</Text>
      {v.x !== v.pt ? <Text style={s.peq}>{v.x}</Text> : null}
    </View>
  );
}

function Secao({ rotulo, titulo, children }: { rotulo: string; titulo?: string; children: React.ReactNode }) {
  return (
    <View style={s.secao} wrap={false}>
      <Text style={s.rotulo}>{rotulo.toUpperCase()}</Text>
      {titulo ? <Text style={s.h}>{titulo}</Text> : null}
      {children}
    </View>
  );
}

/** Dossiê da estratégia secreta (PDF): capa noturna com o segredo, depois cada parte em seções. */
export function DossieOcultoPdf({ e, pais, idioma, moeda, preco, aluna }: { e: EstrategiaPdf; pais: string; idioma: string; moeda: string; preco: string; aluna: string }) {
  registrarFontes();
  const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const cab = (
    <View style={s.cab} fixed>
      <Text>País Oculto · Estratégia secreta</Text>
      <Text>{pais}</Text>
    </View>
  );
  const rod = <Text style={s.rod} fixed render={({ pageNumber, totalPages }) => `Feito pela IA do SDM pra ${aluna} · ${hoje} · ${pageNumber}/${totalPages}`} />;
  return (
    <Document title={`Estratégia secreta · ${pais}`} author="SDM">
      <Page size="A4" style={s.capa}>
        <View>
          <Text style={s.selo}>PAÍS OCULTO · DOSSIÊ CONFIDENCIAL</Text>
          <Text style={s.titulo}>A estratégia secreta</Text>
          <Text style={s.pais}>{pais}</Text>
          <Text style={{ fontSize: 10, color: "#B8AFD0", marginTop: 6 }}>{idioma} · {moeda}</Text>
          <Text style={s.segredoCapa}>{e.segredo}</Text>
        </View>
        <Text style={s.rodapeCapa}>Preparado pra {aluna} em {hoje}. A IA mostra o caminho; quem decide e faz é você. Nada aqui é promessa de resultado.</Text>
      </Page>
      <Page size="A4" style={s.pag}>
        {cab}
        <Secao rotulo="O produto ideal" titulo={e.produto.nome_provisorio}>
          <Text style={[s.p, s.peq]}>{e.produto.formato}</Text>
          <Bil r="Pra quem" v={e.produto.publico} />
          <Bil r="A dor" v={e.produto.dor} />
          <Bil r="A promessa" v={e.produto.promessa} />
          <Text style={s.p}><Text style={{ fontWeight: 700 }}>Por que vende lá: </Text>{e.produto.por_que_vende}</Text>
        </Secao>
        <Secao rotulo="O ângulo que ninguém usa" titulo={e.angulo.titulo}>
          <Text style={s.p}>{e.angulo.explicacao}</Text>
        </Secao>
        <Secao rotulo="A oferta">
          <View style={s.caixa}>
            <Text style={s.p}><Text style={{ fontWeight: 700 }}>Preço de entrada: </Text>{preco}</Text>
            {e.oferta.bonus.length ? <Text style={s.p}><Text style={{ fontWeight: 700 }}>Bônus: </Text>{e.oferta.bonus.join(" · ")}</Text> : null}
            <Text><Text style={{ fontWeight: 700 }}>Garantia: </Text>{e.oferta.garantia}</Text>
          </View>
        </Secao>
        <Secao rotulo="Onde divulgar">
          {e.onde_divulgar.map((d) => <Text key={d.canal} style={s.p}><Text style={{ fontWeight: 700 }}>{d.canal}: </Text>{d.como}</Text>)}
        </Secao>
        <View style={s.secao}>
          <Text style={s.rotulo}>O PLANO EM FASES</Text>
          {e.plano.map((f, i) => (
            <View key={f.fase} style={{ marginBottom: 10 }} wrap={false}>
              <View style={s.linha}><Text style={s.bola}>{i + 1}</Text><Text style={{ fontWeight: 700, paddingTop: 2 }}>{f.fase} <Text style={{ fontWeight: 400, color: CINZA }}>· {f.quando}</Text></Text></View>
              {f.acoes.map((a) => <View key={a} style={[s.linha, { marginLeft: 26 }]}><View style={s.check} /><Text style={{ flex: 1 }}>{a}</Text></View>)}
            </View>
          ))}
        </View>
        <Secao rotulo="Os primeiros ganchos">
          {e.ganchos.map((g) => (
            <View key={g.x} style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 700 }}>{g.x}</Text>
              {g.pt !== g.x ? <Text style={s.peq}>{g.pt}</Text> : null}
            </View>
          ))}
        </Secao>
        <Secao rotulo="Onde receber"><Text style={s.p}>{e.onde_receber}</Text></Secao>
        <Secao rotulo="Cuidados">{e.cuidados.map((c) => <Text key={c} style={s.p}>• {c}</Text>)}</Secao>
        {rod}
      </Page>
    </Document>
  );
}
