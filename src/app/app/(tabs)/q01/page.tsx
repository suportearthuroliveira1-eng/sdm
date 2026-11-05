import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { PageTitle } from "@/components/app/ui";
import { iaLigada } from "@/lib/ai/run";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { minhasPastas } from "@/lib/server/pastas";
import { Chat } from "./chat";

export const metadata: Metadata = { title: "Professora" };

// Professora (aba 4): conversa com IA, print, histórico por produto e "falar com o time".
export default async function Q01({ searchParams }: PageProps<"/app/q01">) {
  const { student } = await requireStudent();
  const aula = typeof (await searchParams).aula === "string" ? String((await searchParams).aula) : null;
  const [hist, pastas, ligada] = await Promise.all([
    db().select({ id: schema.chatMessages.id, papel: schema.chatMessages.papel, texto: schema.chatMessages.texto }).from(schema.chatMessages).where(eq(schema.chatMessages.studentId, student.id)).orderBy(asc(schema.chatMessages.createdAt)).limit(60),
    minhasPastas(),
    iaLigada("text_cheap"),
  ]);
  const ativa = pastas.find((p) => p.id === student.produtoAtivo) ?? pastas[0];
  const agora = ativa?.etapas.find((e) => e.agora);
  const sugestoes = [
    agora ? `Me explica a etapa "${agora.nome}"` : "Por onde eu começo?",
    "O que é CTR?",
    "Qual a diferença entre anúncio pago e vídeo orgânico?",
    "O que eu faço agora no app?",
  ];
  return (
    <>
      <PageTitle>Professora</PageTitle>
      <Chat
        nome={student.nome.split(/\s+/)[0] ?? ""}
        inicial={hist.map((h) => ({ id: h.id, eu: h.papel === "user", texto: h.texto }))}
        sugestoes={sugestoes}
        pastas={pastas.map((p) => ({ id: p.id, nome: p.nome }))}
        pastaInicial={ativa?.id ?? null}
        aula={aula}
        ligada={ligada}
      />
    </>
  );
}
