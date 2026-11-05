import type { Metadata } from "next";
import { Screen } from "@/components/ui/screen";
import { InstallGuide } from "@/components/pwa/install-guide";

export const metadata: Metadata = { title: "Instalar o app" };

// A03 · Instalar (iPhone e Android).
export default function A03() {
  return (
    <Screen id="A03" back="/app">
      <div className="mt-6 mb-6">
        <h1 className="text-[26px] font-bold leading-tight">Coloque o app na sua tela</h1>
        <p className="mt-2 text-muted">Assim ele abre como um aplicativo e pode te avisar da rotina.</p>
      </div>
      <InstallGuide />
    </Screen>
  );
}
