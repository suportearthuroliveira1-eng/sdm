import Link from "next/link";
import type { ReactNode } from "react";

/** Moldura das telas públicas e do app (mobile-first, 390px). */
export function Screen({
  id,
  title,
  back,
  children,
}: {
  id: string;
  title?: string;
  back?: string;
  children: ReactNode;
}) {
  return (
    <main data-screen={id} className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pb-10 pt-[max(env(safe-area-inset-top),16px)]">
      <header className="flex min-h-12 items-center gap-2">
        {back ? (
          <Link href={back} aria-label="Voltar" className="-ml-2 inline-flex size-11 items-center justify-center rounded-xl text-muted hover:text-text">
            <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
        ) : (
          <span className="text-sm font-bold tracking-[0.2em] text-accent">SDM</span>
        )}
        {title ? <h1 className="text-base font-semibold">{title}</h1> : null}
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </main>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "ok" | "warn" | "danger"; children: ReactNode }) {
  const c = {
    info: "border-line bg-surface text-muted",
    ok: "border-ok/40 bg-ok/10 text-ok",
    warn: "border-warn/40 bg-warn/10 text-warn",
    danger: "border-danger/40 bg-danger/10 text-danger",
  }[tone];
  return <p role={tone === "danger" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${c}`}>{children}</p>;
}
