import { eq } from "drizzle-orm";
import Link from "next/link";
import type { ReactNode } from "react";
import { db, schema } from "@/lib/db";
import type { EtapaStatus } from "@/lib/domain/etapas";

/** Cabeçalho de toda etapa: nome da pasta, título e o "Entenda" (regra 2: explica antes de pedir). */
export async function EtapaHead({ pastaId, pastaNome, etapa, numero, children }: { pastaId: string; pastaNome: string; etapa: EtapaStatus; numero: number; children?: ReactNode }) {
  const aula = etapa.aula ? await db().query.lessons.findFirst({ where: eq(schema.lessons.id, etapa.aula), columns: { id: true, titulo: true } }) : null;
  return (
    <div className="mb-1 flex flex-col gap-3 pt-3 lg:pt-0">
      <Link href={`/app/p/${pastaId}`} className="mu self-start no-underline hover:text-text">← {pastaNome}</Link>
      <div className="flex flex-col gap-1">
        <span className="kk">ETAPA {numero}{etapa.ok ? " · FEITA" : ""}</span>
        <h1 className="m-0 text-[24px] font-bold leading-tight lg:text-[30px]">{etapa.nome}</h1>
      </div>
      <div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface-2 p-3.5">
        <span className="self-start rounded-[10px] bg-warn-bg px-2 py-0.5 text-[11px] font-bold tracking-[0.5px] text-warn">ENTENDA</span>
        <span className="tx">{etapa.entenda}</span>
        {aula ? (
          <Link href={`/app/l02/${encodeURIComponent(aula.id)}`} className="flex items-center gap-2 self-start text-[13px] font-semibold text-ok no-underline">
            <span aria-hidden>▶</span> Aula {aula.id} · {aula.titulo}
          </Link>
        ) : etapa.aula ? (
          <span className="mu">Aula {etapa.aula} · [vídeo em breve]</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Passo a passo vindo do conteúdo do app (PASSOS do protótipo, editável no admin). */
export async function PassoAPasso({ chaves }: { chaves: string[] }) {
  const rows = await Promise.all(chaves.map((k) => db().query.contentBlocks.findFirst({ where: eq(schema.contentBlocks.key, `passos.${k}`) })));
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => {
        const d = r?.data as [string, string[], string] | undefined;
        if (!d) return null;
        return (
          <details key={chaves[i]} className="group rounded-[14px] border border-line bg-surface open:bg-surface-2">
            <summary className="flex min-h-11 list-none items-center justify-between gap-2 p-3 font-semibold [&::-webkit-details-marker]:hidden">
              {d[0]}
              <span className="mu transition group-open:rotate-90" aria-hidden>›</span>
            </summary>
            <ol className="m-0 flex flex-col gap-1.5 px-4 pb-3 pl-8">
              {d[1].map((s) => <li key={s} className="tx">{s}</li>)}
            </ol>
            <span className="mu block px-4 pb-3">[print do passo] · aula {d[2]}</span>
          </details>
        );
      })}
    </div>
  );
}

export async function itensChecklist(chave: string): Promise<{ titulo: string; itens: string[] }> {
  const r = await db().query.contentBlocks.findFirst({ where: eq(schema.contentBlocks.key, `checklist.${chave}`) });
  const d = r?.data as { titulo?: string; items?: { l: string }[] } | undefined;
  return { titulo: d?.titulo ?? chave, itens: (d?.items ?? []).map((i) => i.l) };
}

export function Proxima({ href, children = "Próxima etapa" }: { href: string; children?: ReactNode }) {
  return <Link href={href} className="b1 mt-2 no-underline">{children}</Link>;
}
