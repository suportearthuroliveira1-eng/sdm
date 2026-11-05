/**
 * Motor "modelo SDM": monta kit, quiz, anúncios, ganchos, roteiros, bio e legenda
 * a partir da ficha do produto (vitrine), com as frases-base do protótipo
 * (docs/prototipo/App.dc.html: LG, PT e GEN). Não inventa número, prova nem resultado.
 * Quando a IA estiver configurada, os agentes (AGT-montador, AGT-anuncios, AGT-roteiros)
 * substituem este motor; o formato de saída é o mesmo.
 */
export type Bi = { x: string; pt: string };
export type Lang = "en" | "es";

export type ProdutoBase = {
  nome: string;
  lang: Lang;
  aX: string; // assunto no idioma de venda
  aPt: string;
  quem: Bi;
  dor: Bi;
  oque: Bi;
  prom: Bi;
  hooks: { x: string[]; pt: string[] };
  img: string;
  tags: string;
};

type L = {
  prob: (d: string) => string;
  virada: string;
  oque: (n: string, o: string) => string;
  quem: (q: string) => string;
  botao: string;
  adC: string;
  call: string;
  bio: (p: string) => string;
  leg: string;
  q: ((d: string) => string)[];
  o: string[][];
  res: (n: string, p: string) => string;
  banco: ((a: string, d: string) => string)[];
  chamadas: string[];
};

const LG: Record<Lang, L> = {
  en: {
    prob: (d) => `If you're tired of ${d}, you're not alone.`,
    virada: "There's a simpler way to handle this, and it doesn't take your whole weekend.",
    oque: (n, o) => `${n} is ${o}.`,
    quem: (q) => `Made for ${q}.`,
    botao: "See how it works",
    adC: "Tap the link to see how it works.",
    call: "The full guide is in the link in my bio.",
    bio: (p) => `${p}. The guide is in the link below.`,
    leg: "Save this so you don't lose it. The full guide is in the link in my bio.",
    q: [(d) => `How often do you deal with ${d}?`, () => "What have you tried so far?", () => "What would help you most right now?"],
    o: [["Almost every day", "Sometimes", "Rarely"], ["Searching online", "Apps and videos", "Nothing yet"], ["A simple step by step", "A ready-made plan", "Quick tips"]],
    res: (n, p) => `Your result: ${n} fits what you need. ${p}.`,
    banco: [(a) => `3 things I wish I knew about ${a} sooner`, (_a, d) => `Save this if ${d} sounds familiar`, () => "Try this tonight and tell me if it worked", () => "The mistake I made for years", (a) => `Nobody told me this about ${a}`, () => "Watch this before you give up", () => "This changed my week"],
    chamadas: ["The full guide is in the link in my bio.", "Want the whole list? Link in bio.", "Follow for more, and the guide is in my bio."],
  },
  es: {
    prob: (d) => `Si estás cansada de ${d}, no estás sola.`,
    virada: "Hay una forma más simple de resolverlo, y no te lleva todo el fin de semana.",
    oque: (n, o) => `${n} es ${o}.`,
    quem: (q) => `Hecho para ${q}.`,
    botao: "Ver cómo funciona",
    adC: "Toca el enlace para ver cómo funciona.",
    call: "La guía completa está en el enlace de mi perfil.",
    bio: (p) => `${p}. La guía está en el enlace de abajo.`,
    leg: "Guárdalo para no perderlo. La guía completa está en el enlace de mi perfil.",
    q: [(d) => `¿Qué tan seguido te pasa esto: ${d}?`, () => "¿Qué has probado hasta ahora?", () => "¿Qué te ayudaría más ahora?"],
    o: [["Casi todos los días", "A veces", "Casi nunca"], ["Buscar en internet", "Apps y videos", "Nada todavía"], ["Un paso a paso simple", "Un plan listo", "Consejos rápidos"]],
    res: (n, p) => `Tu resultado: ${n} encaja con lo que necesitas. ${p}.`,
    banco: [(a) => `3 cosas que me hubiera gustado saber antes sobre ${a}`, (_a, d) => `Guarda esto si ${d} te suena familiar`, () => "Prueba esto hoy y me cuentas", () => "El error que cometí durante años", (a) => `Nadie me dijo esto sobre ${a}`, () => "Mira esto antes de rendirte", () => "Esto cambió mi semana"],
    chamadas: ["La guía completa está en el enlace de mi perfil.", "¿Quieres la lista completa? Enlace en el perfil.", "Sígueme para más, y la guía está en mi perfil."],
  },
};

