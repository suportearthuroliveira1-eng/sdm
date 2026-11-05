import { handlePurchaseWebhook } from "@/lib/integrations/webhook-handler";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  return handlePurchaseWebhook("hubla", req, env().HUBLA_WEBHOOK_SECRET);
}
