"use client";

import { useActionState, useState } from "react";
import { createStudentAction, importCsvAction, type ImportResult, type LinkResult } from "@/lib/actions/admin";
import { PRODUCTS, PRODUCT_LABEL } from "@/lib/domain/entitlements";
import { Notice } from "@/components/ui/screen";
import { LinkBox } from "./link-box";

export function NewStudentForm() {
  const [state, action, pending] = useActionState(createStudentAction, null as LinkResult | null);
  return (
    <form action={action} className="acd gap-4">
      <h2 className="text-base font-bold">Nova aluna</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="n-nome" className="lb mb-1.5 block text-muted">Nome</label><input id="n-nome" name="nome" required className="ain" /></div>
        <div><label htmlFor="n-email" className="lb mb-1.5 block text-muted">E-mail</label><input id="n-email" name="email" type="email" required className="ain" /></div>
        <div><label htmlFor="n-wa" className="lb mb-1.5 block text-muted">WhatsApp (opcional)</label><input id="n-wa" name="whatsapp" inputMode="tel" className="ain" placeholder="+55..." /></div>
        <div><label htmlFor="n-pais" className="lb mb-1.5 block text-muted">País onde mora</label><input id="n-pais" name="pais" className="ain" /></div>
      </div>
      <fieldset>
        <legend className="lb mb-1.5 block text-muted">Acessos</legend>
        <div className="flex flex-wrap gap-2">
          {PRODUCTS.map((p) => (
            <label key={p} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line px-4 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
              <input type="checkbox" name={`acesso_${p}`} defaultChecked={p === "sdm"} className="size-4 accent-[var(--accent)]" />
              {PRODUCT_LABEL[p]}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="lb mb-1.5 block text-muted">Como ela entra</legend>
        <div className="flex flex-wrap gap-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line px-4 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
            <input type="radio" name="entrega" value="senha" defaultChecked className="size-4 accent-[var(--accent)]" /> E-mail + senha provisória
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line px-4 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
            <input type="radio" name="entrega" value="link" className="size-4 accent-[var(--accent)]" /> Só o link de acesso
          </label>
        </div>
      </fieldset>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 self-start rounded-xl border border-c-amber/50 px-4 text-sm has-[:checked]:bg-c-amber/10">
        <input type="checkbox" name="oculto" className="size-4 accent-[var(--c-amber)]" /> Liberar o País Oculto pra ela
      </label>
      {state && !state.ok ? <Notice tone="danger">{state.error}</Notice> : null}
      <button className="ab1 self-start" disabled={pending}>{pending ? "Criando..." : "Criar aluna"}</button>
      {state?.ok && state.senha ? <SenhaBox email={state.email ?? ""} senha={state.senha} mensagem={state.mensagemSenha ?? ""} /> : null}
      {state?.ok && state.oculto ? <Notice tone="ok">País Oculto liberado.</Notice> : null}
      {state?.ok ? <LinkBox url={state.url} message={state.message} expiresAt={state.expiresAt} /> : null}
    </form>
  );
}

export function ImportCsvForm() {
  const [state, action, pending] = useActionState(importCsvAction, null as ImportResult | null);
  return (
    <form action={action} className="acd gap-4">
      <h2 className="text-base font-bold">Importar CSV</h2>
      <p className="text-sm text-muted">Colunas: <code>nome,email,whatsapp,pais,acessos</code>. Acessos separados por <code>|</code> (ex.: <code>sdm|up1</code>). Vazio vira SDM. Os links são gerados um a um na ficha.</p>
      <div><label htmlFor="csv" className="lb mb-1.5 block text-muted">Arquivo</label><input id="csv" name="arquivo" type="file" accept=".csv,text/csv" required className="ain py-2.5" /></div>
      <button className="ab2 self-start" disabled={pending}>{pending ? "Importando..." : "Importar"}</button>
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

function SenhaBox({ email, senha, mensagem }: { email: string; senha: string; mensagem: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="rounded-xl border border-ok-line bg-ok-bg p-4">
      <p className="mb-1 text-sm text-ok">Conta criada. Mostre só pra ela (a senha aparece uma vez):</p>
      <p className="m-0 text-sm">E-mail: <b>{email}</b></p>
      <p className="m-0 text-sm">Senha provisória: <b className="font-mono text-lg tracking-wider">{senha}</b></p>
      <button type="button" className="ab2 mt-2" onClick={async () => { await navigator.clipboard.writeText(mensagem); setOk(true); }}>{ok ? "Copiado" : "Copiar mensagem pro WhatsApp"}</button>
      <p className="mu mb-0 mt-2 text-xs">No primeiro acesso o app pede pra ela criar a senha definitiva.</p>
    </div>
  );
}
