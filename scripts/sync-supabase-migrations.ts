/**
 * pnpm db:supabase — copia drizzle/*.sql para supabase/migrations/ no formato
 * da CLI do Supabase (`supabase db push`). Fonte da verdade: drizzle/ (gerado
 * do schema). O timestamp vem do _journal.json, então o nome é estável.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

type Journal = { entries: { idx: number; when: number; tag: string }[] };
const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as Journal;
mkdirSync("supabase/migrations", { recursive: true });

const ts = (ms: number) => new Date(ms).toISOString().replace(/[-:T]/g, "").slice(0, 14);

for (const e of journal.entries) {
  let sql = readFileSync(`drizzle/${e.tag}.sql`, "utf8").replaceAll("--> statement-breakpoint", "");
  // No Supabase as extensões ficam no schema "extensions" (que já está no search_path).
  sql = sql.replace("CREATE EXTENSION IF NOT EXISTS vector;", "CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;");
  const name = `supabase/migrations/${ts(e.when)}_${e.tag.replace(/^\d+_/, "")}.sql`;
  writeFileSync(name, `-- gerado de drizzle/${e.tag}.sql por pnpm db:supabase. Não edite aqui.\n${sql}`);
  console.log(name);
}
