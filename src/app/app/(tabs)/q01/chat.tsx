"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Spinner, SubmitButton } from "@/components/ux/submit-button";
import { abrirChamado } from "@/lib/actions/suporte";

type Msg = { id: string; eu: boolean; texto: string; print?: string };

/** Reduz o print pra no máximo 1024 px no lado maior (menos tokens, mais barato). */
async function reduzir(f: File): Promise<string> {
  const img = await createImageBitmap(f);
  const k = Math.min(1, 1024 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}

/** Texto da professora com "Aula X.Y" virando link. */
function ComLinks({ t }: { t: string }) {
  const partes = t.split(/(Aula\s+[A-Z]?\d+(?:\.\d+)?)/g);
  return (
    <>
      {partes.map((p, i) => {
        const m = /^Aula\s+([A-Z]?\d+(?:\.\d+)?)$/.exec(p);
        return m ? <a key={i} href={`/app/l02/${encodeURIComponent(m[1]!)}`} className="font-semibold text-accent-2">{p}</a> : <span key={i}>{p}</span>;
      })}
    </>
  );
}

export function Chat({ nome, inicial, sugestoes, pastas, pastaInicial, aula, ligada }: { nome: string; inicial: Msg[]; sugestoes: string[]; pastas: { id: string; nome: string }[]; pastaInicial: string | null; aula: string | null; ligada: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>(inicial);
  const [txt, setTxt] = useState("");
  const [print, setPrint] = useState<string | null>(null);
  const [pasta, setPasta] = useState(pastaInicial);
  const [enviando, setEnviando] = useState(false);
  const [chamado, setChamado] = useState(false);
  const fim = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  const enviar = async (texto: string) => {
    const t = texto.trim();
    if (!t || enviando) return;
    const minha: Msg = { id: crypto.randomUUID(), eu: true, texto: t, print: print ?? undefined };
    const resp: Msg = { id: crypto.randomUUID(), eu: false, texto: "" };
    setMsgs((m) => [...m, minha, resp]);
    setTxt("");
    setPrint(null);
    setEnviando(true);
    try {
      const r = await fetch("/api/professora", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto: t, print: minha.print ?? null, pastaId: pasta, aula }) });
      if (!r.ok || !r.body) {
        const e = await r.text();
        setMsgs((m) => m.map((x) => (x.id === resp.id ? { ...x, texto: e || "Não consegui responder agora." } : x)));
        return;
      }
      const rd = r.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await rd.read();
        if (done) break;
        const pedaco = dec.decode(value, { stream: true });
        setMsgs((m) => m.map((x) => (x.id === resp.id ? { ...x, texto: x.texto + pedaco } : x)));
      }
    } catch {
      setMsgs((m) => m.map((x) => (x.id === resp.id ? { ...x, texto: "Sem conexão agora. Tente de novo." } : x)));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 lg:max-w-3xl">
      {pastas.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Pensando em qual produto">
          {pastas.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={pasta === p.id} onClick={() => setPasta(p.id)} className={`press min-h-11 flex-none rounded-[22px] border px-3 text-xs font-semibold ${pasta === p.id ? "border-accent bg-sel text-text" : "border-line-2 text-text-2"}`}>{p.nome}</button>
          ))}
        </div>
      ) : null}
      <span className="mu">Eu explico e sugiro; a decisão é sempre sua.{aula ? ` Você veio da aula ${aula}.` : ""}</span>
      {!ligada ? <div className="warn">A Professora com IA ainda não está ligada neste app. Enquanto isso, use o glossário ou fale com o time.</div> : null}
      <div className="flex flex-col gap-2.5" aria-live="polite">
        <div className="max-w-[90%] self-start rounded-[16px_16px_16px_4px] bg-surface px-3.5 py-3 text-sm leading-normal">
          Oi, {nome}! Pode perguntar qualquer coisa, mandar print do gerenciador ou do painel da rede, ou me explicar com as suas palavras o que aprendeu.
        </div>
        {msgs.map((m) =>
          m.eu ? (
            <div key={m.id} className="page-in flex max-w-[85%] flex-col gap-1.5 self-end rounded-[16px_16px_4px_16px] bg-accent px-3.5 py-2.5 text-sm font-semibold text-accent-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {m.print ? <img src={m.print} alt="Print enviado" className="max-h-40 rounded-lg" /> : null}
              {m.texto}
            </div>
          ) : (
            <div key={m.id} className="page-in max-w-[90%] self-start whitespace-pre-line rounded-[16px_16px_16px_4px] bg-surface px-3.5 py-3 text-sm leading-normal">
              {m.texto ? <ComLinks t={m.texto} /> : <span className="flex items-center gap-2 text-muted"><Spinner /> pensando...</span>}
            </div>
          ),
        )}
        <div ref={fim} />
      </div>
      <div className="flex flex-wrap gap-2">
        {(msgs.some((m) => !m.eu) ? ["Explica mais simples", ...sugestoes.slice(0, 3)] : sugestoes).map((s) => (
          <button key={s} type="button" disabled={enviando || !ligada} onClick={() => enviar(s)} className="press min-h-11 rounded-[22px] border border-line-2 bg-surface px-3 text-xs font-semibold text-text-2">{s}</button>
        ))}
      </div>
      {print ? (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={print} alt="Print anexado" className="h-14 rounded-lg" />
          <button type="button" className="b3" onClick={() => setPrint(null)}>Tirar print</button>
        </div>
      ) : null}
      <form className="sticky bottom-24 flex items-center gap-2 lg:bottom-4" onSubmit={(e) => { e.preventDefault(); void enviar(txt); }}>
        <label className="press flex size-11 flex-none cursor-pointer items-center justify-center rounded-full border border-line-2 bg-surface" aria-label="Mandar print">
          <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPrint(await reduzir(f)); e.target.value = ""; }} />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F4F1F8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M21 17l-5-5-8 7" /></svg>
        </label>
        <label htmlFor="msg" className="sr-only">Sua mensagem</label>
        <input id="msg" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Escreva aqui" maxLength={2000} className="in min-h-11 rounded-[22px]" />
        <button className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-accent text-accent-ink transition active:scale-95 disabled:opacity-50" disabled={enviando || !txt.trim() || !ligada} aria-label="Enviar">
          {enviando ? <Spinner /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
        </button>
      </form>
      {chamado ? <Chamado onFim={() => setChamado(false)} /> : <button type="button" className="b3 self-start" onClick={() => setChamado(true)}>Falar com uma pessoa do time</button>}
    </div>
  );
}

function Chamado({ onFim }: { onFim: () => void }) {
  const [st, action] = useActionState(abrirChamado, null as { ok?: boolean; erro?: string } | null);
  if (st?.ok) return <div className="good">Chamado aberto. O time responde por aqui e no seu e-mail [horário de atendimento: regra do time]. <button type="button" className="b3" onClick={onFim}>Fechar</button></div>;
  return (
    <form action={action} className="cd gap-2">
      <span className="kk">FALAR COM O TIME</span>
      <label htmlFor="ch-t" className="lb">O que aconteceu?</label>
      <textarea id="ch-t" name="texto" required minLength={5} maxLength={2000} className="ta" />
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      <SubmitButton pendente="Enviando...">Abrir chamado</SubmitButton>
    </form>
  );
}
