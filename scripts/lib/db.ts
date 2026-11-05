// Conexão para scripts (fora do Next; não usa "server-only").
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/lib/db/schema";

config({ path: ".env.local" });

export function scriptDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definido (.env.local)");
  const client = postgres(url, { prepare: false, max: 1 });
  return { db: drizzle(client, { schema }), close: () => client.end(), schema };
}
