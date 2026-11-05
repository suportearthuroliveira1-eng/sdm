"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { login, type FormState } from "@/lib/actions/auth";
import { Notice } from "@/components/ui/screen";

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
      <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required className="in min-h-[52px]" placeholder="voce@email.com" />
      <label htmlFor="senha" className="lb mt-1 text-sm">Senha</label>
      <input id="senha" name="senha" type="password" autoComplete="current-password" required className="in min-h-[52px]" />
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      <button className={admin ? "ab1" : "b1"} disabled={pending || state.ok}>{pending || state.ok ? "Entrando..." : "Entrar"}</button>
      {admin ? null : (
        <Link href="/app/cadastro" className="b2 no-underline">Criar conta</Link>
      )}
    </form>
  );
}
