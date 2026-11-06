"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Passos } from "@/components/app/passos";
import { Spinner } from "@/components/ux/submit-button";
import { concluirDiagnostico, salvarResposta } from "@/lib/actions/onboarding";
import { tipoDe, type Pergunta, type Respostas } from "@/lib/domain/diagnostico";

const OUTRO = "__outro__";

/** Rascunho da pergunta (o que está marcado na tela, antes de confirmar). */
type Rascunho = { unica: string; multi: string[]; outroLigado: boolean; outroTxt: string; texto: string };

function rascunhoDe(p: Pergunta, v: string | string[] | undefined): Rascunho {
  const base: Rascunho = { unica: "", multi: [], outroLigado: false, outroTxt: "", texto: "" };
  const t = tipoDe(p);
  if (t === "texto") return { ...base, texto: typeof v === "string" ? v : "" };
  if (t === "multipla") {
    const l = Array.isArray(v) ? v : [];
    const fora = l.filter((x) => !p.o.includes(x));
    return { ...base, multi: l.filter((x) => p.o.includes(x)), outroLigado: fora.length > 0, outroTxt: fora.join(", ") };
  }
  if (typeof v === "string" && v) return p.o.includes(v) ? { ...base, unica: v } : { ...base, unica: OUTRO, outroLigado: true, outroTxt: v === "Outro" ? "" : v };
  return base;
}

function valorDe(p: Pergunta, d: Rascunho): string | string[] | null {
  const t = tipoDe(p);
  if (t === "texto") return d.texto.trim() || null;
  if (t === "multipla") {
    const extra = d.outroLigado ? d.outroTxt.split(",").map((x) => x.trim()).filter(Boolean) : [];
    const l = [...d.multi, ...extra];
    return l.length ? l : null;
  }
  if (d.unica === OUTRO) return d.outroTxt.trim() || null;
  return d.unica || null;
}

