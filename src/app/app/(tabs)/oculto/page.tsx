import type { Metadata } from "next";
import { PaisOcultoApp, type Estrategia, type ProdutoOculto } from "@/components/oculto/oculto-app";
import { PreviaOculto } from "@/components/oculto/previa";
import { requireStudent } from "@/lib/auth/session";
import { CATALOGO_OCULTO, catalogoAtivo, escassez, type DadosOculto } from "@/lib/domain/pais-oculto";
import { faixa, PRECOS_PADRAO, type FaixaPreco, type Moeda } from "@/lib/domain/precos";
import { tabelaPrecos } from "@/lib/server/config-app";
import { marcarOndeParou } from "@/lib/server/onde-parou";
import { podeEntrarNoOculto } from "@/lib/server/pais-oculto";
import { hrefEtapa, minhasPastas } from "@/lib/server/pastas";

export const metadata: Metadata = { title: "Países Ocultos" };

// Aba do País Oculto. Liberada: tudo acontece aqui (mapa, estratégia, plano, PDF, produtos).
// Sem acesso: prévia com o castelo trancado, escassez real (vagas/prazo do admin) e o checkout.
export default async function PaisOculto() {
  const { student } = await requireStudent();
  const { cfg, pode } = await podeEntrarNoOculto(student.id);
  const dados = (((student.cartoes ?? {}) as { oculto?: DadosOculto }).oculto ?? {}) as DadosOculto;
  const primeiro = student.nome.split(/\s+/)[0] ?? "";

  if (!pode) {
    const e = escassez(cfg.venda, cfg.alunas.length, new Date());
    return (
      <div className="flex flex-col gap-4 pt-3 lg:max-w-3xl lg:pt-0">
        <PreviaOculto
          nome={primeiro}
          convite={cfg.convite}
          preco={cfg.venda.preco}
          checkoutUrl={cfg.venda.checkoutUrl}
          encerrada={e.encerrada}
          restantes={e.restantes}
          vagas={e.vagas}
          prazo={e.prazo}
          jaAvisada={Boolean(dados.interesse)}
          amostra={CATALOGO_OCULTO.filter((c) => ["portugal", "irlanda", "nz"].includes(c.k)).map((c) => ({ sigla: c.sigla, nome: c.nome, cor: c.cor }))}
        />
      </div>
    );
  }

  const [tabela, pastas] = await Promise.all([tabelaPrecos(), minhasPastas()]);
  const precos = Object.fromEntries((Object.keys(PRECOS_PADRAO) as Moeda[]).map((m) => [m, faixa(m, tabela)])) as Record<Moeda, FaixaPreco>;
  const produtos: ProdutoOculto[] = pastas
    .filter((p) => (p.estado.dados as { oculto?: unknown }).oculto)
    .map((p) => {
      const o = (p.estado.dados as { oculto: { k: string; nome: string } }).oculto;
      const agora = p.etapas.find((e) => e.agora) ?? p.etapas.find((e) => !e.ok && !e.travada) ?? null;
      return { id: p.id, k: o.k, nome: p.nome, pais: o.nome, feitas: p.etapas.filter((e) => e.ok).length, total: p.etapas.length, agora: agora ? { nome: agora.nome, href: hrefEtapa(p.id, agora.slug) } : null };
    });
  await marcarOndeParou(student.id, { path: "/app/oculto", titulo: "Países Ocultos", tipo: "etapa" });
  return (
    <div className="flex flex-col gap-4 pt-3 lg:max-w-4xl lg:pt-0">
      <PaisOcultoApp
        nome={primeiro}
        catalogo={catalogoAtivo(cfg)}
        jaAbriu={Boolean(dados.abertoEm)}
        mapa={dados.mapa ?? null}
        estrategias={(dados.estrategias ?? {}) as Record<string, Estrategia>}
        precos={precos}
        planos={dados.plano ?? {}}
        produtos={produtos}
      />
    </div>
  );
}
