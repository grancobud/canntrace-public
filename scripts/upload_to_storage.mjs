import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, posix } from 'node:path'

const SUPA_URL = process.env.SUPABASE_URL
const ANON = process.env.SUPABASE_ANON_KEY
const BUCKET = 'canntrace-archivos'

if (!SUPA_URL || !ANON || !EMAIL || !PWD) {
  console.error('Faltan variables de entorno: SUPABASE_URL, SUPABASE_ANON_KEY, CANNTRACE_EMAIL, CANNTRACE_PASSWORD')
  process.exit(1)
}

const EMAIL = process.env.CANNTRACE_EMAIL
const PWD = process.env.CANNTRACE_PASSWORD

const MIME = {
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.md': 'text/markdown',
  '.sql': 'application/sql',
  '.ogg': 'audio/ogg',
  '.json': 'application/json',
  '.txt': 'text/plain',
}
const mime = p => MIME[p.slice(p.lastIndexOf('.')).toLowerCase()] || 'application/octet-stream'

async function login() {
  const r = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PWD }),
  })
  if (!r.ok) throw new Error('Login fail ' + r.status + ' ' + await r.text())
  const j = await r.json()
  return j.access_token
}

async function upload(token, localPath, remotePath) {
  const body = readFileSync(localPath)
  const url = `${SUPA_URL}/storage/v1/object/${BUCKET}/${remotePath}`
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': ANON,
      'Authorization': `Bearer ${token}`,
      'Content-Type': mime(localPath),
      'x-upsert': 'true',
    },
    body,
  })
  if (!r.ok) {
    const txt = await r.text()
    console.log(`FAIL ${remotePath}: ${r.status} ${txt}`)
    return false
  }
  console.log(`OK   ${remotePath} (${body.length} bytes)`)
  return true
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

async function main() {
  console.log('Login...')
  const token = await login()
  console.log('Login OK')

  const sources = [
    { root: 'F:/gaston-workspace/Gamp5', prefix: 'gamp5' },
    { root: 'F:/gaston-workspace/cannabis-trazabilidad/validation', prefix: 'validation' },
    { root: 'F:/gaston-workspace/cannabis-trazabilidad/scripts', prefix: 'scripts' },
    { root: 'F:/gaston-workspace/cannabis-trazabilidad/docs', prefix: 'docs' },
    { root: 'C:/Users/Gaston/.claude/projects/F--/memory', prefix: 'memoria-claude' },
  ]

  let ok = 0, fail = 0
  for (const src of sources) {
    let files
    try { files = walk(src.root) } catch (e) { console.log('SKIP ' + src.root + ': ' + e.message); continue }
    for (const f of files) {
      const rel = relative(src.root, f).replace(/\\/g, '/')
      // Supabase Storage: strip non-ASCII from key (URL-safe only)
      const safe = rel.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '_')
      const remote = `${src.prefix}/${safe}`
      const got = await upload(token, f, encodeURI(remote))
      got ? ok++ : fail++
    }
  }
  console.log(`\nTotal: ${ok} OK, ${fail} fail`)
}

main().catch(e => { console.error(e); process.exit(1) })
