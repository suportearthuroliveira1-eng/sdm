import { and, desc, eq, inArray } from "drizzle-orm";
import { CopyButton } from "@/components/pasta/copy-button";
import { aprovarOferta, gerarFicha, gerarIdeias, gerarOferta, gerarPagina } from "@/lib/actions/caminhos";
import { db, schema } from "@/lib/db";
import { iaLigada } from "@/lib/ai/run";
import { AcaoIa, Checklist, MarcarFeito } from "./interativos";
import { AvaliarIdeia, EscolherIdeia, FichaEditavel, FormIa, OfertaForm, PaginaEditor } from "./proprio-client";
import { LinkTester } from "./link-tester";
import { PassoAPasso } from "./comum";
import { ETAPAS_PROPRIO } from "@/lib/domain/etapas";

type P = { id: string; dados: Record<string, unknown>; studentId: string; paisVenda: string | null };
type Bi = { x: string; pt: string };
const feito = (p: P, k: string) => Boolean((p.dados.feito as Record<string, boolean> | undefined)?.[k]);
const marcados = (p: P, k: string) => ((p.dados.checks as Record<string, number[]> | undefined)?.[k] ?? []);

async function AvisoIa() {
  if (await iaLigada()) return null;
  return <div className="warn">A IA ainda não está ligada neste app. Assim que o time colocar a chave, os botões de IA funcionam.</div>;
}

/** B0 · o que vai acontecer. */
export function ProprioEntenda({ p, proxima }: { p: P; proxima: string }) {
  return (
    <>
      <ol className="m-0 flex flex-col gap-2 pl-0">
        {ETAPAS_PROPRIO.slice(1).map((e, i) => (
          <li key={e.slug} className="cd flex-row items-start gap-3">
            <span className="dot bg-sel text-accent-2" aria-hidden>{i + 1}</span>
            <span className="flex flex-col gap-0.5"><span className="text-sm font-bold">{e.nome}</span><span className="mu">{e.entenda}</span></span>
          </li>
        ))}
      </ol>
      <MarcarFeito pastaId={p.id} etapa="entenda" feita={feito(p, "entenda")} proxima={proxima}>Começar</MarcarFeito>
    </>
  );
}

type Ideia = { nome_provisorio: string; publico: Bi; dor: Bi; promessa: Bi; por_que_vende: string; concorrencia: string; canal: string; formato: string };

/** B1 · 3 cartões de ideia. */
export async function ProprioIdeias({ p }: { p: P }) {
  const ideias = (p.dados.ideias as Ideia[] | undefined) ?? [];
  const escolhida = (p.dados.ideia as Ideia | undefined)?.nome_provisorio;
  const av = p.dados.avaliacao as { veredito: string; explicacao: string } | undefined;
  return (
    <>
      <AvisoIa />
      {ideias.length === 0 ? <AcaoIa acao={gerarIdeias.bind(null, p.id, false)} carregando="A IA está pensando em 3 ideias...">Ver 3 ideias de produto pra mim</AcaoIa> : null}
      {av ? <div className={av.veredito === "evitar" ? "warn" : "cd"}><span className="kk">SOBRE A SUA IDEIA · {av.veredito.toUpperCase()}</span><span className="tx">{av.explicacao}</span></div> : null}
      <div className="grid gap-3 lg:grid-cols-3">
        {ideias.map((i, k) => (
          <article key={i.nome_provisorio + k} className={`flex flex-col gap-2 rounded-2xl border-[1.5px] p-4 ${escolhida === i.nome_provisorio ? "border-accent bg-sel" : "border-line bg-surface"}`}>
            <span className="text-[17px] font-bold leading-snug">{i.nome_provisorio}</span>
            <span className="mu">{i.formato}</span>
            <span className="tx"><b>Pra quem:</b> {i.publico.pt}</span>
            <span className="tx"><b>Dor:</b> {i.dor.pt}</span>
            <span className="tx"><b>Promessa:</b> {i.promessa.pt}</span>
            <span className="tx"><b>Por que vende:</b> {i.por_que_vende}</span>
            <div className="flex flex-wrap gap-1.5">
              <span className={`rounded-lg px-2 py-1 text-[11px] font-bold ${i.concorrencia === "baixa" ? "bg-ok-bg text-ok" : i.concorrencia === "alta" ? "bg-warn-bg text-warn" : "bg-surface-2 text-text-2"}`}>Concorrência {i.concorrencia}</span>
              <span className="rounded-lg bg-sel px-2 py-1 text-[11px] font-bold text-accent-2">{i.canal === "anuncio" ? "Bom pra anúncio" : i.canal === "organico" ? "Bom pra orgânico" : "Anúncio e orgânico"}</span>
            </div>
            <EscolherIdeia pastaId={p.id} idx={k} escolhida={escolhida === i.nome_provisorio} />
          </article>
        ))}
      </div>
      {ideias.length ? <AcaoIa acao={gerarIdeias.bind(null, p.id, true)} className="b2" carregando="Pensando em outras 3...">Me dá outras 3</AcaoIa> : null}
      <AvaliarIdeia pastaId={p.id} />
    </>
  );
}

