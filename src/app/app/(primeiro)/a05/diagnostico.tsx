"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Passos } from "@/components/app/passos";
import { Spinner } from "@/components/ux/submit-button";
import { concluirDiagnostico, salvarResposta } from "@/lib/actions/onboarding";
import type { Pergunta, Respostas } from "@/lib/domain/diagnostico";

export function Diagnostico({ perguntas, inicial, inicio }: { perguntas: Pergunta[]; inicial: Respostas; inicio: number }) {
  const router = useRouter();
  const [i, setI] = useState(inicio);
  const [r, setR] = useState<Respostas>(inicial);
  const [outro, setOutro] = useState("");
  const [pending, start] = useTransition();
  const [fechando, setFechando] = useState(false);
  const [erro, setErro] = useState("");
  const p = perguntas[i]!;
  const atual = r[p.k];
  const sel = (o: string) => (Array.isArray(atual) ? atual.includes(o) : atual === o);
  const ultimo = i === perguntas.length - 1;

  const avancar = (novo: Respostas) => {
    if (!ultimo) {
      setI(i + 1);
      setOutro("");
      return;
    }
    setFechando(true);
    start(async () => {
      const res = await concluirDiagnostico();
      if (res.ok) router.push("/app/a06");
      else {
        setFechando(false);
        setErro(res.erro ?? "Não deu pra concluir.");
        const falta = perguntas.findIndex((x) => !novo[x.k] || (Array.isArray(novo[x.k]) && !(novo[x.k] as string[]).length));
        if (falta >= 0) setI(falta);
      }
    });
  };

  const escolher = (o: string) => {
    if (p.multi) {
      const l = Array.isArray(atual) ? atual : [];
      const nl = l.includes(o) ? l.filter((x) => x !== o) : [...l, o];
      setR({ ...r, [p.k]: nl });
      start(async () => {
        await salvarResposta(p.k, nl);
      });
      return;
    }
    if (o === "Outro") {
      setR({ ...r, [p.k]: "Outro" });
      return;
    }
    const novo = { ...r, [p.k]: o };
    setR(novo);
    start(async () => {
      await salvarResposta(p.k, o);
      avancar(novo);
    });
  };

  if (fechando) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center" role="status">
        <span className="spinner size-10 text-accent" aria-hidden />
        <h1 className="m-0 text-xl font-bold">A IA está lendo as suas respostas</h1>
        <p className="mu text-sm">Leva uns segundos. Ela monta um resumo e sugere por onde começar.</p>
      </div>
    );
  }

  const outroAberto = !p.multi && atual === "Outro";
  return (
    <>
      <Passos atual={3} rotulo="Diagnóstico" />
      <div className="flex flex-col gap-1.5">
        <div className="flex h-1.5 overflow-hidden rounded-[3px] bg-line" aria-hidden>
          <div className="rounded-[3px] bg-accent transition-[width] duration-300" style={{ width: `${((i + 1) / perguntas.length) * 100}%` }} />
        </div>
        <span className="mu font-bold">Pergunta {i + 1} de {perguntas.length}</span>
      </div>
      <div key={p.k} className="page-in cd gap-2 p-4">
        <span className="text-lg font-bold leading-snug">{p.q}</span>
        <span className="mu">Por que eu pergunto: {p.p}</span>
      </div>
      <div key={`${p.k}-o`} className="page-in flex flex-col gap-2" role={p.multi ? "group" : "radiogroup"} aria-label={p.q}>
        {p.o.map((o) => (
          <button
            key={o}
            type="button"
            role={p.multi ? "checkbox" : "radio"}
            aria-checked={sel(o)}
            disabled={pending && !p.multi}
            onClick={() => escolher(o)}
            className={`press flex min-h-[52px] items-center justify-between gap-3 rounded-[14px] border px-4 text-left text-[15px] text-text ${sel(o) ? "border-accent bg-sel font-bold" : "border-line-2 bg-surface hover:border-accent/60"}`}
          >
            {o}
            {sel(o) ? <span aria-hidden className="text-accent-2">✓</span> : null}
          </button>
        ))}
      </div>
      {outroAberto ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!outro.trim()) return;
            const novo = { ...r, [p.k]: outro.trim() };
            setR(novo);
            start(async () => {
              await salvarResposta(p.k, outro.trim());
              avancar(novo);
            });
          }}
        >
          <label htmlFor="outro" className="sr-only">Qual?</label>
          <input id="outro" autoFocus value={outro} onChange={(e) => setOutro(e.target.value)} maxLength={120} placeholder="Escreva aqui" className="in" />
          <button className="b1 w-auto px-5" disabled={pending}>{pending ? <Spinner /> : "Ok"}</button>
        </form>
      ) : null}
      {p.multi ? (
        <>
          <span className="mu">Pode marcar mais de uma.</span>
          <button type="button" className="b1" disabled={pending || !Array.isArray(atual) || !atual.length} onClick={() => avancar(r)}>
            {pending ? <Spinner /> : null} Continuar
          </button>
        </>
      ) : null}
      {erro ? <p role="alert" className="m-0 text-sm text-danger">{erro}</p> : null}
      <div className="mt-auto flex justify-between gap-2">
        <button type="button" className="b3" disabled={i === 0 || pending} onClick={() => setI(i - 1)}>Voltar</button>
        <Link href="/app" className="b3">Salvar e continuar depois</Link>
      </div>
    </>
  );
}
