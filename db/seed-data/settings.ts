/**
 * Configurações iniciais (AD11). `pendente: true` = depende de decisão da dona
 * do produto (contexto v6 seção 13) — nenhum valor de produto inventado.
 */
export type SeedSetting = { key: string; value: unknown; grupo: string; descricao: string; pendente?: boolean };

export const SETTINGS: SeedSetting[] = [
  // flags
  { key: "auth_hubla_webhook", value: false, grupo: "flags", descricao: "Processa compras da Hubla automaticamente. Com false, eventos são só guardados." },
  { key: "auth_hotmart_webhook", value: false, grupo: "flags", descricao: "Adaptador Hotmart (teste A/B Hubla × Hotmart)." },
  { key: "whatsapp_auto_send", value: false, grupo: "flags", descricao: "Envia o link de acesso por WhatsApp sozinho após a compra." },
  { key: "feature_ebook_unlock", value: "after_first_sale", grupo: "flags", descricao: "Ebook: after_first_sale | always | off." },
  { key: "grupo_modo", value: null, grupo: "flags", descricao: "Grupo: interno | externo (tela I04).", pendente: true },

  // acesso
  { key: "cadastro_aberto", value: true, grupo: "acesso", descricao: "Qualquer pessoa cria conta com e-mail e senha e já ganha acesso SDM. Desligue quando a Hubla liberar as compras." },
  { key: "access_link_hours", value: 72, grupo: "acesso", descricao: "Validade do link de acesso, em horas." },
  {
    key: "msg_acesso_whatsapp",
    value:
      "Oi, {nome}! Seu acesso ao app do SDM está pronto. Toque no link pra entrar (vale por {horas}h e funciona uma vez):\n{link}\n\nDepois de entrar, siga o passo a passo pra instalar o app no seu celular.",
    grupo: "acesso",
    descricao: "Mensagem pronta pro WhatsApp. Variáveis: {nome}, {link}, {horas}.",
  },
  { key: "suporte_contato", value: null, grupo: "acesso", descricao: "Contato do suporte mostrado na A02.", pendente: true },

  // funil / página
  { key: "PAGE_TOOL_NAME", value: "[a definir]", grupo: "funil", descricao: "Ferramenta externa onde a aluna monta a página.", pendente: true },
  { key: "sdm_page_templates", value: { pre: null, quiz: null }, grupo: "funil", descricao: "Links dos modelos do SDM na ferramenta de página.", pendente: true },

  // IA — conferidos em developers.openai.com/api/docs/pricing em 2026-11-05 (mais baratos que atendem cada tarefa).
  {
    key: "ai_models",
    value: { text_cheap: "gpt-6-luna", text_mid: "gpt-6.1-terra", image: "gpt-image-1-mini", embedding: "text-embedding-3-small" },
    grupo: "ia",
    descricao: "Modelos por classe. text_cheap: diagnóstico, ideias, ficha, anúncios, roteiros, professora. text_mid: oferta, ebook, página. Preços em ai_prices.",
  },
  { key: "ai_prices", value: { "gpt-6-luna": [0.1, 0.01, 0.5], "gpt-6.1-terra": [1, 0.05, 5] }, grupo: "ia", descricao: "US$ por 1M tokens: [entrada, entrada em cache, saída]. Usado no custo do AD12." },
  { key: "quota_ia_dia", value: 200, grupo: "ia", descricao: "Chamadas de IA por aluna por dia (texto)." },
  { key: "ai_budget_usd", value: null, grupo: "ia", descricao: "Teto mensal de custo de IA (alerta no AD12).", pendente: true },
  { key: "quota_professora_dia", value: null, grupo: "ia", descricao: "Mensagens por aluna por dia na professora.", pendente: true },
  { key: "quota_imagens_dia", value: null, grupo: "ia", descricao: "Imagens por aluna por dia.", pendente: true },
  { key: "quota_ebooks_mes", value: null, grupo: "ia", descricao: "Ebooks por aluna por mês.", pendente: true },
  { key: "image_quality_default", value: "low", grupo: "ia", descricao: "Qualidade padrão das imagens: low | medium." },

  // regras pendentes (contexto seção 13)
  { key: "verba_minima", value: null, grupo: "regras", descricao: "Verba mínima de anúncio.", pendente: true },
  { key: "regras_pausa", value: null, grupo: "regras", descricao: "Quando pausar um anúncio.", pendente: true },
  { key: "escada_escala", value: null, grupo: "regras", descricao: "Escada de escala.", pendente: true },
  { key: "dias_aprendizado", value: null, grupo: "regras", descricao: "Dias de aprendizado da campanha.", pendente: true },
  { key: "dias_aquecimento", value: null, grupo: "regras", descricao: "Dias de aquecimento do perfil.", pendente: true },
  { key: "frequencia_posts", value: null, grupo: "regras", descricao: "Frequência de posts no orgânico.", pendente: true },
  { key: "comissao_modelo", value: null, grupo: "regras", descricao: "Comissão CPA ou %.", pendente: true },
  { key: "rede_afiliacao", value: null, grupo: "regras", descricao: "Rede de afiliação principal.", pendente: true },
  { key: "validacao_primeira_venda", value: null, grupo: "regras", descricao: "Como a 1ª venda é validada (libera M7).", pendente: true },
];
