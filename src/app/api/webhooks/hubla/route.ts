import { handlePurchaseWebhook } from "@/lib/integrations/webhook-handler";
import { env } from "@/lib/env";
import { segredo } from "@/lib/server/segredos";

/** Webhook da Hubla: token de Admin → Chaves (ou HUBLA_WEBHOOK_SECRET na Vercel). */
export async function POST(req: Request) {
  return handlePurchaseWebhook("hubla", req, (await segredo("HUBLA_WEBHOOK_TOKEN")) ?? env().HUBLA_WEBHOOK_SECRET);
}
