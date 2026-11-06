import type { Metadata } from "next";
import Link from "next/link";
import { ExcluirImagem, GerarButton, ItemAcoes } from "@/components/pasta/acoes";
import { CopyButton } from "@/components/pasta/copy-button";
import { LangProvider, T } from "@/components/pasta/lang";
import { iaConfigurada } from "@/lib/gen/ia";
import { CORES, type Anuncio, type Bi, type Roteiro } from "@/lib/gen/modelo";
import { baseDaPasta, getPasta, imagensDaPasta, itensDaPasta } from "@/lib/server/pasta";
import { urlsAssinadas } from "@/lib/server/storage";
import { hrefEtapa, pastaDaAluna } from "@/lib/server/pastas";
import { Icone, type NomeIcone } from "@/components/ui/icone";
import { AnuncioEditor } from "./anuncio-editor";
import { MarcarFeito } from "@/components/etapas/interativos";
import { ImagemForms } from "./imagem-forms";

export const metadata: Metadata = { title: "Divulgação" };

const ABAS: { k: string; nome: string; icone: NomeIcone; cor: string; ajuda: string }[] = [
  { k: "anuncios", nome: "Anúncios", icone: "megafone", cor: "var(--c-pink)", ajuda: "3 anúncios prontos: gancho, meio e chamada, com o criativo em PNG pra baixar." },
  { k: "imagens", nome: "Imagens", icone: "olho", cor: "var(--c-sky)", ajuda: "Opcional: gere com a IA ou envie a sua. A imagem vira fundo dos anúncios." },
  { k: "ganchos", nome: "Ganchos", icone: "lampada", cor: "var(--c-amber)", ajuda: "10 frases curtas que fazem a pessoa parar de rolar." },
  { k: "roteiros", nome: "Roteiros", icone: "play", cor: "var(--c-orange)", ajuda: "10 roteiros de vídeo curto, sem precisar aparecer." },
  { k: "bio", nome: "Bio e legenda", icone: "pessoa", cor: "var(--c-teal)", ajuda: "Bio do perfil, legenda com hashtags e chamadas." },
];

