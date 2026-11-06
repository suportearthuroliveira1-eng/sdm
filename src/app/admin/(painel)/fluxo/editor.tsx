"use client";

import { useMemo, useState } from "react";
import { BarraSalvar, Campo, Interruptor } from "@/components/admin/salvar";
import { salvarConfig } from "@/lib/actions/admin-config";
import type { Fluxo, TextosApp } from "@/lib/domain/config-schemas";

type Cartao = { k: "afiliada" | "produto" | "ambos"; t: string; o: string; tempo: string; dinheiro: string; quem: string };
type EtapaTxt = { slug: string; nome: string; entenda: string; grupo: string };

export function EditorFluxo({ fluxo, cadastroAberto }: { fluxo: Fluxo; cadastroAberto: boolean }) {
  const [f, setF] = useState(fluxo);
  const [cad, setCad] = useState(cadastroAberto);
  const [base, setBase] = useState(() => JSON.stringify([fluxo, cadastroAberto]));
  const sujo = useMemo(() => JSON.stringify([f, cad]) !== base, [f, cad, base]);
  return (
    <div className="flex flex-col gap-4">
      <section className="acd flex flex-col divide-y divide-line px-5 py-2">
        <Interruptor id="obr" label="Primeiro acesso obrigatório" ajuda="A aluna só usa o app depois de passar pelas boas-vindas, combinado, diagnóstico e escolha do caminho. O time (admin) não é barrado." on={f.onboardingObrigatorio} onChange={(v) => setF({ ...f, onboardingObrigatorio: v })} />
        <Interruptor id="bv" label="Pular a tela de boas-vindas" on={f.pularBoasVindas} onChange={(v) => setF({ ...f, pularBoasVindas: v })} />
        <Interruptor id="cb" label="Pular a tela do combinado" on={f.pularCombinado} onChange={(v) => setF({ ...f, pularCombinado: v })} />
        <Interruptor id="dd" label='Mostrar "Decidir depois" na escolha do caminho' ajuda="Desligado: ela precisa escolher um caminho pra seguir." on={f.permitirDecidirDepois} onChange={(v) => setF({ ...f, permitirDecidirDepois: v })} />
        <Interruptor id="cad" label="Cadastro aberto" ajuda="Qualquer pessoa cria conta pelo app e ganha acesso ao SDM. Desligado: só quem o time cadastrar ou a compra liberar." on={cad} onChange={setCad} />
      </section>
      <BarraSalvar
        k="fluxo"
        sujo={sujo}
        valor={() => f}
        podeRestaurar={false}
        salvar={async () => {
          const a = await salvarConfig("fluxo", f);
          if (!a?.ok) return a;
          return salvarConfig("cadastro_aberto", cad);
        }}
        onSalvo={() => setBase(JSON.stringify([f, cad]))}
      />
    </div>
  );
}

const linhas = (l: readonly string[] | undefined) => (l ?? []).join("\n");
const deLinhas = (t: string) => t.split("\n").map((x) => x.trim()).filter(Boolean);

