-- RLS em todas as tabelas (prompt seção 4).
-- Aluna (role authenticated, via anon key + JWT do Supabase) só lê/escreve o que é dela.
-- Admin e jobs usam o servidor (service role / DATABASE_URL), que ignora RLS,
-- sempre com checagem de papel no código (src/lib/auth/admin.ts).
--
-- Requer o schema `auth` do Supabase (auth.uid()). Em teste local,
-- scripts/test-db/supabase-stub.sql cria um stub.

CREATE OR REPLACE FUNCTION public.current_student_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.students WHERE auth_user_id = auth.uid() AND ativo LIMIT 1
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.owns_student_product(sp uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.student_products p WHERE p.id = sp AND p.student_id = public.current_student_id())
$$;--> statement-breakpoint

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'students','entitlements','access_links','hubla_product_map','events','diagnostics',
    'vitrine_products','favorites','student_products','generated_items','images','ebooks',
    'modules','lessons','lesson_progress','metrics_entries','link_clicks','sales','profit_weeks',
    'chat_messages','support_tickets','weekly_banks','glossary','content_blocks','knowledge_chunks',
    'agents','ai_usage','settings','notifications','admin_users','audit_log','rate_limits'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;--> statement-breakpoint

-- Sem política = ninguém além do service role/owner:
-- access_links, hubla_product_map, events, knowledge_chunks, agents, ai_usage,
-- settings, admin_users, audit_log, rate_limits.

-- students: a própria linha
CREATE POLICY students_self_select ON public.students FOR SELECT TO authenticated USING (auth_user_id = auth.uid());--> statement-breakpoint
CREATE POLICY students_self_update ON public.students FOR UPDATE TO authenticated USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());--> statement-breakpoint

-- só leitura do que é dela
CREATE POLICY entitlements_self_select ON public.entitlements FOR SELECT TO authenticated USING (student_id = public.current_student_id());--> statement-breakpoint
CREATE POLICY notifications_self_select ON public.notifications FOR SELECT TO authenticated USING (student_id = public.current_student_id());--> statement-breakpoint

-- leitura e escrita do que é dela (por student_id)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['diagnostics','favorites','student_products','generated_items','images','ebooks',
                           'lesson_progress','profit_weeks','chat_messages','support_tickets'] LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (student_id = public.current_student_id()) WITH CHECK (student_id = public.current_student_id())', t || '_own', t);
  END LOOP;
END $$;--> statement-breakpoint

-- por student_product
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['metrics_entries','sales'] LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.owns_student_product(student_product_id)) WITH CHECK (public.owns_student_product(student_product_id))', t || '_own', t);
  END LOOP;
END $$;--> statement-breakpoint
CREATE POLICY link_clicks_own_select ON public.link_clicks FOR SELECT TO authenticated USING (public.owns_student_product(student_product_id));--> statement-breakpoint

-- conteúdo do app: leitura para alunas logadas
CREATE POLICY vitrine_read ON public.vitrine_products FOR SELECT TO authenticated USING (ativo);--> statement-breakpoint
CREATE POLICY modules_read ON public.modules FOR SELECT TO authenticated USING (true);--> statement-breakpoint
CREATE POLICY lessons_read ON public.lessons FOR SELECT TO authenticated USING (publicada);--> statement-breakpoint
CREATE POLICY glossary_read ON public.glossary FOR SELECT TO authenticated USING (true);--> statement-breakpoint
CREATE POLICY content_read ON public.content_blocks FOR SELECT TO authenticated USING (true);--> statement-breakpoint
CREATE POLICY banks_read ON public.weekly_banks FOR SELECT TO authenticated USING (ativo);
