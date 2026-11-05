"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ux/submit-button";
import { salvarPeca } from "@/lib/actions/admin-sdm";

export function NovaPeca() {
  const [st, action] = useActionState(salvarPeca, null as { ok?: boolean; erro?: string } | null);
  return (
    <form action={action} className="acd gap-3">
      <span className="font-bold">Nova peça</span>
      <div className="grid gap-3 sm:grid-cols-4">
        <div><label htmlFor="pk-t" className="lb mb-1.5 block text-muted">Tipo</label><select id="pk-t" name="tipo" className="ain"><option value="anuncio">Anúncio de imagem</option><option value="video">Vídeo</option><option value="texto">Texto</option><option value="story">Story</option><option value="pagina">Página</option></select></div>
        <div className="sm:col-span-2"><label htmlFor="pk-ti" className="lb mb-1.5 block text-muted">Título</label><input id="pk-ti" name="titulo" required className="ain" /></div>
        <div><label htmlFor="pk-i" className="lb mb-1.5 block text-muted">Idioma</label><select id="pk-i" name="idioma" className="ain"><option value="pt">Português</option><option value="en">Inglês</option><option value="es">Espanhol</option></select></div>
      </div>
      <div><label htmlFor="pk-x" className="lb mb-1.5 block text-muted">Texto da peça</label><textarea id="pk-x" name="texto" rows={4} className="ain py-2" /></div>
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      {st?.ok ? <span role="status" className="text-sm text-ok">Peça salva.</span> : null}
      <SubmitButton className="ab1 self-start" pendente="Salvando...">Salvar peça</SubmitButton>
    </form>
  );
}
