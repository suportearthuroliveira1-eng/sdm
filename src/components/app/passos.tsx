/** Indicador "passo X de 5" do primeiro acesso. */
export function Passos({ atual, total = 5, rotulo }: { atual: number; total?: number; rotulo: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < atual ? "bg-accent" : "bg-line"}`} />
        ))}
      </div>
      <span className="mu font-semibold">Primeiro acesso · {rotulo} ({atual} de {total})</span>
    </div>
  );
}
