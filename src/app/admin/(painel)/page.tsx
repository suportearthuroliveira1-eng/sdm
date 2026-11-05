import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { AdminHead } from "./head";

export const metadata = { title: "Visão geral" };

type Row = Record<string, number>;

// AD01 · Visão geral (protótipo). Todas as contagens vêm do banco.
export default async function AD01() {
  await requireAdmin();
  const [r] = (await db().execute(sql`
    WITH s AS (SELECT * FROM students WHERE ativo)
    SELECT
      (SELECT count(*) FROM s WHERE ultimo_acesso > now() - interval '7 days')::int AS ativas7,
      (SELECT count(DISTINCT d.student_id) FROM diagnostics d JOIN s ON s.id = d.student_id)::int AS diagnostico,
      (SELECT count(DISTINCT p.student_id) FROM student_products p JOIN s ON s.id = p.student_id WHERE p.publicado)::int AS funil,
      (SELECT count(*) FROM s WHERE trilha_pago)::int AS pago,
      (SELECT count(*) FROM s WHERE trilha_org)::int AS org,
      (SELECT count(DISTINCT p.student_id) FROM sales v JOIN student_products p ON p.id = v.student_product_id JOIN s ON s.id = p.student_id)::int AS venda,
      (SELECT count(DISTINCT e.student_id) FROM entitlements e JOIN s ON s.id = e.student_id WHERE e.produto = 'sdm')::int AS j_compra,
      (SELECT count(*) FROM s WHERE ultimo_acesso IS NOT NULL)::int AS j_login,
      (SELECT count(*) FROM s WHERE instalado_em IS NOT NULL)::int AS j_instalou,
      (SELECT count(DISTINCT p.student_id) FROM student_products p JOIN s ON s.id = p.student_id)::int AS j_pasta,
      (SELECT count(DISTINCT p.student_id) FROM student_products p JOIN s ON s.id = p.student_id WHERE (p.link_teste->>'ok')::boolean)::int AS j_link,
      (SELECT count(*) FROM s WHERE trilha_pago OR trilha_org)::int AS j_trilha,
      (SELECT count(DISTINCT p.student_id) FROM student_products p JOIN s ON s.id = p.student_id
        WHERE p.data_inicio_campanha IS NOT NULL OR EXISTS (SELECT 1 FROM metrics_entries m WHERE m.student_product_id = p.id))::int AS j_campanha
  `)).rows as unknown as Row[];
  const n = r ?? {};

  const kpis: [string, string, number][] = [
    ["ALUNAS ATIVAS", "Entraram nos últimos 7 dias", n.ativas7 ?? 0],
    ["COM DIAGNÓSTICO", "Fizeram a aula 0.5", n.diagnostico ?? 0],
    ["FUNIL NO AR", "Etapa 2 pronta", n.funil ?? 0],
    ["TRILHA PAGA", "Escolheram na 5.6", n.pago ?? 0],
    ["TRILHA ORGÂNICA", "Escolheram na 5.6", n.org ?? 0],
    ["1ª VENDA", "Registrada no App", n.venda ?? 0],
  ];
  const jornada: [string, number][] = [
    ["Compra", n.j_compra ?? 0],
    ["Login", n.j_login ?? 0],
    ["Instalou na tela", n.j_instalou ?? 0],
    ["Diagnóstico", n.diagnostico ?? 0],
    ["1ª pasta de produto", n.j_pasta ?? 0],
    ["Link de afiliada testado", n.j_link ?? 0],
    ["Funil no ar", n.funil ?? 0],
    ["Trilha escolhida", n.j_trilha ?? 0],
    ["Campanha ou 1º post", n.j_campanha ?? 0],
    ["1ª venda", n.venda ?? 0],
  ];
  const max = Math.max(1, ...jornada.map((j) => j[1]));

  return (
    <>
      <AdminHead id="AD01" t="Visão geral" d="Como as alunas estão andando" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
        {kpis.map(([k, d, v]) => (
          <div key={k} className="acd">
            <span className="kk">{k}</span>
            <span className="text-[26px] font-bold">{v}</span>
            <span className="mu text-[13px]">{d}</span>
          </div>
        ))}
      </div>
      <div className="acd">
        <span className="text-base font-bold">Jornada das alunas</span>
        <span className="mu text-[13px]">Quantas chegaram em cada passo.</span>
        {jornada.map(([label, v]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-[200px] shrink-0 text-[13px] sm:w-[260px]">{label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-[5px] bg-line" role="img" aria-label={`${label}: ${v}`}>
              <div className="h-full rounded-[5px] bg-accent" style={{ width: `${(v / max) * 100}%` }} />
            </div>
            <span className="mu w-[60px] text-right text-[13px]">{v}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3.5">
        <div className="acd"><span className="kk">AULAS COM MAIS ABANDONO</span><span className="mu text-[13px]">[as 3 aulas com menor % assistido na semana · entra com o player na Fase 2]</span></div>
        <div className="acd">
          <span className="kk">DÚVIDAS DA SEMANA</span>
          <span className="mu text-[13px]">[top 10 da professora, pago e orgânico separados · Fase 7]</span>
          <span aria-disabled="true" className="ab2 self-start opacity-50">Ver relatório</span>
        </div>
      </div>
    </>
  );
}
