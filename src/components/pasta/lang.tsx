"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/** Alterna entre o idioma de venda e o português (tradução só pra ela entender). */
const Ctx = createContext<{ pt: boolean }>({ pt: false });

export function LangProvider({ idioma, children }: { idioma: string; children: ReactNode }) {
  const [pt, setPt] = useState(false);
  const nome = idioma === "es" ? "Espanhol" : "Inglês";
  return (
    <Ctx value={{ pt }}>
      <div role="tablist" aria-label="Idioma" className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1 lg:max-w-sm">
        {[false, true].map((v) => (
          <button
            key={String(v)}
            role="tab"
            type="button"
            aria-selected={pt === v}
            onClick={() => setPt(v)}
            className={`min-h-10 cursor-pointer rounded-[9px] border-0 text-[13px] text-text ${pt === v ? "bg-sel font-bold" : "bg-transparent"}`}
          >
            {v ? "Tradução (português)" : `${nome} (pra postar)`}
          </button>
        ))}
      </div>
      {children}
    </Ctx>
  );
}

/** Mostra x ou pt conforme a aba. */
export function T({ x, pt }: { x: string; pt: string }) {
  const c = useContext(Ctx);
  return <>{c.pt ? pt : x}</>;
}

export function useLangPt() {
  return useContext(Ctx).pt;
}
