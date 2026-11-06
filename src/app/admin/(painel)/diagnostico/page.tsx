import { AdminHead } from "../head";
import { requireAdmin } from "@/lib/auth/admin";
import { configDiagnostico } from "@/lib/server/config-app";
import { EditorDiagnostico } from "./editor";

export const metadata = { title: "Diagnóstico" };

/** Personalizar · perguntas do primeiro acesso e regras de decisão do caminho. */
export default async function AdminDiagnostico() {
  await requireAdmin(["admin"]);
  const cfg = await configDiagnostico();
  return (
    <section className="flex max-w-4xl flex-col gap-6">
      <AdminHead id="PERSONALIZAR" t="Diagnóstico e decisão" d="As perguntas que a aluna responde no primeiro acesso e como o app escolhe o caminho dela. Vale na hora pra quem ainda não respondeu." />
      <EditorDiagnostico inicial={cfg} />
    </section>
  );
}
