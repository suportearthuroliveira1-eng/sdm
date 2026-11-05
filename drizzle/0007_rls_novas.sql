-- RLS nas tabelas novas (sem política = só servidor/service role).
ALTER TABLE public.kit_pieces ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY kit_read ON public.kit_pieces FOR SELECT TO authenticated USING (ativo);