// DV01 · Criativos e roteiros em passo a passo (uma seção por vez), tudo salvo na pasta.
export default async function DV01({ params, searchParams }: PageProps<"/app/dv01/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const fundo = String(sp.fundo ?? "");
  const aba = ABAS.some((a) => a.k === sp.aba) ? String(sp.aba) : "anuncios";
  const c = await getPasta(id);
  const { pasta, vit } = c;
  const base = await baseDaPasta(c);
  const [itens, imgs, ia] = await Promise.all([itensDaPasta(pasta.id), imagensDaPasta(pasta.id), iaConfigurada("image")]);
  const urls = await urlsAssinadas(imgs.map((i) => i.storagePath!).filter(Boolean));
  const ads = itens.filter((i) => i.tipo === "anuncio");
  const gancho = itens.find((i) => i.tipo === "gancho");
  const roteiro = itens.find((i) => i.tipo === "roteiro");
  const bio = itens.find((i) => i.tipo === "bio");
  const imgFundo = imgs.find((i) => i.id === fundo);
  const idioma = base?.lang ?? vit?.idioma ?? "en";
  const nomeProduto = vit?.nome ?? pasta.nome ?? "";
  const feito: Record<string, boolean> = { anuncios: ads.length > 0, imagens: imgs.length > 0, ganchos: Boolean(gancho), roteiros: Boolean(roteiro), bio: Boolean(bio) };
  const i = ABAS.findIndex((a) => a.k === aba);
  const ant = ABAS[i - 1];
  const prox = ABAS[i + 1];
  const href = (k: string) => `/app/dv01/${pasta.id}?aba=${k}${fundo ? `&fundo=${fundo}` : ""}`;
  // próxima etapa do caminho (pastas sdm/proprio): a primeira aberta e não feita depois de criativos/roteiros
  const ctx = pasta.tipo === "vitrine" ? null : await pastaDaAluna(pasta.id);
  const seguir = ctx?.etapas.find((e) => !e.ok && !e.travada && e.slug !== "criativos" && e.slug !== "roteiros");
  const voltar = ctx ? `/app/p/${pasta.id}` : `/app/v05/${pasta.id}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 pt-3 lg:pt-0">
        <Link href={voltar} className="flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-muted no-underline hover:text-text"><span aria-hidden>←</span> {nomeProduto}</Link>
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ color: ABAS[i]!.cor, background: `color-mix(in srgb, ${ABAS[i]!.cor} 16%, transparent)` }}><Icone nome={ABAS[i]!.icone} tamanho={26} /></span>
          <div className="flex flex-col">
            <span className="kk">CRIATIVOS E ROTEIROS · PASSO {i + 1} DE {ABAS.length}</span>
            <h1 className="m-0 text-[24px] font-bold leading-tight lg:text-[28px]">{ABAS[i]!.nome}</h1>
          </div>
        </div>
        <p className="tx m-0">{ABAS[i]!.ajuda}</p>
        <nav aria-label="Seções" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0">
          {ABAS.map((a, k) => (
            <Link key={a.k} href={href(a.k)} aria-current={a.k === aba ? "step" : undefined} className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold no-underline ${a.k === aba ? "bg-sel text-text" : "border-line text-text-2"}`} style={a.k === aba ? { borderColor: a.cor } : undefined}>
              <span style={{ color: feito[a.k] ? "var(--ok)" : a.cor }}>{feito[a.k] ? <Icone nome="check" tamanho={14} espessura={2.6} /> : <Icone nome={a.icone} tamanho={14} />}</span>
              {k + 1}. {a.nome}
            </Link>
          ))}
        </nav>
      </div>
      {!base ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-warn-line bg-warn-bg p-4 text-warn-text">
          <span className="text-sm">{pasta.tipo === "sdm" ? "Pra afiliada do SDM, os anúncios e roteiros vêm prontos no kit do time (etapa Kit de divulgação). A IA cria aqui quando o time cadastrar a ficha do SDM." : "Complete a ficha do produto (etapa Ficha) pra gerar criativos com a IA."}</span>
          {ctx && pasta.tipo === "sdm" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <MarcarFeito pastaId={pasta.id} etapa={aba === "roteiros" || aba === "ganchos" ? "roteiros" : "criativos"} feita={false} proxima={seguir ? hrefEtapa(pasta.id, seguir.slug) : voltar}>
                Vou usar as peças do kit: seguir
              </MarcarFeito>
              <Link href={hrefEtapa(pasta.id, "kit")} className="b2 no-underline">Abrir o kit</Link>
            </div>
          ) : null}
        </div>
      ) : null}
      <LangProvider idioma={idioma}>
        {/* ANÚNCIOS */}
        {aba === "anuncios" ? (
        <section aria-labelledby="h-ads" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="h-ads" className="m-0 text-lg font-bold">Anúncios ({ads.length})</h2>
              <p className="mu m-0 text-[13px]">Cada um tem gancho (faz parar), meio (mostra o produto) e chamada (diz o que fazer). Baixe o criativo pronto em PNG.</p>
            </div>
            <GerarButton pastaId={pasta.id} tipo="anuncio" label={ads.length ? "Gerar mais 3 anúncios" : "Gerar 3 anúncios"} className={ads.length ? "b2" : "b1"} />
          </div>
          {imgs.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mu">Fundo dos criativos:</span>
              <Link href={`/app/dv01/${pasta.id}`} className={`flex min-h-11 items-center rounded-[22px] border px-3 text-xs no-underline ${!imgFundo ? "border-accent bg-sel text-text" : "border-line-2 text-text-2"}`}>Cor</Link>
              {imgs.map((im, k) => (
                <Link key={im.id} href={`/app/dv01/${pasta.id}?fundo=${im.id}`} className={`flex min-h-11 items-center rounded-[22px] border px-3 text-xs no-underline ${imgFundo?.id === im.id ? "border-accent bg-sel text-text" : "border-line-2 text-text-2"}`}>Imagem {k + 1}</Link>
              ))}
            </div>
          ) : null}
          <div className="grid gap-3 lg:grid-cols-3">
            {ads.map((it, n) => {
              const a = it.conteudo as Anuncio;
              const q = imgFundo ? `&img=${imgFundo.id}` : "";
              return (
                <article key={it.id} id={it.id} className="cd gap-2.5 border border-line">
                  <span className="kk">ANÚNCIO {ads.length - n} · {it.code}</span>
                  <div
                    className="flex h-[180px] items-end rounded-xl bg-cover bg-center p-3"
                    style={{ backgroundColor: CORES[a.cor % 4], backgroundImage: imgFundo?.storagePath && urls[imgFundo.storagePath] ? `url(${urls[imgFundo.storagePath]})` : undefined }}
                  >
                    <span className="rounded-lg bg-bg px-2 py-1.5 text-[15px] font-bold leading-snug"><T x={a.gancho.x} pt={a.gancho.pt} /></span>
                  </div>
                  <div className="flex flex-col gap-0.5"><span className="text-[11px] font-bold text-warn">GANCHO</span><span className="tx"><T x={a.gancho.x} pt={a.gancho.pt} /></span></div>
                  <div className="flex flex-col gap-0.5"><span className="text-[11px] font-bold text-warn">MEIO</span><span className="tx"><T x={a.meio.x} pt={a.meio.pt} /></span></div>
                  <div className="flex flex-col gap-0.5"><span className="text-[11px] font-bold text-warn">CHAMADA</span><span className="tx"><T x={a.chamada.x} pt={a.chamada.pt} /></span></div>
                  <div className="flex flex-wrap gap-2">
                    <CopyButton text={a.texto.x} label="Copiar texto" />
                    {(["1:1", "4:5", "9:16"] as const).map((f) => (
                      <a key={f} href={`/api/criativo/${it.id}?f=${encodeURIComponent(f)}${q}`} download className="inline-flex min-h-11 items-center rounded-[22px] border border-line-2 px-3 text-xs font-semibold text-text-2 no-underline hover:bg-surface-2">PNG {f}</a>
                    ))}
                  </div>
                  <AnuncioEditor id={it.id} gancho={a.gancho.x} texto={a.texto.x} cor={a.cor} />
                  <ItemAcoes id={it.id} status={it.status} />
                </article>
              );
            })}
          </div>
        </section>
        ) : null}

        {/* GANCHOS */}
        {aba === "ganchos" ? (
          <section aria-labelledby="h-g" className="flex flex-col gap-3 lg:max-w-3xl">
            <div className="flex items-end justify-between gap-2">
              <h2 id="h-g" className="m-0 text-lg font-bold">Ganchos</h2>
              <GerarButton pastaId={pasta.id} tipo="gancho" label={gancho ? "Gerar de novo" : "Gerar 10 ganchos"} className={gancho ? "b2" : "b1"} />
            </div>
            {gancho ? (
              <div className="cd gap-2">
                <ol className="m-0 flex flex-col gap-2 pl-5">
                  {(gancho.conteudo as { ganchos: Bi[] }).ganchos.map((g) => (
                    <li key={g.x} className="tx"><T x={g.x} pt={g.pt} /></li>
                  ))}
                </ol>
                <CopyButton text={(gancho.conteudo as { ganchos: Bi[] }).ganchos.map((g) => g.x).join("\n")} label="Copiar todos" className="self-start" />
                <ItemAcoes id={gancho.id} status={gancho.status} />
              </div>
            ) : null}
          </section>
        ) : null}

        {/* ROTEIROS */}
        {aba === "roteiros" ? (
          <section aria-labelledby="h-r" className="flex flex-col gap-3 lg:max-w-3xl">
            <div className="flex items-end justify-between gap-2">
              <h2 id="h-r" className="m-0 text-lg font-bold">Roteiros de vídeo</h2>
              <GerarButton pastaId={pasta.id} tipo="roteiro" label={roteiro ? "Gerar de novo" : "Gerar 10 roteiros"} className={roteiro ? "b2" : "b1"} />
            </div>
            {roteiro ? (
              <div className="flex flex-col gap-2">
                {(roteiro.conteudo as { roteiros: Roteiro[] }).roteiros.map((r, i) => (
                  <div key={i} className="cd gap-1">
                    <span className="text-[11px] font-bold text-warn">ROTEIRO {i + 1} · {r.formato.toUpperCase()}</span>
                    <span className="tx"><b>Gancho (0–2 s):</b> <T x={r.gancho.x} pt={r.gancho.pt} /></span>
                    <span className="tx"><b>Meio:</b> {r.meio}</span>
                    <span className="tx"><b>Chamada:</b> <T x={r.chamada.x} pt={r.chamada.pt} /></span>
                    <CopyButton text={`${r.gancho.x}\n${r.chamada.x}`} className="self-start" />
                  </div>
                ))}
                <ItemAcoes id={roteiro.id} status={roteiro.status} />
              </div>
            ) : null}
          </section>
        ) : null}

        {/* BIO E LEGENDA */}
        {aba === "bio" ? (
        <section aria-labelledby="h-b" className="flex flex-col gap-3 lg:max-w-3xl">
          <div className="flex items-end justify-between gap-2">
            <h2 id="h-b" className="m-0 text-lg font-bold">Bio e legenda</h2>
            <GerarButton pastaId={pasta.id} tipo="bio" label={bio ? "Gerar de novo" : "Gerar bio e legenda"} className={bio ? "b2" : "b1"} />
          </div>
          {bio ? (() => {
            const b = bio.conteudo as { bio: Bi; legenda: Bi & { tags: string }; chamadas: Bi[] };
            return (
              <div className="cd gap-2">
                <span className="kk">BIO</span>
                <span className="tx"><T x={b.bio.x} pt={b.bio.pt} /></span>
                <CopyButton text={b.bio.x} className="self-start" />
                <span className="kk mt-2">LEGENDA</span>
                <span className="tx"><T x={b.legenda.x} pt={b.legenda.pt} /> <span className="text-accent-2">{b.legenda.tags}</span></span>
                <CopyButton text={`${b.legenda.x} ${b.legenda.tags}`} className="self-start" />
                <span className="kk mt-2">CHAMADAS</span>
                {b.chamadas.map((c) => <span key={c.x} className="tx">• <T x={c.x} pt={c.pt} /></span>)}
                <ItemAcoes id={bio.id} status={bio.status} />
              </div>
            );
          })() : null}
        </section>
        ) : null}
      </LangProvider>

      {/* IMAGENS */}
      {aba === "imagens" ? (
      <section aria-labelledby="h-i" className="flex flex-col gap-3">
        <div>
          <h2 id="h-i" className="m-0 text-lg font-bold">Imagens ({imgs.length})</h2>
          <p className="mu m-0 text-[13px]">Gere com IA ou envie a sua (foto, print, arte). Elas ficam guardadas na pasta e podem virar fundo dos criativos.</p>
        </div>
        <ImagemForms id={pasta.id} promptBase={base?.img ?? vit?.promptImagem ?? ""} ia={ia} />
        {imgs.length ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {imgs.map((im) => (
              <figure key={im.id} className="m-0 flex flex-col gap-2 rounded-2xl bg-surface p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {im.storagePath && urls[im.storagePath] ? <img src={urls[im.storagePath]} alt={im.prompt} className="aspect-square w-full rounded-xl object-cover" /> : null}
                <figcaption className="mu line-clamp-2 px-1">{im.proporcao} · {im.prompt}</figcaption>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {im.storagePath && urls[im.storagePath] ? <a href={urls[im.storagePath]} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-[22px] border border-line-2 px-3 text-xs text-text-2 no-underline">Abrir</a> : null}
                  <Link href={`/app/dv01/${pasta.id}?aba=anuncios&fundo=${im.id}`} className="inline-flex min-h-11 items-center rounded-[22px] border border-line-2 px-3 text-xs text-text-2 no-underline">Usar nos criativos</Link>
                  <ExcluirImagem id={im.id} />
                </div>
              </figure>
            ))}
          </div>
        ) : null}
      </section>
      ) : null}

      {/* navegação do passo a passo */}
      <nav aria-label="Navegar entre as seções" className="sticky bottom-[calc(64px+max(env(safe-area-inset-bottom),12px))] z-10 -mx-4 flex flex-col gap-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:mx-0 lg:rounded-t-2xl lg:border-x">
        <div className="grid grid-cols-2 gap-2">
          {ant ? <Link href={href(ant.k)} className="b2 no-underline">← {ant.nome}</Link> : <Link href={voltar} className="b2 no-underline">← Voltar</Link>}
          {prox ? (
            <Link href={href(prox.k)} className={`${feito[aba] || aba === "imagens" ? "b1" : "b2"} no-underline`}>{prox.nome} →</Link>
          ) : seguir ? (
            <Link href={hrefEtapa(pasta.id, seguir.slug)} className="b1 no-underline">Seguir: {seguir.nome} →</Link>
          ) : (
            <Link href={voltar} className="b1 no-underline">Concluir →</Link>
          )}
        </div>
        {!feito[aba] && aba !== "imagens" ? <span className="text-center text-xs text-muted">Gere esta parte ou pule pra próxima. Dá pra voltar quando quiser.</span> : null}
        {seguir && prox ? <Link href={hrefEtapa(pasta.id, seguir.slug)} className="text-center text-xs font-semibold no-underline">Já tenho o que preciso: seguir pra {seguir.nome} →</Link> : null}
      </nav>
    </div>
  );
}
