"use client";

import { useActionState } from "react";
import { createStudentAction, importCsvAction, type ImportResult, type LinkResult } from "@/lib/actions/admin";
import { PRODUCTS, PRODUCT_LABEL } from "@/lib/domain/entitlements";
import { Notice } from "@/components/ui/screen";
import { LinkBox } from "./link-box";

export function NewStudentForm() {
  const [state, action, pending] = useActionState(createStudentAction, null as LinkResult | null);
  return (
    <form action={action} className="card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Nova aluna</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="n-nome" className="label">Nome</label><input id="n-nome" name="nome" required className="field" /></div>
        <div><label htmlFor="n-email" className="label">E-mail</label><input id="n-email" name="email" type="email" required className="field" /></div>
        <div><label htmlFor="n-wa" className="label">WhatsApp (opcional)</label><input id="n-wa" name="whatsapp" inputMode="tel" className="field" placeholder="+55..." /></div>
        <div><label htmlFor="n-pais" className="label">País onde mora</label><input id="n-pais" name="pais" className="field" /></div>
      </div>
      <fieldset>
        <legend className="label">Acessos</legend>
        <div className="flex flex-wrap gap-2">
          {PRODUCTS.map((p) => (
            <label key={p} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line px-4 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
              <input type="checkbox" name={`acesso_${p}`} defaultChecked={p === "sdm"} className="size-4 accent-[var(--accent)]" />
              {PRODUCT_LABEL[p]}
            </label>
          ))}
        </div>
      </fieldset>
      {state && !state.ok ? <Notice tone="danger">{state.error}</Notice> : null}
      <button className="btn-primary self-start" disabled={pending}>{pending ? "Criando..." : "Criar e gerar link"}</button>
      {state?.ok ? <LinkBox url={state.url} message={state.message} expiresAt={state.expiresAt} /> : null}
    </form>
  );
}

export function ImportCsvForm() {
  const [state, action, pending] = useActionState(importCsvAction, null as ImportResult | null);
  return (
    <form action={action} className="card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Importar CSV</h2>
      <p className="text-sm text-muted">Colunas: <code>nome,email,whatsapp,pais,acessos</code>. Acessos separados por <code>|</code> (ex.: <code>sdm|up1</code>). Vazio vira SDM. Os links são gerados um a um na ficha.</p>
      <div><label htmlFor="csv" className="label">Arquivo</label><input id="csv" name="arquivo" type="file" accept=".csv,text/csv" required className="field py-2.5" /></div>
      <button className="btn-ghost self-start" disabled={pending}>{pending ? "Importando..." : "Importar"}</button>
      {state ? (
        <div className="flex flex-col gap-2">
          <Notice tone={state.ok ? "ok" : "warn"}>{state.criadas} criadas, {state.atualizadas} já existiam (acessos somados), {state.erros.length} com erro.</Notice>
          {state.erros.length ? (
            <ul className="max-h-48 overflow-auto text-sm text-danger">
              {state.erros.map((e) => <li key={`${e.line}-${e.error}`}>Linha {e.line}: {e.error}</li>)}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
