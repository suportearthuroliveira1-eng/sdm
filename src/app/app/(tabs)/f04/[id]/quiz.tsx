"use client";

import { useState } from "react";
import type { Bi, QuizPergunta } from "@/lib/gen/modelo";
import { useLangPt } from "@/components/pasta/lang";

/** "Responda como cliente" (aula 4.5): joga o quiz do jeito que a compradora vai ver. */
export function Quiz({ quiz, resultado }: { quiz: QuizPergunta[]; resultado: Bi }) {
  const pt = useLangPt();
  const [i, setI] = useState(0);
  const fim = i >= quiz.length;
  const q = quiz[i];
  return (
    <div className="cd gap-2 border border-accent bg-sel">
      <span className="kk">RESPONDA COMO CLIENTE · AULA 4.5</span>
      {!fim && q ? (
        <>
          <span className="text-[15px] font-bold">{pt ? q.q.pt : q.q.x}</span>
          {(pt ? q.opcoes.pt : q.opcoes.x).map((o) => (
            <button key={o} type="button" onClick={() => setI(i + 1)} className="min-h-[46px] cursor-pointer rounded-[14px] border border-line-2 bg-surface px-3 text-left text-text">{o}</button>
          ))}
        </>
      ) : (
        <>
          <span className="text-[15px] font-bold">{pt ? resultado.pt : resultado.x}</span>
          <button type="button" className="b2" onClick={() => setI(0)}>Responder de novo</button>
        </>
      )}
    </div>
  );
}
