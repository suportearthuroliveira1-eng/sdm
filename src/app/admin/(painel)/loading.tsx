/** Esqueleto mostrado na hora do clique enquanto a tela nova carrega. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-3.5 pt-3 lg:pt-0" aria-busy="true" aria-label="Carregando">
      <div className="skeleton h-4 w-28" />
      <div className="skeleton h-8 w-64" />
      <div className="skeleton h-24 w-full lg:max-w-3xl" />
      <div className="skeleton h-16 w-full lg:max-w-3xl" />
      <div className="skeleton h-16 w-full lg:max-w-3xl" />
    </div>
  );
}
