import { handlePurchaseWebhook } from "@/lib/integrations/webhook-handler";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  return handlePurchaseWebhook("hotmart", req, env().HOTMART_WEBHOOK_SECRET);
}
