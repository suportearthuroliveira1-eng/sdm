"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

/**
 * Barra fina no topo que aparece no instante do clique em qualquer link interno
 * (e em formulários que navegam) e some quando a tela nova chega.
 * Dá retorno imediato mesmo quando o servidor demora.
 */
function Bar() {
  const path = usePathname();
  const sp = useSearchParams();
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAtivo(false), 0);
    return () => clearTimeout(t);
  }, [path, sp]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setAtivo(true);
    };
    const onNav = () => setAtivo(true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("sdm:nav-start", onNav);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("sdm:nav-start", onNav);
    };
  }, []);

  return (
    <div aria-hidden className={`nav-progress ${ativo ? "is-on" : ""}`}>
      <div />
    </div>
  );
}

export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}

/** Dispara a barra manualmente (ex.: antes de um router.push). */
export const navStart = () => window.dispatchEvent(new Event("sdm:nav-start"));
