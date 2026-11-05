import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { modelo, openai } from "@/lib/ai/run";
import { promptProfessora } from "@/lib/ai/professora";
import { getSetting } from "@/lib/server/settings";
import { rateLimit } from "@/lib/server/rate-limit";
import { errMsg, log } from "@/lib/server/log";

export const runtime = "nodejs";
export const maxDuration = 60;

const entrada = z.object({
  texto: z.string().trim().min(1).max(2000),
  print: z.string().max(1_500_000).regex(/^data:image\/(png|jpeg|webp);base64,/).nullable().optional(),
  pastaId: z.string().uuid().nullable().optional(),
  aula: z.string().max(20).nullable().optional(),
});

/** Professora (Q01): responde em streaming, guarda a conversa e registra custo. */
export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return new Response("não autorizado", { status: 401 });
  const student = await db().query.students.findFirst({ where: eq(schema.students.authUserId, user.id) });
  if (!student?.ativo) return new Response("não autorizado", { status: 401 });
  const parsed = entrada.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response("Mensagem inválida.", { status: 400 });
  const { texto, print, pastaId, aula } = parsed.data;

  const model = await modelo("text_cheap");
  if (!model) return new Response("A Professora ainda não está ligada neste app (falta a chave da OpenAI).", { status: 503 });
  const cota = await getSetting<number | null>("quota_professora_dia", null);
  const rl = await rateLimit(`prof:${student.id}`, typeof cota === "number" && cota > 0 ? cota : 40, 86400);
  if (!rl.ok) return new Response(`Você já fez muitas perguntas hoje. A Professora volta às ${rl.retryAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}.`, { status: 429 });

  let contexto = "";
  if (pastaId) {
    const p = await db().query.studentProducts.findFirst({ where: and(eq(schema.studentProducts.id, pastaId), eq(schema.studentProducts.studentId, student.id)) });
    if (p) contexto = `\nContexto: ela está na pasta "${p.nome ?? p.code}" (${p.tipo}), país de venda ${p.paisVenda ?? "a definir"}, divulgação ${p.divulgacao ?? "a escolher"}.`;
  }
  const hist = (await db().select().from(schema.chatMessages).where(eq(schema.chatMessages.studentId, student.id)).orderBy(desc(schema.chatMessages.createdAt)).limit(10)).reverse();
  await db().insert(schema.chatMessages).values({ studentId: student.id, studentProductId: pastaId ?? null, aulaAtual: aula ?? null, papel: "user", texto, anexoPath: print ? "[print enviado]" : null });

  const client = await openai();
  const instrucoes = await promptProfessora();
  const input = [
    ...hist.map((m) => ({ role: m.papel === "assistant" ? ("assistant" as const) : ("user" as const), content: m.texto })),
    {
      role: "user" as const,
      content: [
        { type: "input_text" as const, text: `${texto}${aula ? `\n(Ela está na aula ${aula}.)` : ""}${contexto}` },
        ...(print ? [{ type: "input_image" as const, image_url: print, detail: "low" as const }] : []),
      ],
    },
  ];
  const t0 = Date.now();
  const stream = await client.responses.create({ model, instructions: instrucoes, input, stream: true, max_output_tokens: 1800, reasoning: { effort: "low" }, prompt_cache_key: "sdm-professora" });
  const enc = new TextEncoder();
  let resposta = "";
  const body = new ReadableStream({
    async start(ctrl) {
      try {
        for await (const ev of stream) {
          if (ev.type === "response.output_text.delta") {
            resposta += ev.delta;
            ctrl.enqueue(enc.encode(ev.delta));
          } else if (ev.type === "response.completed") {
            const u = ev.response.usage;
            const precos = await getSetting<Record<string, [number, number, number]>>("ai_prices", {});
            const pr = precos[model] ?? [0.1, 0.01, 0.5];
            const cache = u?.input_tokens_details?.cached_tokens ?? 0;
            const custo = (((u?.input_tokens ?? 0) - cache) * pr[0] + cache * pr[1] + (u?.output_tokens ?? 0) * pr[2]) / 1e6;
            await db().insert(schema.aiUsage).values({ studentId: student.id, agente: "AGT-professora", modelo: model, tokensIn: u?.input_tokens ?? 0, tokensOut: u?.output_tokens ?? 0, tokensCache: cache, custoUsd: custo.toFixed(6), latenciaMs: Date.now() - t0 });
            await db().insert(schema.chatMessages).values({ studentId: student.id, studentProductId: pastaId ?? null, aulaAtual: aula ?? null, papel: "assistant", texto: resposta || "[sem resposta]", tokens: u?.total_tokens ?? 0, custo: custo.toFixed(6) });
          }
        }
      } catch (e) {
        log("error", "professora stream", { err: errMsg(e) });
        ctrl.enqueue(enc.encode(resposta ? "" : "Não consegui responder agora. Tente de novo em instantes."));
      } finally {
        ctrl.close();
      }
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}
