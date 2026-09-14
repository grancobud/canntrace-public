/**
 * CannTrace Backup Worker
 *
 * Dump semanal de todas las tablas publicas de Supabase a R2, via REST API + service_role.
 * Corre cada domingo 03:00 UTC segun cron en wrangler.toml.
 *
 * Flujo:
 * 1. List tables via RPC `obtener_tablas_publicas` (crear en Supabase, ver README)
 *    o usar lista hardcoded si no existe la RPC.
 * 2. Para cada tabla, SELECT * via REST (chunked 1000 filas) y concatenar.
 * 3. Empaquetar en JSON por tabla dentro de un NDJSON archivo comprimido.
 * 4. Upload a R2 bucket weekly/YYYY-MM-DD.ndjson.gz
 *
 * Para disparar manual: `curl -H 'X-Manual-Trigger: <token>' https://canntrace-backup.workers.dev`
 * (configurar ADMIN_TOKEN secret)
 */

export interface Env {
  BACKUPS: R2Bucket
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  ADMIN_TOKEN?: string
}

// Lista de tablas a respaldar (allowlist manual para evitar dumpear _realtime, audit_log gigante, etc.)
const TABLAS = [
  'organizaciones',
  'perfiles',
  'productos',
  'lotes',
  'operaciones',
  'registros_agua',
  'registros_fitosanitarios',
  'registros_mantenimiento',
  'registros_calidad',
  'registros_documentales',
  'tareas_culturales',
  'sops',
  'reportes_reprocann',
  'eventos_adversos',
  'contactos',
  'instalaciones',
  'resultados_laboratorio',
]

async function fetchTable(env: Env, tabla: string): Promise<any[]> {
  const rows: any[] = []
  const CHUNK = 1000
  let offset = 0
  while (true) {
    const url = `${env.SUPABASE_URL}/rest/v1/${tabla}?select=*&offset=${offset}&limit=${CHUNK}`
    const res = await fetch(url, {
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        Prefer: 'count=none',
      },
    })
    if (!res.ok) throw new Error(`${tabla} status ${res.status}: ${await res.text()}`)
    const data = (await res.json()) as any[]
    rows.push(...data)
    if (data.length < CHUNK) break
    offset += CHUNK
  }
  return rows
}

async function doBackup(env: Env): Promise<{ ok: boolean; size: number; key: string; tablas: Record<string, number> }> {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`
  const key = `weekly/canntrace-${stamp}.ndjson.gz`

  // NDJSON: una tabla por linea, { tabla, count, rows }
  const chunks: string[] = []
  const conteos: Record<string, number> = {}
  for (const t of TABLAS) {
    try {
      const rows = await fetchTable(env, t)
      conteos[t] = rows.length
      chunks.push(JSON.stringify({ tabla: t, count: rows.length, rows }) + '\n')
    } catch (err: any) {
      console.error(`backup table ${t} fallo:`, err?.message)
      conteos[t] = -1
      chunks.push(JSON.stringify({ tabla: t, count: 0, error: err?.message || String(err) }) + '\n')
    }
  }

  const raw = new TextEncoder().encode(chunks.join(''))

  // Compresion via CompressionStream (nativo en Workers)
  const cs = new CompressionStream('gzip')
  const writer = cs.writable.getWriter()
  writer.write(raw)
  writer.close()
  const compressed = new Response(cs.readable)
  const gzBuffer = await compressed.arrayBuffer()

  await env.BACKUPS.put(key, gzBuffer, {
    httpMetadata: { contentType: 'application/gzip' },
    customMetadata: {
      source: 'cloudflare-worker',
      date: stamp,
      tablas_count: String(TABLAS.length),
      raw_size: String(raw.byteLength),
    },
  })

  return { ok: true, size: gzBuffer.byteLength, key, tablas: conteos }
}

export default {
  /** Cron trigger */
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      doBackup(env).then(
        r => console.log('backup OK', r.key, `${(r.size / 1024 / 1024).toFixed(2)}MB`, r.tablas),
        err => console.error('backup FAIL', err?.message || err)
      )
    )
  },

  /** Trigger manual: GET / con header X-Manual-Trigger */
  async fetch(req: Request, env: Env): Promise<Response> {
    const token = req.headers.get('X-Manual-Trigger')
    if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
      return new Response('Unauthorized - set ADMIN_TOKEN secret and pass X-Manual-Trigger header', { status: 401 })
    }
    try {
      const r = await doBackup(env)
      return Response.json(r)
    } catch (err: any) {
      return Response.json({ error: err?.message || String(err) }, { status: 500 })
    }
  },
}
