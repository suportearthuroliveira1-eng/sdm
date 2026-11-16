"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { login, type FormState } from "@/lib/actions/auth";
import { Notice } from "@/components/ui/screen";
import { CampoIcone, CampoSenha } from "@/components/ui/campo";

export function LoginForm({ mode }: { mode: "aluna" | "admin" }) {
  const [state, action, pending] = useActionState(login.bind(null, mode), {} as FormState);
  const admin = mode === "admin";

  // navegação completa: o proxy e os Server Components leem a sessão nova
  useEffect(() => {
    if (state.ok && state.to) window.location.assign(state.to);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-2.5">
      <label htmlFor="email" className="lb text-sm">{admin ? "E-mail do time" : "E-mail que você usou na compra"}</label>
      <CampoIcone icone="carta" id="email" name="email" type="email" inputMode="email" autoComplete="email" required placeholder="voce@email.com" />
      <span className="mt-1 flex items-center justify-between">
        <label htmlFor="senha" className="lb text-sm">Senha</label>
        {admin ? null : <Link href="/app/a02" className="text-xs font-semibold text-accent-2 no-underline">Esqueci a senha</Link>}
      </span>
      <CampoSenha id="senha" name="senha" autoComplete="current-password" required />
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      <button className={admin ? "ab1" : "b1"} disabled={pending || state.ok}>{pending || state.ok ? "Entrando..." : "Entrar"}</button>
      {admin ? null : (
        <Link href="/app/cadastro" className="b2 no-underline">Criar conta</Link>
      )}
    </form>
  );
}
