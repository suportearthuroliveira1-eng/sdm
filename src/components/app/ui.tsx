import Link from "next/link";
import type { ReactNode } from "react";

export function PageTitle({ k, children, right }: { k?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 pt-3 lg:pt-0">
      <div className="flex flex-col gap-0.5">
        {k ? <span className="mu text-sm">{k}</span> : null}
        <h1 className="m-0 text-[26px] font-bold leading-tight lg:text-[30px]">{children}</h1>
      </div>
      {right}
    </div>
  );
}

export function Bar({ pct, color = "bg-[#6FD3A0]" }: { pct: number; color?: string }) {
  return (
    <div className="flex h-1.5 overflow-hidden rounded-[3px] bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`rounded-[3px] ${color}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

/** Item clicável do protótipo (.it). */
export function Item({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`flex w-full items-center gap-3 rounded-[14px] p-3 text-left text-text no-underline ${className}`}>
      {children}
    </Link>
  );
}

export const PlayIcon = (
  <span aria-hidden className="flex size-12 flex-none items-center justify-center rounded-xl bg-[#3B2F5C]">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#F4F1F8"><path d="M8 5v14l11-7z" /></svg>
  </span>
);

export const LockIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
);
