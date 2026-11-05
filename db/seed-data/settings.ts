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

  // IA — nomes NÃO conferidos na doc da OpenAI (rede bloqueada no dev). Conferir antes de ligar.
  {
    key: "ai_models",
    value: { text_cheap: "[conferir]", text_mid: "[conferir]", image: "[conferir]", embedding: "[conferir]" },
    grupo: "ia",
    descricao: "Modelos por classe. text_cheap: professora, fichas, checagens, ganchos. text_mid: kit e ebook.",
    pendente: true,
  },
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
