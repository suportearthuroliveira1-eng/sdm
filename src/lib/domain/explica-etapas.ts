/** Explicação didática de cada passo do produto próprio (fluxograma do "Entenda"). */
export const EXPLICA_PROPRIO: { slug: string; voce: string; ia: string; olha: string }[] = [
  { slug: "ideias", voce: "Escolhe 1 entre 3 ideias (ou manda a sua pra IA avaliar).", ia: "Sugere 3 ideias de ebook ligadas ao que você gosta, com o porquê de cada uma.", olha: "Seus assuntos, o seu tempo, a sua experiência e o que já está saturado." },
  { slug: "ficha", voce: "Responde 3 perguntas curtas (a IA pode escrever um rascunho).", ia: "Completa a ficha: pra quem é, a dor, a promessa, objeções e ganchos.", olha: "A ideia escolhida e o que você contou. Prova só se você contou: nada inventado." },
  { slug: "oferta", voce: "Confere nome, promessa e preço. Muda o que quiser e aprova.", ia: "Monta a oferta: nome, promessa honesta, preço sugerido com o porquê, bônus e garantia.", olha: "A ficha do produto e o que costuma funcionar pra ebook curto." },
  { slug: "mercado", voce: "Escolhe pra quem vender: país e idioma.", ia: "A partir daqui escreve no idioma de quem compra, sempre com tradução pra você.", olha: "A sugestão do seu diagnóstico (onde você mora e o que você fala)." },
  { slug: "ebook", voce: "Aprova o sumário, escolhe o estilo da capa e baixa o PDF.", ia: "Escreve o sumário e cada capítulo, um por um, com a tradução do lado.", olha: "A ficha, a oferta, o tom que você escolheu e o tamanho do ebook." },
  { slug: "revisao", voce: "Confere um checklist antes de vender.", ia: "Nada: aqui é você quem aprova.", olha: "Promessa exagerada, cura, ganho e coisa copiada (você confere)." },
  { slug: "pagina", voce: "Lê, edita bloco por bloco e aprova.", ia: "Escreve a página de vendas com o porquê de cada bloco.", olha: "Ficha + oferta + o formato (página, pré-venda ou quiz)." },
  { slug: "plataforma", voce: "Cria a conta na plataforma, sobe o ebook e pega o link do checkout.", ia: "Te mostra o passo a passo e confere o link.", olha: "Se o link abre e chega no pagamento." },
  { slug: "conta", voce: "Abre a conta pra receber.", ia: "Explica qual conta e como abrir.", olha: "O país que você escolheu." },
  { slug: "teste", voce: "Faz o caminho do cliente até a compra.", ia: "Te guia no teste.", olha: "Página, botão, checkout e entrega do ebook." },
];

/** "Como a IA pensa": os passos de raciocínio mostrados antes de começar. */
export const COMO_A_IA_PENSA = [
  { t: "Junta o que você sabe com o que as pessoas procuram", d: "Ela começa pelo que você gosta e entende. Produto de assunto que você domina é mais fácil de criar e de divulgar." },
  { t: "Escolhe um problema pequeno e específico", d: "Ebook curto vende quando resolve uma coisa só, bem explicada. Nada de \"guia de tudo\"." },
  { t: "Escreve uma promessa honesta", d: "Sem cura, sem ganho garantido, sem número inventado. Faltou dado, ela deixa [valor] pra você completar." },
  { t: "Confere as regras antes de te mostrar", d: "Toda resposta passa por uma checagem. Se falhar, ela refaz sozinha." },
];
