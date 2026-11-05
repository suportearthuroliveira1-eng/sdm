"use client";

import { useActionState } from "react";
import { saveSettingAction } from "@/lib/actions/admin";

export function SettingRow({ k, value, descricao, pendente }: { k: string; value: string; descricao: string | null; pendente: boolean }) {
  const [state, action, pending] = useActionState(saveSettingAction, null as { ok: boolean; error?: string } | null);
  return (
    <form action={action} className="card flex flex-col gap-2 p-4">
      <input type="hidden" name="key" value={k} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`s-${k}`} className="font-mono text-sm">{k}</label>
        {pendente ? <span className="text-xs text-warn">pendente</span> : null}
      </div>
      {descricao ? <p className="text-xs text-muted">{descricao}</p> : null}
      <div className="flex gap-2">
        <input id={`s-${k}`} name="value" defaultValue={value} className="field font-mono text-sm" />
        <button className="btn-ghost" disabled={pending}>Salvar</button>
      </div>
      <p role="status" className="h-4 text-xs">{state?.ok ? <span className="text-ok">Salvo</span> : state?.error ? <span className="text-danger">{state.error}</span> : null}</p>
    </form>
  );
}
