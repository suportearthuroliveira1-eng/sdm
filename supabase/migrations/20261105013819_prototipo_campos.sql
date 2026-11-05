-- gerado de drizzle/0003_prototipo_campos.sql por pnpm db:supabase. Não edite aqui.
ALTER TABLE "lessons" ADD COLUMN "requer_entitlements" "entitlement_product"[] DEFAULT '{}'::entitlement_product[] NOT NULL;
ALTER TABLE "vitrine_products" ADD COLUMN "extra" jsonb DEFAULT '{}'::jsonb NOT NULL;