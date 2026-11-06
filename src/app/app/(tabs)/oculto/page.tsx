import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaisOcultoApp, type Estrategia } from "@/components/oculto/oculto-app";
import { requireStudent } from "@/lib/auth/session";
import { catalogoAtivo, liberadaNoOculto, type DadosOculto } from "@/lib/domain/pais-oculto";
import { faixa, PRECOS_PADRAO, type FaixaPreco, type Moeda } from "@/lib/domain/precos";
import { tabelaPrecos } from "@/lib/server/config-app";
import { marcarOndeParou } from "@/lib/server/onde-parou";
import { configOculto } from "@/lib/server/pais-oculto";

export const metadata: Metadata = { title: "País Oculto" };

// Área secreta: só quem o time liberou (Admin → País Oculto). Pra quem não tem, a página nem existe.
export default async function PaisOculto() {
  const { student } = await requireStudent();
  const cfg = await configOculto();
  if (!liberadaNoOculto(cfg, student.id)) notFound();
  const dados = (((student.cartoes ?? {}) as { oculto?: DadosOculto }).oculto ?? {}) as DadosOculto;
  const tabela = await tabelaPrecos();
  const precos = Object.fromEntries((Object.keys(PRECOS_PADRAO) as Moeda[]).map((m) => [m, faixa(m, tabela)])) as Record<Moeda, FaixaPreco>;
  await marcarOndeParou(student.id, { path: "/app/oculto", titulo: "País Oculto", tipo: "etapa" });
  return (
    <div className="flex flex-col gap-4 pt-3 lg:max-w-4xl lg:pt-0">
      <PaisOcultoApp
        nome={student.nome.split(/\s+/)[0] ?? ""}
        catalogo={catalogoAtivo(cfg)}
        jaAbriu={Boolean(dados.abertoEm)}
        mapa={dados.mapa ?? null}
        estrategias={(dados.estrategias ?? {}) as Record<string, Estrategia>}
        precos={precos}
      />
    </div>
  );
}
