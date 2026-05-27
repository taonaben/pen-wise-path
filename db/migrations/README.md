# PenSmart database migrations

These migrations are NOT auto-applied. Provision your own Supabase project, then run:

1. `001_create_core_schema.sql`
2. `002_create_rls_policies.sql`

You can run them via the Supabase SQL editor or with `psql`:

```
psql "$DATABASE_URL" -f db/migrations/001_create_core_schema.sql
psql "$DATABASE_URL" -f db/migrations/002_create_rls_policies.sql
```

Add your project URL and anon key to `.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
