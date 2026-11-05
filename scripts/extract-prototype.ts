/**
 * pnpm docs:extract — lê o bloco <script type="text/x-dc"> dos protótipos
 * (docs/prototipo/App.dc.html e Admin.dc.html) e grava as variáveis
 * (MODS, VIT, LG, PT, DIAG, GLOSS, CKDEF, PASSOS, INFODEF, ENT, HEAD...) em
 * db/seed-data/prototipo-raw.json, para depois mapear em conteudo.json.
 * O formato exato do bloco ainda não foi visto: o script tenta avaliar como JS
 * num sandbox sem acesso a nada e, se falhar, grava o texto bruto.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const files = ["docs/prototipo/App.dc.html", "docs/prototipo/Admin.dc.html"];
const out: Record<string, unknown> = {};
for (const f of files) {
  if (!existsSync(f)) {
    console.warn(`não encontrado: ${f}`);
    continue;
  }
  const html = readFileSync(f, "utf8");
  const blocks = [...html.matchAll(/<script[^>]*type=["']text\/x-dc["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1] ?? "");
  blocks.forEach((code, i) => {
    const key = `${f}#${i}`;
    try {
      const names = [...code.matchAll(/^(?:const|let|var)\s+([A-Z][A-Z0-9_]*)\s*=/gm)].map((m) => m[1]!);
      const ctx = vm.createContext({ DCLogic: class {}, console });
      vm.runInContext(`${code}\n;globalThis.__out = {${names.join(",")}}`, ctx, { timeout: 2000 });
      out[key] = (ctx as { __out?: unknown }).__out;
      console.log(`${key}: ${names.join(", ")}`);
    } catch (e) {
      out[key] = { raw: code, erro: e instanceof Error ? e.message : String(e) };
      console.warn(`${key}: não deu pra avaliar, texto bruto salvo`);
    }
  });
}
writeFileSync("db/seed-data/prototipo-raw.json", JSON.stringify(out, null, 2));
console.log("gravado db/seed-data/prototipo-raw.json");
