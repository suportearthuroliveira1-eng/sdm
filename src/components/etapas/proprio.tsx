import { and, desc, eq, inArray } from "drizzle-orm";
import { CopyButton } from "@/components/pasta/copy-button";
import { aprovarOferta, gerarIdeias, gerarOferta, gerarPagina } from "@/lib/actions/caminhos";
import { db, schema } from "@/lib/db";
import { iaLigada } from "@/lib/ai/run";
import { AcaoIa, Checklist, MarcarFeito } from "./interativos";
import { AvaliarIdeia, EscolherIdeia, FichaEditavel, FichaPerguntas, MercadoEscolha, OfertaForm, PaginaEditor } from "./proprio-client";
import { Icone } from "@/components/ui/icone";
import { INFO_MERCADO } from "@/lib/domain/mercados";
import { LinkTester } from "./link-tester";
import { BarraAcao, PassoAPasso } from "./comum";
import { ETAPAS_PROPRIO } from "@/lib/domain/etapas";
import { COMO_A_IA_PENSA, EXPLICA_PROPRIO } from "@/lib/domain/explica-etapas";
import { visualEtapa } from "@/lib/domain/visual-etapas";
import { ComoIaPensa, FluxoProduto } from "./entenda-produto";
import { PilotoAutomatico } from "./piloto";

type P = { id: string; dados: Record<string, unknown>; studentId: string; paisVenda: string | null };
type Bi = { x: string; pt: string };
const feito = (p: P, k: string) => Boolean((p.dados.feito as Record<string, boolean> | undefined)?.[k]);
const marcados = (p: P, k: string) => ((p.dados.checks as Record<string, number[]> | undefined)?.[k] ?? []);

async function AvisoIa() {
  if (await iaLigada()) return null;
  return <div className="warn">A IA ainda não está ligada neste app. Assim que o time colocar a chave, os botões de IA funcionam.</div>;
}

