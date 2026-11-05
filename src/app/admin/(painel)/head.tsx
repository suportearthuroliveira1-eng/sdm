import type { ReactNode } from "react";

/** Cabeçalho das telas do admin (kk = ID, título, descrição). */
export function AdminHead({ id, t, d, children }: { id: string; t: string; d?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className="kk">{id}</span>
        <h1 className="m-0 text-[28px] font-bold">{t}</h1>
        {d ? <span className="mu text-[13px]">{d}</span> : null}
      </div>
      {children}
    </div>
  );
}