/** B2 · perguntas guiadas + ficha que a IA completa. */
export async function ProprioFicha({ p, proxima }: { p: P; proxima: string }) {
  const ficha = p.dados.ficha as Record<string, unknown> | undefined;
  const resp = (p.dados.fichaRespostas as Record<string, string> | undefined) ?? {};
  const ideia = p.dados.ideia as Ideia | undefined;
  return (
    <>
      <AvisoIa />
      {ideia ? <div className="cd"><span className="kk">IDEIA ESCOLHIDA</span><span className="text-[15px] font-bold">{ideia.nome_provisorio}</span><span className="mu">{ideia.promessa.pt}</span></div> : null}
      <FormIa
        acao={gerarFicha.bind(null, p.id)}
        botao={ficha ? "Refazer a ficha com a IA" : "Completar a ficha com a IA"}
        carregando="A IA está montando a sua ficha..."
        campos={[
          { name: "o_que_sabe", label: "O que você sabe desse assunto?", ajuda: "Conte com as suas palavras: o que você faz, aprendeu ou já ensinou.", valor: resp.o_que_sabe },
          { name: "historia_real", label: "Tem alguma história real? (opcional)", ajuda: "Algo que aconteceu de verdade com você ou com alguém. A IA só usa como prova o que você contar aqui.", valor: resp.historia_real },
          { name: "nao_prometer", label: "O que você NÃO quer prometer?", ajuda: "Ex.: emagrecimento, dinheiro rápido, resultado em X dias.", valor: resp.nao_prometer },
        ]}
      />
      {ficha ? (
        <>
          <FichaEditavel pastaId={p.id} ficha={ficha as never} />
          <a href={proxima} className="b1 no-underline">Ficha certa, próxima etapa</a>
        </>
      ) : null}
    </>
  );
}

/** B3 · oferta: nome, promessa, preço com o porquê, bônus reais, garantia. */
export function ProprioOferta({ p, proxima }: { p: P; proxima: string }) {
  const o = p.dados.oferta as { nome: Bi; promessa: Bi; preco: { valor: number; moeda: string; porque: string }; bonus: { titulo: Bi; o_que_e: string }[]; garantia: { texto: Bi; porque: string }; por_que_funciona: string; aprovada?: boolean } | undefined;
  if (!o) return <AcaoIa acao={gerarOferta.bind(null, p.id, false)} carregando="A IA está montando a oferta...">Montar a oferta com a IA</AcaoIa>;
  return (
    <>
      <div className="grid gap-2.5 lg:grid-cols-2">
        <div className="cd gap-1"><span className="kk">PREÇO SUGERIDO</span><span className="text-xl font-bold">{o.preco.moeda} {o.preco.valor}</span><span className="mu">{o.preco.porque}</span></div>
        <div className="cd gap-1"><span className="kk">GARANTIA</span><span className="tx">{o.garantia.texto.x}</span><span className="mu">{o.garantia.texto.pt} · {o.garantia.porque}</span></div>
      </div>
      {o.bonus.length ? <div className="cd gap-1.5"><span className="kk">BÔNUS</span>{o.bonus.map((b) => <span key={b.titulo.x} className="tx">• <b>{b.titulo.x}</b> ({b.titulo.pt}): {b.o_que_e}</span>)}</div> : null}
      <div className="cd"><span className="kk">POR QUE FUNCIONA</span><span className="tx">{o.por_que_funciona}</span></div>
      <OfertaForm pastaId={p.id} acao={aprovarOferta.bind(null, p.id)} nome={o.nome.x} nomePt={o.nome.pt} promessa={o.promessa.x} promessaPt={o.promessa.pt} preco={o.preco.valor} aprovada={Boolean(o.aprovada)} proxima={proxima} />
      <AcaoIa acao={gerarOferta.bind(null, p.id, true)} className="b2" carregando="Montando outra versão...">Pedir outra versão</AcaoIa>
    </>
  );
}

