"use client";

import { useState, type ReactNode } from "react";
import { Icone } from "@/components/ui/icone";

/** Botãozinho "Pra que serve?": a explicação fica escondida até ela tocar (menos texto na tela). */
export function PraQueServe({ children, rotulo = "Pra que serve?" }: { children: ReactNode; rotulo?: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" aria-expanded={aberto} onClick={() => setAberto(!aberto)} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors ${aberto ? "border-accent bg-sel text-accent-2" : "border-line text-text-2 hover:border-accent/60"}`}>
        <Icone nome="info" tamanho={14} /> {rotulo}
      </button>
      {aberto ? <div className="surge w-full rounded-2xl rounded-tl-sm border border-accent/40 bg-sel px-3.5 py-2.5 text-sm leading-snug text-text">{children}</div> : null}
    </div>
  );
}

/** Cartão de resultado: ícone, rótulo, a resposta grande e "Por quê?" que abre a explicação. */
export function CartaoPorque({ icone, cor, rotulo, valor, porque, destaque = false, atraso = 0 }: { icone: Parameters<typeof Icone>[0]["nome"]; cor: string; rotulo: string; valor: string; porque: string; destaque?: boolean; atraso?: number }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className={`oc-revela flex flex-col gap-2 rounded-2xl border-[1.5px] p-4 ${destaque ? "border-accent bg-sel" : "border-line bg-surface"}`} style={{ animationDelay: `${atraso}ms` }}>
      <div className="flex items-center gap-3">
        <span className="oc-selo grid size-12 shrink-0 place-items-center rounded-2xl" style={{ color: cor, background: `color-mix(in srgb, ${cor} 16%, transparent)`, animationDelay: `${atraso + 120}ms` }}><Icone nome={icone} tamanho={24} /></span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: cor }}>{rotulo}</span>
          <span className="text-[17px] font-bold leading-snug">{valor}</span>
        </span>
      </div>
      <button type="button" aria-expanded={aberto} onClick={() => setAberto(!aberto)} className="inline-flex min-h-9 items-center gap-1 self-start text-xs font-bold text-text-2 hover:text-text">
        {aberto ? "Fechar" : "Por quê?"} <span aria-hidden className={`transition-transform ${aberto ? "rotate-90" : ""}`}>›</span>
      </button>
      {aberto ? <p className="surge m-0 text-sm leading-snug text-text-2">{porque}</p> : null}
    </div>
  );
}
