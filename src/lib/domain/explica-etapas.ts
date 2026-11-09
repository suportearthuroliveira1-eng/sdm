/**
 * Explicação simples de cada etapa ("O que é isso?"), mostrada no topo da etapa.
 * Linguagem de quem nunca vendeu nada: o que é, pra que serve, um exemplo, quem faz o quê.
 */
export type GuiaEtapa = { oQueE: string; praQue: string; exemplo?: string; voce: string; ia: string };

const COMUM: Record<string, GuiaEtapa> = {
  conta: { oQueE: "A conta onde o dinheiro das vendas cai.", praQue: "Quem compra paga em dólar (ou euro). Você precisa de uma conta que receba nessa moeda e mande pro Brasil quando quiser.", voce: "Abre a conta, seguindo o passo a passo.", ia: "Nada aqui: é só você. O app mostra o caminho." },
  divulgar: { oQueE: "O jeito que as pessoas vão ficar sabendo do produto.", praQue: "Sem divulgação ninguém compra. Anúncio pago é mais rápido, mas custa. Vídeo orgânico é de graça, mas demora mais.", exemplo: "Pago: você paga a Meta pra mostrar um anúncio. Orgânico: você posta vídeos no Instagram ou TikTok.", voce: "Escolhe pago, orgânico ou os dois.", ia: "Sugere o melhor caminho a partir do seu diagnóstico." },
  "base-anuncios": { oQueE: "A estrutura que a Meta exige antes de anunciar.", praQue: "Sem perfil seguro, portfólio e conta de anúncios, a Meta bloqueia. Fazer certo uma vez evita dor de cabeça.", voce: "Segue o checklist e marca o que fez.", ia: "Nada aqui: são configurações na Meta." },
  criativos: { oQueE: "As peças do anúncio: imagem e texto.", praQue: "É o que a pessoa vê rolando o feed. Um bom criativo faz parar e clicar.", voce: "Escolhe, baixa e sobe na Meta.", ia: "Escreve os textos e cria as imagens." },
  pixel: { oQueE: "Um código que conta quem clicou e quem comprou.", praQue: "Com ele a Meta aprende quem compra e mostra o anúncio pra pessoas parecidas.", voce: "Instala seguindo o passo a passo.", ia: "Nada aqui: o app só confere." },
  numeros: { oQueE: "Os resultados da sua campanha.", praQue: "Os números dizem se é pra continuar, mudar ou pausar.", voce: "Digita os números que aparecem na Meta.", ia: "Lê e diz o próximo passo." },
  perfil: { oQueE: "A sua vitrine na rede social.", praQue: "Quem gosta do vídeo olha o perfil antes de clicar. Bio clara e link certo fazem a pessoa comprar.", voce: "Ajusta nome, bio e link.", ia: "Escreve a bio e monta a página de links." },
  roteiros: { oQueE: "O texto de cada vídeo, cena por cena.", praQue: "Com roteiro você grava rápido e não trava. Dá pra fazer sem aparecer.", voce: "Grava e posta.", ia: "Escreve os roteiros e os ganchos do começo." },
  "numeros-org": { oQueE: "Visualizações e cliques de cada vídeo.", praQue: "Mostra qual vídeo funcionou pra você fazer mais parecidos.", voce: "Digita os números de cada vídeo.", ia: "Aponta o vídeo campeão." },
};

