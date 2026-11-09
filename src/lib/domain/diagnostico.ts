/**
 * Diagnóstico do primeiro acesso (padrão: 10 perguntas, incluindo verba, preferência pago/orgânico e se aparece em vídeo): perguntas uma por tela, cada uma com "por que eu pergunto".
 * As perguntas, as opções e as regras de decisão são editáveis no admin (setting `diagnostico`);
 * o que está aqui é o padrão (fluxo ideal do PDF + textos do protótipo).
 */
export type Caminho = "afiliada" | "produto" | "ambos";
export type Divulgacao = "pago" | "org" | "ambos";
/** Uma opção pode "puxar" o caminho e/ou a divulgação sugeridos, com um peso. */
export type Puxa = { caminho?: Caminho; divulgacao?: Divulgacao; peso?: number };
export type Pergunta = {
  k: string;
  q: string;
  p: string;
  o: string[];
  /** única (padrão), múltipla ou texto livre */
  tipo?: "unica" | "multipla" | "texto";
  /** legado: igual a tipo "multipla" */
  multi?: boolean;
  /** mostra "Outro" com campo de texto */
  outro?: boolean;
  /** regras de decisão por opção */
  regras?: Record<string, Puxa>;
};

export type ConfigDiagnostico = {
  perguntas: Pergunta[];
  decisao: {
    /** regras: o caminho sai das regras e a IA só explica; ia: a IA decide, com as regras como orientação */
    modo: "regras" | "ia";
    caminhoPadrao: Caminho;
    divulgacaoPadrao: Divulgacao;
  };
};

export const tipoDe = (p: Pergunta): "unica" | "multipla" | "texto" => p.tipo ?? (p.multi ? "multipla" : "unica");

export const PERGUNTAS: Pergunta[] = [
  { k: "pais", q: "Em que país você mora?", p: "é de lá que você conhece o jeito das pessoas e, muitas vezes, o idioma.", o: ["Estados Unidos", "Portugal", "Reino Unido", "Irlanda", "Espanha", "Itália", "Brasil"], outro: true },
  { k: "idiomas", tipo: "multipla", q: "Quais idiomas você fala, mesmo que pouco?", p: "a IA escreve tudo no idioma do cliente, mas ajuda saber o que você entende.", o: ["Português", "Inglês", "Espanhol", "Italiano"], outro: true },
  { k: "tempo", q: "Quanto tempo por dia você consegue separar?", p: "o caminho certo depende do tempo que você tem de verdade.", o: ["30 minutos", "1 hora", "2 horas ou mais"], regras: { "2 horas ou mais": { caminho: "ambos", peso: 1 } } },
  { k: "verba", q: "Quanto você consegue investir em anúncio por mês, sem apertar?", p: "anúncio é pago por você, direto pra Meta. Se não der agora, tem o caminho orgânico, sem custo de anúncio.", o: ["Nada agora", "Até US$ 100 por mês", "De US$ 100 a US$ 300 por mês", "Mais de US$ 300 por mês"], regras: { "Nada agora": { divulgacao: "org", peso: 3 }, "Até US$ 100 por mês": { divulgacao: "pago", peso: 1 }, "De US$ 100 a US$ 300 por mês": { divulgacao: "pago", peso: 1 }, "Mais de US$ 300 por mês": { divulgacao: "pago", peso: 1 } } },
  { k: "preferencia", q: "Como você prefere divulgar?", p: "anúncio pago traz resultado mais rápido e custa dinheiro; vídeo orgânico é grátis, mas pede tempo e constância.", o: ["Anúncio pago", "Vídeo orgânico (sem pagar anúncio)", "Os dois", "Não sei, quero a sugestão do app"], regras: { "Anúncio pago": { divulgacao: "pago", peso: 2 }, "Vídeo orgânico (sem pagar anúncio)": { divulgacao: "org", peso: 2 }, "Os dois": { divulgacao: "ambos", peso: 2 } } },
  { k: "aparecer", q: "Você topa aparecer nos vídeos?", p: "dá pra fazer vídeo sem mostrar o rosto: só a voz, as mãos ou a tela. A IA escreve os roteiros do seu jeito.", o: ["Sim, apareço", "Só a voz ou as mãos", "Prefiro não aparecer"] },
  { k: "assuntos", tipo: "multipla", q: "Sobre o que você gosta de falar ou entende?", p: "produto de um assunto que você gosta é mais fácil de criar e de divulgar.", o: ["Cozinha e receitas", "Casa e organização", "Filhos e família", "Fé e devocional", "Inglês e idiomas", "Beleza e cuidado"], outro: true },
  { k: "exp", q: "Já vendeu alguma coisa pela internet?", p: "pra IA saber de onde começar a explicar.", o: ["Nunca", "Já tentei", "Já vendo"] },
  { k: "medo", q: "Qual é o seu maior medo agora?", p: "a gente explica antes justamente o que mais te preocupa.", o: ["Não saber mexer no celular e nas redes", "Não falar bem o idioma", "Perder dinheiro", "Não ter tempo", "Aparecer em vídeo"], outro: true },
  { k: "objetivo", q: "O que você quer conseguir com o SDM?", p: "assim o app mostra primeiro o que te leva até lá.", o: ["Ter uma renda extra em dólar", "Trabalhar de casa", "Ter o meu próprio produto", "Aprender a vender pela internet"], outro: true, regras: { "Ter o meu próprio produto": { caminho: "produto", peso: 2 } } },
];

