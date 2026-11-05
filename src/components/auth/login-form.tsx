"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { authStep, type AuthState } from "@/lib/actions/auth";
import { Notice } from "@/components/ui/screen";

export function LoginForm({ mode }: { mode: "aluna" | "admin" }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(authStep.bind(null, mode), { step: "email" } as AuthState);
  const admin = mode === "admin";

  useEffect(() => {
    if (state.step === "done") router.replace(state.to);
    if (state.step === "sem_acesso") router.replace("/app/a02");
  }, [state, router]);

  if (state.step === "code") {
    return (
      <form action={action} className="flex flex-col gap-2.5">
        {state.info ? <Notice>{state.info}</Notice> : null}
        <label htmlFor="code" className="lb text-sm">Código de 6 dígitos</label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required autoFocus className="in min-h-[52px] text-center text-2xl tracking-[0.5em]" placeholder="000000" />
        {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
        <button name="intent" value="verify" className={admin ? "ab1" : "b1"} disabled={pending}>{pending ? "Conferindo..." : "Entrar"}</button>
        <button name="intent" value="reset" formNoValidate className="b3" disabled={pending}>Usar outro e-mail ou pedir novo código</button>
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2.5">
      <label htmlFor="email" className="lb text-sm">{admin ? "E-mail do time" : "E-mail que você usou na compra"}</label>
      <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required className="in min-h-[52px]" placeholder="voce@email.com" />
      <span className="mu text-[13px]">Não tem senha. A gente manda um código de 6 dígitos pro seu e-mail.</span>
      {state.step === "email" && state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      <button name="intent" value="request" className={admin ? "ab1" : "b1"} disabled={pending}>{pending ? "Enviando..." : "Entrar"}</button>
    </form>
  );
}
