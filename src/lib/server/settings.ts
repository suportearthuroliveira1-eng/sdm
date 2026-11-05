import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db().query.settings.findFirst({ where: eq(schema.settings.key, key) });
  return (row?.value as T | undefined) ?? fallback;
}

export async function getFlag(key: string): Promise<boolean> {
  return (await getSetting<boolean>(key, false)) === true;
}
