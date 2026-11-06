"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { Spinner } from "@/components/ux/submit-button";
import { toast } from "@/components/ux/toaster";
import { IaTrabalhando } from "@/components/ux/ia-trabalhando";
import { marcarFeito, marcarItem } from "@/lib/actions/caminhos";

/** Checklist com salvamento na hora; libera "marcar etapa como feita" quando tudo está marcado. */
export function Checklist({ pastaId, lista, titulo, itens, marcados, etapa, feita, proxima }: { pastaId: string; lista: string; titulo?: string; itens: string[]; marcados: number[]; etapa?: string; feita?: boolean; proxima?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [otim, setOtim] = useOptimistic(new Set(marcados), (s: Set<number>, [i, on]: [number, boolean]) => {
    const n = new Set(s);
    if (on) n.add(i);
    else n.delete(i);
    return n;
  });
  const tudo = itens.length > 0 && itens.every((_, i) => otim.has(i));
  return (
    <div className="flex flex-col gap-2">
      {titulo ? <span className="kk">{titulo.toUpperCase()}</span> : null}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {itens.map((t, i) => (
          <li key={t}>
            <label className={`press flex min-h-12 items-center gap-3 rounded-[14px] border px-3 py-2.5 ${otim.has(i) ? "border-ok-line bg-ok-bg" : "border-line bg-surface"}`}>
              <input
                type="checkbox"
                className="size-5 accent-[var(--ok)]"
                checked={otim.has(i)}
                onChange={(e) => {
                  const on = e.target.checked;
                  start(async () => {
                    setOtim([i, on]);
                    await marcarItem(pastaId, lista, i, on);
                    router.refresh();
                  });
                }}
              />
              <span className="tx">{t}</span>
            </label>
          </li>
        ))}
      </ul>
      <span className="mu">{otim.size} de {itens.length} feitos</span>
      {etapa ? <MarcarFeito pastaId={pastaId} etapa={etapa} feita={feita} habilitado={tudo} proxima={proxima} pending={pending} /> : null}
    </div>
  );
}

export function MarcarFeito({ pastaId, etapa, feita, habilitado = true, proxima, children = "Marcar etapa como feita", pending: ext }: { pastaId: string; etapa: string; feita?: boolean; habilitado?: boolean; proxima?: string; children?: ReactNode; pending?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (feita) {
    return proxima ? (
      <button type="button" className="b1" onClick={() => router.push(proxima)}>
        Próxima etapa
      </button>
    ) : (
      <div className="good">Etapa feita.</div>
    );
  }
  return (
    <button
      type="button"
      className="b1"
      disabled={!habilitado || pending || ext}
      onClick={() =>
        start(async () => {
          await marcarFeito(pastaId, etapa);
          toast("Etapa feita");
          router.push(proxima ?? `/app/p/${pastaId}`);
        })
      }
    >
      {pending ? <Spinner /> : null} {children}
    </button>
  );
}

/** Botão que chama a IA (ou outra ação demorada): mostra o robô trabalhando, o progresso e o erro amigável. */
export function AcaoIa({
  acao,
  children,
  className = "b1",
  ok,
  carregando = "A IA está trabalhando",
  passos,
  duracao = 15,
  semTela = false,
}: {
  acao: () => Promise<{ ok?: boolean; erro?: string }>;
  children: ReactNode;
  className?: string;
  ok?: string;
  carregando?: string;
  passos?: string[];
  duracao?: number;
  semTela?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [erro, setErro] = useState("");
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        className={className}
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          start(async () => {
            setErro("");
            let r: { ok?: boolean; erro?: string };
            try {
              r = await acao();
            } catch {
              setErro("Não deu certo agora. Confira a internet e toque de novo.");
              return;
            }
            if (r.erro) setErro(r.erro);
            else {
              if (ok) toast(ok);
              router.refresh();
            }
          })
        }
      >
        {pending ? (
          <>
            <Spinner /> {carregando.replace(/\.+$/, "")}...
          </>
        ) : (
          children
        )}
      </button>
      {erro ? <span role="alert" className="text-sm text-danger">{erro}</span> : null}
      {!semTela ? <IaTrabalhando ativo={pending} titulo={carregando.replace(/\.+$/, "")} passos={passos} duracao={duracao} /> : null}
    </div>
  );
}
