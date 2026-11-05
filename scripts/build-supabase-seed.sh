#!/usr/bin/env bash
# pnpm db:supabase-seed — gera supabase/seed.sql (settings, agentes, módulos,
# aulas, glossário, vitrine de exemplo e textos) a partir de um banco local já
# semeado (SEED_DB_URL). Idempotente: ON CONFLICT DO NOTHING.
set -euo pipefail
: "${SEED_DB_URL:?defina SEED_DB_URL apontando pro banco local semeado}"
{
  echo "-- gerado por scripts/build-supabase-seed.sh a partir de db/seed-data. Não edite aqui."
  pg_dump "$SEED_DB_URL" --data-only --inserts --on-conflict-do-nothing --no-owner --no-privileges \
    -t public.settings -t public.agents -t public.modules -t public.lessons -t public.glossary \
    -t public.vitrine_products -t public.content_blocks \
    | grep -v -E '^(SET |SELECT pg_catalog\.set_config|--|\\(un)?restrict |$)'
  echo "SELECT setval('public.vit_seq', GREATEST((SELECT max(substring(code from 5)::int) FROM public.vitrine_products), 1));"
} > supabase/seed.sql
echo "supabase/seed.sql: $(grep -c '^INSERT' supabase/seed.sql) linhas"
