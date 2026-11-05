/**
 * Diagnóstico do primeiro acesso: 8 perguntas, uma por tela, cada uma com "por que eu pergunto".
 * Perguntas do fluxo ideal (PDF); textos e opções do protótipo (DIAG) onde existiam.
 */
export type Pergunta = { k: string; q: string; p: string; o: string[]; multi?: boolean; outro?: boolean };

export const PERGUNTAS: Pergunta[] = [
  { k: "pais", q: "Em que país você mora?", p: "é de lá que você conhece o jeito das pessoas e, muitas vezes, o idioma.", o: ["Estados Unidos", "Portugal", "Reino Unido", "Irlanda", "Espanha", "Itália", "Brasil", "Outro"] },
  { k: "idiomas", multi: true, q: "Quais idiomas você fala, mesmo que pouco?", p: "a IA escreve tudo no idioma do cliente, mas ajuda saber o que você entende.", o: ["Português", "Inglês", "Espanhol", "Italiano", "Outro"] },
  { k: "tempo", q: "Quanto tempo por dia você consegue separar?", p: "o caminho certo depende do tempo que você tem de verdade.", o: ["30 minutos", "1 hora", "2 horas ou mais"] },
  { k: "verba", q: "Dá pra investir em anúncio agora?", p: "anúncio é pago por você. Se não der agora, tem o caminho orgânico.", o: ["Nada agora", "Um valor pequeno", "Um valor que não me aperta"] },
  { k: "assuntos", multi: true, q: "Sobre o que você gosta de falar ou entende?", p: "produto de um assunto que você gosta é mais fácil de criar e de divulgar.", o: ["Cozinha e receitas", "Casa e organização", "Filhos e família", "Fé e devocional", "Inglês e idiomas", "Beleza e cuidado", "Outro"] },
  { k: "exp", q: "Já vendeu alguma coisa pela internet?", p: "pra IA saber de onde começar a explicar.", o: ["Nunca", "Já tentei", "Já vendo"] },
  { k: "medo", q: "Qual é o seu maior medo agora?", p: "a gente explica antes justamente o que mais te preocupa.", o: ["Não saber mexer no celular e nas redes", "Não falar bem o idioma", "Perder dinheiro", "Não ter tempo", "Aparecer em vídeo", "Outro"] },
  { k: "objetivo", q: "O que você quer conseguir com o SDM?", p: "assim o app mostra primeiro o que te leva até lá.", o: ["Ter uma renda extra em dólar", "Trabalhar de casa", "Ter o meu próprio produto", "Aprender a vender pela internet", "Outro"] },
];

export type Respostas = Record<string, string | string[]>;

export function completo(r: Respostas) {
  return PERGUNTAS.every((p) => {
    const v = r[p.k];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  });
}

export function primeiraPendente(r: Respostas) {
  const i = PERGUNTAS.findIndex((p) => {
    const v = r[p.k];
    return Array.isArray(v) ? v.length === 0 : !v;
  });
  return i < 0 ? PERGUNTAS.length - 1 : i;
}

export type Resultado = {
  perfil: string;
  pais_venda: { k: "eua" | "uk" | "latam" | "esp"; porque: string };
  caminho: { valor: "afiliada" | "produto" | "ambos"; porque: string };
  divulgacao: { valor: "pago" | "org" | "ambos"; porque: string };
  cuidados: string[];
  motor?: "ia" | "regras";
};

const lista = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

/** Reserva sem IA: regras simples e explicadas (usada se a IA estiver desligada ou falhar). */
export function resultadoPorRegras(r: Respostas): Resultado {
  const pais = String(r.pais ?? "");
  const idiomas = lista(r.idiomas);
  const fala = (x: string) => idiomas.includes(x);
  let k: Resultado["pais_venda"]["k"] = "eua";
  let porquePais = "É o maior público de quem compra em inglês.";
  if (pais === "Espanha") [k, porquePais] = ["esp", "Você mora na Espanha e conhece o jeito das pessoas daí."];
  else if (pais === "Reino Unido" || pais === "Irlanda") [k, porquePais] = ["uk", "Você mora num país de língua inglesa da Europa e conhece o jeito das pessoas daí."];
  else if (fala("Espanhol") && !fala("Inglês")) [k, porquePais] = ["latam", "Você entende espanhol: os latinos nos EUA compram em espanhol e recebem em dólar."];
  else if (pais === "Estados Unidos") porquePais = "Você mora nos EUA e conhece o jeito das pessoas daí.";
  const verba = String(r.verba ?? "");
  const div: Resultado["divulgacao"] =
    verba === "Nada agora"
      ? { valor: "org", porque: "Sem verba pra anúncio agora, o vídeo orgânico é o caminho: pede tempo e constância, não dinheiro." }
      : verba === "Um valor que não me aperta"
        ? { valor: "ambos", porque: "Com verba e tempo, dá pra testar anúncio e vídeo orgânico ao mesmo tempo." }
        : { valor: "pago", porque: "Com um valor pequeno já dá pra testar anúncio, sempre dentro do que não aperta." };
  const objetivo = String(r.objetivo ?? "");
  const tempo = String(r.tempo ?? "");
  const cam: Resultado["caminho"] =
    objetivo === "Ter o meu próprio produto"
      ? { valor: "produto", porque: "Você quer ter o seu produto: a IA te ajuda a criar um ebook simples, passo a passo." }
      : tempo === "2 horas ou mais"
        ? { valor: "ambos", porque: "Com mais tempo por dia, dá pra começar como afiliada e criar o seu produto em paralelo." }
        : { valor: "afiliada", porque: "Ser afiliada é o jeito mais rápido de começar: o produto e o kit já estão prontos." };
  const assuntos = lista(r.assuntos).join(", ") || "os assuntos que você marcou";
  return {
    perfil: `Você mora em ${pais || "[país]"}, tem ${tempo || "[tempo]"} por dia e gosta de ${assuntos}. ${String(r.exp ?? "") === "Nunca" ? "Está começando agora, então o app explica tudo antes." : "Já teve algum contato com vendas pela internet."}`,
    pais_venda: { k, porque: porquePais },
    caminho: cam,
    divulgacao: div,
    cuidados: [r.medo ? `Seu medo (${String(r.medo).toLowerCase()}) tem aula própria: o app te mostra quando chegar a hora.` : "", "Um passo por dia: o Início sempre mostra só o próximo."].filter(Boolean),
    motor: "regras",
  };
}
