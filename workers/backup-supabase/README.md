# CannTrace Backup Worker

Worker Cloudflare que corre cada **domingo 03:00 UTC** y respalda todas las tablas publicas de Supabase a R2.

**Ventaja vs GitHub Action**: 100% en Cloudflare, no depende de GitHub, no hay limite de minutos, observability incluido.

## Setup (una sola vez)

```bash
cd workers/backup-supabase
npm install

# Crear bucket R2 (si no existe)
CLOUDFLARE_API_TOKEN="cfut_..." npx wrangler r2 bucket create canntrace-backups

# Setear secrets (service_role de Supabase - dashboard > Settings > API)
npx wrangler secret put SUPABASE_URL
#   Pega: https://sqdqvhjlmdweuuncwlfb.supabase.co
npx wrangler secret put SUPABASE_SERVICE_KEY
#   Pega: eyJhbGc... (service_role key)
npx wrangler secret put ADMIN_TOKEN
#   Pega un token random para disparos manuales

# Deploy
npm run deploy
```

## Trigger manual

```bash
curl -H "X-Manual-Trigger: <tu-ADMIN_TOKEN>" https://canntrace-backup.<tu-subdominio>.workers.dev
```

## Ver logs

```bash
npx wrangler tail canntrace-backup
```

O desde el dashboard de Cloudflare Workers → Observability.

## Restore

```bash
# Descargar el backup
npx wrangler r2 object get canntrace-backups/weekly/canntrace-2026-04-20-0300.ndjson.gz --file backup.ndjson.gz --remote
gunzip backup.ndjson.gz

# backup.ndjson contiene una tabla por linea. Cada linea es JSON con { tabla, count, rows }.
# Para restaurar una tabla especifica:
cat backup.ndjson | jq -r 'select(.tabla=="lotes") | .rows[]' > lotes.json

# Despues usar supabase-js o psql para importar
```

## Que se respalda

Allowlist en `src/index.ts` — 17 tablas core de CannTrace (lotes, operaciones, registros, SOPs, etc). Deliberadamente NO incluye:

- `audit_log` (append-only, puede ser gigante - respaldar aparte si hace falta)
- Tablas Supabase internas (`_realtime`, `pg_*`)

## Retention

El Worker no borra backups viejos. Configurar lifecycle rules en R2 dashboard (ej: transicionar a storage infrequent despues de 30 dias, eliminar despues de 1 año).
