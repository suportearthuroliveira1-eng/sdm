import "server-only";
import { db, schema } from "@/lib/db";
import { modelo, openai } from "@/lib/ai/run";
import { getSetting } from "@/lib/server/settings";

/** Geração de imagem (OpenAI). Liga com OPENAI_API_KEY + settings.ai_models.image. */
export async function iaConfigurada(classe: "image" | "text_cheap" | "text_mid") {
  return Boolean(await modelo(classe));
}

const TAMANHO: Record<string, "1024x1024" | "1024x1536"> = { "1:1": "1024x1024", "4:5": "1024x1536", "9:16": "1024x1536" };

export async function gerarImagemIA(prompt: string, proporcao: string, studentId: string) {
  const model = await modelo("image");
  if (!model) throw new Error("imagem desligada");
  const qualidade = await getSetting<string>("image_quality_default", "low");
  const client = await openai();
  const t0 = Date.now();
  const r = await client.images.generate({ model, prompt, size: TAMANHO[proporcao] ?? "1024x1024", quality: qualidade as "low", n: 1 });
  const b64 = r.data?.[0]?.b64_json;
  if (!b64) throw new Error("sem imagem na resposta");
  const u = r.usage;
  await db().insert(schema.aiUsage).values({ studentId, agente: "imagem", modelo: model, tokensIn: u?.input_tokens ?? 0, tokensOut: u?.output_tokens ?? 0, latenciaMs: Date.now() - t0, custoUsd: "0" });
  const png = Buffer.from(b64, "base64");
  return { png: png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer, qualidade, custo: 0 };
}
