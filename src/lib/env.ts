import "server-only";
import { z } from "zod";

/**
 * Variáveis de servidor. Lidas sob demanda (não no import) para o build
 * funcionar sem .env.local. Nunca logar valores.
 */
const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
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
  ACCESS_LINK_SECRET: z.string().min(32, "ACCESS_LINK_SECRET precisa de 32+ caracteres"),
  APP_URL: z.string().url(),
  ADMIN_EMAIL: z.string().email().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function env(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Variáveis de ambiente inválidas ou ausentes: ${missing}. Veja .env.example.`);
  }
  cached = parsed.data;
  return cached;
}

/** Só os nomes em uso (para docs/ESTADO.md). */
export const ENV_NAMES = Object.keys(serverSchema.shape);
