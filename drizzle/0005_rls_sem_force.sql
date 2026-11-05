-- O servidor conecta como dono das tabelas (postgres). Com FORCE, o RLS valeria
-- até pro dono e poderia barrar o próprio app no Supabase. Sem FORCE: dono e
-- service role ignoram RLS (checagem de papel no código); anon/authenticated seguem com RLS.
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '\_\_%' LOOP
    EXECUTE format('ALTER TABLE public.%I NO FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
