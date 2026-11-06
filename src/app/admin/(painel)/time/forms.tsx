"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { criarMembro, mudarMembro, type TimeState } from "@/lib/actions/admin-time";

const PAPEIS = [
  { k: "admin", t: "Admin" },
  { k: "suporte", t: "Suporte" },
  { k: "conteudo", t: "Conteúdo" },
] as const;

export function NovoMembro() {
  const [st, action, pending] = useActionState(criarMembro, null as TimeState);
  return (
    <form action={action} className="acd gap-3">
      <h2 className="m-0 text-base font-bold">Adicionar alguém do time</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1"><label htmlFor="t-nome" className="lb text-muted">Nome</label><input id="t-nome" name="nome" required className="ain" /></div>
        <div className="flex flex-col gap-1"><label htmlFor="t-email" className="lb text-muted">E-mail</label><input id="t-email" name="email" type="email" required className="ain" /></div>
        <div className="flex flex-col gap-1">
          <label htmlFor="t-papel" className="lb text-muted">Papel</label>
          <select id="t-papel" name="papel" defaultValue="suporte" className="ain">{PAPEIS.map((p) => <option key={p.k} value={p.k}>{p.t}</option>)}</select>
        </div>
      </div>
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      <button className="ab1 self-start" disabled={pending}>{pending ? "Criando..." : "Adicionar"}</button>
      {st?.ok ? (
        <div className="rounded-xl border border-ok-line bg-ok-bg p-3 text-sm">
          <p className="m-0 text-ok">{st.msg}</p>
          {st.senha ? <p className="m-0 mt-1">E-mail: <b>{st.email}</b> · Senha provisória: <b className="font-mono text-base">{st.senha}</b></p> : null}
        </div>
      ) : null}
    </form>
  );
}

export function MembroLinha({ id, nome, email, papel, ativo, eu }: { id: string; nome: string; email: string; papel: string; ativo: boolean; eu: boolean }) {
  const router = useRouter();
  const [p, start] = useTransition();
  const [erro, setErro] = useState("");
  const mudar = (m: Parameters<typeof mudarMembro>[1]) =>
    start(async () => {
      setErro("");
      const r = await mudarMembro(id, m);
      if (r.erro) setErro(r.erro);
      router.refresh();
    });
  return (
    <li className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 ${ativo ? "" : "opacity-60"}`}>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-bold">{nome || email}{eu ? " (você)" : ""}</span>
        <span className="truncate text-xs text-muted">{email}{ativo ? "" : " · sem acesso"}</span>
        {erro ? <span role="alert" className="text-xs text-danger">{erro}</span> : null}
      </span>
      <span className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`papel-${id}`}>Papel</label>
        <select id={`papel-${id}`} value={papel} disabled={p} onChange={(e) => mudar({ papel: e.target.value as "admin" | "suporte" | "conteudo" })} className="ain min-h-9 w-auto py-1 text-sm">
          {PAPEIS.map((x) => <option key={x.k} value={x.k}>{x.t}</option>)}
        </select>
        <button type="button" className="ab2 min-h-9 px-3 text-xs" disabled={p} onClick={() => mudar({ ativo: !ativo })}>{ativo ? "Tirar acesso" : "Devolver acesso"}</button>
      </span>
    </li>
  );
}
