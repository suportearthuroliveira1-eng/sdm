"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ux/submit-button";
import { toast } from "@/components/ux/toaster";
import { salvarNumeros } from "@/lib/actions/caminhos";

export function NumerosForm({ pastaId, org }: { pastaId: string; org: boolean }) {
  const router = useRouter();
  const hoje = new Date().toISOString().slice(0, 10);
  const [st, action] = useActionState(async (p: { ok?: boolean; erro?: string } | null, f: FormData) => {
    const r = await salvarNumeros(pastaId, p, f);
    if (r.ok) {
      toast("Números salvos");
      router.refresh();
    }
    return r;
  }, null);
  const campos = org
    ? [["views", "Visualizações"], ["seguidores", "Seguidores novos"], ["comentarios", "Comentários"]]
    : [["gasto", "Gasto (US$)"], ["cpm", "CPM"], ["ctr", "CTR (%)"], ["cpc", "CPC"], ["vendas", "Vendas"]];
  return (
    <form action={action} className="cd gap-3">
      <span className="kk">DIGITAR NÚMEROS</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="flex flex-col gap-1"><label htmlFor="n-data" className="lb">Data</label><input id="n-data" name="data" type="date" defaultValue={hoje} className="in" required /></div>
        {campos.map(([k, l]) => (
          <div key={k} className="flex flex-col gap-1"><label htmlFor={`n-${k}`} className="lb">{l}</label><input id={`n-${k}`} name={k} inputMode="decimal" className="in" /></div>
        ))}
      </div>
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      <SubmitButton pendente="Salvando...">Salvar números</SubmitButton>
      <span className="mu">Mandar print e conexão automática com a Meta: [em breve].</span>
    </form>
  );
}
