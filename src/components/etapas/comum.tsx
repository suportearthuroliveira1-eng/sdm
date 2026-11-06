import { eq } from "drizzle-orm";
import Link from "next/link";
import type { ReactNode } from "react";
import { db, schema } from "@/lib/db";
import type { EtapaStatus } from "@/lib/domain/etapas";
import { RolarAtual } from "./rolar-atual";
import { Icone } from "@/components/ui/icone";
import { visualEtapa } from "@/lib/domain/visual-etapas";
import { guiaEtapa } from "@/lib/domain/explica-etapas";

/**
 * Cabeçalho de toda etapa: onde ela está (passo X de N, trilha clicável), o título
 * e o "Entenda" com a aula (regra 2: explica antes de pedir). Etapa feita: o Entenda fica recolhido.
 */
export async function EtapaHead({ pastaId, pastaNome, etapa, etapas, tipo = "", children }: { pastaId: string; pastaNome: string; etapa: EtapaStatus; etapas: EtapaStatus[]; tipo?: string; children?: ReactNode }) {
  const guia = guiaEtapa(tipo, etapa.slug);
  const cor = visualEtapa(etapa.slug).cor;
  const aula = etapa.aula ? await db().query.lessons.findFirst({ where: eq(schema.lessons.id, etapa.aula), columns: { id: true, titulo: true } }) : null;
  const i = etapas.findIndex((e) => e.slug === etapa.slug);
  const feitas = etapas.filter((e) => e.ok).length;
  return (
    <div className="mb-1 flex flex-col gap-3 pt-3 lg:pt-0">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/app/p/${pastaId}`} className="flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-muted no-underline hover:text-text">
          <span aria-hidden>←</span> {pastaNome}
        </Link>
        <span className="flex shrink-0 items-center gap-2">
          {feitas > 1 ? (
            <Link href={`/app/p/${pastaId}/pronto`} className="flex min-h-9 items-center gap-1 rounded-full border border-ok-line px-3 text-xs font-bold text-ok no-underline">
              <Icone nome="olho" tamanho={14} /> Tudo pronto
            </Link>
          ) : null}
          <span className="rounded-full bg-sel px-3 py-1 text-xs font-bold text-accent-2">
            Passo {i + 1} de {etapas.length}
          </span>
        </span>
      </div>
      <nav aria-label={`Passos de ${pastaNome}: ${feitas} de ${etapas.length} prontos`} className="flex flex-col gap-2">
        <div className="flex gap-1" aria-hidden>
          {etapas.map((e) => (
            <span key={e.slug} className={`h-1.5 flex-1 rounded-full transition-colors ${e.slug === etapa.slug || e.ok ? "" : "bg-line"}`} style={e.slug === etapa.slug ? { background: visualEtapa(e.slug).cor } : e.ok ? { background: "var(--ok)" } : undefined} />
          ))}
        </div>
        <ol className="-mx-4 flex list-none gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
          {etapas.map((e) => {
            const atual = e.slug === etapa.slug;
            const cls = `flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold no-underline ${atual ? "border-accent bg-sel text-text" : e.ok ? "border-line bg-surface text-text-2" : "border-line text-muted"}`;
            const v = visualEtapa(e.slug);
            const marca = e.ok ? <Icone nome="check" tamanho={14} espessura={2.4} className="text-ok" /> : <Icone nome={v.icone} tamanho={14} />;
            return (
              <li key={e.slug} style={{ color: e.travada && !atual ? undefined : v.cor }}>
                {e.travada && !atual ? (
                  <span className={`${cls} opacity-60`} title={e.travada}>{marca} {e.nome}</span>
                ) : (
                  <Link href={hrefEtapaCliente(pastaId, e.slug)} aria-current={atual ? "step" : undefined} className={cls} style={atual ? { borderColor: v.cor } : undefined}>
                    {marca} <span className="text-text">{e.nome}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
        <RolarAtual />
      </nav>
      <div className="flex items-center gap-3">
        <span className="flutua grid size-12 shrink-0 place-items-center rounded-2xl" style={{ color: visualEtapa(etapa.slug).cor, background: `color-mix(in srgb, ${visualEtapa(etapa.slug).cor} 16%, transparent)` }}>
          <Icone nome={visualEtapa(etapa.slug).icone} tamanho={26} />
        </span>
        <h1 className="m-0 text-[24px] font-bold leading-tight lg:text-[30px]">{etapa.nome}</h1>
      </div>
      <div className="-mt-2 flex flex-col gap-1">
        {etapa.ok ? <span className="text-sm font-bold text-ok">Etapa feita. Pode rever ou mudar o que quiser.</span> : null}
      </div>
      {guia ? (
        <details open={!etapa.ok} className="group surge rounded-2xl border-[1.5px] bg-surface" style={{ borderColor: `color-mix(in srgb, ${cor} 45%, transparent)` }}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-sm font-bold" style={{ color: cor }}><Icone nome="info" tamanho={16} /> O que é {artigo(etapa.nome)}?</span>
            <span className="mu text-xs transition group-open:rotate-90" aria-hidden>›</span>
          </summary>
          <div className="flex flex-col gap-2.5 px-4 pb-4">
            <span className="text-[17px] font-bold leading-snug text-text">{guia.oQueE}</span>
            <span className="tx">{guia.praQue}</span>
            {guia.exemplo ? (
              <span className="rounded-xl border-l-[3px] bg-surface-2 px-3 py-2 text-[13px] text-text-2" style={{ borderColor: cor }}><b className="text-text">Exemplo:</b> {guia.exemplo}</span>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <span className="flex flex-col gap-0.5 rounded-xl bg-surface-2 p-2.5"><span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-text-2"><Icone nome="pessoa" tamanho={12} /> Você</span><span className="text-[13px] leading-snug text-text">{guia.voce}</span></span>
              <span className="flex flex-col gap-0.5 rounded-xl bg-surface-2 p-2.5"><span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: cor }}><Icone nome="varinha" tamanho={12} /> A IA</span><span className="text-[13px] leading-snug text-text">{guia.ia}</span></span>
            </div>
            {aula ? (
              <Link href={`/app/l02/${encodeURIComponent(aula.id)}`} className="flex items-center gap-2 self-start text-[13px] font-semibold text-ok no-underline">
                <span aria-hidden>▶</span> Aula {aula.id} · {aula.titulo}
              </Link>
            ) : null}
          </div>
        </details>
      ) : tipo === "proprio" && etapa.slug === "entenda" ? null : (
        <details open={!etapa.ok} className="group rounded-[14px] border border-line bg-surface-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2 [&::-webkit-details-marker]:hidden">
            <span className="rounded-[10px] bg-warn-bg px-2 py-0.5 text-[11px] font-bold tracking-[0.5px] text-warn">ENTENDA</span>
            <span className="mu text-xs transition group-open:rotate-90" aria-hidden>›</span>
          </summary>
          <div className="flex flex-col gap-1.5 px-3.5 pb-3.5">
            <span className="tx">{etapa.entenda}</span>
            {aula ? (
              <Link href={`/app/l02/${encodeURIComponent(aula.id)}`} className="flex items-center gap-2 self-start text-[13px] font-semibold text-ok no-underline">
                <span aria-hidden>▶</span> Aula {aula.id} · {aula.titulo}
              </Link>
            ) : etapa.aula ? (
              <span className="mu">Aula {etapa.aula} · [vídeo em breve]</span>
            ) : null}
          </div>
        </details>
      )}
      {children}
    </div>
  );
}

/** "a Oferta", "o Ebook", "a Ficha do produto"... (nome da etapa com artigo, minúsculo). */
function artigo(nome: string) {
  const n = nome.replace(/^(Pago|Orgânico) · /, "");
  if (n.endsWith("?")) return "isso";
  const art = /^(ideias|regras)/i.test(n) ? "as" : /^(números|criativos|roteiros)/i.test(n) ? "os" : /^(oferta|ficha|revis|página|plataforma|conta|base|rede)/i.test(n) ? "a" : "o";
  return `${art} ${n.charAt(0).toLowerCase()}${n.slice(1)}`;
}

/** Mesmo endereço de hrefEtapa (server), sem importar código de servidor aqui. */
const hrefEtapaCliente = (pastaId: string, slug: string) => (slug === "criativos" || slug === "roteiros" ? `/app/dv01/${pastaId}?aba=${slug === "roteiros" ? "roteiros" : "anuncios"}` : `/app/p/${pastaId}/${slug}`);

/** Rodapé de toda etapa: anterior / próxima (só se a próxima estiver aberta). */
export function NavEtapas({ pastaId, etapas, slug }: { pastaId: string; etapas: EtapaStatus[]; slug: string }) {
  const i = etapas.findIndex((e) => e.slug === slug);
  const ant = etapas[i - 1];
  const prox = etapas[i + 1];
  return (
    <nav aria-label="Navegar entre os passos" className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4">
      {ant ? (
        <Link href={hrefEtapaCliente(pastaId, ant.slug)} className="flex min-h-12 flex-col justify-center rounded-[14px] border border-line px-3 text-left no-underline hover:border-accent/60">
          <span className="text-[11px] text-muted">← Anterior</span>
          <span className="truncate text-sm font-semibold text-text">{ant.nome}</span>
        </Link>
      ) : (
        <span />
      )}
      {prox ? (
        prox.travada ? (
          <span className="flex min-h-12 flex-col justify-center rounded-[14px] border border-line px-3 text-right opacity-60" title={prox.travada}>
            <span className="text-[11px] text-muted">Próxima (fechada)</span>
            <span className="truncate text-sm font-semibold text-muted">{prox.nome}</span>
          </span>
        ) : (
          <Link href={hrefEtapaCliente(pastaId, prox.slug)} className="flex min-h-12 flex-col justify-center rounded-[14px] border border-line px-3 text-right no-underline hover:border-accent/60">
            <span className="text-[11px] text-muted">Próxima →</span>
            <span className="truncate text-sm font-semibold text-text">{prox.nome}</span>
          </Link>
        )
      ) : (
        <Link href={`/app/p/${pastaId}`} className="flex min-h-12 flex-col justify-center rounded-[14px] border border-line px-3 text-right no-underline">
          <span className="text-[11px] text-muted">Fim</span>
          <span className="text-sm font-semibold text-text">Voltar pra pasta</span>
        </Link>
      )}
    </nav>
  );
}

/** Botão principal fixo embaixo da tela (acima do menu no celular). */
export function BarraAcao({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[calc(64px+max(env(safe-area-inset-bottom),12px))] z-10 -mx-4 mt-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:mx-0 lg:rounded-t-2xl lg:border-x">
      {children}
    </div>
  );
}

/** Passo a passo vindo do conteúdo do app (PASSOS do protótipo, editável no admin). */
export async function PassoAPasso({ chaves }: { chaves: string[] }) {
  const rows = await Promise.all(chaves.map((k) => db().query.contentBlocks.findFirst({ where: eq(schema.contentBlocks.key, `passos.${k}`) })));
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => {
        const d = r?.data as [string, string[], string] | undefined;
        if (!d) return null;
        return (
          <details key={chaves[i]} className="group rounded-[14px] border border-line bg-surface open:bg-surface-2">
            <summary className="flex min-h-11 list-none items-center justify-between gap-2 p-3 font-semibold [&::-webkit-details-marker]:hidden">
              {d[0]}
              <span className="mu transition group-open:rotate-90" aria-hidden>›</span>
            </summary>
            <ol className="m-0 flex flex-col gap-1.5 px-4 pb-3 pl-8">
              {d[1].map((s) => <li key={s} className="tx">{s}</li>)}
            </ol>
            <span className="mu block px-4 pb-3">[print do passo] · aula {d[2]}</span>
          </details>
        );
      })}
    </div>
  );
}

export async function itensChecklist(chave: string): Promise<{ titulo: string; itens: string[] }> {
  const r = await db().query.contentBlocks.findFirst({ where: eq(schema.contentBlocks.key, `checklist.${chave}`) });
  const d = r?.data as { titulo?: string; items?: { l: string }[] } | undefined;
  return { titulo: d?.titulo ?? chave, itens: (d?.items ?? []).map((i) => i.l) };
}

export function Proxima({ href, children = "Próxima etapa" }: { href: string; children?: ReactNode }) {
  return <Link href={href} className="b1 mt-2 no-underline">{children}</Link>;
}

/** Subpassos dentro de uma etapa (uma parte por vez): abas com ✓, conteúdo da parte e "anterior/próxima parte". */
export function SubPassos({ base, partes, atual, children }: { base: string; partes: { k: string; nome: string; ok: boolean }[]; atual: string; children: ReactNode }) {
  const i = Math.max(0, partes.findIndex((x) => x.k === atual));
  const ant = partes[i - 1];
  const prox = partes[i + 1];
  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Partes desta etapa" className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${partes.length}, minmax(0, 1fr))` }}>
        {partes.map((x, k) => (
          <Link key={x.k} href={`${base}?parte=${x.k}`} aria-current={k === i ? "step" : undefined} className={`flex min-h-12 flex-col justify-center rounded-xl border px-2.5 py-1.5 no-underline ${k === i ? "border-accent bg-sel" : "border-line bg-surface"}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${x.ok ? "text-ok" : k === i ? "text-accent-2" : "text-muted"}`}>{x.ok ? "✓ feito" : `parte ${k + 1}`}</span>
            <span className="truncate text-xs font-semibold text-text">{x.nome}</span>
          </Link>
        ))}
      </nav>
      <div key={atual} className="surge flex flex-col gap-3">{children}</div>
      {ant || prox ? (
        <div className="grid grid-cols-2 gap-2">
          {ant ? <Link href={`${base}?parte=${ant.k}`} className="b2 no-underline">← {ant.nome}</Link> : <span />}
          {prox ? <Link href={`${base}?parte=${prox.k}`} className="b1 no-underline">{prox.nome} →</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
