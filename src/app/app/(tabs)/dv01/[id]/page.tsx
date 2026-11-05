import type { Metadata } from "next";
import Link from "next/link";
import { ExcluirImagem, GerarButton, ItemAcoes } from "@/components/pasta/acoes";
import { CopyButton } from "@/components/pasta/copy-button";
import { PastaHead } from "@/components/pasta/head";
import { LangProvider, T } from "@/components/pasta/lang";
import { iaConfigurada } from "@/lib/gen/ia";
import { CORES, type Anuncio, type Bi, type Roteiro } from "@/lib/gen/modelo";
import { baseDaPasta, getPasta, imagensDaPasta, itensDaPasta } from "@/lib/server/pasta";
import { urlsAssinadas } from "@/lib/server/storage";
import { AnuncioEditor } from "./anuncio-editor";
import { ImagemForms } from "./imagem-forms";

export const metadata: Metadata = { title: "Divulgação" };

// DV01 · Divulgação (PG01 anúncios, OG02/OG05 roteiros, bio/legenda e imagens), tudo salvo na pasta.
export default async function DV01({ params, searchParams }: PageProps<"/app/dv01/[id]">) {
  const { id } = await params;
  const fundo = String((await searchParams).fundo ?? "");
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

  return (
    <div className="flex flex-col gap-6">
      <PastaHead id={pasta.id} code={pasta.code} produto={nomeProduto} k="DIVULGAÇÃO" t="Criativos e roteiros" />
      {!base ? <div className="warn">{pasta.tipo === "sdm" ? "Pra afiliada do SDM, use as peças prontas do kit (etapa Kit de divulgação). Os criativos com IA aparecem aqui quando o time cadastrar a ficha do SDM." : "Complete a ficha do produto (etapa Ficha) pra gerar criativos com a IA."}</div> : null}
      <LangProvider idioma={idioma}>
        {/* ANÚNCIOS */}
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

        {/* GANCHOS E ROTEIROS */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="h-g" className="flex flex-col gap-3">
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
          <section aria-labelledby="h-r" className="flex flex-col gap-3">
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
        </div>

        {/* BIO E LEGENDA */}
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
      </LangProvider>

      {/* IMAGENS */}
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
                  <Link href={`/app/dv01/${pasta.id}?fundo=${im.id}#h-ads`} className="inline-flex min-h-11 items-center rounded-[22px] border border-line-2 px-3 text-xs text-text-2 no-underline">Usar nos criativos</Link>
                  <ExcluirImagem id={im.id} />
                </div>
              </figure>
            ))}
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href={`/app/v09/${pasta.id}`} className="b2 no-underline">Abrir a biblioteca</Link>
        <Link href={`/app/v05/${pasta.id}`} className="b2 no-underline">Voltar pro painel</Link>
      </div>
    </div>
  );
}