export function Diagnostico({ perguntas, inicial, inicio }: { perguntas: Pergunta[]; inicial: Respostas; inicio: number }) {
  const router = useRouter();
  const [i, setI] = useState(inicio);
  const [r, setR] = useState<Respostas>(inicial);
  const [d, setD] = useState<Rascunho>(() => rascunhoDe(perguntas[inicio]!, inicial[perguntas[inicio]!.k]));
  const [pending, start] = useTransition();
  const [fechando, setFechando] = useState(false);
  const [erro, setErro] = useState("");
  const p = perguntas[i]!;
  const t = tipoDe(p);
  const ultimo = i === perguntas.length - 1;
  const valor = valorDe(p, d);

  const irPara = (n: number, resp: Respostas = r) => {
    setI(n);
    setD(rascunhoDe(perguntas[n]!, resp[perguntas[n]!.k]));
    setErro("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmar = () => {
    if (pending) return;
    if (valor === null) {
      setErro(t === "multipla" ? "Marque pelo menos uma opção." : d.unica === OUTRO || d.outroLigado ? "Escreva a sua resposta." : "Escolha uma opção.");
      return;
    }
    setErro("");
    start(async () => {
      const res = await salvarResposta(p.k, valor).catch(() => ({ ok: false, erro: "Sem conexão. Toque em Confirmar de novo." }));
      if (!res.ok) {
        setErro(res.erro ?? "Não deu pra salvar.");
        return;
      }
      const novo = { ...r, [p.k]: valor };
      setR(novo);
      if (!ultimo) {
        irPara(i + 1, novo);
        return;
      }
      setFechando(true);
      const fim = await concluirDiagnostico().catch(() => ({ ok: false, erro: "Sem conexão. Tente de novo." }));
      if (fim.ok) {
        router.push("/app/a06");
        return;
      }
      setFechando(false);
      setErro(fim.erro ?? "Não deu pra concluir.");
      const falta = perguntas.findIndex((x) => {
        const v = novo[x.k];
        return Array.isArray(v) ? !v.length : !v;
      });
      if (falta >= 0) irPara(falta, novo);
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

  const opcao = (o: string, marcado: boolean, onClick: () => void, papel: "radio" | "checkbox") => (
    <button
      key={o}
      type="button"
      role={papel}
      aria-checked={marcado}
      onClick={onClick}
      className={`press flex min-h-[54px] items-center justify-between gap-3 rounded-[14px] border-[1.5px] px-4 text-left text-[15px] text-text transition-colors ${marcado ? "border-accent bg-sel font-bold" : "border-line-2 bg-surface hover:border-accent/60"}`}
    >
      <span>{o}</span>
      <span aria-hidden className={`grid size-6 shrink-0 place-items-center border-[1.5px] text-[13px] ${papel === "radio" ? "rounded-full" : "rounded-md"} ${marcado ? "border-accent bg-accent text-accent-ink" : "border-line-2"}`}>
        {marcado ? "✓" : ""}
      </span>
    </button>
  );

  return (
    <>
      <Passos atual={3} rotulo="Diagnóstico" />
      <div className="flex flex-col gap-1.5">
        <div className="flex h-1.5 overflow-hidden rounded-[3px] bg-line" aria-hidden>
          <div className="rounded-[3px] bg-accent transition-[width] duration-300" style={{ width: `${(i / perguntas.length) * 100}%` }} />
        </div>
        <span className="mu font-bold">Pergunta {i + 1} de {perguntas.length}</span>
      </div>

      <div key={p.k} className="page-in flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[22px] font-bold leading-snug">{p.q}</h1>
          {p.p ? <p className="mu m-0">Por que eu pergunto: {p.p}</p> : null}
          {t === "multipla" ? <p className="m-0 text-sm font-bold text-accent-2">Pode marcar mais de uma.</p> : null}
        </div>

        {t === "texto" ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="resp" className="sr-only">{p.q}</label>
            <textarea id="resp" rows={4} maxLength={500} value={d.texto} onChange={(e) => setD({ ...d, texto: e.target.value })} placeholder="Escreva com as suas palavras" className="in min-h-28 py-3" />
          </div>
        ) : (
          <div className="flex flex-col gap-2" role={t === "multipla" ? "group" : "radiogroup"} aria-label={p.q}>
            {t === "multipla"
              ? p.o.map((o) => opcao(o, d.multi.includes(o), () => setD({ ...d, multi: d.multi.includes(o) ? d.multi.filter((x) => x !== o) : [...d.multi, o] }), "checkbox"))
              : p.o.map((o) => opcao(o, d.unica === o, () => setD({ ...d, unica: o, outroLigado: false }), "radio"))}
            {p.outro
              ? t === "multipla"
                ? opcao("Outro", d.outroLigado, () => setD({ ...d, outroLigado: !d.outroLigado }), "checkbox")
                : opcao("Outro", d.unica === OUTRO, () => setD({ ...d, unica: OUTRO, outroLigado: true }), "radio")
              : null}
            {p.outro && (t === "multipla" ? d.outroLigado : d.unica === OUTRO) ? (
              <div className="page-in flex flex-col gap-1">
                <label htmlFor="outro" className="text-sm font-bold">Qual?{t === "multipla" ? " (separe com vírgula)" : ""}</label>
                <input
                  id="outro"
                  autoFocus
                  onFocus={(e) => e.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}
                  value={d.outroTxt}
                  onChange={(e) => setD({ ...d, outroTxt: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      confirmar();
                    }
                  }}
                  maxLength={120}
                  placeholder="Escreva aqui"
                  className="in scroll-mb-32"
                />
              </div>
            ) : null}
          </div>
        )}
      </div>

      {erro ? <p role="alert" className="m-0 text-sm text-danger">{erro}</p> : null}

      <div className="sticky bottom-0 -mx-5 mt-auto flex gap-2 border-t border-line bg-bg/95 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 backdrop-blur">
        {i > 0 ? (
          <button type="button" className="b2 w-auto px-5" onClick={() => irPara(i - 1)} disabled={pending}>
            Voltar
          </button>
        ) : null}
        <button type="button" className="b1 flex-1" onClick={confirmar} disabled={pending || valor === null} aria-busy={pending}>
          {pending ? (
            <>
              <Spinner /> Salvando...
            </>
          ) : ultimo ? (
            "Confirmar e ver o resultado"
          ) : (
            "Confirmar"
          )}
        </button>
      </div>
    </>
  );
}
