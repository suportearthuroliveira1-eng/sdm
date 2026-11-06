"use client";

import { useState, useTransition } from "react";
import { restaurarConfig, salvarConfig, type ConfigKey, type ConfigState } from "@/lib/actions/admin-config";
import { toast } from "@/components/ux/toaster";
import { Spinner } from "@/components/ux/submit-button";

/** Barra fixa de salvar das telas de Personalizar. */
export function BarraSalvar({ k, valor, sujo, onSalvo, podeRestaurar = true, salvar }: { k: ConfigKey; valor: () => unknown; sujo: boolean; onSalvo?: () => void; podeRestaurar?: boolean; salvar?: () => Promise<ConfigState> }) {
  const [pend, start] = useTransition();
  const [st, setSt] = useState<ConfigState>(null);
  const rodar = (f: () => Promise<ConfigState>, recarregar = false) =>
    start(async () => {
      const r: ConfigState = await f().catch(() => ({ erro: "Sem conexão. Tente de novo." }));
      setSt(r);
      if (r?.ok) {
        toast(r.msg ?? "Salvo");
        if (recarregar) window.location.reload();
        else onSalvo?.();
      }
    });
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
      <button type="button" className="ab1" disabled={pend || !sujo} onClick={() => rodar(salvar ?? (() => salvarConfig(k, valor())))}>
        {pend ? <><Spinner /> Salvando...</> : "Salvar alterações"}
      </button>
      {podeRestaurar ? (
        <button
          type="button"
          className="ab2"
          disabled={pend}
          onClick={() => {
            if (confirm("Voltar tudo desta tela pro padrão do app?")) rodar(() => restaurarConfig(k), true);
          }}
        >
          Voltar ao padrão
        </button>
      ) : null}
      <span role="status" className="text-sm">
        {st?.erro ? <span className="text-danger">{st.erro}</span> : sujo ? <span className="text-warn">Alterações não salvas</span> : <span className="text-muted">Tudo salvo</span>}
      </span>
    </div>
  );
}

export function Campo({ id, label, ajuda, children }: { id: string; label: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-bold">{label}</label>
      {children}
      {ajuda ? <span className="text-xs text-muted">{ajuda}</span> : null}
    </div>
  );
}

export function Interruptor({ id, label, ajuda, on, onChange }: { id: string; label: string; ajuda?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex flex-col">
        <span id={`${id}-l`} className="text-sm font-bold">{label}</span>
        {ajuda ? <span className="text-xs text-muted">{ajuda}</span> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={`${id}-l`}
        onClick={() => onChange(!on)}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors before:absolute before:-inset-2.5 before:content-[''] ${on ? "border-accent bg-accent" : "border-line-2 bg-surface-2"}`}
      >
        <span className={`absolute top-0.5 size-[22px] rounded-full bg-white shadow transition-[left] ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