/** B5 · revisão antes de vender. */
export function ProprioRevisao({ p, proxima }: { p: P; proxima: string }) {
  const itens = ["O ebook entrega o que a promessa diz", "Não tem promessa de cura, de ganho ou de prazo", "Nada foi copiado de outra pessoa", "Lendo em português, faz sentido pra mim"];
  return <Checklist pastaId={p.id} lista="revisao" titulo="Checklist de revisão" itens={itens} marcados={marcados(p, "revisao")} etapa="revisao" feita={feito(p, "revisao")} proxima={proxima} />;
}

/** B6 · página de vendas bloco por bloco. */
export async function ProprioPagina({ p, proxima }: { p: P; proxima: string }) {
  const itens = await db().select().from(schema.generatedItems).where(and(eq(schema.generatedItems.studentProductId, p.id), inArray(schema.generatedItems.tipo, ["kit_pre", "kit_quiz"]))).orderBy(desc(schema.generatedItems.createdAt)).limit(1);
  const it = itens[0];
  return (
    <>
      <AvisoIa />
      <p className="tx">Escolha o formato. A IA recomenda a <b>página de vendas</b> pro seu produto próprio.</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <AcaoIa acao={gerarPagina.bind(null, p.id, "pagina")} className={it ? "b2" : "b1"} carregando="Escrevendo a página...">Página de vendas (recomendado)</AcaoIa>
        <AcaoIa acao={gerarPagina.bind(null, p.id, "pre")} className="b2" carregando="Escrevendo a pré-venda...">Pré-venda</AcaoIa>
        <AcaoIa acao={gerarPagina.bind(null, p.id, "quiz")} className="b2" carregando="Escrevendo o quiz...">Quiz</AcaoIa>
      </div>
      {it ? (
        <>
          <PaginaEditor itemId={it.id} status={it.status} blocos={(it.conteudo as { blocos: { n: string; oq: string; x: string; pt: string }[] }).blocos} formato={(it.conteudo as { formato?: string }).formato ?? "pagina"} />
          {(it.conteudo as { imagemPrompt?: string }).imagemPrompt ? (
            <div className="cd gap-1.5"><span className="kk">IMAGEM · PROMPT</span><span className="mu text-text-2">{(it.conteudo as { imagemPrompt: string }).imagemPrompt}</span><CopyButton text={(it.conteudo as { imagemPrompt: string }).imagemPrompt} label="Copiar prompt" className="self-start" /></div>
          ) : null}
          <div className="warn">Publicar: onde a página fica ainda está [a definir pelo time]. Por enquanto, copie os blocos pra ferramenta de página.</div>
          <a href={proxima} className="b1 no-underline">Próxima etapa</a>
        </>
      ) : null}
    </>
  );
}

/** B7 · plataforma de venda: passo a passo [a definir] + link do checkout testado. */
export function ProprioPlataforma({ p, proxima }: { p: P; proxima: string }) {
  const ck = p.dados.checkout as { url?: string; ok?: boolean } | undefined;
  return (
    <>
      <div className="cd gap-1.5">
        <span className="kk">PASSO A PASSO · PLATAFORMA [A DEFINIR]</span>
        <span className="tx">1. Criar a sua conta na plataforma de pagamento.</span>
        <span className="tx">2. Cadastrar o produto com o nome e o preço da sua oferta.</span>
        <span className="tx">3. Subir o PDF do seu ebook.</span>
        <span className="tx">4. Copiar o link do checkout e colar aqui embaixo.</span>
        <span className="mu">[prints do passo a passo quando o time definir a plataforma]</span>
      </div>
      <LinkTester pastaId={p.id} url={ck?.url} campo rotulo="Link do checkout" label="Colar e conferir se abre" />
      {ck?.ok ? <a href={proxima} className="b1 no-underline">Próxima etapa</a> : null}
    </>
  );
}

/** B9 · teste até a compra. */
export function ProprioTeste({ p, proxima }: { p: P; proxima: string }) {
  const itens = ["Abri a minha página no celular", "Cliquei no botão", "Cheguei no checkout", "Fiz uma compra teste", "O ebook chegou no e-mail"];
  return (
    <>
      <PassoAPassoTeste />
      <Checklist pastaId={p.id} lista="teste" titulo="Teste do caminho do cliente" itens={itens} marcados={marcados(p, "teste")} etapa="teste" feita={feito(p, "teste")} proxima={proxima} />
    </>
  );
}

function PassoAPassoTeste() {
  return <p className="tx">Faça o caminho como se fosse a cliente. Marque cada passo quando funcionar.</p>;
}

export { PassoAPasso };
