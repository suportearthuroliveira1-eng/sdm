"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Interruptor } from "@/components/admin/salvar";
import { CopyButton } from "@/components/pasta/copy-button";
import { toast } from "@/components/ux/toaster";
import { salvarConfig } from "@/lib/actions/admin-config";

/** Hubla: passo a passo com o que falta, URL do webhook e liga/desliga. */
export function HublaCard({ ligado, url, temToken, temEmail, mapeados }: { ligado: boolean; url: string; temToken: boolean; temEmail: boolean; mapeados: number }) {
  const router = useRouter();
  const [pend, start] = useTransition();
  const passos: [boolean, string, React.ReactNode][] = [
    [true, "Na Hubla, abra Integrações → Webhook → Ativar e adicione uma regra com esta URL:", <span key="u" className="flex flex-wrap items-center gap-2"><code className="break-all rounded bg-bg px-2 py-1 text-xs">{url}</code><CopyButton text={url} label="Copiar URL" /></span>],
    [true, "Nos eventos da regra, marque: Pagamento da fatura realizado, Fatura reembolsada, Status da fatura atualizada (pro chargeback), Acesso concedido e Acesso removido.", null],
    [temToken, "Copie o \"Hubla Webhook Token\" (aba Autenticação) e cole em Chaves e variáveis.", <a key="c" href="/admin/chaves" className="text-sm">Abrir Chaves e variáveis</a>],
    [mapeados > 0, "Mapeie o ID do produto da Hubla pro acesso que ele libera (abaixo). Dica: faça uma venda de teste no ambiente de testes da Hubla; o ID aparece em Últimos eventos.", null],
    [temEmail, "Pra mandar a senha provisória por e-mail, cadastre a chave do Resend em Chaves e variáveis (sem ela, você gera a senha na ficha da aluna e manda no WhatsApp).", null],
  ];
  return (
    <div className="acd flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="m-0 text-lg font-semibold">Hubla · venda cria o acesso sozinha</h2>
          <p className="m-0 text-sm text-muted">Venda aprovada → cria a aluna, libera o acesso e manda a senha provisória. Reembolso, chargeback ou cancelamento → tira o acesso.</p>
        </div>
        <div className="w-72">
          <Interruptor
            id="hubla-on"
            label={ligado ? "Ligado: processando vendas" : "Desligado: só guarda os avisos"}
            on={ligado}
            onChange={(v) =>
              !pend &&
              start(async () => {
                const r = await salvarConfig("auth_hubla_webhook", v);
                if (r?.ok) {
                  toast(v ? "Hubla ligada" : "Hubla desligada");
                  router.refresh();
                }
              })
            }
          />
        </div>
      </div>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {passos.map(([ok, t, extra], i) => (
          <li key={i} className="flex gap-3 rounded-xl bg-surface-2 p-3">
            <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${ok ? "bg-ok text-accent-ink" : "border border-warn text-warn"}`}>{ok ? "✓" : i + 1}</span>
            <div className="flex flex-col gap-1.5 text-sm">
              <span>{t}</span>
              {extra}
            </div>
          </li>
        ))}
      </ol>
      {!temToken && ligado ? <div className="warn">Sem o token, o app recusa todos os avisos da Hubla (por segurança).</div> : null}
    </div>
  );
}