const PT: L = {
  prob: (d) => `Se você está cansada de ${d}, você não está sozinha.`,
  virada: "Existe um jeito mais simples de resolver isso, e não toma o seu fim de semana inteiro.",
  oque: (n, o) => `${n} é ${o}.`,
  quem: (q) => `Feito pra ${q}.`,
  botao: "Ver como funciona",
  adC: "Toque no link pra ver como funciona.",
  call: "O guia completo está no link da minha bio.",
  bio: (p) => `${p}. O guia está no link abaixo.`,
  leg: "Salve pra não perder. O guia completo está no link da minha bio.",
  q: [(d) => `Com que frequência você passa por isso: ${d}?`, () => "O que você já tentou?", () => "O que mais te ajudaria agora?"],
  o: [["Quase todo dia", "Às vezes", "Raramente"], ["Procurar na internet", "Apps e vídeos", "Nada ainda"], ["Um passo a passo simples", "Um plano pronto", "Dicas rápidas"]],
  res: (n, p) => `Seu resultado: ${n} combina com o que você precisa. ${p}.`,
  banco: [(a) => `3 coisas que eu queria saber antes sobre ${a}`, (_a, d) => `Salve se ${d} parece com a sua vida`, () => "Teste isso hoje e me conta se deu certo", () => "O erro que eu cometi por anos", (a) => `Ninguém me contou isso sobre ${a}`, () => "Assista antes de desistir", () => "Isso mudou a minha semana"],
  chamadas: ["O guia completo está no link da minha bio.", "Quer a lista inteira? Link na bio.", "Me segue pra mais, e o guia está na bio."],
};

export type Bloco = { n: string; oq: string; x: string; pt: string };
export type Anuncio = { gancho: Bi; meio: Bi; chamada: Bi; texto: Bi; cor: number };
export type Roteiro = { gancho: Bi; meio: string; chamada: Bi; formato: string };
export type QuizPergunta = { q: Bi; opcoes: { x: string[]; pt: string[] } };

export const PORQUE = {
  kit_pre: "Segue a ordem que funciona numa pré-venda: promessa, cena que ela vive, a dor, a virada sem milagre, o que é, pra quem é e o botão pro produtor.",
  kit_quiz: "Três perguntas fazem a pessoa pensar no próprio problema antes de ver o produto; o resultado conecta a resposta dela ao produto.",
  anuncio: "Cada anúncio tem gancho (faz parar), meio (mostra o produto numa frase) e chamada (diz o que fazer). Os 3 testam ganchos diferentes.",
  gancho: "Ganchos da ficha do produto + banco de ganchos do SDM, adaptados ao assunto e à dor de quem compra.",
  roteiro: "Roteiros curtos sem precisar aparecer: gancho nos 2 primeiros segundos, um pedaço do produto no meio e a chamada pro link da bio.",
  bio: "Bio com a promessa do produto e o caminho pro link; legenda que pede pra salvar (aumenta alcance) e leva pro link.",
} as const;

export function kitPre(p: ProdutoBase): Bloco[] {
  const l = LG[p.lang];
  return [
    { n: "1 · TÍTULO", oq: "A promessa. É a primeira coisa que a pessoa lê.", x: p.prom.x, pt: p.prom.pt },
    { n: "2 · ABERTURA", oq: 'Uma cena que ela vive. Faz ela pensar "isso sou eu".', x: p.hooks.x[0] ?? "", pt: p.hooks.pt[0] ?? "" },
    { n: "3 · O PROBLEMA", oq: "Mostra que você entende a dor dela.", x: l.prob(p.dor.x), pt: PT.prob(p.dor.pt) },
    { n: "4 · A VIRADA", oq: "Abre a porta pra solução, sem prometer milagre.", x: l.virada, pt: PT.virada },
    { n: "5 · O QUE É", oq: "Explica o produto numa frase simples.", x: l.oque(p.nome, p.oque.x), pt: PT.oque(p.nome, p.oque.pt) },
    { n: "6 · PRA QUEM É", oq: "Ajuda a pessoa certa a se reconhecer.", x: l.quem(p.quem.x), pt: PT.quem(p.quem.pt) },
    { n: "7 · BOTÃO", oq: "Leva pra página do produtor pelo seu link de afiliada.", x: l.botao, pt: PT.botao },
  ];
}

