"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { authStep, type AuthState } from "@/lib/actions/auth";
import { Notice } from "@/components/ui/screen";

export function LoginForm({ mode }: { mode: "aluna" | "admin" }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(authStep.bind(null, mode), { step: "email" } as AuthState);

  useEffect(() => {
    if (state.step === "done") router.replace(state.to);
    if (state.step === "sem_acesso") router.replace("/app/a02");
  }, [state, router]);

  if (state.step === "code") {
    return (
      <form action={action} className="flex flex-col gap-4">
        {state.info ? <Notice>{state.info}</Notice> : null}
        <div>
          <label htmlFor="code" className="label">Código de 6 dígitos</label>
          <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required autoFocus className="field text-center text-2xl tracking-[0.5em]" placeholder="000000" />
        </div>
        {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
        <button name="intent" value="verify" className="btn-primary" disabled={pending}>{pending ? "Conferindo..." : "Entrar"}</button>
        <button name="intent" value="reset" formNoValidate className="btn-ghost" disabled={pending}>Usar outro e-mail ou pedir novo código</button>
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="label">{mode === "admin" ? "E-mail do time" : "E-mail da compra"}</label>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required className="field" placeholder="voce@email.com" />
      </div>
      {state.step === "email" && state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      <button name="intent" value="request" className="btn-primary" disabled={pending}>{pending ? "Enviando..." : "Receber código"}</button>
      {mode === "aluna" ? (
        <Link href="/app/a02" className="flex min-h-11 items-center justify-center text-sm text-muted underline underline-offset-4">Não consigo entrar</Link>
      ) : null}
    </form>
  );
}
