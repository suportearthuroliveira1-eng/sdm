"use client";

import { useState } from "react";
import { Icone, type NomeIcone } from "@/components/ui/icone";
import { Robo } from "@/components/ux/ia-trabalhando";

type No = { slug: string; nome: string; cor: string; icone: NomeIcone; voce: string; ia: string; olha: string };

/** Fluxograma do produto: um nó por passo, ligados por linha animada. Toque pra abrir o detalhe. */
export function FluxoProduto({ nos }: { nos: No[] }) {
  const [aberto, setAberto] = useState<string | null>(nos[0]?.slug ?? null);
  return (
    <ol className="m-0 flex list-none flex-col p-0" aria-label="Os passos pra criar o seu produto">
      {nos.map((n, i) => {
        const ab = aberto === n.slug;
        const ultimo = i === nos.length - 1;
        return (
          <li key={n.slug} className="surge relative flex gap-3" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="flex flex-col items-center">
              <span className={`relative z-[1] grid size-11 shrink-0 place-items-center rounded-2xl transition-transform ${ab ? "pulsa scale-110" : ""}`} style={{ color: n.cor, background: `color-mix(in srgb, ${n.cor} 18%, var(--bg))`, ["--cor" as string]: n.cor }}>
                <Icone nome={n.icone} tamanho={22} />
              </span>
              {!ultimo ? (
                <span aria-hidden className="fluxo-traco my-1 min-h-3 w-[2.5px] flex-1 rounded-full opacity-70" style={{ ["--cor" as string]: n.cor }} />
              ) : null}
            </div>
            <div className={`mb-3 flex flex-1 flex-col rounded-2xl border transition-colors ${ab ? "bg-surface" : "border-transparent"}`} style={ab ? { borderColor: `color-mix(in srgb, ${n.cor} 50%, transparent)` } : undefined}>
              <button type="button" aria-expanded={ab} onClick={() => setAberto(ab ? null : n.slug)} className="flex min-h-11 items-center justify-between gap-2 px-3 py-2 text-left">
                <span className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: n.cor }}>Passo {i + 1}</span>
                  <span className="font-bold text-text">{n.nome}</span>
                </span>
                <span aria-hidden className={`text-muted transition-transform ${ab ? "rotate-90" : ""}`}>›</span>
              </button>
              {ab ? (
                <div className="surge grid gap-2 px-3 pb-3 sm:grid-cols-3">
                  <Quadro titulo="Você faz" icone="pessoa" cor="var(--text-2)" texto={n.voce} />
                  <Quadro titulo="A IA faz" icone="varinha" cor={n.cor} texto={n.ia} />
                  <Quadro titulo="O que a IA olha" icone="olho" cor="var(--c-amber)" texto={n.olha} />
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Quadro({ titulo, icone, cor, texto }: { titulo: string; icone: NomeIcone; cor: string; texto: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-surface-2 p-3">
      <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: cor }}>
        <Icone nome={icone} tamanho={14} /> {titulo}
      </span>
      <span className="text-[13px] leading-snug text-text-2">{texto}</span>
    </div>
  );
}

/** "Como a IA pensa": os dados dela entram, a IA raciocina em 4 passos, saem as ideias. */
export function ComoIaPensa({ dados, passos }: { dados: { rotulo: string; valor: string }[]; passos: { t: string; d: string }[] }) {
  const [passo, setPasso] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-col gap-1.5">
          <span className="kk">O QUE ELA LÊ DE VOCÊ</span>
          <div className="flex flex-wrap gap-1.5">
            {dados.length ? (
              dados.map((d, i) => (
                <span key={d.rotulo} className="surge rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs" style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="text-muted">{d.rotulo}:</span> <b className="text-text">{d.valor}</b>
                </span>
              ))
            ) : (
              <span className="mu text-sm">Responda o diagnóstico pra ela te conhecer.</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 py-2">
          <svg width="120" height="16" viewBox="0 0 120 16" aria-hidden className="hidden lg:block">
            <line x1="0" y1="8" x2="120" y2="8" stroke="var(--c-teal)" strokeWidth="2.5" strokeLinecap="round" className="fluxo-linha" />
          </svg>
          <Robo tamanho={92} />
          <span className="text-xs font-bold text-c-teal">A IA pensa</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="kk">O QUE SAI</span>
          {["3 ideias explicadas", "Ficha completa", "Oferta com o porquê", "Ebook e página"].map((t, i) => (
            <span key={t} className="surge flex items-center gap-2 text-sm" style={{ animationDelay: `${300 + i * 90}ms` }}>
              <span className="grid size-5 place-items-center rounded-full bg-ok text-accent-ink"><Icone nome="check" tamanho={12} espessura={3} /></span>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="kk">COMO ELA RACIOCINA</span>
        <div className="flex gap-1.5" role="tablist" aria-label="Passos do raciocínio">
          {passos.map((p, i) => (
            <button key={p.t} type="button" role="tab" aria-selected={passo === i} onClick={() => setPasso(i)} className={`h-11 flex-1 rounded-xl border text-sm font-bold transition-colors ${passo === i ? "border-c-teal bg-c-teal/15 text-c-teal" : "border-line text-muted hover:text-text"}`}>
              {i + 1}
            </button>
          ))}
        </div>
        <div key={passo} role="tabpanel" className="surge flex flex-col gap-1 rounded-2xl border border-line bg-surface-2 p-4">
          <span className="font-bold">{passos[passo]?.t}</span>
          <span className="tx text-sm">{passos[passo]?.d}</span>
          <div className="mt-1 flex justify-between">
            <button type="button" className="b3 min-h-9 px-0 text-sm" disabled={passo === 0} onClick={() => setPasso(passo - 1)}>← Anterior</button>
            <button type="button" className="b3 min-h-9 px-0 text-sm" disabled={passo === passos.length - 1} onClick={() => setPasso(passo + 1)}>Próximo →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
