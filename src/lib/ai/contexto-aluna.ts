import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { etapasDaPasta, type EstadoPasta, type TipoPasta } from "@/lib/domain/etapas";
import { guiaEtapa } from "@/lib/domain/explica-etapas";
import { liberadaNoOculto } from "@/lib/domain/pais-oculto";
import { textosApp } from "@/lib/server/config-app";
import { configOculto } from "@/lib/server/pais-oculto";
import { estadoDasPastas, hrefEtapa } from "@/lib/server/pastas";

/**
 * O que a Professora consulta sobre a aluna antes de responder: diagnóstico, caminho,
 * cada produto (o que já está pronto e o próximo passo), aulas vistas e onde ela parou.
 * Só dados dela (nunca de outra aluna). Texto curto, em tópicos.
 */
export async function contextoDaAluna(studentId: string): Promise<string> {
  const d = db();
  const student = await d.query.students.findFirst({ where: eq(schema.students.id, studentId) });
  if (!student) return "";
  const [diag, rows, aulasVistas, ultimas, tx, oculto, admin] = await Promise.all([
    d.query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, studentId), orderBy: desc(schema.diagnostics.versao) }),
    d.select().from(schema.studentProducts).where(eq(schema.studentProducts.studentId, studentId)).orderBy(schema.studentProducts.criadoEm),
    d.select({ n: sql<number>`count(*)::int` }).from(schema.lessonProgress).where(and(eq(schema.lessonProgress.studentId, studentId), sql`${schema.lessonProgress.vistaEm} is not null`)),
    d
      .select({ id: schema.lessons.id, t: schema.lessons.titulo })
      .from(schema.lessonProgress)
      .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonProgress.lessonId))
      .where(and(eq(schema.lessonProgress.studentId, studentId), sql`${schema.lessonProgress.vistaEm} is not null`))
      .orderBy(desc(schema.lessonProgress.vistaEm))
      .limit(3),
    textosApp(),
    configOculto(),
    student.authUserId ? d.query.adminUsers.findFirst({ where: eq(schema.adminUsers.authUserId, student.authUserId), columns: { id: true } }) : null,
  ]);
  const est = await estadoDasPastas(rows.map((r) => r.id));

  const linhas: string[] = [];
  linhas.push(`- Nome: ${student.nome.split(/\s+/)[0]}. Mora em: ${student.paisMora ?? "[não disse]"}. Idiomas: ${student.idiomas.join(", ") || "[não disse]"}.`);
  linhas.push(`- Primeiro acesso: ${student.diagnosticoEm ? "diagnóstico feito" : "diagnóstico AINDA NÃO feito"}; caminho escolhido: ${student.caminho ?? "ainda não escolheu"}.`);

  const r = (diag?.respostas ?? {}) as Record<string, unknown>;
  const res = diag?.resultado as { perfil?: string; pais_venda?: { k?: string }; caminho?: { valor?: string }; divulgacao?: { valor?: string } } | null;
  if (diag) {
    const v = (k: string) => (Array.isArray(r[k]) ? (r[k] as string[]).join(", ") : String(r[k] ?? "")) || "[—]";
    linhas.push(`- Diagnóstico: tempo ${v("tempo")}; verba ${v("verba")}; prefere ${v("preferencia")}; aparecer em vídeo: ${v("aparecer")}; assuntos ${v("assuntos")}; já vendeu: ${v("exp")}; medo: ${v("medo")}; quer: ${v("objetivo")}.`);
    if (res) linhas.push(`- O que a IA sugeriu: país ${res.pais_venda?.k ?? "[—]"}, caminho ${res.caminho?.valor ?? "[—]"}, divulgação ${res.divulgacao?.valor ?? "[—]"}.`);
  }

  if (!rows.length) linhas.push("- Produtos: nenhum ainda.");
  for (const p of rows) {
    const e = est.get(p.id);
    if (!e) continue;
    const estado: EstadoPasta = { tipo: p.tipo as TipoPasta, dados: (p.dados ?? {}) as Record<string, unknown>, divulgacao: p.divulgacao, ...e };
    const etapas = etapasDaPasta(estado, tx.etapas);
    const feitas = etapas.filter((x) => x.ok);
    const agora = etapas.find((x) => x.agora) ?? etapas.find((x) => !x.ok && !x.travada);
    const tipo = p.tipo === "sdm" ? "afiliada do SDM" : p.tipo === "proprio" ? "produto próprio (ebook)" : "afiliada de produto da vitrine";
    const dados = estado.dados as { ideia?: { nome_provisorio?: string }; oferta?: { preco?: { valor?: number; moeda?: string } }; oculto?: { nome?: string } };
    const extra = [
      dados.ideia?.nome_provisorio ? `ideia "${dados.ideia.nome_provisorio}"` : "",
      dados.oferta?.preco?.valor ? `preço ${dados.oferta.preco.moeda ?? ""} ${dados.oferta.preco.valor}` : "",
      p.paisVenda ? `vende pra ${p.paisVenda}` : "",
      p.divulgacao ? `divulgação ${p.divulgacao}` : "",
      dados.oculto?.nome ? `veio do País Oculto (${dados.oculto.nome})` : "",
    ].filter(Boolean).join("; ");
    linhas.push(`- Produto "${p.nome ?? p.code}" (${tipo}): ${feitas.length} de ${etapas.length} etapas prontas${extra ? `; ${extra}` : ""}.`);
    if (feitas.length) linhas.push(`  Prontas: ${feitas.map((x) => x.nome).join(", ")}.`);
    if (agora) {
      const g = guiaEtapa(p.tipo, agora.slug);
      linhas.push(`  Próximo passo: ${agora.nome} (abre em ${hrefEtapa(p.id, agora.slug)})${g ? ` — ${g.oQueE}` : ""}.`);
    }
    const travada = etapas.find((x) => x.travada && !x.ok);
    if (travada) linhas.push(`  Fechada por enquanto: ${travada.nome} (${travada.travada}).`);
  }

  linhas.push(`- Aulas vistas: ${aulasVistas[0]?.n ?? 0}${ultimas.length ? ` (últimas: ${ultimas.map((a) => `${a.id} ${a.t}`).join("; ")})` : ""}.`);
  const ut = student.ultimaTela as { titulo?: string } | null;
  if (ut?.titulo) linhas.push(`- Onde parou da última vez: ${ut.titulo}.`);
  linhas.push(`- País Oculto: ${liberadaNoOculto(oculto, studentId, Boolean(admin)) ? "liberado pra ela" : "não liberado"}.`);
  return linhas.join("\n");
}

