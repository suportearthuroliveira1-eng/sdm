"use client";

import Link from "next/link";
import { CampoSenha } from "@/components/ui/campo";
import { useActionState, useEffect } from "react";
import { setPassword, type FormState } from "@/lib/actions/auth";
import { Notice } from "@/components/ui/screen";

export function PasswordForm({ to, primeiro }: { to: string; primeiro: boolean }) {
  const [state, action, pending] = useActionState(setPassword, {} as FormState);
  useEffect(() => {
    if (state.ok) {
      const t = setTimeout(() => window.location.assign(state.to ?? to), 900);
      return () => clearTimeout(t);
    }
  }, [state, to]);
  if (state.ok) return <Notice tone="ok">Senha salva.</Notice>;
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="to" value={to} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="lb">Nova senha</label>
        <CampoSenha id="senha" name="senha" required minLength={8} autoComplete="new-password" aria-describedby="senha-regra" placeholder="Crie uma senha" classe="in" />
        <span id="senha-regra" className="mu">Pelo menos 8 caracteres, com letra e número.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmar" className="lb">Repita a senha</label>
        <CampoSenha id="confirmar" name="confirmar" required autoComplete="new-password" placeholder="Repita a senha" classe="in" />
      </div>
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      <button className="b1" disabled={pending}>{pending ? "Salvando..." : "Salvar senha"}</button>
      {primeiro ? <Link href={to} className="b3">Fazer depois</Link> : null}
    </form>
  );
}