export const CONFIG_PADRAO: ConfigDiagnostico = {
  perguntas: PERGUNTAS,
  decisao: { modo: "regras", caminhoPadrao: "afiliada", divulgacaoPadrao: "pago" },
};

export type Respostas = Record<string, string | string[]>;

const respondida = (p: Pergunta, r: Respostas) => {
  const v = r[p.k];
  return Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());
};

export function completo(r: Respostas, perguntas: Pergunta[] = PERGUNTAS) {
  return perguntas.every((p) => respondida(p, r));
}

export function primeiraPendente(r: Respostas, perguntas: Pergunta[] = PERGUNTAS) {
  const i = perguntas.findIndex((p) => !respondida(p, r));
  return i < 0 ? perguntas.length - 1 : i;
}

/** Valida uma resposta contra a pergunta. Devolve a resposta limpa ou null. */
export function validarResposta(p: Pergunta, v: unknown): string | string[] | null {
  const t = tipoDe(p);
  const limpo = (x: unknown) => String(x ?? "").trim().slice(0, 120);
  if (t === "texto") {
    const s = String(v ?? "").trim().slice(0, 500);
    return s ? s : null;
  }
  if (t === "multipla") {
    if (!Array.isArray(v)) return null;
    const l = [...new Set(v.map(limpo).filter(Boolean))].slice(0, 12);
    if (!l.length) return null;
    return l.every((x) => p.o.includes(x) || p.outro) ? l : null;
  }
  const s = limpo(v);
  if (!s) return null;
  return p.o.includes(s) || p.outro ? s : null;
}

/** Soma os pesos das regras das respostas. Empate ou nada marcado → padrão. */
export function decidir(r: Respostas, cfg: ConfigDiagnostico): { caminho: Caminho; divulgacao: Divulgacao; motivosCaminho: string[]; motivosDiv: string[] } {
  const cam: Record<string, number> = {};
  const div: Record<string, number> = {};
  const motivosCaminho: string[] = [];
  const motivosDiv: string[] = [];
  for (const p of cfg.perguntas) {
    const v = r[p.k];
    for (const resp of Array.isArray(v) ? v : v ? [v] : []) {
      const regra = p.regras?.[resp];
      if (!regra) continue;
      const peso = regra.peso ?? 1;
      if (regra.caminho) {
        cam[regra.caminho] = (cam[regra.caminho] ?? 0) + peso;
        motivosCaminho.push(resp);
      }
      if (regra.divulgacao) {
        div[regra.divulgacao] = (div[regra.divulgacao] ?? 0) + peso;
        motivosDiv.push(resp);
      }
    }
  }
  const melhor = <T extends string>(m: Record<string, number>, padrao: T): T => {
    const l = Object.entries(m).sort((a, b) => b[1] - a[1]);
    if (!l.length || (l[1] && l[1][1] === l[0]![1])) return padrao;
    return l[0]![0] as T;
  };
  return { caminho: melhor(cam, cfg.decisao.caminhoPadrao), divulgacao: melhor(div, cfg.decisao.divulgacaoPadrao), motivosCaminho, motivosDiv };
}

