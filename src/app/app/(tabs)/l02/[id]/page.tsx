import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LockIcon } from "@/components/app/ui";
import { agoraFacaLink } from "@/lib/domain/screens";
import { getJornada } from "@/lib/server/aluna";
import { AulaAcoes } from "./acoes";

export const metadata: Metadata = { title: "Aula" };

// L02 · Player da aula com "Agora faça" (protótipo). Vídeo e roteiro de 5 blocos vêm do admin (AD05).
export default async function L02({ params }: PageProps<"/app/l02/[id]">) {
  const id = decodeURIComponent((await params).id);
  const j = await getJornada();
  const mod = j.modulos.find((m) => m.aulas.some((a) => a.id === id));
  const aula = mod?.aulas.find((a) => a.id === id);
  if (!mod || !aula) notFound();
  const todas = j.modulos.flatMap((m) => m.aulas);
  const i = todas.findIndex((a) => a.id === id);
  const prox = todas.slice(i + 1).find((a) => !a.lock.travado);
  const alvo = agoraFacaLink(aula.agoraFacaAlvo);

  return (
    <div className="flex flex-col gap-3.5 pt-3 lg:max-w-3xl lg:pt-0">
      <div className="flex flex-col gap-0.5">
        <span className="mu text-sm">Aula {aula.id} · {mod.id} {mod.nome}</span>
        <h1 className="m-0 text-[24px] font-bold leading-tight lg:text-[30px]">{aula.titulo}</h1>
      </div>
      {aula.lock.travado ? (
        <div className="warn flex flex-col gap-2">
          <span className="flex items-center gap-2 font-bold">{LockIcon} Aula bloqueada</span>
          <span>{aula.lock.motivo}</span>
          <Link href={aula.lock.acao.href} className="b2 self-start no-underline">{aula.lock.acao.label}</Link>
        </div>
      ) : (
        <>
          <div className="flex min-h-[190px] flex-col items-center justify-center gap-2.5 rounded-[18px] border border-line bg-surface-2 lg:min-h-[360px]">
            <span className="flex size-[60px] items-center justify-center rounded-full bg-accent" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#140F1F"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span className="mu text-sm">[vídeo da aula · o time sobe pelo admin]</span>
          </div>
          <div className="mu">{[aula.tipo, aula.minutos ? `${aula.minutos} min` : null].filter(Boolean).join(" · ")}</div>
          {aula.agoraFacaTexto ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-accent bg-sel p-4">
              <span className="kk">AGORA FAÇA</span>
              <span className="text-[15px] font-bold leading-snug">{aula.agoraFacaTexto}</span>
              {aula.agoraFacaAlvo === "fora" ? <span className="mu text-text-2">Essa parte você faz fora do app.</span> : null}
              {alvo ? <Link href={alvo.href} className="b1 no-underline">Fazer agora no app</Link> : aula.agoraFacaAlvo && !["fora", "pergunta"].includes(aula.agoraFacaAlvo) ? <span className="mu text-text-2">[a tela {aula.agoraFacaAlvo} chega nas próximas fases]</span> : null}
            </div>
          ) : null}
          <AulaAcoes id={aula.id} vista={aula.vista} feita={aula.feita} />
          {prox ? <Link href={`/app/l02/${encodeURIComponent(prox.id)}`} className="b3 self-start">Próxima aula: {prox.id} · {prox.titulo}</Link> : null}
        </>
      )}
    </div>
  );
}
