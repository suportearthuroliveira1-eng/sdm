"use client";

import { useState, useTransition } from "react";
import { marcarAula } from "@/lib/actions/aulas";

export function AulaAcoes({ id, vista, feita }: { id: string; vista: boolean; feita: boolean }) {
  const [pending, start] = useTransition();
  const [st, setSt] = useState({ vista, feita });
  const [toast, setToast] = useState("");
  const run = (o: "vista" | "feita") =>
    start(async () => {
      const r = await marcarAula(id, o);
      if (r.ok) {
        setSt((s) => ({ vista: true, feita: o === "feita" ? true : s.feita }));
        setToast(o === "vista" ? "Aula marcada como vista." : "Boa! Marcado como feito.");
        setTimeout(() => setToast(""), 2400);
      }
    });
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 lg:max-w-md">
        <button className="b2" disabled={pending || st.vista} onClick={() => run("vista")}>{st.vista ? "Aula vista" : "Marcar como vista"}</button>
        <button className="b2" disabled={pending || st.feita} onClick={() => run("feita")}>{st.feita ? "Já fiz" : "Já fiz o \"Agora faça\""}</button>
      </div>
      <p role="status" aria-live="polite" className="mu h-4">{toast}</p>
    </div>
  );
}
