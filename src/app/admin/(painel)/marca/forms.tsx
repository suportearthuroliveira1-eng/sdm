"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { enviarImagemMarca, removerImagemMarca, salvarTextosMarca } from "@/lib/actions/admin-marca";

type S = { ok?: boolean; erro?: string; msg?: string } | null;

export function ImagemMarca({ campo, titulo, dica, atual, redonda = false }: { campo: "fotoAmanda" | "icone"; titulo: string; dica: string; atual: string | null; redonda?: boolean }) {
  const router = useRouter();
  const [st, action, pending] = useActionState(enviarImagemMarca.bind(null, campo), null as S);
  const [previa, setPrevia] = useState<string | null>(null);
  const [tirando, start] = useTransition();
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (st?.ok) router.refresh();
  }, [st, router]);
  const img = previa ?? atual;
  return (
    <form action={action} className="acd gap-3">
      <h2 className="m-0 text-base font-bold">{titulo}</h2>
      <div className="flex items-center gap-4">
        <span className={`grid size-24 shrink-0 place-items-center overflow-hidden border border-line bg-surface-2 ${redonda ? "rounded-full" : "rounded-[22px]"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img ? <img src={img} alt={titulo} className="size-full object-cover" /> : <span className="text-xs text-muted">padrão</span>}
        </span>
        <span className="mu text-sm">{dica}</span>
      </div>
      <input
        name="arquivo"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="ain py-2.5"
        aria-label={`Escolher ${titulo.toLowerCase()}`}
        onChange={(e) => {
          const f = e.target.files?.[0];
          setMsg(f && f.size > 4 * 1024 * 1024 ? "Imagem grande demais (máx. 4 MB)." : "");
          setPrevia(f ? URL.createObjectURL(f) : null);
        }}
      />
      {st?.erro || msg ? <span role="alert" className="text-sm text-danger">{msg || st?.erro}</span> : null}
      {st?.msg ? <span className="text-sm text-ok">{st.msg}</span> : null}
      <div className="flex gap-2">
        <button className="ab1" disabled={pending || Boolean(msg)}>{pending ? "Enviando..." : "Salvar imagem"}</button>
        {atual ? (
          <button type="button" className="ab2" disabled={tirando} onClick={() => start(async () => { await removerImagemMarca(campo); setPrevia(null); router.refresh(); })}>
            Voltar pro padrão
          </button>
        ) : null}
      </div>
    </form>
  );
}

export function TextosMarca({ nome, recado }: { nome: string; recado: string }) {
  const [st, action, pending] = useActionState(salvarTextosMarca, null as S);
  return (
    <form action={action} className="acd gap-3">
      <h2 className="m-0 text-base font-bold">Textos</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1"><label htmlFor="m-nome" className="lb text-muted">Nome que aparece</label><input id="m-nome" name="nomeAmanda" defaultValue={nome} maxLength={60} className="ain" /></div>
        <div className="flex flex-col gap-1"><label htmlFor="m-recado" className="lb text-muted">Frase curta dela (aparece com a foto no Início)</label><input id="m-recado" name="recado" defaultValue={recado} maxLength={240} className="ain" placeholder="Estou com você em cada passo." /></div>
      </div>
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      {st?.msg ? <span className="text-sm text-ok">{st.msg}</span> : null}
      <button className="ab1 self-start" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</button>
    </form>
  );
}
