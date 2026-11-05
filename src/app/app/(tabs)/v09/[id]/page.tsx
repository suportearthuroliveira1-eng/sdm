import type { Metadata } from "next";
import Link from "next/link";
import { ItemAcoes } from "@/components/pasta/acoes";
import { CopyButton } from "@/components/pasta/copy-button";
import { PastaHead } from "@/components/pasta/head";
import { getPasta, imagensDaPasta, itensDaPasta } from "@/lib/server/pasta";
import { urlsAssinadas } from "@/lib/server/storage";
import { textoDoItem, NOME_TIPO } from "@/lib/gen/texto";

export const metadata: Metadata = { title: "Biblioteca" };

// V09 · Biblioteca: tudo que foi gerado pra esse produto. Nada vai pro ar sem aprovar.
export default async function V09({ params, searchParams }: PageProps<"/app/v09/[id]">) {
  const { id } = await params;
  const f = String((await searchParams).f ?? "todos");
  const { pasta, vit } = await getPasta(id);
  const [itens, imgs] = await Promise.all([itensDaPasta(pasta.id), imagensDaPasta(pasta.id)]);
  const tipos = [...new Set(itens.map((i) => i.tipo))];
  const vis = f === "todos" ? itens : f === "imagens" ? [] : itens.filter((i) => i.tipo === f);
  const urls = f === "todos" || f === "imagens" ? await urlsAssinadas(imgs.map((i) => i.storagePath!).filter(Boolean)) : {};
  const chips = [["todos", "Tudo"], ...tipos.map((t) => [t, NOME_TIPO[t] ?? t]), ...(imgs.length ? [["imagens", `Imagens (${imgs.length})`]] : [])];
  return (
    <div className="flex flex-col gap-3.5">
      <PastaHead id={pasta.id} code={pasta.code} produto={vit?.nome ?? ""} k="BIBLIOTECA" t="Tudo desse produto" />
      <p className="tx text-[13px]">Tudo que o app fez pra esse produto. Nada vai pro ar sem você aprovar.</p>
      <nav aria-label="Filtro" className="flex gap-2 overflow-x-auto pb-1">
        {chips.map(([k, l]) => (
          <Link key={k} href={`/app/v09/${pasta.id}?f=${k}`} className={`flex min-h-11 flex-none items-center rounded-[22px] border px-3 text-xs font-semibold no-underline ${f === k ? "border-accent bg-sel text-text" : "border-line-2 text-text-2"}`}>{l}</Link>
        ))}
      </nav>
      {itens.length === 0 && imgs.length === 0 ? <span className="mu">Ainda vazio. Aparece quando você gerar o kit (etapa 2) ou os criativos (etapa 3).</span> : null}
      <div className="grid gap-3 lg:grid-cols-2">
        {vis.map((it) => {
          const txt = textoDoItem(it.tipo, it.conteudo);
          return (
            <div key={it.id} className="cd gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="kk">{(NOME_TIPO[it.tipo] ?? it.tipo).toUpperCase()}</span>
                <span className="mu">{it.code} · v{it.versao} · {it.status}</span>
              </div>
              <p className="tx m-0 line-clamp-5 whitespace-pre-line text-[13px]">{txt}</p>
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton text={txt} />
                {it.tipo === "anuncio" ? <Link href={`/app/dv01/${pasta.id}#${it.id}`} className="mu">abrir criativo</Link> : null}
              </div>
              <ItemAcoes id={it.id} status={it.status} />
            </div>
          );
        })}
        {(f === "todos" || f === "imagens") &&
          imgs.map((im) => (
            <div key={im.id} className="cd gap-2">
              <span className="kk">IMAGEM · {im.proporcao}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {im.storagePath && urls[im.storagePath] ? <img src={urls[im.storagePath]} alt={im.prompt} className="max-h-64 w-full rounded-xl object-contain" /> : null}
              <span className="mu line-clamp-2">{im.prompt}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
