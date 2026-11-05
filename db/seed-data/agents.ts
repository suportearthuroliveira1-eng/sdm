/**
 * Agentes (seção 6 do prompt). Prompts de sistema ficam PENDENTES até copiar
 * as regras de conteúdo da seção 10 do contexto v6. Todos inativos.
 */
export const AGENTS = [
  { id: "AGT-diagnostico", nome: "Diagnóstico", classe: "text_cheap", maxTokens: 1200 },
  { id: "AGT-recomendacao", nome: "Recomendação", classe: "text_cheap", maxTokens: 1200 },
  { id: "AGT-montador", nome: "Montador (kit)", classe: "text_mid", maxTokens: 6000 },
  { id: "AGT-conferencia", nome: "Conferência da página", classe: "text_cheap", maxTokens: 1200 },
  { id: "AGT-anuncios", nome: "Anúncios", classe: "text_cheap", maxTokens: 1500 },
  { id: "AGT-roteiros", nome: "Roteiros", classe: "text_cheap", maxTokens: 2500 },
  { id: "AGT-fichas", nome: "Fichas", classe: "text_cheap", maxTokens: 1500 },
  { id: "AGT-professora", nome: "Professora", classe: "text_cheap", maxTokens: 800 },
  { id: "AGT-diag-funil", nome: "Diagnóstico do funil", classe: "text_cheap", maxTokens: 1200 },
  { id: "AGT-ebook", nome: "Ebook", classe: "text_mid", maxTokens: 6000 },
] as const;

export const PENDING_PROMPT =
  "[PENDENTE] Copiar as regras de conteúdo da seção 10 do docs/SDM_contexto_completo_v6.md (voz da Amanda, fé com moderação, lista do nunca, texto sem cara de IA) e a tarefa específica deste agente.";
