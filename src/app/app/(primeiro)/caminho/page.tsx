import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Passos } from "@/components/app/passos";
import { FormPending, SubmitButton } from "@/components/ux/submit-button";
import { escolherCaminho } from "@/lib/actions/onboarding";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import type { Resultado } from "@/lib/domain/diagnostico";

export const metadata: Metadata = { title: "Escolha seu caminho" };

// Tela 7 · 3 cartões grandes. Pode trocar ou somar depois no Perfil.
const OPCOES = [
  { k: "afiliada", t: "Ser afiliada do SDM", o: "Você divulga o próprio SDM com o kit pronto do time e ganha comissão [valor] por venda.", tempo: "É o mais rápido pra começar: o produto e as peças já existem.", dinheiro: "Não precisa criar nada. Anúncio é opcional.", quem: "Pra quem quer começar logo, sem criar produto." },
  { k: "produto", t: "Criar meu produto com a IA", o: "A IA te ajuda a criar um ebook simples sobre um assunto que você conhece, com página de vendas.", tempo: "Leva mais passos: ideia, ficha, oferta, ebook, página e plataforma.", dinheiro: "Não precisa de dinheiro pra criar. A venda é toda sua.", quem: "Pra quem quer ter o próprio produto." },
  { k: "ambos", t: "Os dois", o: "Começa como afiliada do SDM e, em paralelo, cria o seu produto com a IA.", tempo: "Pede mais tempo por dia.", dinheiro: "Igual aos dois de cima.", quem: "Pra quem tem 2 horas ou mais por dia." },
] as const;

export default async function Caminho() {
  const { student } = await requireStudent();
  const d = await db().query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, student.id), orderBy: desc(schema.diagnostics.versao) });
  const sugerido = (d?.resultado as Resultado | null)?.caminho?.valor;
  return (
    <>
      <Passos atual={5} rotulo="Seu caminho" />
      <h1 className="m-0 text-[26px] font-bold leading-tight">Escolha seu caminho</h1>
      <p className="tx text-muted">Dá pra trocar ou somar depois, no Perfil.</p>
      {OPCOES.map((o) => (
        <form key={o.k} action={escolherCaminho.bind(null, o.k)} className={`flex flex-col gap-2 rounded-2xl border-[1.5px] p-4 ${sugerido === o.k ? "border-accent bg-sel" : "border-line bg-surface"}`}>
          <div className="flex items-center gap-2">
            <span className="flex-1 text-lg font-bold">{o.t}</span>
            {sugerido === o.k ? <span className="rounded-[10px] bg-accent px-2 py-1 text-[11px] font-bold text-accent-ink">SUGERIDO PRA VOCÊ</span> : null}
          </div>
          <span className="tx">{o.o}</span>
          <span className="mu"><b className="text-text-2">Tempo:</b> {o.tempo}</span>
          <span className="mu"><b className="text-text-2">Dinheiro:</b> {o.dinheiro}</span>
          <span className="mu"><b className="text-text-2">Pra quem:</b> {o.quem}</span>
          <SubmitButton className={sugerido === o.k ? "b1 mt-1" : "b2 mt-1"} pendente="Criando a sua pasta...">Escolher</SubmitButton>
          <FormPending label="Preparando..." />
        </form>
      ))}
      <form action={escolherCaminho.bind(null, "depois")}>
        <SubmitButton className="b3" pendente="Salvando...">Decidir depois</SubmitButton>
      </form>
    </>
  );
}
