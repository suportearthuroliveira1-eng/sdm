import { and, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/pasta/copy-button";
import { PreviaPagina } from "@/components/etapas/previa-pagina";
import { Icone, type NomeIcone } from "@/components/ui/icone";
import { db, schema } from "@/lib/db";
import { faixa, fmtPreco, type Moeda } from "@/lib/domain/precos";
import { TEMAS, type CapEbook, type TemaKey } from "@/lib/domain/temas";
import { visualEtapa } from "@/lib/domain/visual-etapas";
import { hrefEtapa, pastaDaAluna } from "@/lib/server/pastas";

export const metadata: Metadata = { title: "Tudo pronto" };

type Bi = { x: string; pt: string };

function Secao({ slug, titulo, icone, children, falta, pastaId }: { slug: string; titulo: string; icone?: NomeIcone; children?: React.ReactNode; falta?: string | null; pastaId: string }) {
  const v = visualEtapa(slug);
  return (
    <section className="surge flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4" aria-labelledby={`s-${slug}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ color: v.cor, background: `color-mix(in srgb, ${v.cor} 16%, transparent)` }}><Icone nome={icone ?? v.icone} tamanho={20} /></span>
        <h2 id={`s-${slug}`} className="m-0 flex-1 text-lg font-bold">{titulo}</h2>
        <Link href={hrefEtapa(pastaId, slug)} className="text-sm font-semibold no-underline">{falta ? "Fazer" : "Editar"}</Link>
      </div>
      {falta ? <p className="mu m-0 text-sm">{falta}</p> : children}
    </section>
  );
}

/** Tudo o que já está pronto do produto, num lugar só: ebook (PDF), página, oferta, ficha e anúncios. */
export default async function Pronto({ params }: PageProps<"/app/p/[id]/pronto">) {
  const { id } = await params;
  const ctx = await pastaDaAluna(id);
  if (!ctx) notFound();
  const { pasta, etapas } = ctx;
  const d = (pasta.dados ?? {}) as Record<string, unknown>;
  const [eb, pagina, anuncios] = await Promise.all([
    db().query.ebooks.findFirst({ where: and(eq(schema.ebooks.studentProductId, pasta.id), eq(schema.ebooks.studentId, pasta.studentId)) }),
    db().select().from(schema.generatedItems).where(and(eq(schema.generatedItems.studentProductId, pasta.id), inArray(schema.generatedItems.tipo, ["kit_pre", "kit_quiz"]))).orderBy(desc(schema.generatedItems.createdAt)).limit(1),
    db().select().from(schema.generatedItems).where(and(eq(schema.generatedItems.studentProductId, pasta.id), eq(schema.generatedItems.tipo, "anuncio"))).orderBy(desc(schema.generatedItems.createdAt)).limit(6),
  ]);
  const ficha = d.ficha as { nome: string; publico: Bi; dor: Bi; promessa: Bi; o_que_e: Bi } | undefined;
  const oferta = d.oferta as { nome: Bi; promessa: Bi; preco: { valor: number; moeda: string }; bonus: { titulo: Bi; o_que_e: string }[]; garantia: { texto: Bi }; aprovada?: boolean } | undefined;
  const capsProntos = ((eb?.capitulos ?? []) as CapEbook[]).filter((c) => c.texto).length;
  const ebPronto = eb?.status === "pronto" || (eb && capsProntos > 0 && capsProntos === ((eb.capitulos ?? []) as CapEbook[]).length);
  const tema = TEMAS[(eb?.temaVisual as TemaKey) ?? "lilas"] ?? TEMAS.lilas;
  const ideia = (eb?.ideia ?? {}) as { titulo?: Bi; subtitulo?: Bi };
  const pg = pagina[0];
  const blocos = (pg?.conteudo as { blocos?: { n: string; oq: string; x: string; pt: string }[] } | undefined)?.blocos ?? [];
  const feitas = etapas.filter((e) => e.ok).length;
  const moeda = (["USD", "EUR", "GBP", "BRL"].includes(oferta?.preco?.moeda ?? "") ? oferta!.preco.moeda : "USD") as Moeda;

  return (
    <div className="flex flex-col gap-4 lg:max-w-4xl">
      <div className="flex flex-col gap-1 pt-3 lg:pt-0">
        <Link href={`/app/p/${pasta.id}`} className="mu self-start text-sm no-underline hover:text-text">← {pasta.nome}</Link>
        <span className="kk">TUDO PRONTO · {feitas} DE {etapas.length} ETAPAS</span>
        <h1 className="m-0 text-[26px] font-bold leading-tight lg:text-[30px]">{pasta.nome}</h1>
        <span className="mu">Tudo o que você e a IA já fizeram, num lugar só, pra ver, baixar e copiar.</span>
      </div>

      {pasta.tipo === "proprio" ? (
        <Secao slug="ebook" titulo="Ebook (PDF)" pastaId={pasta.id} falta={ebPronto ? null : eb ? `Faltam capítulos: ${capsProntos} de ${((eb.capitulos ?? []) as CapEbook[]).length} prontos.` : "Ainda não começou."}>
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
            <a href={`/api/ebook/${pasta.id}`} target="_blank" rel="noreferrer" className="flutua relative flex aspect-[3/4] flex-col justify-end gap-2 overflow-hidden rounded-lg p-4 text-white no-underline shadow-2xl" style={{ background: tema.capa }}>
              <span className="absolute -right-10 -top-10 size-36 rounded-full opacity-40" style={{ background: tema.destaque }} />
              <span className="h-1 w-10 rounded" style={{ background: tema.destaque }} />
              <span className="text-[15px] font-extrabold leading-tight">{ideia.titulo?.x ?? eb?.titulo}</span>
              <span className="text-[10px] opacity-80">{ideia.subtitulo?.x}</span>
            </a>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-text-2">{capsProntos} capítulos · tema {tema.nome} · {eb?.idioma === "es" ? "espanhol" : eb?.idioma === "pt" ? "português" : "inglês"}</span>
              <div className="grid gap-2 sm:grid-cols-3">
                <a href={`/api/ebook/${pasta.id}`} target="_blank" rel="noreferrer" className="b1 no-underline">Abrir o PDF</a>
                <a href={`/api/ebook/${pasta.id}?baixar=1`} className="b2 no-underline">Baixar</a>
                <a href={`/api/ebook/${pasta.id}?lang=pt`} target="_blank" rel="noreferrer" className="b2 no-underline">Ver em português</a>
              </div>
              <iframe title="PDF do ebook" src={`/api/ebook/${pasta.id}#view=FitH&pagemode=none`} className="mt-1 hidden h-[560px] w-full rounded-xl border border-line bg-white md:block" />
            </div>
          </div>
        </Secao>
      ) : null}

      {pasta.tipo === "proprio" ? (
        <Secao slug="pagina" titulo="Página de vendas" pastaId={pasta.id} falta={blocos.length ? null : "Ainda não foi escrita."}>
          <PreviaPagina blocos={blocos} titulo={oferta?.nome?.x ?? pasta.nome ?? ""} />
        </Secao>
      ) : null}

      {pasta.tipo === "proprio" ? (
        <Secao slug="oferta" titulo="Oferta" pastaId={pasta.id} falta={oferta ? null : "Ainda não foi montada."}>
          {oferta ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-1">
                <span className="text-[17px] font-bold">{oferta.nome.x}</span>
                <span className="tx">{oferta.promessa.x}</span>
                {oferta.promessa.pt !== oferta.promessa.x ? <span className="mu">{oferta.promessa.pt}</span> : null}
                {oferta.bonus?.length ? <span className="mu mt-1">Bônus: {oferta.bonus.map((b) => b.titulo.x).join(" · ")}</span> : null}
                {oferta.garantia?.texto?.x ? <span className="mu">Garantia: {oferta.garantia.texto.x}</span> : null}
              </div>
              <div className="flex flex-col items-start gap-1 rounded-xl bg-surface-2 p-3 sm:items-end">
                <span className="kk">PREÇO</span>
                <span className="text-2xl font-extrabold">{fmtPreco(oferta.preco?.valor > 0 ? oferta.preco.valor : faixa(moeda).sugerido, moeda)}</span>
                <span className={`text-xs font-bold ${oferta.aprovada ? "text-ok" : "text-warn"}`}>{oferta.aprovada ? "aprovada" : "falta aprovar"}</span>
              </div>
            </div>
          ) : null}
        </Secao>
      ) : null}

      {pasta.tipo === "proprio" ? (
        <Secao slug="ficha" titulo="Ficha do produto" pastaId={pasta.id} falta={ficha ? null : "Ainda não foi feita."}>
          {ficha ? (
            <dl className="m-0 grid gap-2 sm:grid-cols-2">
              {([["Pra quem é", ficha.publico], ["A dor", ficha.dor], ["A promessa", ficha.promessa], ["O que é", ficha.o_que_e]] as const).map(([l, v]) => (
                <div key={l} className="rounded-xl bg-surface-2 p-3">
                  <dt className="text-xs font-bold text-muted">{l}</dt>
                  <dd className="m-0 text-sm">{v?.x}</dd>
                  {v?.pt && v.pt !== v.x ? <dd className="mu m-0 mt-1">{v.pt}</dd> : null}
                </div>
              ))}
            </dl>
          ) : null}
        </Secao>
      ) : null}

      <Secao slug="criativos" titulo="Anúncios" pastaId={pasta.id} falta={anuncios.length ? null : "Ainda não foram criados (etapa de divulgação)."}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {anuncios.map((a) => {
            const c = a.conteudo as { gancho?: Bi; texto?: Bi; chamada?: Bi };
            const txt = [c.gancho?.x, c.texto?.x, c.chamada?.x].filter(Boolean).join("\n\n");
            return (
              <div key={a.id} className="flex flex-col gap-2 rounded-xl bg-surface-2 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/criativo/${a.id}?f=1:1`} alt={c.gancho?.pt ?? "Anúncio"} loading="lazy" className="aspect-square w-full rounded-lg bg-bg object-cover" />
                <span className="line-clamp-3 px-1 text-xs text-text-2">{c.texto?.x}</span>
                <CopyButton text={txt} label="Copiar texto" className="self-start" />
              </div>
            );
          })}
        </div>
      </Secao>

      <Link href={`/app/p/${pasta.id}`} className="b2 no-underline">Voltar pra pasta</Link>
    </div>
  );
}