export type Resultado = {
  perfil: string;
  pais_venda: { k: "eua" | "uk" | "latam" | "esp" | "br"; porque: string };
  caminho: { valor: "afiliada" | "produto" | "ambos"; porque: string };
  divulgacao: { valor: "pago" | "org" | "ambos"; porque: string };
  cuidados: string[];
  motor?: "ia" | "regras";
};

const lista = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

const PORQUE_CAMINHO: Record<Caminho, string> = {
  produto: "Você quer ter o seu produto: a IA te ajuda a criar um ebook simples, passo a passo.",
  ambos: "Com mais tempo por dia, dá pra começar como afiliada e criar o seu produto em paralelo.",
  afiliada: "Ser afiliada é o jeito mais rápido de começar: o produto e o kit já estão prontos.",
};
const PORQUE_DIV: Record<Divulgacao, string> = {
  org: "Vídeo orgânico: não gasta com anúncio, pede tempo e constância. Bom pra começar sem tirar dinheiro do bolso.",
  ambos: "Anúncio e vídeo orgânico juntos: o anúncio traz os primeiros cliques e o orgânico cresce com o tempo.",
  pago: "Anúncio pago: com o valor que não aperta, você já testa e tem os primeiros cliques mais rápido.",
};

/** Reserva sem IA (e decisão no modo "regras"): regras do admin, explicadas. */
export function resultadoPorRegras(r: Respostas, cfg: ConfigDiagnostico = CONFIG_PADRAO): Resultado {
  const pais = String(r.pais ?? "");
  const idiomas = lista(r.idiomas);
  const fala = (x: string) => idiomas.includes(x);
  let k: Resultado["pais_venda"]["k"] = "eua";
  let porquePais = "É o maior público de quem compra em inglês.";
  if (pais === "Espanha") [k, porquePais] = ["esp", "Você mora na Espanha e conhece o jeito das pessoas daí."];
  else if (pais === "Reino Unido" || pais === "Irlanda") [k, porquePais] = ["uk", "Você mora num país de língua inglesa da Europa e conhece o jeito das pessoas daí."];
  else if (fala("Espanhol") && !fala("Inglês")) [k, porquePais] = ["latam", "Você entende espanhol: os latinos nos EUA compram em espanhol e recebem em dólar."];
  else if (!fala("Inglês") && !fala("Espanhol")) [k, porquePais] = ["br", "Você fala português: começa vendendo na sua língua. Dá pra trocar de país depois."];
  else if (pais === "Estados Unidos") porquePais = "Você mora nos EUA e conhece o jeito das pessoas daí.";
  const d = decidir(r, cfg);
  const tempo = String(r.tempo ?? "");
  const assuntos = lista(r.assuntos).join(", ") || "os assuntos que você marcou";
  return {
    perfil: `Você mora em ${pais || "[país]"}, tem ${tempo || "[tempo]"} por dia e gosta de ${assuntos}. ${String(r.exp ?? "") === "Nunca" ? "Está começando agora, então o app explica tudo antes." : "Já teve algum contato com vendas pela internet."}`,
    pais_venda: { k, porque: porquePais },
    caminho: { valor: d.caminho, porque: PORQUE_CAMINHO[d.caminho] },
    divulgacao: { valor: d.divulgacao, porque: PORQUE_DIV[d.divulgacao] },
    cuidados: [r.medo ? `Seu medo (${String(r.medo).toLowerCase()}) tem aula própria: o app te mostra quando chegar a hora.` : "", "Um passo por dia: o Início sempre mostra só o próximo."].filter(Boolean),
    motor: "regras",
  };
}
