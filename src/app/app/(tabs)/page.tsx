import type { Metadata } from "next";
import Link from "next/link";
import { Bar, Item, PageTitle, PlayIcon } from "@/components/app/ui";
import { getJornada } from "@/lib/server/aluna";

export const metadata: Metadata = { title: "Início" };

// I01 · Seu caminho (protótipo).
export default async function I01() {
  const j = await getJornada();
  const primeiro = j.student.nome.split(/\s+/)[0];
  const pct = j.total ? Math.round((j.vistas / j.total) * 100) : 0;
  const atalhos = [
    { t: "Vitrine de produtos", d: "Produtos pra divulgar como afiliada", href: "/app/v02" },
    { t: "Aulas", d: `${j.vistas} de ${j.total} vistas`, href: "/app/l01" },
    { t: "Glossário", d: "As palavras do SDM, sem complicação", href: "/app/l04" },
    { t: "Instalar na tela", d: "Abrir o SDM como um app", href: "/app/a03" },
  ];
  return (
    <>
      <PageTitle k={`Oi, ${primeiro}`}>Seu caminho</PageTitle>
      <div className="grid gap-3.5 lg:grid-cols-2">
        <div className="flex flex-col gap-3.5">
          {j.proxima ? (
            <Item href={`/app/l02/${encodeURIComponent(j.proxima.id)}`} className="flex-col items-start gap-1.5 border border-accent bg-sel p-4">
              <span className="kk">SEU PRÓXIMO PASSO</span>
              <span className="text-[17px] font-bold leading-snug">Assistir a aula {j.proxima.id}: {j.proxima.titulo}</span>
              {j.proxima.agoraFacaTexto ? <span className="text-[13px] text-text-2">Depois: {j.proxima.agoraFacaTexto}</span> : null}
            </Item>
          ) : (
            <div className="good">Você viu todas as aulas liberadas até agora.</div>
          )}
          {j.proxima ? (
            <Item href={`/app/l02/${encodeURIComponent(j.proxima.id)}`} className="border border-line bg-surface">
              {PlayIcon}
              <span className="flex flex-col gap-0.5">
                <span className="kk">PRÓXIMA AULA</span>
                <span className="text-sm font-bold">{j.proxima.titulo}</span>
                <span className="mu">{j.proxima.id}{j.proxima.minutos ? ` · ${j.proxima.minutos} min` : ""}</span>
              </span>
            </Item>
          ) : null}
          {j.pendentes.length ? (
            <>
              <span className="text-sm font-bold">&quot;Agora faça&quot; que ficaram pra trás</span>
              {j.pendentes.map((a) => (
                <Item key={a.id} href={`/app/l02/${encodeURIComponent(a.id)}`} className="border border-warn-line bg-warn-bg">
                  <span className="dot border-2 border-warn text-warn" aria-hidden>!</span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-[#F7E6C2]">{a.agoraFacaTexto}</span>
                    <span className="mu text-warn-text">Aula {a.id}</span>
                  </span>
                </Item>
              ))}
            </>
          ) : null}
          <div className="cd">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Suas aulas</span>
              <span className="mu">{j.vistas} de {j.total} aulas vistas</span>
            </div>
            <Bar pct={pct} />
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-2">
            {atalhos.map((a) => (
              <Item key={a.t} href={a.href} className="min-h-[84px] flex-col items-start gap-1 border border-line bg-surface">
                <span className="text-sm font-bold">{a.t}</span>
                <span className="mu">{a.d}</span>
              </Item>
            ))}
          </div>
          <div className="flex flex-col gap-0.5 rounded-[14px] border border-ok-line bg-ok-bg p-3">
            <span className="text-[11px] font-bold tracking-[0.5px] text-ok">PLANTÃO DA SEMANA</span>
            <span className="text-sm font-bold">A Amanda responde as dúvidas mais feitas</span>
            <span className="mu text-ok-text">[o time publica o plantão pelo admin · em breve]</span>
          </div>
          <Link href="/app/u01" className="b3 self-start">Meu perfil e acessos</Link>
        </div>
      </div>
    </>
  );
}
