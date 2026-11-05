"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { enviarImagem, gerarImagem } from "@/lib/actions/pasta";
import { CopyButton } from "@/components/pasta/copy-button";

type S = { ok?: boolean; erro?: string } | null;

export function ImagemForms({ id, promptBase, ia }: { id: string; promptBase: string; ia: boolean }) {
  const router = useRouter();
  const [g, gerar, gPending] = useActionState(gerarImagem.bind(null, id), null as S);
  const [u, enviar, uPending] = useActionState(enviarImagem.bind(null, id), null as S);
  useEffect(() => {
    if (g?.ok || u?.ok) router.refresh();
  }, [g, u, router]);
  const prop = (n: string) => (
    <select name="proporcao" aria-label="Formato" className="in w-auto" defaultValue="1:1" id={n}>
      <option value="1:1">1:1 (feed)</option>
      <option value="4:5">4:5 (feed alto)</option>
      <option value="9:16">9:16 (story/reels)</option>
    </select>
  );
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <form action={gerar} className="cd gap-2">
        <span className="kk">GERAR COM IA</span>
        <label htmlFor="pr" className="lb">Prompt da imagem</label>
        <textarea id="pr" name="prompt" defaultValue={promptBase} className="ta" maxLength={1500} />
        <div className="flex flex-wrap items-center gap-2">
          {prop("pg")}
          <button className="b1 min-h-[46px] w-auto flex-1 text-sm" disabled={gPending || !ia}>{gPending ? "Gerando..." : "Gerar imagem"}</button>
        </div>
        {!ia ? <span className="mu text-warn-text">A geração com IA liga quando o time configurar a chave da OpenAI. Enquanto isso, copie o prompt e use em outra ferramenta, ou envie sua imagem.</span> : null}
        <CopyButton text={promptBase} label="Copiar prompt" className="self-start" />
        {g?.erro ? <span role="alert" className="text-xs text-danger">{g.erro}</span> : null}
      </form>
      <form action={enviar} className="cd gap-2">
        <span className="kk">ENVIAR MINHA IMAGEM</span>
        <label htmlFor="arq" className="lb">Arquivo (PNG, JPG ou WebP, até 4 MB)</label>
        <input id="arq" name="arquivo" type="file" accept="image/png,image/jpeg,image/webp" required className="in py-2.5" />
        <div className="flex flex-wrap items-center gap-2">
          {prop("pu")}
          <button className="b1 min-h-[46px] w-auto flex-1 text-sm" disabled={uPending}>{uPending ? "Enviando..." : "Enviar imagem"}</button>
        </div>
        {u?.erro ? <span role="alert" className="text-xs text-danger">{u.erro}</span> : null}
        {u?.ok ? <span role="status" className="text-xs text-ok">Imagem salva na pasta.</span> : null}
      </form>
    </div>
  );
}
