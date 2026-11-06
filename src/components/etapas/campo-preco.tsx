"use client";

import { useState } from "react";
import { fmtPreco, SIMBOLO, type FaixaPreco, type Moeda } from "@/lib/domain/precos";

/** Preço com a moeda, o sugerido (um toque pra usar), a faixa e o teto. Nunca deixa passar preço alto sem avisar. */
export function CampoPreco({ id, name, moeda, faixa, inicial, onChange }: { id: string; name?: string; moeda: Moeda; faixa: FaixaPreco; inicial: number | null; onChange?: (v: string) => void }) {
  const [v, setV] = useState(inicial && inicial > 0 ? String(inicial) : String(faixa.sugerido));
  const n = Number(v.replace(",", "."));
  const alto = Number.isFinite(n) && n > faixa.teto;
  const set = (x: string) => {
    setV(x);
    onChange?.(x);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="lb">Preço do ebook <span className="font-normal text-muted">({moeda})</span></label>
      <div className="flex flex-wrap items-center gap-2">
        <div className={`flex min-h-[46px] items-center rounded-[calc(var(--raio)-2px)] border bg-surface pl-3 ${alto ? "border-danger" : "border-line-2 focus-within:border-accent"}`}>
          <span className="text-sm font-bold text-muted">{SIMBOLO[moeda]}</span>
          <input id={id} name={name} inputMode="decimal" value={v} onChange={(e) => set(e.target.value)} aria-invalid={alto} aria-describedby={`${id}-ajuda`} className="w-24 bg-transparent px-2 text-[15px] text-text focus:outline-none" />
        </div>
        {n !== faixa.sugerido ? (
          <button type="button" className="rounded-full border border-ok-line bg-ok-bg px-3 py-2 text-xs font-bold text-ok" onClick={() => set(String(faixa.sugerido))}>
            Usar o sugerido: {fmtPreco(faixa.sugerido, moeda)}
          </button>
        ) : (
          <span className="rounded-full bg-ok-bg px-3 py-2 text-xs font-bold text-ok">Preço sugerido</span>
        )}
      </div>
      <span id={`${id}-ajuda`} className={`text-xs ${alto ? "font-bold text-danger" : "text-muted"}`}>
        {alto
          ? `Preço alto pra ebook curto. O máximo aqui é ${fmtPreco(faixa.teto, moeda)}.`
          : `Faixa que costuma funcionar: ${fmtPreco(faixa.min, moeda)} a ${fmtPreco(faixa.max, moeda)} · máximo ${fmtPreco(faixa.teto, moeda)}.`}
      </span>
    </div>
  );
}