export function EditorTextos({ inicial, padroes }: { inicial: TextosApp; padroes: { caminhos: Cartao[]; sdmFaz: readonly string[]; voceFaz: readonly string[]; boasVindas: { titulo: string; texto: string }; etapas: EtapaTxt[] } }) {
  const [tx, setTx] = useState<TextosApp>(inicial);
  const [base, setBase] = useState(() => JSON.stringify(inicial));
  const [busca, setBusca] = useState("");
  const sujo = useMemo(() => JSON.stringify(tx) !== base, [tx, base]);
  const bv = tx.boasVindas;
  const cb = tx.combinado;
  const setEtapa = (slug: string, campo: "nome" | "entenda", v: string) => {
    const atual = { ...(tx.etapas[slug] ?? {}) };
    if (v.trim()) atual[campo] = v;
    else delete atual[campo];
    const etapas = { ...tx.etapas };
    if (atual.nome || atual.entenda) etapas[slug] = atual;
    else delete etapas[slug];
    setTx({ ...tx, etapas });
  };
  const etapas = padroes.etapas.filter((e) => !busca || `${e.nome} ${e.slug} ${e.grupo}`.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <p className="mu m-0 text-sm">Campo vazio = usa o texto padrão (aparece em cinza). Use {"{nome}"} pra colocar o primeiro nome da aluna.</p>

      <section className="acd flex flex-col gap-3 p-5" aria-labelledby="t-bv">
        <h2 id="t-bv" className="m-0 text-lg font-bold">Boas-vindas</h2>
        <Campo id="bv-t" label="Título">
          <input id="bv-t" className="ain" maxLength={120} placeholder={padroes.boasVindas.titulo} value={bv.titulo ?? ""} onChange={(e) => setTx({ ...tx, boasVindas: { ...bv, titulo: e.target.value || undefined } })} />
        </Campo>
        <Campo id="bv-x" label="Texto">
          <textarea id="bv-x" className="ain min-h-20 py-2" maxLength={600} placeholder={padroes.boasVindas.texto} value={bv.texto ?? ""} onChange={(e) => setTx({ ...tx, boasVindas: { ...bv, texto: e.target.value || undefined } })} />
        </Campo>
        <Campo id="bv-v" label="Link do vídeo (mp4)" ajuda="Vazio: mostra o botão pra Aula 0.1.">
          <input id="bv-v" className="ain" maxLength={400} placeholder="https://..." value={bv.videoUrl ?? ""} onChange={(e) => setTx({ ...tx, boasVindas: { ...bv, videoUrl: e.target.value || undefined } })} />
        </Campo>
      </section>

      <section className="acd flex flex-col gap-3 p-5" aria-labelledby="t-cb">
        <h2 id="t-cb" className="m-0 text-lg font-bold">O nosso combinado</h2>
        <Campo id="cb-t" label="Título">
          <input id="cb-t" className="ain" maxLength={120} placeholder="O nosso combinado" value={cb.titulo ?? ""} onChange={(e) => setTx({ ...tx, combinado: { ...cb, titulo: e.target.value || undefined } })} />
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo id="cb-s" label="O que o SDM faz" ajuda="Um item por linha.">
            <textarea id="cb-s" className="ain min-h-32 py-2" placeholder={linhas(padroes.sdmFaz)} value={linhas(cb.sdmFaz)} onChange={(e) => setTx({ ...tx, combinado: { ...cb, sdmFaz: deLinhas(e.target.value) } })} />
          </Campo>
          <Campo id="cb-v" label="O que você faz" ajuda="Um item por linha.">
            <textarea id="cb-v" className="ain min-h-32 py-2" placeholder={linhas(padroes.voceFaz)} value={linhas(cb.voceFaz)} onChange={(e) => setTx({ ...tx, combinado: { ...cb, voceFaz: deLinhas(e.target.value) } })} />
          </Campo>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="t-cam">
        <h2 id="t-cam" className="m-0 text-lg font-bold">Cartões da escolha do caminho</h2>
        <div className="grid gap-3 lg:grid-cols-3">
          {padroes.caminhos.map((c) => {
            const v = tx.caminhos[c.k];
            const set = (campo: keyof Omit<Cartao, "k">, val: string) => {
              const novo = { t: v?.t ?? c.t, o: v?.o ?? c.o, tempo: v?.tempo ?? c.tempo, dinheiro: v?.dinheiro ?? c.dinheiro, quem: v?.quem ?? c.quem, [campo]: val };
              setTx({ ...tx, caminhos: { ...tx.caminhos, [c.k]: novo } });
            };
            return (
              <div key={c.k} className="acd flex flex-col gap-2 p-4">
                {(["t", "o", "tempo", "dinheiro", "quem"] as const).map((campo) => (
                  <Campo key={campo} id={`c-${c.k}-${campo}`} label={{ t: "Título", o: "O que é", tempo: "Tempo", dinheiro: "Dinheiro", quem: "Pra quem" }[campo]}>
                    {campo === "o" ? (
                      <textarea id={`c-${c.k}-${campo}`} className="ain min-h-20 py-2" value={v?.[campo] ?? c[campo]} onChange={(e) => set(campo, e.target.value)} />
                    ) : (
                      <input id={`c-${c.k}-${campo}`} className="ain" value={v?.[campo] ?? c[campo]} onChange={(e) => set(campo, e.target.value)} />
                    )}
                  </Campo>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="t-et">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="t-et" className="m-0 text-lg font-bold">Etapas dos caminhos</h2>
          <input aria-label="Buscar etapa" className="ain max-w-64" placeholder="Buscar etapa" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        {etapas.map((e) => (
          <div key={`${e.grupo}-${e.slug}`} className="acd grid gap-2 p-4 sm:grid-cols-[220px_1fr]">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">{e.grupo}</span>
              <input aria-label={`Nome da etapa ${e.nome}`} className="ain" placeholder={e.nome} value={tx.etapas[e.slug]?.nome ?? ""} onChange={(ev) => setEtapa(e.slug, "nome", ev.target.value)} />
            </div>
            <textarea aria-label={`Explicação da etapa ${e.nome}`} className="ain min-h-[72px] py-2" maxLength={400} placeholder={e.entenda} value={tx.etapas[e.slug]?.entenda ?? ""} onChange={(ev) => setEtapa(e.slug, "entenda", ev.target.value)} />
          </div>
        ))}
      </section>

      <BarraSalvar k="textos_app" valor={() => tx} sujo={sujo} onSalvo={() => setBase(JSON.stringify(tx))} />
    </div>
  );
}
