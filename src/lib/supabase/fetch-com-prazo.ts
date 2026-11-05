/**
 * fetch com prazo pros clientes do Supabase: sem isso, uma chamada de Auth
 * que não responde segura a tela pra sempre.
 */
export const fetchComPrazo: typeof fetch = (input, init) =>
  fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(10_000) });
