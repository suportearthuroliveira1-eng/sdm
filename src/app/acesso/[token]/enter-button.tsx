"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Notice } from "@/components/ui/screen";
import { enterWithLink, type EnterState } from "./actions";

export function EnterButton({ token }: { token: string }) {
  const [state, action, pending] = useActionState(enterWithLink.bind(null, token), {} as EnterState);
  return (
    <form action={action} className="flex flex-col gap-2.5">
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      <button className="b1" disabled={pending}>{pending ? "Entrando..." : "Entrar no app"}</button>
      {state.error ? <Link href="/app/a01" className="b3">Entrar com o código no e-mail</Link> : null}
    </form>
  );
}
