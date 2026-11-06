/** Ícones de linha (24px, stroke = currentColor). Sem emoji (regra 8). */
const PATHS = {
  lampada: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z",
  ficha: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5",
  etiqueta: "M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01",
  globo: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z",
  livro: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13",
  escudo: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3zM8.5 12l2.5 2.5 4.5-5",
  pagina: "M4 4h16v16H4zM4 9h16M8 13h8M8 16h5",
  carrinho: "M3 4h2l2.4 10.5a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6M9 20h.01M17 20h.01",
  carteira: "M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14h.01",
  teste: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3",
  megafone: "M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12",
  grafico: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  pessoa: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  play: "M8 5v14l11-7z",
  olho: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  kit: "M4 7h16v13H4zM9 7V4h6v3M4 12h16",
  regras: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01",
  cerebro: "M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4H9zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4h1z",
  varinha: "M5 19L17 7M14 4l1-2 1 2 2 1-2 1-1 2-1-2-2-1zM19 11l.7-1.3L21 9l-1.3-.7L19 7l-.7 1.3L17 9l1.3.7z",
  passos: "M5 20h4v-4h4v-4h4V8h3",
  check: "M5 12.5l4.5 4.5L19 7",
  seta: "M5 12h14M13 6l6 6-6 6",
  idioma: "M4 5h9M8.5 3v2M6 5c.5 3 2.5 5.5 5 7M11 5c-.8 3.5-3 6.5-6.5 8.5M13 21l4-9 4 9M14.5 18h5",
} as const;
export type NomeIcone = keyof typeof PATHS;

export function Icone({ nome, tamanho = 20, className = "", espessura = 1.8 }: { nome: NomeIcone; tamanho?: number; className?: string; espessura?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={espessura} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d={PATHS[nome]} />
    </svg>
  );
}
