import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LockIcon } from "@/components/app/ui";
import { Icone } from "@/components/ui/icone";
import { visualEtapa } from "@/lib/domain/visual-etapas";
import { PilotoAutomatico } from "@/components/etapas/piloto";
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
  const agora = etapas.find((e) => e.agora);
  const pct = etapas.length ? Math.round((feitas / etapas.length) * 100) : 0;
  // fases da pasta (agrupa a lista longa em blocos com nome)
  const grupo = (slug: string) => {
    const div = ["divulgar", "base-anuncios", "criativos", "pixel", "numeros", "perfil", "roteiros", "numeros-org"];
    if (div.includes(slug)) return "Divulgar";
    if (pasta.tipo === "sdm") return "Começar como afiliada";
    return ["entenda", "ideias", "ficha", "oferta", "mercado", "ebook", "revisao"].includes(slug) ? "Criar o produto" : "Preparar a venda";
  };
  const grupos = [...new Set(etapas.map((e) => grupo(e.slug)))];
  let motivoMostrado = false;
  return (
    <div className="flex flex-col gap-4 lg:max-w-3xl">
      <div className="flex flex-col gap-1 pt-3 lg:pt-0">
        <span className="kk">{pasta.tipo === "sdm" ? "AFILIADA DO SDM" : "PRODUTO PRÓPRIO"}</span>
        <h1 className="m-0 text-[26px] font-bold leading-tight lg:text-[30px]">{pasta.nome}</h1>
        <span className="mu">Fase: {FASES[fase]}{pasta.paisVenda ? ` · vende pra ${pasta.paisVenda.toUpperCase()}` : ""}</span>
      </div>
      {(pasta.dados as { fichaMudou?: boolean }).fichaMudou ? <div className="warn">Você mudou a ficha do produto. Confira a oferta, o ebook e a página: talvez precisem ser refeitos.</div> : null}

      <section className="flex flex-col gap-3 rounded-2xl border border-accent bg-sel p-4" aria-labelledby="cont">
        <div className="flex items-center justify-between gap-2">
          <span className="kk">{feitas} DE {etapas.length} PRONTAS</span>
          <span className="text-sm font-bold text-accent-2">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        {agora ? (
          <>
            <div className="flex flex-col gap-0.5">
              <h2 id="cont" className="m-0 text-lg font-bold">Agora: {agora.nome}</h2>
              <p className="mu m-0 text-sm">{agora.entenda}</p>
            </div>
            <Link href={hrefEtapa(pasta.id, agora.slug)} className="b1 no-underline">{feitas ? "Continuar" : "Começar"}</Link>
          </>
        ) : (
          <h2 id="cont" className="m-0 text-lg font-bold">{feitas === etapas.length ? "Tudo pronto por aqui." : "Esperando o time ou uma etapa fechada."}</h2>
        )}
      </section>

      {feitas > 0 ? (
        <Link href={`/app/p/${pasta.id}/pronto`} className="surge flex items-center gap-3 rounded-2xl border border-ok-line bg-ok-bg p-4 text-text no-underline transition-colors hover:border-ok">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ok text-accent-ink"><Icone nome="olho" tamanho={20} /></span>
          <span className="flex flex-1 flex-col">
            <span className="font-bold">Ver tudo que está pronto</span>
            <span className="text-sm text-ok-text">Ebook em PDF, página de vendas, oferta, ficha e anúncios, num lugar só.</span>
          </span>
          <span aria-hidden className="text-ok">→</span>
        </Link>
      ) : null}

      {pasta.tipo === "proprio" && !etapas.find((e) => e.slug === "ebook")?.ok ? (
        (() => {
          const pil = (pasta.dados as { piloto?: { em?: string; fim?: string | null } }).piloto;
          const parou = Boolean(pil?.em && !pil?.fim);
          return (
            <PilotoAutomatico
              pastaId={pasta.id}
              revisaoHref={`/app/p/${pasta.id}/revisao`}
              continuar={parou || feitas > 0}
              titulo={parou ? "A IA parou no meio: continuar" : feitas > 0 ? "Deixe a IA fazer o resto" : "A IA faz tudo pra mim"}
              descricao={parou ? "Você saiu enquanto a IA montava o produto. Ela pula o que já está pronto e termina o resto." : feitas > 0 ? "Ela pula o que você já fez e termina ficha, oferta, país e ebook. Você revisa no final." : "Ela escolhe a ideia, completa a ficha, monta a oferta e escreve o ebook. Você revisa no final."}
            />
          );
        })()
      ) : null}

      {grupos.map((g) => (
        <section key={g} className="flex flex-col gap-2" aria-label={g}>
          <h2 className="m-0 mt-1 text-xs font-bold uppercase tracking-wider text-muted">{g}</h2>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {etapas.map((e) => {
              if (grupo(e.slug) !== g) return null;
              let sub = e.ok ? "feita · toque pra rever" : e.agora ? "agora: comece por aqui" : "";
              if (e.travada) {
                sub = motivoMostrado ? "abre depois" : e.travada;
                motivoMostrado = true;
              } else if (!e.ok && !e.agora) sub = "aberta";
              const inner = (
                <>
                  <span className={`relative grid size-10 shrink-0 place-items-center rounded-xl ${e.agora ? "pulsa" : ""}`} aria-hidden style={e.travada ? { color: "var(--muted)", background: "var(--surface-2)" } : { color: visualEtapa(e.slug).cor, background: `color-mix(in srgb, ${visualEtapa(e.slug).cor} 16%, transparent)`, ["--cor" as string]: visualEtapa(e.slug).cor }}>
                    {e.travada ? LockIcon : <Icone nome={visualEtapa(e.slug).icone} tamanho={20} />}
                    {e.ok ? <span className="absolute -bottom-1 -right-1 grid size-[18px] place-items-center rounded-full border-2 border-bg bg-ok text-accent-ink"><Icone nome="check" tamanho={11} espessura={3} /></span> : null}
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">{e.nome}</span>
                    <span className={`text-xs ${e.ok ? "text-ok" : e.agora ? "text-accent-2" : "text-muted"}`}>{sub}</span>
                  </span>
                  {!e.travada ? <span aria-hidden className="text-muted">›</span> : null}
                </>
              );
              return (
                <li key={e.slug}>
                  {e.travada ? (
                    <div className="flex items-center gap-3 rounded-[14px] border border-line bg-bg px-3 py-[11px] text-muted" aria-disabled="true">{inner}</div>
                  ) : (
                    <Link href={hrefEtapa(pasta.id, e.slug)} className={`flex items-center gap-3 rounded-[14px] border px-3 py-[11px] text-text no-underline transition-colors hover:border-accent/60 ${e.agora ? "border-accent bg-sel" : "border-line bg-surface"}`}>{inner}</Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <div className="grid grid-cols-2 gap-2 lg:max-w-md">
        <Link href={`/app/v09/${pasta.id}`} className="b2 no-underline">Biblioteca do produto</Link>
        {pasta.divulgacao ? <Link href={hrefEtapa(pasta.id, pasta.divulgacao === "org" ? "numeros-org" : "numeros")} className="b2 no-underline">Ver números</Link> : <Link href={`/app/dv01/${pasta.id}`} className="b2 no-underline">Criativos</Link>}
      </div>
    </div>
  );
}
