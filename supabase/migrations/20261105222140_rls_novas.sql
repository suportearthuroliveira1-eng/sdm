-- gerado de drizzle/0007_rls_novas.sql por pnpm db:supabase. Não edite aqui.
-- RLS nas tabelas novas (sem política = só servidor/service role).
ALTER TABLE public.kit_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY kit_read ON public.kit_pieces FOR SELECT TO authenticated USING (ativo);
