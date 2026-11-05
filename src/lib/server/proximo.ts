import "server-only";
import type { getJornada } from "@/lib/server/aluna";
import type { PastaResumo } from "@/lib/server/pastas";
import { hrefEtapa } from "@/lib/server/pastas";

export type Proximo = { k: string; titulo: string; descricao: string; href: string; aula: string | null; pasta?: PastaResumo };

/** Regra 1 do app: o Início mostra UM próximo passo só. */
export function proximoPasso(j: Awaited<ReturnType<typeof getJornada>>, pastas: PastaResumo[]): Proximo {
  const s = j.student;
  if (!s.boasVindasEm) return { k: "boas", titulo: "Assistir o recado da Amanda", descricao: "Um vídeo curto pra você começar.", href: "/app/a04", aula: "0.1" };
  if (!s.combinadoEm) return { k: "comb", titulo: "Fazer o nosso combinado", descricao: "O que o SDM faz e o que você faz.", href: "/app/a07", aula: "0.6" };
  if (!s.diagnosticoEm) return { k: "diag", titulo: "Responder o diagnóstico", descricao: "8 perguntas rápidas. A IA usa pra sugerir o seu caminho.", href: "/app/a05", aula: null };
  const comPasta = pastas.filter((p) => p.tipo !== "vitrine" || p.etapas.length);
  if (!s.caminho || (s.caminho === "depois" && !comPasta.length)) {
    return { k: "caminho", titulo: "Escolher o seu caminho", descricao: "Afiliada do SDM, o seu produto com a IA, ou os dois.", href: "/app/caminho", aula: null };
  }
  const ativa = pastas.find((p) => p.id === s.produtoAtivo && p.tipo !== "vitrine") ?? pastas.find((p) => p.tipo !== "vitrine");
  if (ativa) {
    const et = ativa.etapas.find((e) => e.agora);
    if (et) return { k: `et-${et.slug}`, titulo: `${ativa.nome}: ${et.nome}`, descricao: et.entenda, href: hrefEtapa(ativa.id, et.slug), aula: et.aula ?? null, pasta: ativa };
    const travada = ativa.etapas.find((e) => !e.ok && e.travada);
    if (travada) return { k: `trav-${travada.slug}`, titulo: `${ativa.nome}: ${travada.nome}`, descricao: travada.travada!, href: `/app/p/${ativa.id}`, aula: travada.aula ?? null, pasta: ativa };
  }
  if (j.proxima) return { k: "aula", titulo: `Assistir a aula ${j.proxima.id}: ${j.proxima.titulo}`, descricao: j.proxima.agoraFacaTexto ? `Depois: ${j.proxima.agoraFacaTexto}` : "", href: `/app/l02/${encodeURIComponent(j.proxima.id)}`, aula: j.proxima.id };
  return { k: "fim", titulo: "Tudo em dia por aqui", descricao: "Volte amanhã: a rotina de hoje está feita.", href: "/app/v01", aula: null };
}
