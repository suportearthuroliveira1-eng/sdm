import { sql } from "drizzle-orm";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { PRODUCT_LABEL, type Product } from "@/lib/domain/entitlements";
import { AdminHead } from "../head";
import { ImportCsvForm, NewStudentForm } from "./forms";

export const metadata = { title: "Alunas" };

const FILTROS = {
  todas: "Todas",
  sem7: "Sem acesso há 7 dias",
  semfunil: "Sem funil",
  venda: "Com venda",
} as const;
type Filtro = keyof typeof FILTROS;

type Linha = {
  id: string;
  code: string;
  nome: string;
  email: string;
  pais: string | null;
  ativo: boolean;
  trilha_pago: boolean;
  trilha_org: boolean;
  acessos: Product[] | null;
  funil: string | null;
  publicado: boolean | null;
};

const FUNIL: Record<string, string> = { pre: "pré-venda", quiz: "quiz", direto: "direto" };

// AD02 · Alunas (protótipo): busca, filtros, tabela; + nova aluna e CSV (prompt seção 3).
export default async function AD02({ searchParams }: PageProps<"/admin/alunas">) {
  await requireAdmin(["suporte"]);
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const f: Filtro = (Object.keys(FILTROS) as Filtro[]).find((k) => k === sp.f) ?? "todas";
  const like = `%${q.replace(/[%_\\]/g, "")}%`;

  const rows = (await db().execute(sql`
    SELECT s.id, s.code, s.nome, s.email, s.pais_mora AS pais, s.ativo, s.trilha_pago, s.trilha_org,
      (SELECT array_agg(e.produto ORDER BY e.produto) FROM entitlements e WHERE e.student_id = s.id AND e.status = 'active') AS acessos,
      p.funil, p.publicado
    FROM students s
    LEFT JOIN student_products p ON p.id = s.produto_ativo
    WHERE (${q} = '' OR s.nome ILIKE ${like} OR s.email ILIKE ${like} OR s.code ILIKE ${like})
      AND (${f} <> 'sem7' OR s.ultimo_acesso IS NULL OR s.ultimo_acesso < now() - interval '7 days')
      AND (${f} <> 'semfunil' OR NOT EXISTS (SELECT 1 FROM student_products x WHERE x.student_id = s.id AND x.publicado))
      AND (${f} <> 'venda' OR EXISTS (SELECT 1 FROM sales v JOIN student_products x ON x.id = v.student_product_id WHERE x.student_id = s.id))
    ORDER BY s.criado_em DESC
    LIMIT 200
  `)) as unknown as Linha[];

  const trilha = (r: Linha) => (r.trilha_pago && r.trilha_org ? "Pago + orgânico" : r.trilha_pago ? "Pago" : r.trilha_org ? "Orgânico" : "a escolher");
  const href = (k: Filtro) => `/admin/alunas?${new URLSearchParams({ ...(q ? { q } : {}), f: k })}`;

  return (
    <>
      <AdminHead id="AD02" t="Alunas" d="Busca e filtros" />
      <form role="search" className="flex flex-wrap gap-2.5">
        <label htmlFor="bs" className="sr-only">Buscar aluna</label>
        <input id="bs" name="q" type="search" defaultValue={q} placeholder="Buscar por nome, e-mail ou ALN" className="ain flex-[1_1_260px]" />
        <input type="hidden" name="f" value={f} />
        <button className="ab2">Buscar</button>
      </form>
      <nav aria-label="Filtros" className="flex flex-wrap gap-2.5">
        {(Object.keys(FILTROS) as Filtro[]).map((k) => (
          <Link key={k} href={href(k)} aria-current={f === k ? "true" : undefined} className={`ab2 no-underline ${f === k ? "border-accent bg-sel" : ""}`}>
            {FILTROS[k]}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["ID", "Aluna", "País", "Trilha", "Onde está", "Funil", "Acessos", ""].map((h) => (
                <th key={h} className="whitespace-nowrap border-b border-line px-3 py-2.5 text-left font-semibold text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="mu p-3 text-[13px]">Nenhuma aluna {q || f !== "todas" ? "encontrada" : "cadastrada ainda"}.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="mu border-b border-line-3 p-3 align-top text-[13px]">{r.code}</td>
                  <td className="border-b border-line-3 p-3 align-top font-semibold">{r.nome}{r.ativo ? null : <span className="ml-2 text-xs font-normal text-danger">desativada</span>}<br /><span className="mu font-normal">{r.email}</span></td>
                  <td className="border-b border-line-3 p-3 align-top">{r.pais ?? "—"}</td>
                  <td className="border-b border-line-3 p-3 align-top">{trilha(r)}</td>
                  <td className="mu border-b border-line-3 p-3 align-top">[—]</td>
                  <td className="border-b border-line-3 p-3 align-top">{r.funil ? `${FUNIL[r.funil] ?? r.funil}${r.publicado ? " no ar" : ""}` : "—"}</td>
                  <td className="border-b border-line-3 p-3 align-top">{r.acessos?.map((a) => PRODUCT_LABEL[a]).join(", ") || "—"}</td>
                  <td className="border-b border-line-3 p-3 align-top"><Link href={`/admin/alunas/${r.id}`} className="ab2 no-underline">Abrir</Link></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <span className="mu text-[13px]">&quot;Onde está&quot; (etapa da jornada) passa a aparecer quando as etapas do app existirem (Fase 2–3).</span>

      <div className="grid gap-3.5 xl:grid-cols-2">
        <NewStudentForm />
        <ImportCsvForm />
      </div>
    </>
  );
}
