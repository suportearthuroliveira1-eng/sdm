/**
 * Valores PÚBLICOS do projeto, fixos no código a pedido da dona do projeto.
 * A URL e a chave "publishable" do Supabase vão pro navegador de qualquer
 * forma (o RLS é que protege os dados). Uma variável de ambiente com o mesmo
 * nome, se existir, tem prioridade.
 *
 * NUNCA coloque aqui: chave secret/service_role, senha do banco, OpenAI etc.
 */
export const SUPABASE_PROJECT_REF = "hcknrrgbmhnqtmenovmk";
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${SUPABASE_PROJECT_REF}.supabase.co`;
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable__cOm0wohkE66APzqsi_hdw_yRkr8oDZ";
