import { AdminHead } from "../head";
import { requireAdmin } from "@/lib/auth/admin";
import { TEMA_PADRAO } from "@/lib/domain/tema";
import { temaApp } from "@/lib/server/config-app";
import { EditorTema } from "./editor";

export const metadata = { title: "Aparência" };

/** Personalizar · cores, cantos e animações do app (vale pro app da aluna e pro admin). */
export default async function Aparencia() {
  await requireAdmin(["admin"]);
  const t = (await temaApp()) ?? TEMA_PADRAO;
  return (
    <section className="flex max-w-6xl flex-col gap-6">
      <AdminHead id="PERSONALIZAR" t="Aparência" d="Cores, cantos e animações do app. A prévia mostra na hora; ao salvar vale pra todas as alunas." />
      <EditorTema inicial={t} />
    </section>
  );
}
