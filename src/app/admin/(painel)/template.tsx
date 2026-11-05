/** Remonta a cada navegação: a tela nova entra com um leve fade. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
