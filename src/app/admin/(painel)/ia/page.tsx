import { desc, sql } from "drizzle-orm";
import { AdminHead } from "../head";
import { AGENTES, type AgenteKey } from "@/lib/ai/agentes";
import { PROFESSORA_PADRAO } from "@/lib/ai/professora";
import { REGRAS_BASE } from "@/lib/ai/regras";
import { configIa } from "@/lib/ai/run";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { getSetting } from "@/lib/server/settings";
import { statusSegredo } from "@/lib/server/segredos";
import { EditorIa, type AgenteView } from "./editor";

export const metadata = { title: "IA" };

/** Personalizar · IA: modelos, limites, regras base, Professora e cada agente (prompt com versões). */
export default async function AdminIa() {
  await requireAdmin(["admin"]);
  const [cfg, modelos, qIa, qProf, versoes, uso, chave] = await Promise.all([
    configIa(),
    getSetting<Record<string, string>>("ai_models", {}),
    getSetting<number | null>("quota_ia_dia", null),
    getSetting<number | null>("quota_professora_dia", null),
    db().select({ id: schema.agents.id, versao: schema.agents.versao, ativo: schema.agents.ativo, texto: schema.agents.promptSistema, em: schema.agents.createdAt }).from(schema.agents).orderBy(desc(schema.agents.versao)),
    db()
      .select({ agente: schema.aiUsage.agente, n: sql<number>`count(*)::int`, custo: sql<number>`coalesce(sum(${schema.aiUsage.custoUsd}),0)::float`, cache: sql<number>`count(*) filter (where ${schema.aiUsage.cacheHit})::int` })
      .from(schema.aiUsage)
      .where(sql`${schema.aiUsage.ts} > now() - interval '7 days'`)
      .groupBy(schema.aiUsage.agente),
    statusSegredo("OPENAI_API_KEY"),
  ]);
  const usoDe = (id: string) => uso.find((u) => u.agente === id) ?? { n: 0, custo: 0, cache: 0 };
  const agentes: AgenteView[] = (Object.keys(AGENTES) as AgenteKey[]).map((k) => {
    const a = AGENTES[k];
    const vs = versoes.filter((v) => v.id === a.id && !v.texto.startsWith("[PENDENTE]"));
    const ativa = vs.find((v) => v.ativo);
    return {
      k,
      nome: a.nome,
      classe: a.classe,
      maxTokens: a.maxTokens,
      padrao: a.tarefa,
      atual: ativa?.texto ?? a.tarefa,
      versaoAtiva: ativa?.versao ?? null,
      versoes: vs.map((v) => ({ versao: v.versao, em: v.em.toISOString(), ativo: v.ativo })),
      uso: usoDe(a.id),
    };
  });
  const total = uso.reduce((s, u) => s + Number(u.custo), 0);
  const usoProf = usoDe("AGT-professora");
  return (
    <section className="flex max-w-5xl flex-col gap-6">
      <AdminHead id="PERSONALIZAR" t="Inteligência artificial" d="O que cada IA faz, com que modelo e com que regras. Mudou o texto, as próximas respostas já seguem.">
        <div className="flex flex-col items-end gap-1 text-right">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${chave.origem ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn-text"}`}>{chave.origem ? `OpenAI ligada · termina em ${chave.fim}` : "OpenAI desligada"}</span>
          <span className="text-xs text-muted">Últimos 7 dias: US$ {total.toFixed(2)}</span>
        </div>
      </AdminHead>
      <EditorIa
        cfg={cfg}
        modelos={{ text_cheap: modelos.text_cheap ?? "", text_mid: modelos.text_mid ?? "", image: modelos.image ?? "", embedding: modelos.embedding ?? "" }}
        quotas={{ ia: qIa ?? 200, prof: qProf ?? 40 }}
        regrasPadrao={REGRAS_BASE}
        professoraPadrao={PROFESSORA_PADRAO}
        agentes={agentes}
        usoProfessora={usoProf}
      />
    </section>
  );
}
