import type { ReactNode } from "react";
import { BackButton } from "./back-button";

/**
 * Moldura das telas da aluna (390px, igual ao protótipo).
 * Com `head` mostra o cabeçalho do protótipo (voltar redondo + rótulo + título).
 */
export function Screen({
  id,
  head,
  back,
  children,
}: {
  id: string;
  head?: { k: string; t: string };
  /** destino quando não há histórico (ex.: abriu direto pelo link) */
  back?: string;
  children: ReactNode;
}) {
  return (
    <main data-screen={id} className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col pt-[env(safe-area-inset-top)]">
      {head ? (
        <header className="flex flex-none items-center gap-3 px-5 pb-1.5 pt-4">
          <BackButton fallback={back ?? "/app"} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="mu">{head.k}</span>
            <h1 className="m-0 text-[17px] font-bold leading-tight">{head.t}</h1>
          </div>
        </header>
      ) : null}
      <div className="flex flex-1 flex-col gap-3.5 px-5 pb-7 pt-2.5">{children}</div>
    </main>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "ok" | "warn" | "danger"; children: ReactNode }) {
  const c = {
    info: "cd text-sm text-text-2",
    ok: "good",
    warn: "warn",
    danger: "rounded-[14px] border border-danger/40 bg-danger/10 px-3.5 py-3 text-[13px] text-danger",
  }[tone];
  return (
    <p role={tone === "danger" ? "alert" : "status"} className={`m-0 ${c}`}>
      {children}
    </p>
  );
}

/** Marca SDM (quadrado roxo) usada no A01 e no admin. */
export function Brand({ size = 44, src }: { size?: number; src?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (src) return <img src={src} alt="" aria-hidden style={{ width: size, height: size }} className="flex-none rounded-[14px] object-cover" />;
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="flex flex-none items-center justify-center rounded-[14px] bg-accent text-[15px] font-bold text-accent-ink"
    >
      SDM
    </span>
  );
}
