import { Icone, type NomeIcone } from "@/components/ui/icone";

const ETAPAS: { t: string; icone: NomeIcone }[] = [
  { t: "Oi", icone: "pessoa" },
  { t: "Combinado", icone: "check" },
  { t: "Perguntas", icone: "ficha" },
  { t: "Resultado", icone: "cerebro" },
  { t: "Caminho", icone: "passos" },
];

/** Trilha do primeiro acesso: 5 bolinhas com ícone, a de agora pulsa, as feitas ficam com check. */
/** sub: andamento dentro do passo (ex.: pergunta 3 de 10): a linha anda até a próxima bolinha. */
export function Passos({ atual, total = 5, rotulo, sub }: { atual: number; total?: number; rotulo: string; sub?: { feitas: number; total: number } }) {
  const extra = sub && sub.total ? Math.min(1, sub.feitas / sub.total) : 0;
  return (
    <nav aria-label={`Primeiro acesso: ${rotulo}, passo ${atual} de ${total}`} className="flex flex-col gap-2">
      <ol className="relative m-0 flex list-none items-center justify-between p-0" aria-hidden>
        <span className="absolute inset-x-4 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-line" />
        <span className="absolute left-4 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-accent transition-[width] duration-700" style={{ width: `calc((100% - 2rem) * ${(atual - 1 + extra) / (total - 1)})` }} />
        {ETAPAS.slice(0, total).map((e, i) => {
          const feito = i < atual - 1;
          const agora = i === atual - 1;
          return (
            <li key={e.t} className="relative z-[1]">
              <span className={`grid size-9 place-items-center rounded-full border-2 transition-all duration-500 ${agora ? "pulsa scale-110 border-accent bg-accent text-accent-ink" : feito ? "border-accent bg-sel text-accent" : "border-line bg-bg text-muted"}`}>
                <Icone nome={feito ? "check" : e.icone} tamanho={16} espessura={feito ? 3 : 2} />
              </span>
            </li>
          );
        })}
      </ol>
      <span className="flex items-center justify-between gap-2 text-xs font-bold text-muted">
        <span>Passo {atual} de {total} · <span className="text-accent-2">{rotulo}</span></span>
        {sub ? <span className="rounded-full bg-sel px-2.5 py-0.5 text-accent-2">{Math.min(sub.feitas + 1, sub.total)} de {sub.total}</span> : null}
      </span>
    </nav>
  );
}