/** Mapa do app pra Professora apontar o lugar certo (fixo; entra no cache da OpenAI). */
export const MAPA_DO_APP = `MAPA DO APP (use pra dizer onde tocar)
- Menu: Início (próximo passo e "continue de onde parou"), Produtos (as pastas: afiliada do SDM e produtos próprios), Aulas, Ocultos (País Oculto, área secreta liberada pelo time), Professora (você), Perfil (dados, trocar senha, refazer diagnóstico).
- Primeiro acesso: boas-vindas → combinado → diagnóstico (10 perguntas) → resultado da IA → escolher o caminho.
- Afiliada do SDM: Entenda → Pedir afiliação → Meu link → Kit de divulgação → Conta pra receber → Regras → Divulgação.
- Produto próprio (ebook): Entenda → Ideias de produto → Ficha do produto → Oferta → Idioma e país → Ebook → Revisão → Página de vendas → Plataforma de venda → Conta pra receber → Teste até a compra → Divulgação. Em "Entenda" dá pra tocar em "A IA faz tudo pra mim".
- Divulgação: Pago (base de anúncios, criativos, pixel, números) e/ou Orgânico (rede e perfil, roteiros, números).
- Cada etapa tem no topo "O que é ...?" com a explicação e, quando existe, a aula.`;
