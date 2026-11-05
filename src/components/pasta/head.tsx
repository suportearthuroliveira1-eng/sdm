import Link from "next/link";
import type { ReactNode } from "react";

/** Cabeçalho das telas da pasta: rótulo da etapa, título e atalho de volta pro painel. */
export function PastaHead({ id, code, produto, k, t, children }: { id: string; code: string; produto: string; k: string; t: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-1 pt-3 lg:pt-0">
      <Link href={`/app/v05/${id}`} className="mu self-start no-underline hover:text-text">{code} · {produto}</Link>
      <span className="kk">{k}</span>
      <h1 className="m-0 text-[24px] font-bold leading-tight lg:text-[30px]">{t}</h1>
      {children}
    </div>
  );
}
