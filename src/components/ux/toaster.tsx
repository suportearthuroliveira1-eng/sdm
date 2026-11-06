"use client";

import { useEffect, useState } from "react";

/** Toast curto de confirmação (protótipo: caixa clara embaixo). Use toast("Copiado"). */
export function toast(msg: string) {
  window.dispatchEvent(new CustomEvent("sdm:toast", { detail: msg }));
}

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      setKey((k) => k + 1);
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 2400);
    };
    window.addEventListener("sdm:toast", on);
    return () => {
      window.removeEventListener("sdm:toast", on);
      clearTimeout(t);
    };
  }, []);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),14px)] z-[60] flex justify-center px-5">
      {msg ? (
        <div key={key} className="toast-in max-w-sm rounded-[14px] bg-text px-4 py-3 text-sm font-semibold text-accent-ink shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          {msg}
        </div>
      ) : null}
    </div>
  );
}
