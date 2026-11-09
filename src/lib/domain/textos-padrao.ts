/** Textos padrão do primeiro acesso. O admin pode trocar em Personalizar → Fluxo e textos (setting `textos_app`). */
export const CAMINHOS_PADRAO = [
  { k: "afiliada", t: "Ser afiliada do SDM", o: "Você divulga o SDM com o kit pronto e ganha comissão [valor] por venda.", tempo: "É o mais rápido pra começar: o produto e as peças já existem.", dinheiro: "Não precisa criar nada. Anúncio é opcional.", quem: "Pra quem quer começar logo, sem criar produto." },
  { k: "produto", t: "Criar meu produto com a IA", o: "A IA te ajuda a criar um ebook curto sobre algo que você conhece.", tempo: "Leva mais passos: ideia, ficha, oferta, ebook, página e plataforma.", dinheiro: "Não precisa de dinheiro pra criar. A venda é toda sua.", quem: "Pra quem quer ter o próprio produto." },
  { k: "ambos", t: "Os dois", o: "Começa como afiliada e, junto, cria o seu produto com a IA.", tempo: "Pede mais tempo por dia.", dinheiro: "Igual aos dois de cima.", quem: "Pra quem tem 2 horas ou mais por dia." },
] as const;

export const SDM_FAZ = [
  "Explica antes, em aula curta.",
  "A IA escreve no idioma do cliente, com tradução.",
  "Mostra um passo de cada vez.",
  "Responde quando você travar.",
];
export const VOCE_FAZ = [
  "Dou um passo por dia.",
  'Faço o "Agora faça" de cada aula.',
  "Pergunto quando travar.",
  "Vou até o fim.",
];

export const BOAS_VINDAS_PADRAO = { titulo: "Que bom que você chegou, {nome}", texto: "Antes de tudo, um recado da Amanda pra você." };
