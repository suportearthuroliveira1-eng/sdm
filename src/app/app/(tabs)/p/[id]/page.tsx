import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LockIcon } from "@/components/app/ui";
import { FASES } from "@/lib/domain/etapas";
import { hrefEtapa, pastaDaAluna } from "@/lib/server/pastas";

export const metadata: Metadata = { title: "Pasta do produto" };

// P2 · Dentro da pasta: etapas com status feita ✓, agora ●, bloqueada 🔒 (com o motivo).
export default async function Pasta({ params }: PageProps<"/app/p/[id]">) {
  const { id } = await params;
  const p = await pastaDaAluna(id);
  if (!p) notFound();
  const { pasta, etapas, fase } = p;
  if (pasta.tipo === "vitrine") redirect(`/app/v05/${pasta.id}`);
  const feitas = etapas.filter((e) => e.ok).length;
  return (
    <div className="flex flex-col gap-3.5 lg:max-w-3xl">
      <div className="flex flex-col gap-1 pt-3 lg:pt-0">
        <span className="kk">{pasta.code} · {pasta.tipo === "sdm" ? "AFILIADA DO SDM" : "PRODUTO PRÓPRIO"}</span>
        <h1 className="m-0 text-[26px] font-bold leading-tight lg:text-[30px]">{pasta.nome}</h1>
        <span className="mu">Fase: {FASES[fase]}{pasta.paisVenda ? ` · vende pra ${pasta.paisVenda.toUpperCase()}` : ""}</span>
      </div>
      {(pasta.dados as { fichaMudou?: boolean }).fichaMudou ? <div className="warn">Você mudou a ficha do produto. Confira a oferta, o ebook e a página: talvez precisem ser refeitos.</div> : null}
      <div className="grid grid-cols-2 gap-2 lg:max-w-md">
        <Link href={`/app/v09/${pasta.id}`} className="b2 no-underline">Biblioteca do produto</Link>
        {pasta.divulgacao ? <Link href={hrefEtapa(pasta.id, pasta.divulgacao === "org" ? "numeros-org" : "numeros")} className="b2 no-underline">Ver números</Link> : <Link href={`/app/dv01/${pasta.id}`} className="b2 no-underline">Criativos</Link>}
      </div>
      <span className="mu">{feitas} de {etapas.length} etapas prontas · toque numa etapa</span>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {etapas.map((e, i) => {
          const inner = (
            <>
              <span className={`dot size-7 border-2 ${e.ok ? "border-ok bg-ok text-accent-ink" : e.agora ? "border-accent bg-accent text-accent-ink" : "border-line-2 text-muted"}`} aria-hidden>
                {e.ok ? "✓" : e.travada ? LockIcon : i + 1}
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{e.nome}</span>
                <span className={`text-xs ${e.ok ? "text-ok" : e.agora ? "text-accent-2" : "text-muted"}`}>{e.ok ? "feita · toque pra rever" : e.agora ? "agora: comece por aqui" : e.travada ?? ""}</span>
              </span>
              {!e.travada ? <span aria-hidden className="text-muted">›</span> : null}
            </>
          );
          return (
            <li key={e.slug}>
              {e.travada ? (
                <div className="flex items-center gap-3 rounded-[14px] border border-line bg-bg px-3 py-[11px] text-muted" aria-disabled="true">{inner}</div>
              ) : (
                <Link href={hrefEtapa(pasta.id, e.slug)} className={`flex items-center gap-3 rounded-[14px] border px-3 py-[11px] text-text no-underline ${e.agora ? "border-accent bg-sel" : "border-line bg-surface"}`}>{inner}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