const PROPRIO: Record<string, GuiaEtapa> = {
  ideias: { oQueE: "O assunto do seu ebook.", praQue: "Ebook bom resolve um problema pequeno de um jeito simples. Assunto que você já conhece é mais fácil de criar e de vender.", exemplo: "\"Maquiagem em 10 minutos com 5 produtos\" em vez de \"tudo sobre maquiagem\".", voce: "Escolhe 1 entre 3 ideias, ou manda a sua.", ia: "Sugere 3 ideias ligadas ao que você gosta, com o porquê." },
  ficha: { oQueE: "O RG do seu produto.", praQue: "Diz pra quem é, qual problema resolve e o que promete. Tudo depois sai daqui: oferta, ebook, página e anúncios.", exemplo: "Pra quem: mães sem tempo. Dor: não sabem se arrumar rápido. Promessa: maquiagem pronta em 10 minutos.", voce: "Confere e corrige o que quiser.", ia: "Escreve a ficha inteira (ou usa o que você contar)." },
  oferta: { oQueE: "O pacote que a pessoa compra.", praQue: "Não é só o ebook: é o nome, a promessa, o preço, os bônus e a garantia. Uma oferta clara faz a pessoa sentir que vale a pena.", exemplo: "Ebook + checklist de bônus por US$ 9, com 7 dias de garantia.", voce: "Confere, muda o que quiser e aprova.", ia: "Monta tudo com um preço baixo, fácil de comprar." },
  mercado: { oQueE: "Pra quem você vai vender: país e idioma.", praQue: "Vender em dólar ou euro rende mais. O ebook e a página saem no idioma de quem compra, com tradução pra você.", voce: "Escolhe o país (o app já sugere).", ia: "Passa a escrever no idioma escolhido." },
  ebook: { oQueE: "O produto em si: um PDF curto e bonito.", praQue: "É o que a pessoa recebe depois de pagar. Curto e direto: ela lê num dia e já usa.", voce: "Aprova o sumário, escolhe a capa e baixa.", ia: "Escreve cada capítulo, com tradução do lado." },
  revisao: { oQueE: "Uma conferida final antes de vender.", praQue: "Garante que o ebook entrega o que promete e que não tem promessa proibida (cura, ganho garantido).", voce: "Lê e marca o checklist.", ia: "Nada: aqui quem aprova é você." },
  pagina: { oQueE: "A página que convence a pessoa a comprar.", praQue: "Quem clica no anúncio cai aqui. Ela explica o problema, mostra a solução e leva pro botão de compra.", voce: "Lê, edita e copia pra ferramenta de página.", ia: "Escreve a página bloco por bloco." },
  plataforma: { oQueE: "Onde a pessoa paga e recebe o ebook.", praQue: "A plataforma cobra, entrega o PDF por e-mail e te repassa o dinheiro.", voce: "Cria a conta, cadastra o produto e cola o link do pagamento.", ia: "Confere se o link abre." },
  teste: { oQueE: "Você fazendo o caminho de quem compra.", praQue: "Pra ter certeza de que nada quebra: página, botão, pagamento e entrega.", voce: "Faz uma compra teste e marca cada passo.", ia: "Nada: o app só te guia." },
};

const SDM: Record<string, GuiaEtapa> = {
  afiliacao: { oQueE: "O pedido pra vender o SDM como afiliada.", praQue: "Afiliada vende o produto de outra pessoa e ganha uma comissão por venda. Você não cria nada.", voce: "Pede a afiliação.", ia: "Nada: o time aprova." },
  link: { oQueE: "O seu link de afiliada.", praQue: "É ele que marca que a venda veio de você. Sem o link certo, a comissão não cai.", voce: "Copia e usa um link por canal.", ia: "Nada: o app gera os links." },
  kit: { oQueE: "Peças prontas pra divulgar.", praQue: "Você não começa do zero: o time já entrega textos e imagens que funcionam.", voce: "Escolhe e baixa.", ia: "Adapta pro seu país, sem mudar a promessa." },
  regras: { oQueE: "As regras da afiliação.", praQue: "Protegem a sua conta e a marca. Quebrar uma regra pode cortar a comissão.", voce: "Lê e marca que entendeu.", ia: "Nada aqui." },
};

/** Guia da etapa pro tipo de pasta (proprio, sdm/vitrine). Sem guia: null. */
export function guiaEtapa(tipo: string, slug: string): GuiaEtapa | null {
  if (slug === "entenda") return null;
  return (tipo === "proprio" ? PROPRIO[slug] : SDM[slug]) ?? COMUM[slug] ?? null;
}
