/**
 * Rastreamento (TRACKING_API_KEY). Serviço [a confirmar com a dona do produto].
 * Adaptador vazio até a confirmação: não envia nada.
 */
export type TrackingEvent =
  | { type: "bio_click"; studentProductCode: string; rede?: string; post?: string; ts: Date }
  | { type: "sale"; studentProductCode: string; valor?: number; moeda?: string; ts: Date };

export interface TrackingProvider {
  name: string;
  track(ev: TrackingEvent): Promise<void>;
}

export const noopTracking: TrackingProvider = { name: "noop", async track() {} };

export function trackingProvider(): TrackingProvider {
  return noopTracking;
}
