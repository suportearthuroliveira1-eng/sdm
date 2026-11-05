export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in flex flex-1 flex-col gap-4">{children}</div>;
}
