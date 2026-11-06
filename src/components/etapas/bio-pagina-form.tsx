"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Spinner } from "@/components/ux/submit-button";
import { toast } from "@/components/ux/toaster";
import { salvarBioPagina } from "@/lib/actions/caminhos";

type Link = { texto: string; url: string };

/** Editor da página de links da bio (nome, frase, botão do produto e até 4 links extras). */
export function BioPaginaForm({ pastaId, inicial, link, temDestino, sugestaoFrase }: { pastaId: string; inicial: { nome?: string; frase?: string; botao?: string; links?: Link[] }; link: string; temDestino: boolean; sugestaoFrase: string }) {
  const router = useRouter();
  const [v, setV] = useState({ nome: inicial.nome ?? "", frase: inicial.frase ?? "", botao: inicial.botao ?? "" });
  const [links, setLinks] = useState<Link[]>(inicial.links ?? []);
  const [erro, setErro] = useState("");
  const [pend, start] = useTransition();
  const salvar = () =>
    start(async () => {
      setErro("");
      const r = await salvarBioPagina(pastaId, { ...v, links: links.filter((l) => l.texto.trim() || l.url.trim()) }).catch(() => ({ erro: "Sem conexão." }));
      if (r.erro) return setErro(r.erro);
      toast("Página de links salva");
      router.refresh();
    });
  return (
    <div className="cd gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="kk">SUA PÁGINA DE LINKS (O LINK DA BIO)</span>
        <a href={link} target="_blank" rel="noreferrer" className="text-sm font-semibold">Abrir minha página ↗</a>
      </div>
      {!temDestino ? <div className="warn">O botão do produto aparece quando o link do produto estiver pronto (checkout testado ou link de afiliada aprovado).</div> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="bp-nome" className="lb">Nome que aparece</label>
          <input id="bp-nome" className="in" maxLength={40} value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} placeholder="Seu primeiro nome" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="bp-botao" className="lb">Texto do botão do produto</label>
          <input id="bp-botao" className="in" maxLength={40} value={v.botao} onChange={(e) => setV({ ...v, botao: e.target.value })} placeholder="Ex.: Get my ebook" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="bp-frase" className="lb">Frase (no idioma de quem compra)</label>
        <textarea id="bp-frase" className="ta min-h-16" maxLength={240} value={v.frase} onChange={(e) => setV({ ...v, frase: e.target.value })} placeholder={sugestaoFrase || "Uma frase curta sobre o que você ajuda a resolver"} />
        {sugestaoFrase && !v.frase ? <button type="button" className="b3 self-start px-0 text-xs" onClick={() => setV({ ...v, frase: sugestaoFrase })}>Usar a bio que a IA escreveu</button> : null}
      </div>
      <div className="flex flex-col gap-2">
        <span className="lb">Outros links (opcional, até 4)</span>
        {links.map((l, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[160px_1fr_44px]">
            <input aria-label={`Texto do link ${i + 1}`} className="in" maxLength={40} value={l.texto} placeholder="Ex.: Meu Instagram" onChange={(e) => setLinks(links.map((x, k) => (k === i ? { ...x, texto: e.target.value } : x)))} />
            <input aria-label={`Endereço do link ${i + 1}`} className="in" type="url" value={l.url} placeholder="https://…" onChange={(e) => setLinks(links.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)))} />
            <button type="button" className="b2 px-0" aria-label={`Tirar o link ${i + 1}`} onClick={() => setLinks(links.filter((_, k) => k !== i))}>×</button>
          </div>
        ))}
        {links.length < 4 ? <button type="button" className="b2 self-start" onClick={() => setLinks([...links, { texto: "", url: "" }])}>+ Link</button> : null}
      </div>
      {erro ? <span role="alert" className="text-sm text-danger">{erro}</span> : null}
      <button type="button" className="b1" disabled={pend} onClick={salvar}>{pend ? <><Spinner /> Salvando...</> : "Salvar a página"}</button>
    </div>
  );
}
