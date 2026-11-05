"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { editarAnuncio } from "@/lib/actions/pasta";
import { CORES } from "@/lib/gen/modelo";

export function AnuncioEditor({ id, gancho, texto, cor }: { id: string; gancho: string; texto: string; cor: number }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, action, pending] = useActionState(async (p: { ok?: boolean; erro?: string } | null, form: FormData) => {
    const r = await editarAnuncio(id, p, form);
    if (r.ok) {
      setOpen(false);
      router.refresh();
    }
    return r;
  }, null as { ok?: boolean; erro?: string } | null);
  if (!open) return <button type="button" className="b2" onClick={() => setOpen(true)}>Ajustar este anúncio</button>;
  return (
    <form action={action} className="flex flex-col gap-2 rounded-xl border border-line-2 p-3">
      <label className="lb" htmlFor={`g-${id}`}>Gancho (aula P2.2)</label>
      <input id={`g-${id}`} name="gancho" defaultValue={gancho} className="in" maxLength={300} />
      <label className="lb" htmlFor={`t-${id}`}>Texto do anúncio (aula P2.5)</label>
      <textarea id={`t-${id}`} name="texto" defaultValue={texto} className="ta" maxLength={2000} />
      <fieldset className="m-0 flex gap-2 border-0 p-0">
        <legend className="lb mb-1">Fundo (aula P2.3)</legend>
        {CORES.map((c, i) => (
          <label key={c} className="cursor-pointer">
            <input type="radio" name="cor" value={i} defaultChecked={i === cor} className="peer sr-only" />
            <span aria-label={`Cor ${i + 1}`} className="block size-11 rounded-full border-[3px] border-transparent peer-checked:border-accent" style={{ background: c }} />
          </label>
        ))}
      </fieldset>
      {state?.erro ? <span role="alert" className="text-xs text-danger">{state.erro}</span> : null}
      <div className="flex gap-2">
        <button className="b1 min-h-[46px] text-sm" disabled={pending}>{pending ? "Salvando..." : "Salvar este anúncio"}</button>
        <button type="button" className="b3" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
    </form>
  );
}
