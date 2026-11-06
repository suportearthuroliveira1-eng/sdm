/** Textos padrão do primeiro acesso. O admin pode trocar em Personalizar → Fluxo e textos (setting `textos_app`). */
export const CAMINHOS_PADRAO = [
  { k: "afiliada", t: "Ser afiliada do SDM", o: "Você divulga o próprio SDM com o kit pronto do time e ganha comissão [valor] por venda.", tempo: "É o mais rápido pra começar: o produto e as peças já existem.", dinheiro: "Não precisa criar nada. Anúncio é opcional.", quem: "Pra quem quer começar logo, sem criar produto." },
  { k: "produto", t: "Criar meu produto com a IA", o: "A IA te ajuda a criar um ebook simples sobre um assunto que você conhece, com página de vendas.", tempo: "Leva mais passos: ideia, ficha, oferta, ebook, página e plataforma.", dinheiro: "Não precisa de dinheiro pra criar. A venda é toda sua.", quem: "Pra quem quer ter o próprio produto." },
  { k: "ambos", t: "Os dois", o: "Começa como afiliada do SDM e, em paralelo, cria o seu produto com a IA.", tempo: "Pede mais tempo por dia.", dinheiro: "Igual aos dois de cima.", quem: "Pra quem tem 2 horas ou mais por dia." },
] as const;

export const SDM_FAZ = [
  "Explica cada passo antes de pedir, em aula curta.",
  "A IA escreve no idioma do cliente e mostra o português do lado.",
  "O app mostra sempre um próximo passo só.",
  "O time responde quando você travar.",
];
export const VOCE_FAZ = [
  "Eu vou dar um passo por dia, mesmo que pequeno.",
  'Eu vou fazer o "Agora faça" de cada aula antes de seguir.',
  "Eu vou perguntar quando travar, em vez de sumir.",
  "Eu vou até o fim do meu caminho.",
];

export const BOAS_VINDAS_PADRAO = { titulo: "Que bom que você chegou, {nome}", texto: "Antes de tudo, um recado da Amanda pra você." };
