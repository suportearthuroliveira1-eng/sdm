import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { REGRAS_BASE } from "./regras";
import type { ConfigIa } from "./run";
import { MAPA_DO_APP } from "./contexto-aluna";

/**
 * Prompt da Professora: regras + glossário oficial + índice das aulas.
 * Tudo estável (muda só quando o time edita) → entra no cache automático da OpenAI.
 * As 117 aulas e 39 termos cabem inteiros (~4 mil tokens): mais barato e mais certo
 * que montar RAG agora. Quando houver roteiros completos, troca por busca vetorial (pgvector).
 */
export const PROFESSORA_PADRAO = `- Antes de responder, consulte a FICHA DA ALUNA: chame pelo nome, diga onde ela está e qual é o próximo passo exato (o nome da etapa e onde tocar). Não peça o que ela já fez e não mande refazer o que já está pronto.
- Se a ficha não tiver a informação, não invente: pergunte ou diga onde ver no app.
- Responda em português do Brasil, curto (até 6 frases), simples, falando com ela (você).
- Use as palavras do GLOSSÁRIO do jeito que estão lá.
- Quando existir aula sobre o assunto, cite assim: "Tem uma aula sobre isso: Aula X.Y" (use só ids que estão na lista).
- Termine sugerindo UM próximo passo prático no app.
- Você explica e sugere; a decisão é sempre dela. Nunca prometa resultado.
- Se ela mandar print (gerenciador de anúncios, painel da rede), leia os números que aparecem e explique o que significam. Não invente número que não está no print.
- Se a pergunta for de imposto, documento, conta bloqueada ou algo que o time precisa resolver, diga pra ela abrir um chamado com o time.`;

/** ficha: o que a Professora sabe da aluna (vai no fim, depois da parte fixa, pra não quebrar o cache). */
export async function promptProfessora(cfg: ConfigIa = {}, ficha = "") {
  const [gloss, aulas] = await Promise.all([
    db().select({ t: schema.glossary.termo, d: schema.glossary.definicao, a: schema.glossary.aula }).from(schema.glossary).orderBy(asc(schema.glossary.termo)),
    db().select({ id: schema.lessons.id, t: schema.lessons.titulo, af: schema.lessons.agoraFacaTexto }).from(schema.lessons).where(eq(schema.lessons.publicada, true)).orderBy(asc(schema.lessons.ordem)),
  ]);
  return `${cfg.regrasBase?.trim() ? cfg.regrasBase : REGRAS_BASE}

VOCÊ É A PROFESSORA DO APP
${cfg.professora?.trim() ? cfg.professora : PROFESSORA_PADRAO}

GLOSSÁRIO OFICIAL
${gloss.map((g) => `- ${g.t}: ${g.d}${g.a ? ` (aula ${g.a})` : ""}`).join("\n")}

AULAS (id · título · "agora faça")
${aulas.map((a) => `${a.id} · ${a.t}${a.af ? ` · ${a.af}` : ""}`).join("\n")}

${MAPA_DO_APP}${ficha ? `

FICHA DA ALUNA (dados reais dela no app, de agora; consulte antes de responder)
${ficha}` : ""}`;
}
