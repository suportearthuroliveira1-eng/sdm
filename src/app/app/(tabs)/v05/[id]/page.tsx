import type { Metadata } from "next";
import Link from "next/link";
import { getPasta, etapas, itensDaPasta } from "@/lib/server/pasta";

export const metadata: Metadata = { title: "Painel do produto" };

// V05 · Painel da pasta (protótipo): etapas 0–6, cada uma com o motivo quando está fechada.
export default async function V05({ params }: PageProps<"/app/v05/[id]">) {
  const { id } = await params;
  const { pasta, vit } = await getPasta(id);
  const itens = await itensDaPasta(pasta.id);
  const et = etapas(pasta, {
    kit: itens.some((i) => i.tipo === "kit_pre" || i.tipo === "kit_quiz"),
    criativos: itens.some((i) => ["anuncio", "roteiro", "gancho", "bio"].includes(i.tipo)),
  });
  const feitas = et.filter((e) => e.ok).length;
  const atual = et.find((e) => !e.ok && e.href)?.n;
  return (
    <div className="flex flex-col gap-3.5 lg:max-w-3xl">
      <div className="flex flex-col gap-1 pt-3 lg:pt-0">
        <span className="kk">{pasta.code}</span>
        <h1 className="m-0 text-[26px] font-bold leading-tight lg:text-[30px]">{vit?.nome ?? "[produto]"}</h1>
        <span className="mu">{vit?.assunto}{pasta.paisVenda ? ` · vende pra ${pasta.paisVenda.toUpperCase()}` : ""}</span>
      </div>
      {pasta.precisaRefazer ? <div className="warn">Você trocou o país. Refaça o kit e os criativos no idioma novo (etapas 2 e 3).</div> : null}
      <div className="grid grid-cols-2 gap-2 lg:max-w-md">
        <Link href={`/app/v06/${pasta.id}`} className="b2 no-underline">Ficha do produto</Link>
        <Link href={`/app/v09/${pasta.id}`} className="b2 no-underline">Biblioteca ({itens.length})</Link>
      </div>
      <span className="mu">{feitas} de 7 etapas prontas · toque numa etapa</span>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {et.map((e) => {
          const at = e.n === atual;
          const inner = (
            <>
              <span className={`dot size-7 border-2 ${e.ok ? "border-ok bg-ok text-accent-ink" : at ? "border-accent bg-sel text-accent-2" : "border-line-2 text-muted"}`} aria-hidden>
                {e.ok ? "✓" : e.n}
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{e.n} · {e.nome}</span>
                <span className={`text-xs ${e.ok ? "text-ok" : at ? "text-accent-2" : "text-muted"}`}>
                  {e.ok ? "pronto · toque pra rever" : at ? "agora: comece por aqui" : e.travada ?? ""}
                </span>
              </span>
            </>
          );
          return (
            <li key={e.n}>
              {e.href ? (
                <Link href={e.href} className={`flex items-center gap-3 rounded-[14px] border px-3 py-[11px] text-text no-underline ${at ? "border-accent bg-sel" : "border-line bg-surface hover:border-line-2"}`}>{inner}</Link>
              ) : (
                <div className="flex items-center gap-3 rounded-[14px] border border-line bg-bg px-3 py-[11px] text-muted" aria-disabled="true">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
