import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Chaves de serviços que o admin pode cadastrar pelo painel (tabela app_secrets,
 * só servidor). Ordem: banco (admin) → variável de ambiente (Vercel/.env.local).
 * O valor nunca vai pro navegador, pro log nem pra auditoria.
 */
export const SEGREDOS_EDITAVEIS = {
  OPENAI_API_KEY: { nome: "Chave da OpenAI", ajuda: "Liga toda a IA do app (diagnóstico, produto, ebook, anúncios, Professora, imagens). Começa com sk-.", prefixo: "sk-" },
  HUBLA_WEBHOOK_TOKEN: { nome: "Token do webhook da Hubla", ajuda: "Na Hubla: Integrações → Webhook → aba Autenticação → \"Hubla Webhook Token\". O app só aceita avisos de venda que chegam com esse token.", prefixo: "" },
  RESEND_API_KEY: { nome: "Chave do Resend (e-mail)", ajuda: "Envia o e-mail de acesso com a senha provisória pra quem comprou. Crie grátis em resend.com (API Keys). Começa com re_.", prefixo: "re_" },
} as const;
export type SegredoKey = keyof typeof SEGREDOS_EDITAVEIS;

const cache = new Map<string, { v: string | null; ate: number }>();

export async function segredo(k: SegredoKey): Promise<string | null> {
  const c = cache.get(k);
  if (c && c.ate > Date.now()) return c.v;
  let v: string | null = null;
  try {
    const row = await db().query.appSecrets.findFirst({ where: eq(schema.appSecrets.key, k) });
    v = row?.value || null;
  } catch {
    v = null; // tabela ainda não criada: cai pra variável de ambiente
  }
  v = v || process.env[k] || null;
  cache.set(k, { v, ate: Date.now() + 30_000 });
  return v;
}

export function limparCacheSegredos() {
  cache.clear();
}

/** Pra tela do admin: de onde vem e os 4 últimos caracteres. */
export async function statusSegredo(k: SegredoKey) {
  const row = await db().query.appSecrets.findFirst({ where: eq(schema.appSecrets.key, k) });
  const v = row?.value || process.env[k] || "";
  return { origem: row?.value ? ("admin" as const) : process.env[k] ? ("vercel" as const) : null, fim: v ? v.slice(-4) : null, atualizado: row?.updatedAt ?? null };
}
