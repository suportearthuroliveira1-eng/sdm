import { lt } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { inngest } from "./client";

/** Limpa links de acesso vencidos há mais de 30 dias e janelas de rate limit velhas. */
export const cleanupAccessLinks = inngest.createFunction(
  { id: "cleanup-access-links", triggers: [{ cron: "TZ=America/Sao_Paulo 15 3 * * *" }] },
  async ({ step }) => {
    const cutoff = new Date(Date.now() - 30 * 86400_000);
    const links = await step.run("apagar-links", async () => {
      const r = await db()
        .delete(schema.accessLinks)
        .where(lt(schema.accessLinks.expiresAt, cutoff))
        .returning({ jti: schema.accessLinks.jti });
      return r.length;
    });
    const rl = await step.run("apagar-rate-limits", async () => {
      const r = await db().delete(schema.rateLimits).where(lt(schema.rateLimits.windowStart, new Date(Date.now() - 86400_000))).returning({ k: schema.rateLimits.key });
      return r.length;
    });
    return { links, rl };
  },
);

export const functions = [cleanupAccessLinks];
