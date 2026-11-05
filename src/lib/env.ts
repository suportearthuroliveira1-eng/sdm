import "server-only";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./public-config";

/**
 * Variáveis de servidor. Lidas sob demanda (não no import) para o build
 * funcionar sem .env.local. Nunca logar valores.
 */
const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default(SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default(SUPABASE_PUBLISHABLE_KEY),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  TRACKING_API_KEY: z.string().optional(),
  HUBLA_WEBHOOK_SECRET: z.string().optional(),
  HOTMART_WEBHOOK_SECRET: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  WHATSAPP_PROVIDER: z.string().default("log"),
  WHATSAPP_API_KEY: z.string().optional(),
  ACCESS_LINK_SECRET: z.string().min(32, "ACCESS_LINK_SECRET precisa de 32+ caracteres").optional(),
  APP_URL: z.string().url().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
});

type Parsed = z.infer<typeof serverSchema>;
export type ServerEnv = Parsed & { ACCESS_LINK_SECRET: string; APP_URL: string };

/**
 * Sem ACCESS_LINK_SECRET: deriva um segredo da chave secret do Supabase
 * (HMAC). Trocar a chave secret invalida os links pendentes (geram-se de novo).
 */
export function deriveAccessSecret(serviceKey: string) {
  return createHmac("sha256", serviceKey).update("sdm-access-link-v1").digest("hex");
}

/** Sem APP_URL: domínio de produção da Vercel, depois o do deploy, depois localhost. */
export function resolveAppUrl(e: Record<string, string | undefined>) {
  if (e.APP_URL) return e.APP_URL.replace(/\/$/, "");
  if (e.VERCEL_PROJECT_PRODUCTION_URL) return `https://${e.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (e.VERCEL_URL) return `https://${e.VERCEL_URL}`;
  return "http://localhost:3000";
}

let cached: ServerEnv | null = null;

export function env(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Variáveis de ambiente inválidas ou ausentes: ${missing}. Veja .env.example.`);
  }
  cached = {
    ...parsed.data,
    ACCESS_LINK_SECRET: parsed.data.ACCESS_LINK_SECRET ?? deriveAccessSecret(parsed.data.SUPABASE_SERVICE_ROLE_KEY),
    APP_URL: resolveAppUrl(process.env),
  };
  return cached;
}

/** Só os nomes em uso (para docs/ESTADO.md). */
export const ENV_NAMES = Object.keys(serverSchema.shape);
