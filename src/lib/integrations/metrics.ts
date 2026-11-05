/**
 * Números das campanhas/perfis. Conexão automática (Meta etc.) fica pra depois;
 * agora valem o modo manual e o print (Fase 5).
 */
export type MetricsSnapshot = {
  data: string; // YYYY-MM-DD
  gasto?: number;
  cpm?: number;
  ctr?: number;
  cpc?: number;
  vendas?: number;
  views?: number;
  retencao?: number;
  seguidores?: number;
  comentarios?: number;
};

export interface MetricsProvider {
  name: "manual" | "print" | "conexao";
  fetch(studentProductId: string, desde: string, ate: string): Promise<MetricsSnapshot[]>;
}

export const manualMetrics: MetricsProvider = {
  name: "manual",
  async fetch() {
    return []; // dados vêm do formulário (metrics_entries)
  },
};
