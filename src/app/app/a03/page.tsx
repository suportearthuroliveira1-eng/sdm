import type { Metadata } from "next";
import { Screen } from "@/components/ui/screen";
import { InstallGuide } from "@/components/pwa/install-guide";

export const metadata: Metadata = { title: "Instalar na tela do celular" };

// A03 · Instalar (protótipo).
export default function A03() {
  return (
    <Screen id="A03" head={{ k: "Acesso", t: "Instalar na tela do celular" }} back="/app/a01">
      <p className="tx">Instalado, o SDM abre pelo ícone na tela do celular, como um app. Você não precisa procurar o link de novo.</p>
      <InstallGuide />
    </Screen>
  );
}
