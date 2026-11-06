import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { CopyButton } from "@/components/pasta/copy-button";
import { FormPending, SubmitButton } from "@/components/ux/submit-button";
import { escolherDivulgacao } from "@/lib/actions/caminhos";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { getSetting } from "@/lib/server/settings";
import { Checklist } from "./interativos";
import { itensChecklist, PassoAPasso, SubPassos } from "./comum";
import { NumerosForm } from "./numeros-form";
import { BioPaginaForm } from "./bio-pagina-form";
import { destinoDaBio } from "@/lib/server/bio";

type P = { id: string; dados: Record<string, unknown>; studentId: string; paisVenda: string | null; divulgacao: string | null; bioCode: string | null };
const feito = (p: P, k: string) => Boolean((p.dados.feito as Record<string, boolean> | undefined)?.[k]);
const marcados = (p: P, k: string) => ((p.dados.checks as Record<string, number[]> | undefined)?.[k] ?? []);

/** D0 · como você vai divulgar (2 cartões lado a lado + os dois). */
export function Divulgar({ p }: { p: P }) {
  const op = [
    { k: "pago", t: "Anúncio pago", custo: "Você paga a Meta por dia [verba mínima: regra do time].", tempo: "Uns 20 minutos por dia pra olhar os números.", vel: "Mais rápido pra ter os primeiros cliques.", quem: "Quem tem um valor pequeno que não aperta." },
    { k: "org", t: "Vídeo orgânico", custo: "Sem custo com anúncio.", tempo: "Mais tempo: gravar e postar com constância.", vel: "Mais devagar no começo, cresce com a frequência.", quem: "Quem tem tempo e não tem verba agora." },
  ];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {op.map((o) => (
          <form key={o.k} action={escolherDivulgacao.bind(null, p.id, o.k)} className={`flex flex-col gap-2 rounded-2xl border-[1.5px] p-4 ${p.divulgacao === o.k ? "border-accent bg-sel" : "border-line bg-surface"}`}>
            <span className="text-lg font-bold">{o.t}</span>
            <span className="mu"><b className="text-text-2">Custo:</b> {o.custo}</span>
            <span className="mu"><b className="text-text-2">Tempo por dia:</b> {o.tempo}</span>
            <span className="mu"><b className="text-text-2">Velocidade:</b> {o.vel}</span>
            <span className="mu"><b className="text-text-2">Pra quem:</b> {o.quem}</span>
            <SubmitButton className={p.divulgacao === o.k ? "b1 mt-auto" : "b2 mt-auto"} pendente="Salvando...">{p.divulgacao === o.k ? "Escolhido" : `Escolher ${o.t.toLowerCase()}`}</SubmitButton>
          </form>
        ))}
      </div>
      <form action={escolherDivulgacao.bind(null, p.id, "ambos")}>
        <SubmitButton className={p.divulgacao === "ambos" ? "b1" : "b2 w-full"} pendente="Salvando...">{p.divulgacao === "ambos" ? "Os dois (escolhido)" : "Os dois"}</SubmitButton>
        <FormPending />
      </form>
    </>
  );
}

/** DP1 · base de anúncios. */
export async function BaseAnuncios({ p, proxima }: { p: P; proxima: string }) {
  const ck = await itensChecklist("B03");
  return (
    <>
      <PassoAPasso chaves={["portfolio", "contaads", "cartao"]} />
      <Checklist pastaId={p.id} lista="base-anuncios" titulo={ck.titulo} itens={ck.itens} marcados={marcados(p, "base-anuncios")} etapa="base-anuncios" feita={feito(p, "base-anuncios")} proxima={proxima} />
    </>
  );
}

/** DP3 · pixel. */
export async function Pixel({ p, proxima }: { p: P; proxima: string }) {
  const ck = await itensChecklist("PG05");
  return (
    <>
      <PassoAPasso chaves={["pixelcriar", "pixelpagina", "pixelrede"]} />
      <Checklist pastaId={p.id} lista="pixel" titulo={ck.titulo} itens={ck.itens} marcados={marcados(p, "pixel")} etapa="pixel" feita={feito(p, "pixel")} proxima={proxima} />
    </>
  );
}

