"use client";

import Link from "next/link";
import { CampoSenha } from "@/components/ui/campo";
import { useActionState, useEffect } from "react";
import { signup, type FormState } from "@/lib/actions/auth";
import { Notice } from "@/components/ui/screen";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, {} as FormState);
  useEffect(() => {
    if (state.ok && state.to) window.location.assign(state.to);
  }, [state]);
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nome" className="lb">Seu nome</label>
        <input id="nome" name="nome" required autoComplete="name" className="in" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="lb">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="in" placeholder="voce@email.com" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="lb">Senha</label>
        <CampoSenha id="senha" name="senha" required minLength={8} autoComplete="new-password" aria-describedby="senha-regra" placeholder="Crie uma senha" classe="in" />
        <span id="senha-regra" className="mu">Pelo menos 8 caracteres, com letra e número.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmar" className="lb">Repita a senha</label>
        <CampoSenha id="confirmar" name="confirmar" required autoComplete="new-password" placeholder="Repita a senha" classe="in" />
      </div>
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      <button className="b1" disabled={pending || state.ok}>{pending || state.ok ? "Criando..." : "Criar conta e entrar"}</button>
      <Link href="/app/a01" className="b3">Já tenho conta</Link>
    </form>
  );
}