export function kitQuiz(p: ProdutoBase): { blocos: Bloco[]; quiz: QuizPergunta[]; resultado: Bi } {
  const l = LG[p.lang];
  const quiz: QuizPergunta[] = [0, 1, 2].map((i) => ({
    q: { x: l.q[i]!(p.dor.x), pt: PT.q[i]!(p.dor.pt) },
    opcoes: { x: l.o[i]!, pt: PT.o[i]! },
  }));
  const resultado = { x: l.res(p.nome, p.prom.x), pt: PT.res(p.nome, p.prom.pt) };
  const blocos: Bloco[] = quiz.map((q, i) => ({
    n: `PERGUNTA ${i + 1}`,
    oq: "Faz a pessoa pensar no problema dela, sem pressão.",
    x: `${q.q.x} (${q.opcoes.x.join(" / ")})`,
    pt: `${q.q.pt} (${q.opcoes.pt.join(" / ")})`,
  }));
  blocos.push({ n: "RESULTADO", oq: "Mostra que o produto combina com ela.", x: resultado.x, pt: resultado.pt });
  blocos.push({ n: "BOTÃO", oq: "Leva pra página do produtor pelo seu link de afiliada.", x: l.botao, pt: PT.botao });
  return { blocos, quiz, resultado };
}

export function ganchos(p: ProdutoBase): Bi[] {
  const l = LG[p.lang];
  const base = p.hooks.x.map((x, i) => ({ x, pt: p.hooks.pt[i] ?? "" }));
  const banco = l.banco.map((f, i) => ({ x: f(p.aX, p.dor.x), pt: PT.banco[i]!(p.aPt, p.dor.pt) }));
  return [...base, ...banco];
}

export function anuncios(p: ProdutoBase, inicio = 0): Anuncio[] {
  const l = LG[p.lang];
  const g = ganchos(p);
  const meio = { x: l.oque(p.nome, p.oque.x), pt: PT.oque(p.nome, p.oque.pt) };
  const chamada = { x: l.adC, pt: PT.adC };
  return [0, 1, 2].map((k) => {
    const gancho = g[(inicio + k) % g.length]!;
    return { gancho, meio, chamada, texto: { x: `${gancho.x} ${meio.x} ${chamada.x}`, pt: `${gancho.pt} ${meio.pt} ${chamada.pt}` }, cor: (inicio + k) % 4 };
  });
}

export function roteiros(p: ProdutoBase, formatos: string[] = []): Roteiro[] {
  const l = LG[p.lang];
  const fmts = formatos.length ? formatos : ["Mãos + voz"];
  return ganchos(p)
    .slice(0, 10)
    .map((g, i) => ({
      gancho: g,
      meio: `Mostre na tela uma parte de ${p.aPt} ou um passo do produto, sem explicar demais.`,
      chamada: { x: l.call, pt: PT.call },
      formato: fmts[i % fmts.length]!,
    }));
}

export function bioLegenda(p: ProdutoBase) {
  const l = LG[p.lang];
  return {
    bio: { x: l.bio(p.prom.x), pt: PT.bio(p.prom.pt) },
    legenda: { x: l.leg, pt: PT.leg, tags: p.tags },
    chamadas: l.chamadas.map((x, i) => ({ x, pt: PT.chamadas[i]! })),
  };
}

/** Cores de fundo dos criativos (protótipo: CORES). */
export const CORES = ["#3B2F5C", "#2F4A5C", "#5C3B2F", "#2F5C45"];
