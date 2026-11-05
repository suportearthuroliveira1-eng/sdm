"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { excluirImagem, excluirItem, gerarAction, statusItem } from "@/lib/actions/pasta";

type Tipo = "kit" | "anuncio" | "gancho" | "roteiro" | "bio";

export function GerarButton({ pastaId, tipo, label, className = "b1" }: { pastaId: string; tipo: Tipo; label: string; className?: string }) {
  const [pending, start] = useTransition();
  const [erro, setErro] = useState("");
  const router = useRouter();
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await gerarAction(pastaId, tipo);
            if (!r.ok) setErro("erro" in r ? (r.erro ?? "Erro") : "Erro");
            else router.refresh();
          })
        }
      >
        {pending ? "Gerando..." : label}
      </button>
      {erro ? <span role="alert" className="text-xs text-danger">{erro}</span> : null}
    </div>
  );
}

export function ItemAcoes({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const aprovado = status === "aprovado";
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        className={`inline-flex min-h-11 cursor-pointer items-center rounded-[22px] px-3 text-xs font-bold ${aprovado ? "border border-ok-line bg-ok-bg text-ok" : "border-0 bg-accent text-accent-ink"}`}
        onClick={() => start(async () => { await statusItem(id, aprovado ? "rascunho" : "aprovado"); router.refresh(); })}
      >
        {aprovado ? "Aprovado ✓ (desfazer)" : "Aprovar"}
      </button>
      <button
        type="button"
        disabled={pending}
        className="inline-flex min-h-11 cursor-pointer items-center rounded-[22px] border border-line-2 bg-transparent px-3 text-xs text-muted hover:text-danger"
        onClick={() => {
          if (!confirm("Excluir este item?")) return;
          start(async () => { await excluirItem(id); router.refresh(); });
        }}
      >
        Excluir
      </button>
    </div>
  );
}

export function ExcluirImagem({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className="inline-flex min-h-11 cursor-pointer items-center rounded-[22px] border border-line-2 bg-transparent px-3 text-xs text-muted hover:text-danger"
      onClick={() => {
        if (!confirm("Excluir esta imagem?")) return;
        start(async () => { await excluirImagem(id); router.refresh(); });
      }}
    >
      Excluir
    </button>
  );
}
