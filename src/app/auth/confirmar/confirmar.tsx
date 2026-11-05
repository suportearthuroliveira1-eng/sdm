"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/public-config";

const SAFE = /^\/(app|admin)(\/|$)/;

export function Confirmar() {
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const params = new URLSearchParams(window.location.search);
    const toParam = params.get("to") ?? "/app";
    const to = SAFE.test(toParam) ? toParam : "/app";
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    const desc = hash.get("error_description") ?? params.get("error_description");
    // Tira os tokens da barra de endereço na hora.
    window.history.replaceState(null, "", window.location.pathname);
    if (!access_token || !refresh_token) {
      setTimeout(() => setErro(desc ? "Esse link venceu ou já foi usado. Peça um novo." : "Link incompleto. Peça um novo."), 0);
      return;
    }
    const sb = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    sb.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) setErro("Não deu pra entrar com esse link. Peça um novo.");
      else window.location.replace(to);
    });
  }, []);

  if (erro) {
    return (
      <div className="mt-[18px] flex flex-col gap-3">
        <h1 className="m-0 text-[26px] font-bold leading-tight">Não deu certo</h1>
        <p role="alert" className="tx">{erro}</p>
        <Link href="/app/a01" className="b1 no-underline">Voltar pro login</Link>
      </div>
    );
  }
  return (
    <div className="mt-[18px] flex flex-col gap-2.5" role="status">
      <h1 className="m-0 text-[26px] font-bold leading-tight">Entrando...</h1>
      <p className="tx text-muted">Só um instante.</p>
    </div>
  );
}
