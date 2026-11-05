import { asc, eq } from "drizzle-orm";
import { CopyButton } from "@/components/pasta/copy-button";
import { db, schema } from "@/lib/db";
import { adaptarPeca, pedirAfiliacao } from "@/lib/actions/caminhos";
import { getSetting } from "@/lib/server/settings";
import { AcaoIa, Checklist, MarcarFeito } from "./interativos";
import { itensChecklist, PassoAPasso } from "./comum";
import { LinkTester } from "./link-tester";

type P = { id: string; dados: Record<string, unknown>; studentId: string; paisVenda: string | null };
const feito = (p: P, k: string) => Boolean((p.dados.feito as Record<string, boolean> | undefined)?.[k]);
const marcados = (p: P, k: string) => ((p.dados.checks as Record<string, number[]> | undefined)?.[k] ?? []);

/** A0 · Entenda: como ela ganha, o que ela faz, o que o time faz. */
export async function SdmEntenda({ p, proxima }: { p: P; proxima: string }) {
  const comissao = await getSetting<string | null>("sdm_comissao", null);
  const cards = [
    ["COMO VOCÊ GANHA", `Cada venda do SDM pelo seu link rende uma comissão de ${comissao ?? "[valor]"}. Ela cai na sua conta em dólar.`],
    ["O QUE VOCÊ FAZ", "Pede a afiliação, pega o seu link, usa as peças prontas do kit e divulga (anúncio ou vídeo)."],
    ["O QUE O TIME FAZ", "Aprova a sua afiliação, mantém o kit atualizado, cuida da página e do checkout e responde as suas dúvidas."],
  ];
  return (
    <>
      <div className="grid gap-2.5 lg:grid-cols-3">
        {cards.map(([t, d]) => (
          <div key={t} className="cd gap-1.5"><span className="kk">{t}</span><span className="tx">{d}</span></div>
        ))}
      </div>
      <MarcarFeito pastaId={p.id} etapa="entenda" feita={feito(p, "entenda")} proxima={proxima}>Começar</MarcarFeito>
    </>
  );
}

