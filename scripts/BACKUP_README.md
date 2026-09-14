# Backup Supabase → Cloudflare R2

Script de backup semanal automatico. Dump completo de Postgres → gzip → R2 bucket.

## Setup inicial (una sola vez)

### 1. Crear bucket R2

```bash
CLOUDFLARE_API_TOKEN="cfut_..." npx wrangler r2 bucket create canntrace-backups
```

### 2. Obtener DATABASE_URL de Supabase

Supabase Dashboard → **Settings** → **Database** → **Connection string** → **URI** (con password). Formato:

```
postgres://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres
```

### 3. Configurar secrets en GitHub

Repo → **Settings** → **Secrets and variables** → **Actions** → New:

- `SUPABASE_DB_URL` (URI completa con password)
- `CLOUDFLARE_API_TOKEN` (el mismo del deploy de Pages)
- `CLOUDFLARE_ACCOUNT_ID` (Cloudflare dashboard → account ID en sidebar)

## Uso manual local

```bash
export SUPABASE_DB_URL="postgres://..."
export CLOUDFLARE_API_TOKEN="cfut_..."
export CLOUDFLARE_ACCOUNT_ID="..."
node scripts/backup-supabase-to-r2.mjs
```

Requiere `pg_dump` instalado (PostgreSQL client 15+). En Windows: `winget install PostgreSQL.PostgreSQL` o instalar desde postgresql.org.

## Schedule automatico

El workflow `.github/workflows/backup-supabase.yml` corre **cada domingo 03:00 UTC (00:00 ARG)**.

Trigger manual: **Actions** tab → "Backup Supabase → R2" → **Run workflow**.

## Restore

```bash
# Descargar dump
npx wrangler r2 object get canntrace-backups/weekly/canntrace-2026-04-20-0300.sql.gz --file restore.sql.gz --remote
gunzip restore.sql.gz

# Aplicar en un proyecto nuevo o de prueba
psql "$DATABASE_URL_DESTINO" < restore.sql
```

## Retention

El workflow no borra backups viejos — hacerlo manual desde dashboard R2 o con `wrangler r2 object delete`. Por defecto R2 cobra ~USD 0.015 / GB / mes, con 10GB gratis. Un dump de CannTrace pesa ~5-20 MB comprimido, asi que 52 backups / año = ~1 GB = gratis.
