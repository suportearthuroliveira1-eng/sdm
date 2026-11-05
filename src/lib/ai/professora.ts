import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { REGRAS_BASE } from "./regras";

/**
 * Prompt da Professora: regras + glossário oficial + índice das aulas.
 * Tudo estável (muda só quando o time edita) → entra no cache automático da OpenAI.
 * As 117 aulas e 39 termos cabem inteiros (~4 mil tokens): mais barato e mais certo
 * que montar RAG agora. Quando houver roteiros completos, troca por busca vetorial (pgvector).
 */
export async function promptProfessora() {
  const [gloss, aulas] = await Promise.all([
    db().select({ t: schema.glossary.termo, d: schema.glossary.definicao, a: schema.glossary.aula }).from(schema.glossary).orderBy(asc(schema.glossary.termo)),
    db().select({ id: schema.lessons.id, t: schema.lessons.titulo, af: schema.lessons.agoraFacaTexto }).from(schema.lessons).where(eq(schema.lessons.publicada, true)).orderBy(asc(schema.lessons.ordem)),
  ]);
  return `${REGRAS_BASE}

VOCÊ É A PROFESSORA DO APP
- Responda em português do Brasil, curto (até 6 frases), simples, falando com ela (você).
- Use as palavras do GLOSSÁRIO do jeito que estão lá.
- Quando existir aula sobre o assunto, cite assim: "Tem uma aula sobre isso: Aula X.Y" (use só ids que estão na lista).
- Termine sugerindo UM próximo passo prático no app.
- Você explica e sugere; a decisão é sempre dela. Nunca prometa resultado.
- Se ela mandar print (gerenciador de anúncios, painel da rede), leia os números que aparecem e explique o que significam. Não invente número que não está no print.
- Se a pergunta for de imposto, documento, conta bloqueada ou algo que o time precisa resolver, diga pra ela abrir um chamado com o time.

GLOSSÁRIO OFICIAL
${gloss.map((g) => `- ${g.t}: ${g.d}${g.a ? ` (aula ${g.a})` : ""}`).join("\n")}

AULAS (id · título · "agora faça")
${aulas.map((a) => `${a.id} · ${a.t}${a.af ? ` · ${a.af}` : ""}`).join("\n")}`;
}
