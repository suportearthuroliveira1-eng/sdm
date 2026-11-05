import { Screen } from "@/components/ui/screen";

export const metadata = { title: "Sem internet" };

export default function Offline() {
  return (
    <Screen id="OFFLINE">
      <div className="mt-10">
        <h1 className="text-[26px] font-bold">Sem internet agora</h1>
        <p className="mt-2 text-muted">O que você já fez está salvo. Quando a conexão voltar, é só abrir o app de novo.</p>
      </div>
    </Screen>
  );
}