/** DO1 · rede e perfil: link da bio com contagem de cliques + aquecimento de 7 dias. */
export async function Perfil({ p, proxima, parte = "link" }: { p: P; proxima: string; parte?: string }) {
  const [ck, cliques, bio] = await Promise.all([
    itensChecklist("OG03"),
    db().select({ id: schema.linkClicks.id }).from(schema.linkClicks).where(eq(schema.linkClicks.studentProductId, p.id)),
    db().query.generatedItems.findFirst({ where: and(eq(schema.generatedItems.studentProductId, p.id), eq(schema.generatedItems.tipo, "bio")), orderBy: desc(schema.generatedItems.createdAt) }),
  ]);
  const pastaRow = await db().query.studentProducts.findFirst({ where: eq(schema.studentProducts.id, p.id) });
  const link = p.bioCode ? `${env().APP_URL}/l/${p.bioCode}` : null;
  const b = bio?.tipo === "bio" ? (bio.conteudo as { bio: { x: string; pt: string }; nomes_perfil?: string[] }) : null;
  const temPagina = Boolean(p.dados.bioPagina);
  const partes = [
    { k: "link", nome: "Link e página", ok: temPagina },
    { k: "bio", nome: "Bio e nome", ok: Boolean(b) },
    { k: "aquecimento", nome: "Aquecimento", ok: feito(p, "perfil") },
  ];
  return (
    <SubPassos base={`/app/p/${p.id}/perfil`} partes={partes} atual={partes.some((x) => x.k === parte) ? parte : "link"}>
      {parte === "bio" ? (
        <div className="cd gap-1.5">
          <span className="kk">BIO E NOME DO PERFIL</span>
          <span className="mu">A bio vai no seu perfil da rede. A IA escreve no idioma de quem compra, com tradução.</span>
          {b ? (
            <>
              <span className="tx">{b.bio.x}</span>
              <span className="mu">{b.bio.pt}</span>
              <CopyButton text={b.bio.x} label="Copiar bio" className="self-start" />
              {b.nomes_perfil?.length ? <span className="mu">Sugestões de nome: {b.nomes_perfil.join(" · ")}</span> : null}
            </>
          ) : null}
          <Link href={`/app/dv01/${p.id}?aba=bio`} className={b ? "b2 no-underline" : "b1 no-underline"}>{b ? "Pedir outra bio" : "Gerar bio com a IA"}</Link>
        </div>
      ) : parte === "aquecimento" ? (
        <Checklist pastaId={p.id} lista="perfil" titulo={`${ck.titulo} (7 dias)`} itens={ck.itens} marcados={marcados(p, "perfil")} etapa="perfil" feita={feito(p, "perfil")} proxima={proxima} />
      ) : (
        <>
          <div className="cd gap-1.5">
            <span className="kk">SEU LINK DA BIO</span>
            {link ? <span className="break-all font-mono text-sm">{link}</span> : null}
            <span className="mu">Cole esse link na bio do Instagram ou TikTok. Ele abre a sua página de links. Cada visita é contada aqui. Total: <b className="text-text">{cliques.length}</b></span>
            {link ? <CopyButton text={link} className="self-start" /> : null}
          </div>
          {link ? (
            <BioPaginaForm
              pastaId={p.id}
              link={link}
              inicial={(p.dados.bioPagina as { nome?: string; frase?: string; botao?: string; links?: { texto: string; url: string }[] } | undefined) ?? {}}
              temDestino={Boolean(pastaRow && destinoDaBio(pastaRow))}
              sugestaoFrase={b?.bio.x ?? ""}
            />
          ) : null}
        </>
      )}
    </SubPassos>
  );
}

/** DP5 / DO4 · números: digitar e ver o sinal (regras de pausa vêm do time). */
export async function Numeros({ p, org }: { p: P; org: boolean }) {
  const [hist, regras] = await Promise.all([
    db().select().from(schema.metricsEntries).where(eq(schema.metricsEntries.studentProductId, p.id)).orderBy(desc(schema.metricsEntries.data)).limit(20),
    getSetting<unknown>("regras_pausa", null),
  ]);
  return (
    <>
      <NumerosForm pastaId={p.id} org={org} />
      <div className={regras ? "cd" : "warn"}>
        <span className="font-bold">Sinal (verde, amarelo, vermelho)</span>
        <span>{regras ? "Calculado pelas regras do time." : "O sinal aparece quando o time cadastrar as regras de pausa e de escala. Enquanto isso, mostre seus números pra Professora."}</span>
      </div>
      <Link href="/app/q01" className="b2 no-underline">Perguntar pra Professora</Link>
      {hist.length ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full border-collapse text-[13px]">
            <thead><tr>{(org ? ["Data", "Views", "Seguidores", "Comentários"] : ["Data", "Gasto", "CPM", "CTR", "CPC", "Vendas"]).map((h) => <th key={h} className="border-b border-line px-3 py-2 text-left font-semibold text-muted">{h}</th>)}</tr></thead>
            <tbody>
              {hist.map((h) => (
                <tr key={h.id}>
                  {(org ? [h.data, h.views, h.seguidores, h.comentarios] : [h.data, h.gasto, h.cpm, h.ctr, h.cpc, h.vendas]).map((v, i) => <td key={i} className="border-b border-line-3 px-3 py-2">{v ?? "—"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
