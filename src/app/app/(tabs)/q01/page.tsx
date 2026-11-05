import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/app/ui";
import { requireStudent } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Professora" };

// Q01 · Professora (IA). A conversa com IA entra na Fase 7.
export default async function Q01() {
  const { student } = await requireStudent();
  return (
    <>
      <PageTitle>Professora</PageTitle>
      <div className="flex flex-col gap-2.5 lg:max-w-2xl">
        <span className="mu">Eu explico e sugiro; a decisão é sempre sua.</span>
        <div className="max-w-[420px] self-start rounded-[16px_16px_16px_4px] bg-surface px-3.5 py-3 text-sm leading-normal">
          Oi, {student.nome.split(/\s+/)[0]}! Pode perguntar qualquer coisa, mandar print do gerenciador ou do painel da rede, ou me explicar com as suas palavras o que aprendeu.
        </div>
        <div className="warn">A professora com IA está sendo preparada e chega numa próxima atualização. Enquanto isso, o glossário responde as palavras do SDM.</div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/l04" className="b2 no-underline">Abrir o glossário</Link>
          <Link href="/app/l01" className="b2 no-underline">Ver as aulas</Link>
        </div>
      </div>
    </>
  );
}
