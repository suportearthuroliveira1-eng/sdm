"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { rateLimit } from "@/lib/server/rate-limit";

export type TicketState = { ok: boolean; error?: string };

const input = z.object({ email: z.string().trim().toLowerCase().email(), texto: z.string().trim().min(5).max(2000) });

export async function openAccessTicket(_p: TicketState, form: FormData): Promise<TicketState> {
  const parsed = input.safeParse({ email: form.get("email"), texto: form.get("texto") });
  if (!parsed.success) return { ok: false, error: "Confira o e-mail e escreva o que aconteceu." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = await rateLimit(`ticket:${ip}`, 5, 3600);
  if (!rl.ok) return { ok: false, error: "Você já mandou várias mensagens. Aguarde a resposta do time." };
  await db().insert(schema.supportTickets).values({ emailContato: parsed.data.email, texto: `[A02 sem acesso] ${parsed.data.texto}` });
  return { ok: true };
}
