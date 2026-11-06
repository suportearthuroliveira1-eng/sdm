import { AdminHead } from "../head";
import { requireAdmin } from "@/lib/auth/admin";
import { ETAPAS_DIVULGACAO_BASE, ETAPAS_ORG, ETAPAS_PAGO, ETAPAS_PROPRIO, ETAPAS_SDM } from "@/lib/domain/etapas";
import { BOAS_VINDAS_PADRAO, CAMINHOS_PADRAO, SDM_FAZ, VOCE_FAZ } from "@/lib/domain/textos-padrao";
import { configFluxo, textosApp } from "@/lib/server/config-app";
import { getSetting } from "@/lib/server/settings";
import { EditorFluxo, EditorTextos } from "./editor";

export const metadata = { title: "Fluxo e textos" };

/** Personalizar · regras do primeiro acesso e textos do app. */
export default async function AdminFluxo({ searchParams }: PageProps<"/admin/fluxo">) {
  await requireAdmin(["admin"]);
  const aba = (await searchParams).aba === "textos" ? "textos" : "regras";
  const [fluxo, tx, cad] = await Promise.all([configFluxo(), textosApp(), getSetting<boolean>("cadastro_aberto", true)]);
  const vistos = new Set<string>();
  const etapas = [
    ...ETAPAS_SDM.map((e) => ({ ...e, grupo: "Afiliada do SDM" })),
    ...ETAPAS_PROPRIO.map((e) => ({ ...e, grupo: "Produto próprio" })),
    ...ETAPAS_DIVULGACAO_BASE.map((e) => ({ ...e, grupo: "Divulgação" })),
    ...ETAPAS_PAGO.map((e) => ({ ...e, grupo: "Pago" })),
    ...ETAPAS_ORG.map((e) => ({ ...e, grupo: "Orgânico" })),
  ].filter((e) => (vistos.has(e.slug) ? false : (vistos.add(e.slug), true)));
  return (
    <section className="flex max-w-5xl flex-col gap-6">
      <AdminHead id="PERSONALIZAR" t="Fluxo e textos" d="Como a aluna entra no app e o que ela lê em cada tela. Muda na hora, sem deploy." />
      <nav className="flex gap-2" aria-label="Seções">
        {([["regras", "Regras do fluxo"], ["textos", "Textos"]] as const).map(([k, t]) => (
          <a key={k} href={`/admin/fluxo?aba=${k}`} aria-current={aba === k ? "page" : undefined} className={`flex min-h-11 items-center rounded-[10px] px-4 text-sm font-bold no-underline ${aba === k ? "bg-sel text-text" : "text-muted hover:text-text"}`}>
            {t}
          </a>
        ))}
      </nav>
      {aba === "regras" ? (
        <EditorFluxo fluxo={fluxo} cadastroAberto={cad !== false} />
      ) : (
        <EditorTextos inicial={tx} padroes={{ caminhos: CAMINHOS_PADRAO.map((c) => ({ ...c })), sdmFaz: SDM_FAZ, voceFaz: VOCE_FAZ, boasVindas: BOAS_VINDAS_PADRAO, etapas: etapas.map((e) => ({ slug: e.slug, nome: e.nome, entenda: e.entenda, grupo: e.grupo })) }} />
      )}
    </section>
  );
}
