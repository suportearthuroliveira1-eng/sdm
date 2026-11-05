import "server-only";
import { getSetting } from "@/lib/server/settings";
import { db, schema } from "@/lib/db";

/**
 * Ponte com a OpenAI (só servidor). Liga quando existir OPENAI_API_KEY e o
 * nome do modelo estiver preenchido no AD11 (settings.ai_models), nunca fixo no código.
 */
type Modelos = { text_cheap?: string; text_mid?: string; image?: string; embedding?: string };

export async function iaConfigurada(classe: keyof Modelos) {
  if (!process.env.OPENAI_API_KEY) return false;
  const m = await getSetting<Modelos>("ai_models", {});
  const nome = m[classe];
  return Boolean(nome && !nome.startsWith("["));
}

const TAMANHO: Record<string, string> = { "1:1": "1024x1024", "4:5": "1024x1536", "9:16": "1024x1536" };

export async function gerarImagemIA(prompt: string, proporcao: string, studentId: string) {
  const m = await getSetting<Modelos>("ai_models", {});
  const qualidade = await getSetting<string>("image_quality_default", "low");
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const t0 = Date.now();
  const r = await client.images.generate({ model: m.image!, prompt, size: TAMANHO[proporcao] as "1024x1024", quality: qualidade as "low", n: 1 });
  const b64 = r.data?.[0]?.b64_json;
  if (!b64) throw new Error("sem imagem na resposta");
  await db().insert(schema.aiUsage).values({ studentId, agente: "imagem", modelo: m.image!, latenciaMs: Date.now() - t0, custoUsd: "0" });
  const png = Buffer.from(b64, "base64");
  return { png: png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer, qualidade, custo: 0 };
}
