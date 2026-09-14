#!/usr/bin/env node
// Backup semanal de Supabase a Cloudflare R2.
//
// Uso: node scripts/backup-supabase-to-r2.mjs
//
// Env requeridas:
//   SUPABASE_DB_URL         postgres://... (Settings > Database > Connection string > URI + password)
//   CLOUDFLARE_API_TOKEN    token con permiso R2:Edit
//   CLOUDFLARE_ACCOUNT_ID   ID de la cuenta
//   R2_BUCKET               bucket destino (default: canntrace-backups)
//
// Requisitos locales: pg_dump (PostgreSQL client 15+) y wrangler (`npm i -g wrangler`).

import { execSync, spawnSync } from 'node:child_process'
import { mkdirSync, existsSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { tmpdir } from 'node:os'

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const R2_BUCKET = process.env.R2_BUCKET || 'canntrace-backups'

if (!SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL requerida')
if (!CLOUDFLARE_API_TOKEN) throw new Error('CLOUDFLARE_API_TOKEN requerida')

// Fecha YYYY-MM-DD-HHMM para la key
const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
const basename = `canntrace-${stamp}.sql`
const gzName = `${basename}.gz`

const tmp = mkdirSync(join(tmpdir(), `canntrace-backup-${stamp}`), { recursive: true })
const dumpPath = join(tmp || tmpdir(), basename)
const gzPath = join(tmp || tmpdir(), gzName)

console.log(`[backup] Ejecutando pg_dump → ${dumpPath}`)
const res = spawnSync('pg_dump', [
  '--no-owner',
  '--no-privileges',
  '--clean',
  '--if-exists',
  '--file', dumpPath,
  SUPABASE_DB_URL,
], { stdio: 'inherit' })
if (res.status !== 0) throw new Error('pg_dump fallo - verifica que este instalado y la URL sea correcta')

console.log('[backup] Comprimiendo con gzip...')
const raw = readFileSync(dumpPath)
const gz = gzipSync(raw, { level: 9 })
const { writeFileSync } = await import('node:fs')
writeFileSync(gzPath, gz)
const sizeMB = (gz.length / 1024 / 1024).toFixed(2)
console.log(`[backup] SQL original: ${(raw.length / 1024 / 1024).toFixed(2)} MB → gzip: ${sizeMB} MB`)

// Upload via wrangler R2
console.log(`[backup] Subiendo a R2 bucket=${R2_BUCKET} key=${gzName}...`)
const key = `weekly/${gzName}`
const env = { ...process.env, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID: CLOUDFLARE_ACCOUNT_ID || '' }
const up = spawnSync('npx', ['wrangler', 'r2', 'object', 'put', `${R2_BUCKET}/${key}`, '--file', gzPath, '--remote'], {
  stdio: 'inherit',
  env,
  shell: true,
})
if (up.status !== 0) throw new Error('wrangler r2 object put fallo')

// Cleanup archivos locales
try { unlinkSync(dumpPath); unlinkSync(gzPath) } catch {}

console.log(`[backup] OK - ${R2_BUCKET}/${key} (${sizeMB} MB)`)

// Opcional: listar los ultimos 10 backups para sanity
try {
  const list = execSync(`npx wrangler r2 object list ${R2_BUCKET} --prefix weekly/ --remote`, { env }).toString()
  console.log('[backup] Ultimos backups:\n' + list.split('\n').slice(-12).join('\n'))
} catch {}
