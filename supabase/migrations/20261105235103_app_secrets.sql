-- gerado de drizzle/0008_app_secrets.sql por pnpm db:supabase. Não edite aqui.
CREATE TABLE "app_secrets" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Só o servidor lê: RLS ligado, sem política, e sem acesso pros papéis da API.
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_secrets FROM anon, authenticated;
