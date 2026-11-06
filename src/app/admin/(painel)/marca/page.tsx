import { AdminHead } from "../head";
import { requireAdmin } from "@/lib/auth/admin";
import { NOME_AMANDA_PADRAO } from "@/lib/domain/marca";
import { marcaApp } from "@/lib/server/marca";
import { ImagemMarca, TextosMarca } from "./forms";

export const metadata = { title: "Marca" };

/** Personalizar · foto da Amanda, ícone do app e o nome que aparece pras alunas. */
export default async function AdminMarca() {
  await requireAdmin(["admin"]);
  const m = await marcaApp();
  return (
    <section className="flex max-w-5xl flex-col gap-6">
      <AdminHead id="PERSONALIZAR" t="Marca" d="A foto da Amanda aparece no login, nas boas-vindas, no menu e no Início. O ícone é o do app instalado no celular e da aba do navegador." />
      <div className="grid gap-4 lg:grid-cols-2">
        <ImagemMarca campo="fotoAmanda" titulo="Foto da Amanda" dica="Quadrada, rosto no centro. PNG, JPG ou WEBP até 4 MB." atual={m.fotoAmanda ?? null} redonda />
        <ImagemMarca campo="icone" titulo="Ícone do app" dica="Quadrado, 512 × 512, PNG. Deixe uma margem: o celular corta os cantos." atual={m.icone ?? null} />
      </div>
      <TextosMarca nome={m.nomeAmanda ?? NOME_AMANDA_PADRAO} recado={m.recado ?? ""} />
    </section>
  );
}
