/**
 * pnpm db:seed — idempotente. Settings e agentes sempre; conteúdo só se
 * db/seed-data/conteudo.json existir (gerado dos docs do produto).
 */
import { existsSync, readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { AGENTS, PENDING_PROMPT } from "../db/seed-data/agents";
import { conteudoSeed } from "../db/seed-data/content-schema";
import { SETTINGS } from "../db/seed-data/settings";
import { scriptDb } from "./lib/db";

const { db, close, schema } = scriptDb();

async function main() {
  for (const s of SETTINGS) {
    await db
      .insert(schema.settings)
      .values({ key: s.key, value: s.value as object, grupo: s.grupo, descricao: s.descricao, pendente: s.pendente ?? false })
      .onConflictDoUpdate({ target: schema.settings.key, set: { descricao: s.descricao, grupo: s.grupo } }); // não sobrescreve valor
  }
  console.log(`settings: ${SETTINGS.length}`);

  for (const a of AGENTS) {
    await db
      .insert(schema.agents)
      .values({ id: a.id, versao: 1, nome: a.nome, modelo: `[${a.classe}]`, promptSistema: PENDING_PROMPT, maxTokens: a.maxTokens, ativo: false })
      .onConflictDoNothing();
  }
  console.log(`agentes: ${AGENTS.length} (prompts pendentes, inativos)`);

  const file = "db/seed-data/conteudo.json";
  if (!existsSync(file)) {
    console.warn(`AVISO: ${file} não existe. Aulas, módulos, glossário, vitrine e textos NÃO foram semeados.`);
    console.warn("       Coloque os docs em docs/ e gere o arquivo (ver docs/ESTADO.md, próximos passos).");
    return;
  }
  const c = conteudoSeed.parse(JSON.parse(readFileSync(file, "utf8")));
  await db.transaction(async (tx) => {
    for (const m of c.modules) await tx.insert(schema.modules).values(m).onConflictDoUpdate({ target: schema.modules.id, set: m });
    for (const l of c.lessons) await tx.insert(schema.lessons).values(l).onConflictDoUpdate({ target: schema.lessons.id, set: l });
    for (const g of c.glossary) await tx.insert(schema.glossary).values(g).onConflictDoUpdate({ target: schema.glossary.termo, set: g });
    const exemplo = await tx.select({ n: sql<number>`count(*)::int` }).from(schema.vitrineProducts);
    if ((exemplo[0]?.n ?? 0) === 0) {
      for (const v of c.vitrine) await tx.insert(schema.vitrineProducts).values({ ...v, exemplo: true });
    }
    for (const b of c.contentBlocks)
      await tx.insert(schema.contentBlocks).values({ key: b.key, kind: b.kind, data: b.data as object }).onConflictDoUpdate({ target: schema.contentBlocks.key, set: { kind: b.kind, data: b.data as object } });
  });
  console.log(`conteúdo (${c.fonte}): ${c.modules.length} módulos, ${c.lessons.length} aulas, ${c.glossary.length} termos, ${c.vitrine.length} produtos, ${c.contentBlocks.length} blocos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(close);
