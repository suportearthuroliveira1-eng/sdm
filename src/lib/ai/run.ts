import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { z } from "zod";
import { db, schema } from "@/lib/db";
import { getSetting } from "@/lib/server/settings";
import { errMsg, log } from "@/lib/server/log";
import { rateLimit } from "@/lib/server/rate-limit";
import { segredo } from "@/lib/server/segredos";
import { AGENTES, type AgenteKey, type Classe } from "./agentes";
import { REGRAS_BASE } from "./regras";

export class IaDesligada extends Error {
  constructor() {
    super("IA desligada: falta a chave da OpenAI (admin → Chaves) ou o nome do modelo nas configurações.");
  }
}
export class IaLimite extends Error {}

type Modelos = { text_cheap?: string; text_mid?: string; image?: string; embedding?: string };
/** Preço por 1M tokens (entrada, entrada em cache, saída) em US$. Editável em settings.ai_prices. */
type Precos = Record<string, [number, number, number]>;
const PRECOS_PADRAO: Precos = {
  "gpt-6-luna": [0.1, 0.01, 0.5],
  "gpt-6.1-terra": [1, 0.05, 5],
  "gpt-5-nano": [0.05, 0.005, 0.4],
  "gpt-5-mini": [0.25, 0.025, 2],
};

export async function modelo(classe: Classe | "image" | "embedding"): Promise<string | null> {
  if (!(await segredo("OPENAI_API_KEY"))) return null;
  const m = await getSetting<Modelos>("ai_models", {});
  const nome = m[classe];
  return nome && !nome.startsWith("[") ? nome : null;
}

export async function iaLigada(classe: Classe = "text_cheap") {
  return Boolean(await modelo(classe));
}

let cliente: { chave: string; c: import("openai").default } | null = null;
export async function openai() {
  const chave = await segredo("OPENAI_API_KEY");
  if (!chave) throw new IaDesligada();
  if (!cliente || cliente.chave !== chave) {
    const { default: OpenAI } = await import("openai");
    cliente = { chave, c: new OpenAI({ apiKey: chave, timeout: 90_000, maxRetries: 1 }) };
  }
  return cliente.c;
}

/** Prompt de sistema: regras base (fixas) + tarefa do agente (versão ativa no banco, senão a do código). */
async function promptDoAgente(key: AgenteKey) {
  const a = AGENTES[key];
  const row = await db().query.agents.findFirst({
    where: and(eq(schema.agents.id, a.id), eq(schema.agents.ativo, true)),
    orderBy: desc(schema.agents.versao),
  });
  const tarefaBanco = row && !row.promptSistema.startsWith("[PENDENTE]") ? row.promptSistema : null;
  return { versao: row?.versao ?? 0, texto: `${REGRAS_BASE}\n\n${tarefaBanco ?? a.tarefa}`, temperatura: row?.temperatura ?? null };
}

function custo(model: string, precos: Precos, u: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } } | undefined) {
  const p = precos[model];
  if (!p || !u) return 0;
  const cache = u.input_tokens_details?.cached_tokens ?? 0;
  return (((u.input_tokens ?? 0) - cache) * p[0] + cache * p[1] + (u.output_tokens ?? 0) * p[2]) / 1_000_000;
}

/**
 * Roda um agente com saída estruturada (JSON Schema + Zod).
 * - Cache: mesma entrada → resposta do banco, sem chamar a API (use `semCache` pra "gerar de novo").
 * - Checagem: se o modelo marcar alguma regra como não cumprida, refaz 1 vez.
 * - Registra tokens, cache e custo em ai_usage.
 */
export async function rodar<K extends AgenteKey>(
  key: K,
  entrada: Record<string, unknown>,
  opts: { studentId: string | null; semCache?: boolean },
): Promise<{ saida: z.infer<(typeof AGENTES)[K]["schema"]>; doCache: boolean; custoUsd: number; modelo: string; agente: string }> {
  const a = AGENTES[key];
  const model = await modelo(a.classe);
  if (!model) throw new IaDesligada();
  if (opts.studentId) {
    const limite = await getSetting<number | null>("quota_ia_dia", null);
    const rl = await rateLimit(`ia:${opts.studentId}`, typeof limite === "number" && limite > 0 ? limite : 200, 86400);
    if (!rl.ok) throw new IaLimite(`Você usou a IA bastante hoje. Ela volta às ${rl.retryAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}.`);
  }
  const p = await promptDoAgente(key);
  const entradaTxt = JSON.stringify(entrada);
  const hash = createHash("sha256").update(`${key}|${a.id}|${p.versao}|${model}|${entradaTxt}`).digest("hex");

  if (!opts.semCache) {
    const hit = await db().query.aiCache.findFirst({ where: eq(schema.aiCache.hash, hash) });
    if (hit) {
      await db().insert(schema.aiUsage).values({ studentId: opts.studentId, agente: a.id, modelo: model, cacheHit: true, custoUsd: "0" });
      return { saida: hit.saida as z.infer<(typeof AGENTES)[K]["schema"]>, doCache: true, custoUsd: 0, modelo: model, agente: a.id };
    }
  }

  const client = await openai();
  const { zodTextFormat } = await import("openai/helpers/zod");
  const precos = { ...PRECOS_PADRAO, ...(await getSetting<Precos>("ai_prices", {})) };
  let total = 0;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const t0 = Date.now();
    try {
      const r = await client.responses.parse({
        model,
        instructions: p.texto,
        input: `ENTRADA (JSON):\n${entradaTxt}${tentativa ? "\n\nATENÇÃO: a tentativa anterior não cumpriu todas as regras. Refaça cumprindo todas." : ""}`,
        text: { format: zodTextFormat(a.schema, key) },
        max_output_tokens: a.maxTokens + 2000, // folga pro raciocínio
        reasoning: { effort: "low" },
        prompt_cache_key: `sdm-${a.id}`,
      });
      const u = r.usage;
      const c = custo(model, precos, u);
      total += c;
      await db().insert(schema.aiUsage).values({
        studentId: opts.studentId,
        agente: a.id,
        modelo: model,
        tokensIn: u?.input_tokens ?? 0,
        tokensOut: u?.output_tokens ?? 0,
        tokensCache: u?.input_tokens_details?.cached_tokens ?? 0,
        custoUsd: c.toFixed(6),
        latenciaMs: Date.now() - t0,
      });
      const saida = r.output_parsed;
      if (!saida) throw new Error(`resposta vazia (${r.status})`);
      const ch = (saida as { checagem?: Record<string, boolean> }).checagem;
      const falhou = ch && Object.values(ch).some((v) => v === false);
      if (falhou && tentativa === 0) continue;
      await db().insert(schema.aiCache).values({ hash, agente: a.id, versao: p.versao, saida: saida as object }).onConflictDoUpdate({ target: schema.aiCache.hash, set: { saida: saida as object } });
      return { saida: saida as z.infer<(typeof AGENTES)[K]["schema"]>, doCache: false, custoUsd: total, modelo: model, agente: a.id };
    } catch (e) {
      log("error", "agente falhou", { agente: a.id, tentativa, err: errMsg(e) });
      if (tentativa === 1) throw e;
    }
  }
  throw new Error("a IA não respondeu no formato esperado");
}

/** Mensagem amigável pra mostrar na tela. */
export function erroIa(e: unknown): string {
  if (e instanceof IaDesligada) return "A IA ainda não está ligada neste app (falta a chave da OpenAI). Fale com o time.";
  if (e instanceof IaLimite) return e.message;
  return "A IA não conseguiu responder agora. Tente de novo em instantes.";
}