/** B0 · antes de criar: o caminho inteiro (fluxograma), como a IA pensa e a escolha: a IA faz tudo ou passo a passo. */
export async function ProprioEntenda({ p, proxima }: { p: P; proxima: string }) {
  const d = await db().query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, p.studentId), orderBy: desc(schema.diagnostics.versao) });
  const r = (d?.respostas ?? {}) as Record<string, string | string[]>;
  const txt = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : v ?? "");
  const dados = [
    ["Gosta de", r.assuntos],
    ["Mora em", r.pais],
    ["Fala", r.idiomas],
    ["Tempo por dia", r.tempo],
    ["Já vendeu?", r.exp],
    ["Quer", r.objetivo],
  ]
    .map(([rotulo, v]) => ({ rotulo: rotulo as string, valor: txt(v as string | string[] | undefined) }))
    .filter((x) => x.valor);
  const nos = EXPLICA_PROPRIO.map((e) => {
    const def = ETAPAS_PROPRIO.find((x) => x.slug === e.slug);
    const v = visualEtapa(e.slug);
    return { ...e, nome: def?.nome ?? e.slug, cor: v.cor, icone: v.icone };
  });
  const jaComecou = feito(p, "entenda");
  return (
    <>
      <section className="surge relative overflow-hidden rounded-3xl border border-line p-5" style={{ background: "radial-gradient(120% 120% at 100% 0%, color-mix(in srgb, var(--c-teal) 16%, transparent), transparent 55%), radial-gradient(120% 120% at 0% 100%, color-mix(in srgb, var(--c-pink) 14%, transparent), transparent 55%), var(--surface)" }}>
        <div className="flex flex-col gap-2">
          <span className="kk">ANTES DE COMEÇAR</span>
          <h2 className="m-0 text-[22px] font-bold leading-snug">Você vai criar um ebook simples, sobre um assunto que você já conhece</h2>
          <p className="tx m-0">A IA faz o trabalho pesado. Você escolhe, confere e aprova. Nada é publicado nem vendido sem você.</p>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-bg/60 p-3">
          <span className="text-c-sky"><Icone nome="idioma" tamanho={18} /></span>
          <span className="text-sm text-text-2"><b className="text-text">Tudo em português primeiro.</b> Ideia, ficha e oferta saem em português pra você entender cada detalhe. Só depois você escolhe o país e o idioma de venda.</span>
        </div>
      </section>

      <section className="cd gap-3" aria-labelledby="como-pensa">
        <h2 id="como-pensa" className="m-0 flex items-center gap-2 text-lg font-bold"><span className="text-c-teal"><Icone nome="cerebro" tamanho={22} /></span> Como a IA pensa</h2>
        <ComoIaPensa dados={dados} passos={COMO_A_IA_PENSA} />
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="o-caminho">
        <h2 id="o-caminho" className="m-0 flex items-center gap-2 text-lg font-bold"><span className="text-c-amber"><Icone nome="passos" tamanho={22} /></span> O caminho, passo a passo</h2>
        <p className="mu m-0 text-sm">Toque em cada passo pra ver o que você faz, o que a IA faz e o que ela olha.</p>
        <FluxoProduto nos={nos} />
      </section>

      <section className="flex flex-col gap-2.5" aria-labelledby="como-quer">
        <h2 id="como-quer" className="m-0 text-lg font-bold">Como você quer fazer?</h2>
        <PilotoAutomatico pastaId={p.id} revisaoHref={`/app/p/${p.id}/revisao`} />
        <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface p-4">
          <span className="flex items-center gap-2 font-bold"><span className="text-accent"><Icone nome="passos" tamanho={20} /></span> Vou fazendo com a IA, passo a passo</span>
          <span className="mu text-sm">Você vê e decide cada etapa. Leva mais tempo, mas você entende tudo.</span>
          <div className="mt-1"><MarcarFeito pastaId={p.id} etapa="entenda" feita={jaComecou} proxima={proxima}>Começar passo a passo</MarcarFeito></div>
        </div>
      </section>
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
      {ideias.length === 0 ? <AcaoIa acao={gerarIdeias.bind(null, p.id, false)} carregando="A IA está pensando em 3 ideias" passos={["Lendo o seu diagnóstico", "Cruzando o que você gosta com o que as pessoas compram", "Fugindo do que já está saturado", "Explicando o porquê de cada ideia"]} duracao={12}>Ver 3 ideias de produto pra mim</AcaoIa> : null}
      {av ? <div className={av.veredito === "evitar" ? "warn" : "cd"}><span className="kk">SOBRE A SUA IDEIA · {av.veredito.toUpperCase()}</span><span className="tx">{av.explicacao}</span></div> : null}
      <div className={`grid gap-3 ${ideias.length === 4 ? "md:grid-cols-2" : "lg:grid-cols-3"}`}>
        {ideias.map((i, k) => (
          <article key={i.nome_provisorio + k} style={{ animationDelay: `${k * 90}ms` }} className={`surge flex flex-col gap-2 rounded-2xl border-[1.5px] p-4 transition-colors ${escolhida === i.nome_provisorio ? "border-c-amber bg-[color-mix(in_srgb,var(--c-amber)_10%,var(--surface))]" : "border-line bg-surface hover:border-c-amber/50"}`}>
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-c-amber"><Icone nome="lampada" tamanho={14} /> Ideia {k + 1}{av && k === 0 ? " · a sua, ajustada" : ""}</span>
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
      {ideias.length ? <AcaoIa acao={gerarIdeias.bind(null, p.id, true)} className="b2" carregando="Pensando em outras 3 ideias" passos={["Guardando as ideias anteriores", "Procurando outros caminhos", "Explicando o porquê de cada uma"]} duracao={12}>Me dá outras 3</AcaoIa> : null}
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
      <div className="cd gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-c-teal/15 text-c-teal"><Icone nome="ficha" tamanho={22} /></span>
          <div className="flex flex-col gap-1">
            <span className="font-bold">Pra que serve a ficha</span>
            <span className="tx">É o RG do seu produto: pra quem é, que problema resolve e o que promete (sem exagero). Tudo que vem depois sai daqui: oferta, ebook, página e anúncios.</span>
          </div>
        </div>
        <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-3">
          {[["Você responde 3 perguntas", "só a primeira é obrigatória"], ["A IA completa a ficha", "público, dor, promessa, objeções, ganchos"], ["Você confere e corrige", "qualquer campo, quando quiser"]].map(([t, d], i) => (
            <li key={t} className="surge flex items-start gap-2 rounded-xl bg-surface-2 p-3" style={{ animationDelay: `${i * 90}ms` }}>
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-c-teal text-xs font-bold text-accent-ink">{i + 1}</span>
              <span className="flex flex-col"><span className="text-sm font-bold">{t}</span><span className="mu text-xs">{d}</span></span>
            </li>
          ))}
        </ol>
      </div>
      {ideia ? <div className="cd border-c-amber/40"><span className="kk">IDEIA ESCOLHIDA</span><span className="text-[15px] font-bold">{ideia.nome_provisorio}</span><span className="mu">{ideia.promessa.pt}</span></div> : null}
      <FichaPerguntas pastaId={p.id} inicial={resp} temFicha={Boolean(ficha)} />
      {ficha ? (
        <div id="sua-ficha" className="flex scroll-mt-20 flex-col gap-3">
          <FichaEditavel pastaId={p.id} ficha={ficha as never} />
          <BarraAcao>
            <a href={proxima} className="b1 no-underline">Ficha certa, próxima etapa</a>
          </BarraAcao>
        </div>
      ) : null}
    </>
  );
}

/** B3 · oferta: nome, promessa, preço com o porquê, bônus reais, garantia. */
export function ProprioOferta({ p, proxima }: { p: P; proxima: string }) {
  const o = p.dados.oferta as { nome: Bi; promessa: Bi; preco: { valor: number; moeda: string; porque: string }; bonus: { titulo: Bi; o_que_e: string }[]; garantia: { texto: Bi; porque: string }; por_que_funciona: string; aprovada?: boolean } | undefined;
  if (!o) return <AcaoIa acao={gerarOferta.bind(null, p.id, false)} carregando="A IA está montando a oferta" passos={["Lendo a ficha do produto", "Pensando num nome e numa promessa honesta", "Sugerindo um preço com o porquê", "Escolhendo bônus e garantia reais"]} duracao={15}>Montar a oferta com a IA</AcaoIa>;
  return (
    <>
      <div className="grid gap-2.5 lg:grid-cols-2">
        <div className="cd gap-1"><span className="kk">PREÇO SUGERIDO</span><span className="text-xl font-bold">{o.preco.valor > 0 ? `${o.preco.moeda} ${o.preco.valor}` : "[valor]"}</span><span className="mu">{o.preco.porque}</span></div>
        <div className="cd gap-1"><span className="kk">GARANTIA</span><span className="tx">{o.garantia.texto.x}</span><span className="mu">{o.garantia.texto.pt !== o.garantia.texto.x ? `${o.garantia.texto.pt} · ` : ""}{o.garantia.porque}</span></div>
      </div>
      {o.bonus.length ? <div className="cd gap-1.5"><span className="kk">BÔNUS</span>{o.bonus.map((b) => <span key={b.titulo.x} className="tx">• <b>{b.titulo.x}</b>{b.titulo.pt !== b.titulo.x ? ` (${b.titulo.pt})` : ""}: {b.o_que_e}</span>)}</div> : null}
      <div className="cd"><span className="kk">POR QUE FUNCIONA</span><span className="tx">{o.por_que_funciona}</span></div>
      <OfertaForm pastaId={p.id} acao={aprovarOferta.bind(null, p.id)} nome={o.nome.x} nomePt={o.nome.pt} promessa={o.promessa.x} promessaPt={o.promessa.pt} preco={o.preco.valor} aprovada={Boolean(o.aprovada)} proxima={proxima} />
      <AcaoIa acao={gerarOferta.bind(null, p.id, true)} className="b2" carregando="Montando outra versão da oferta" passos={["Lendo a ficha", "Mudando o ângulo da oferta", "Conferindo as regras"]} duracao={15}>Pedir outra versão</AcaoIa>
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
        <AcaoIa acao={gerarPagina.bind(null, p.id, "pagina")} className={it ? "b2" : "b1"} carregando="A IA está escrevendo a página" passos={["Lendo ficha e oferta", "Montando a ordem dos blocos", "Escrevendo bloco por bloco", "Traduzindo pra você", "Conferindo: nada inventado"]} duracao={20}>Página de vendas (recomendado)</AcaoIa>
        <AcaoIa acao={gerarPagina.bind(null, p.id, "pre")} className="b2" carregando="A IA está escrevendo a pré-venda" passos={["Lendo ficha e oferta", "Escrevendo bloco por bloco", "Traduzindo pra você", "Conferindo: nada inventado"]} duracao={20}>Pré-venda</AcaoIa>
        <AcaoIa acao={gerarPagina.bind(null, p.id, "quiz")} className="b2" carregando="A IA está escrevendo o quiz" passos={["Lendo ficha e oferta", "Criando as perguntas", "Ligando as respostas à oferta", "Conferindo as regras"]} duracao={20}>Quiz</AcaoIa>
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

/** B · Idioma e país (depois da oferta; até aqui tudo em português). */
export async function ProprioMercado({ p, proxima }: { p: P; proxima: string }) {
  const { resultado } = await (async () => {
    const d = await db().query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, p.studentId), orderBy: desc(schema.diagnostics.versao) });
    return { resultado: (d?.resultado as { pais_venda?: { k?: string } } | null) ?? null };
  })();
  const atual = (p.dados.mercado as { pais?: string } | undefined)?.pais ?? null;
  return (
    <>
      <div className="cd flex-row items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-c-sky/15 text-c-sky"><Icone nome="idioma" tamanho={22} /></span>
        <span className="tx">A ideia, a ficha e a oferta ficaram em português pra você entender tudo. A partir daqui, o ebook, a página e os anúncios saem no idioma de quem compra, sempre com a tradução do lado.</span>
      </div>
      {(p.dados as { mercadoMudou?: boolean }).mercadoMudou ? <div className="warn">Você trocou o país. Se o ebook ou a página já estavam prontos, refaça pra sair no idioma novo.</div> : null}
      <MercadoEscolha pastaId={p.id} atual={atual} sugerido={resultado?.pais_venda?.k ?? p.paisVenda} proxima={proxima} info={INFO_MERCADO} preco={(p.dados.oferta as { preco?: { valor?: number } } | undefined)?.preco?.valor ?? null} />
    </>
  );
}