/** A1 · pedir afiliação + status (Em análise · Aprovada · Recusada com o motivo). */
export function SdmAfiliacao({ p, proxima }: { p: P; proxima: string }) {
  const af = p.dados.afiliacao as { status?: string; motivo?: string; pedidoEm?: string } | undefined;
  if (!af?.status) {
    return (
      <>
        <p className="tx">Toque no botão e o time recebe o seu pedido. Quando aprovar, o seu link aparece aqui e você recebe um aviso.</p>
        <AcaoIa acao={pedirAfiliacao.bind(null, p.id)} ok="Pedido enviado pro time" carregando="Enviando o pedido...">Quero ser afiliada</AcaoIa>
      </>
    );
  }
  if (af.status === "aprovada") {
    return (
      <>
        <div className="good">Afiliação aprovada. O seu link já está pronto.</div>
        <a href={proxima} className="b1 no-underline">Ver meu link</a>
      </>
    );
  }
  if (af.status === "recusada") {
    return (
      <>
        <div className="warn">Pedido recusado. Motivo: {af.motivo ?? "[o time vai te explicar]"}</div>
        <AcaoIa acao={pedirAfiliacao.bind(null, p.id)} className="b2" ok="Pedido enviado de novo">Pedir de novo</AcaoIa>
      </>
    );
  }
  return (
    <div className="cd gap-1.5" role="status">
      <span className="kk">STATUS</span>
      <span className="text-[17px] font-bold text-warn">Em análise</span>
      <span className="mu">Pedido feito em {af.pedidoEm ? new Date(af.pedidoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}. O time confere e aprova [prazo: regra do time].</span>
    </div>
  );
}

/** A2 · o link dela, uma versão por canal pra saber de onde veio cada venda. */
export function SdmLink({ p, proxima }: { p: P; proxima: string }) {
  const link = (p.dados.afiliacao as { link?: string } | undefined)?.link;
  if (!link) return <div className="warn">O time aprovou, mas ainda não cadastrou o seu link. Ele aparece aqui assim que for cadastrado.</div>;
  const canal = (c: string) => {
    try {
      const u = new URL(link);
      u.searchParams.set("utm_source", c);
      return u.toString();
    } catch {
      return link;
    }
  };
  return (
    <>
      <div className="flex flex-col gap-2">
        {[["Link principal", link], ["Anúncio", canal("anuncio")], ["Instagram", canal("instagram")], ["TikTok", canal("tiktok")]].map(([t, u]) => (
          <div key={t} className="cd gap-1.5">
            <span className="kk">{t!.toUpperCase()}</span>
            <span className="break-all font-mono text-xs">{u}</span>
            <CopyButton text={u!} className="self-start" />
          </div>
        ))}
      </div>
      <LinkTester pastaId={p.id} url={link} />
      <span className="mu">De onde vieram as vendas: [aparece quando o serviço de rastreamento for ligado]</span>
      <MarcarFeito pastaId={p.id} etapa="link" feita={feito(p, "link")} proxima={proxima}>Copiei e testei o meu link</MarcarFeito>
    </>
  );
}

/** A3 · kit de divulgação do time + "adaptar pro meu país com a IA" (mostra o português ao lado). */
export async function SdmKit({ p, proxima }: { p: P; proxima: string }) {
  const [pecas, adaptadas] = await Promise.all([
    db().select().from(schema.kitPieces).where(eq(schema.kitPieces.ativo, true)).orderBy(asc(schema.kitPieces.ordem)),
    db().select().from(schema.generatedItems).where(eq(schema.generatedItems.studentProductId, p.id)),
  ]);
  const ad = adaptadas.filter((a) => a.tipo === "texto_anuncio");
  return (
    <>
      {pecas.length === 0 ? <div className="warn">O time ainda não cadastrou as peças do kit. Elas aparecem aqui assim que forem publicadas no painel.</div> : null}
      <div className="grid gap-3 lg:grid-cols-2">
        {pecas.map((pc) => {
          const minhas = ad.filter((a) => (a.conteudo as { peca?: string }).peca === pc.id);
          return (
            <article key={pc.id} className="cd gap-2">
              <span className="kk">{pc.tipo.toUpperCase()}</span>
              <span className="text-[15px] font-bold">{pc.titulo}</span>
              {pc.texto ? <p className="tx m-0 whitespace-pre-line">{pc.texto}</p> : null}
              <div className="flex flex-wrap gap-2">
                {pc.texto ? <CopyButton text={pc.texto} label="Copiar texto" /> : null}
              </div>
              {pc.texto ? <AcaoIa acao={adaptarPeca.bind(null, p.id, pc.id, false)} className="b2" ok="Adaptado">Adaptar pro meu país com a IA</AcaoIa> : null}
              {minhas.map((m) => {
                const t = (m.conteudo as { texto: { x: string; pt: string } }).texto;
                return (
                  <div key={m.id} className="grid gap-2 rounded-xl border border-line-2 p-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1"><span className="kk">PRA POSTAR</span><span className="tx">{t.x}</span><CopyButton text={t.x} className="self-start" /></div>
                    <div className="flex flex-col gap-1"><span className="kk">EM PORTUGUÊS</span><span className="tx text-muted">{t.pt}</span></div>
                  </div>
                );
              })}
              {minhas.length ? <AcaoIa acao={adaptarPeca.bind(null, p.id, pc.id, true)} className="b3 self-start" ok="Variação pronta">Pedir variação</AcaoIa> : null}
            </article>
          );
        })}
      </div>
      <MarcarFeito pastaId={p.id} etapa="kit" feita={feito(p, "kit")} proxima={proxima}>Já separei as minhas peças</MarcarFeito>
    </>
  );
}

/** A4 / B8 · conta pra receber (Wise) com passo a passo + dados de saque. */
export async function Conta({ p, proxima }: { p: P; proxima: string }) {
  const ck = await itensChecklist("DN03");
  return (
    <>
      <PassoAPasso chaves={["wise"]} />
      <Checklist pastaId={p.id} lista="conta" titulo={ck.titulo} itens={ck.itens} marcados={marcados(p, "conta")} etapa="conta" feita={feito(p, "conta")} proxima={proxima} />
    </>
  );
}

/** A5 · regras curtas (Regras da Meta do protótipo, até o time cadastrar as regras da afiliação). */
export async function SdmRegras({ p, proxima }: { p: P; proxima: string }) {
  const custom = await db().query.contentBlocks.findFirst({ where: eq(schema.contentBlocks.key, "afiliacao.regras") });
  const ck = custom ? { titulo: "Regras da afiliação", itens: (custom.data as { items: string[] }).items } : await itensChecklist("PG04");
  return <Checklist pastaId={p.id} lista="regras" titulo={ck.titulo} itens={ck.itens} marcados={marcados(p, "regras")} etapa="regras" feita={feito(p, "regras")} proxima={proxima} />;
}
