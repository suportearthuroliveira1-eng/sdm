import type { Metadata } from "next";
import { Screen } from "@/components/ui/screen";
import { ResendForm, SupportBox } from "./forms";

export const metadata: Metadata = { title: "Não recebi meu acesso" };

// A02 · Sem acesso (protótipo: reenviar + falar com o time).
export default function A02() {
  return (
    <Screen id="A02" head={{ k: "Acesso", t: "Não recebi meu acesso" }} back="/app/a01">
      <p className="tx">O acesso chega no seu WhatsApp logo depois da compra, com um link que já entra no app. Se não chegou, a gente reenvia.</p>
      <ResendForm />
      <SupportBox />
    </Screen>
  );
}
