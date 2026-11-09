import { eq } from "drizzle-orm";
import Link from "next/link";
import type { ReactNode } from "react";
import { db, schema } from "@/lib/db";
import type { EtapaStatus } from "@/lib/domain/etapas";
import { Icone } from "@/components/ui/icone";
import { visualEtapa } from "@/lib/domain/visual-etapas";
import { guiaEtapa } from "@/lib/domain/explica-etapas";
import { fasesDa, indiceDaFase } from "@/lib/domain/jornada";

/**
 * Cabeçalho de toda etapa: onde ela está (passo X de N, trilha clicável), o título
 * e o "Entenda" com a aula (regra 2: explica antes de pedir). Etapa feita: o Entenda fica recolhido.
 */
export async function EtapaHead({ pastaId, pastaNome, etapa, etapas, tipo = "", oculto, children }: { pastaId: string; pastaNome: string; etapa: EtapaStatus; etapas: EtapaStatus[]; tipo?: string; oculto?: string | null; children?: ReactNode }) {
  const guia = guiaEtapa(tipo, etapa.slug);
  const cor = visualEtapa(etapa.slug).cor;
  const aula = etapa.aula ? await db().query.lessons.findFirst({ where: eq(schema.lessons.id, etapa.aula), columns: { id: true, titulo: true } }) : null;
  const i = etapas.findIndex((e) => e.slug === etapa.slug);
  const feitas = etapas.filter((e) => e.ok).length;
  const prox = etapas[i + 1];
  const fases = fasesDa(tipo).filter((f) => etapas.some((e) => f.slugs.includes(e.slug)));
  const fAtual = indiceDaFase(fases, etapa.slug);
  const daAtual = etapas.filter((e) => fases[fAtual]?.slugs.includes(e.slug));
  // a linha anda dentro da fase conforme ela conclui as etapas dela
  const progressoFase = daAtual.length ? Math.min(0.9, daAtual.filter((e) => e.ok).length / daAtual.length) : 0;
  return (
    <div className="mb-1 flex flex-col gap-3 pt-3 lg:pt-0">
      {oculto ? (
        <Link href="/app/oculto" className="oc-convite flex min-h-11 items-center gap-2 rounded-xl border border-c-amber/60 px-3 py-2 text-sm text-text no-underline" style={{ background: "linear-gradient(135deg, #1a1030, #0b0814)" }}>
          <span className="text-c-amber"><Icone nome="globo" tamanho={16} /></span>
          <span className="flex-1"><b className="text-c-amber">Produto do País Oculto</b> · {oculto}</span>
          <span className="text-xs font-bold text-c-amber">Ver a estratégia →</span>
        </Link>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <Link href={`/app/p/${pastaId}`} className="flex min-h-11 min-w-0 items-center gap-1.5 text-sm font-semibold text-muted no-underline hover:text-text">
          <span aria-hidden>←</span> <span className="truncate">{pastaNome}</span>
        </Link>
        {feitas > 1 ? (
          <Link href={`/app/p/${pastaId}/pronto`} className="flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-ok-line px-3 text-xs font-bold text-ok no-underline">
            <Icone nome="olho" tamanho={14} /> Tudo pronto
          </Link>
        ) : null}
      </div>

      {/* a jornada em poucas fases: onde ela está e o que vem depois */}
      <nav aria-label={`Seu caminho: fase ${fAtual + 1} de ${fases.length}, ${fases[fAtual]?.nome}`} className="surge flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3">
        <ol className="relative m-0 flex list-none items-start justify-between p-0">
          <span aria-hidden className="absolute left-5 right-5 top-[17px] h-[3px] rounded-full bg-line" />
          <span aria-hidden className="absolute left-5 top-[17px] h-[3px] rounded-full transition-[width] duration-700" style={{ width: `calc((100% - 2.5rem) * ${fases.length > 1 ? (fAtual + progressoFase) / (fases.length - 1) : 0})`, background: "linear-gradient(90deg, var(--ok), " + (fases[fAtual]?.cor ?? "var(--accent)") + ")" }} />
          {fases.map((f, k) => {
            const daFase = etapas.filter((e) => f.slugs.includes(e.slug));
            const feita = daFase.length > 0 && daFase.every((e) => e.ok);
            const agora = k === fAtual;
            const destino = daFase.find((e) => !e.ok && !e.travada) ?? daFase[0];
            const bolinha = (
              <span className={`grid size-[34px] place-items-center rounded-full border-2 transition-all duration-500 ${agora ? "pulsa scale-110" : ""}`} style={{ ["--cor" as string]: f.cor, borderColor: agora || feita ? f.cor : "var(--line-2)", background: agora ? f.cor : feita ? `color-mix(in srgb, ${f.cor} 18%, var(--surface))` : "var(--bg)", color: agora ? "var(--accent-ink)" : feita ? f.cor : "var(--muted)" }}>
                <Icone nome={feita && !agora ? "check" : f.icone} tamanho={16} espessura={feita && !agora ? 3 : 2} />
              </span>
            );
            return (
              <li key={f.k} className="relative z-[1] flex w-14 flex-col items-center gap-1 text-center">
                {destino && !destino.travada && !agora ? <Link href={hrefEtapaCliente(pastaId, destino.slug)} aria-label={`Fase ${f.nome}`} className="no-underline">{bolinha}</Link> : bolinha}
                <span className={`text-[11px] leading-tight ${agora ? "font-bold text-text" : "text-muted"}`}>{f.nome}</span>
              </li>
            );
          })}
        </ol>
        <div className="flex items-center justify-between gap-2 border-t border-line pt-2 text-xs">
          <span className="text-muted">Passo <b className="text-text">{i + 1}</b> de {etapas.length}</span>
          {prox ? <span className="truncate text-muted">Depois: <b className="text-text-2">{prox.nome}</b></span> : <span className="font-bold text-ok">Último passo</span>}
        </div>
        <details className="group">
          <summary className="flex min-h-9 cursor-pointer list-none items-center justify-center gap-1 text-xs font-bold text-accent-2 [&::-webkit-details-marker]:hidden">
            Ver todos os passos <span aria-hidden className="transition group-open:rotate-90">›</span>
          </summary>
          <ol className="surge m-0 mt-1 grid list-none gap-1 p-0 sm:grid-cols-2">
            {etapas.map((e, k) => {
              const atual = e.slug === etapa.slug;
              const v = visualEtapa(e.slug);
              const conteudo = (
                <>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${e.ok ? "bg-ok text-accent-ink" : atual ? "text-accent-ink" : "border border-line-2 text-muted"}`} style={atual && !e.ok ? { background: v.cor } : undefined}>
                    {e.ok ? <Icone nome="check" tamanho={12} espessura={3} /> : k + 1}
                  </span>
                  <span className={`truncate ${atual ? "font-bold text-text" : e.travada ? "text-muted" : "text-text-2"}`}>{e.nome}</span>
                </>
              );
              return (
                <li key={e.slug}>
                  {e.travada && !atual ? (
                    <span className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm opacity-60" title={e.travada}>{conteudo}</span>
                  ) : (
                    <Link href={hrefEtapaCliente(pastaId, e.slug)} aria-current={atual ? "step" : undefined} className={`flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm no-underline ${atual ? "bg-sel" : "hover:bg-surface-2"}`}>{conteudo}</Link>
                  )}
                </li>
              );
            })}
          </ol>
        </details>
      </nav>

      <div className="flex items-center gap-3">
        <span className="flutua grid size-12 shrink-0 place-items-center rounded-2xl" style={{ color: visualEtapa(etapa.slug).cor, background: `color-mix(in srgb, ${visualEtapa(etapa.slug).cor} 16%, transparent)` }}>
          <Icone nome={visualEtapa(etapa.slug).icone} tamanho={26} />
        </span>
        <span className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: fases[fAtual]?.cor }}>{fases[fAtual]?.nome}</span>
          <h1 className="m-0 text-[24px] font-bold leading-tight lg:text-[30px]">{etapa.nome}</h1>
        </span>
      </div>
      {etapa.ok ? <span className="-mt-1 text-sm font-bold text-ok">Etapa feita. Pode rever ou mudar o que quiser.</span> : null}
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
