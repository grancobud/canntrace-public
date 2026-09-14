#!/usr/bin/env node
// Golden-set runner para detectar drift en la extraccion LLM.
// Uso: node tests/run-golden-set.mjs [--verbose] [--out reports/golden-YYYYMMDD.json]
//
// Lee tests/llm-golden-set.json, invoca la Edge Function ai-extract-operacion
// para cada caso, compara contra expected, y genera reporte con accuracy.
//
// Baseline esperado: >= 80% pass rate. Si baja <70%, alerta drift.
// Correr semanalmente: GitHub Action Mondays 09:00 UTC.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// -- Config --
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sqdqvhjlmdweuuncwlfb.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  || readEnv('VITE_SUPABASE_ANON_KEY')
if (!SUPABASE_ANON_KEY) {
  console.error('Falta SUPABASE_ANON_KEY (env o src/frontend/canntrace-app/.env VITE_SUPABASE_ANON_KEY)')
  process.exit(2)
}

const VERBOSE = process.argv.includes('--verbose')
const OUT_FLAG = process.argv.indexOf('--out')
const OUT_PATH = OUT_FLAG > -1 ? process.argv[OUT_FLAG + 1] : defaultOutPath()

function readEnv(key) {
  const p = join(ROOT, 'src/frontend/canntrace-app/.env')
  if (!existsSync(p)) return null
  const content = readFileSync(p, 'utf-8')
  const m = content.match(new RegExp(`^${key}=(.+)$`, 'm'))
  return m ? m[1].trim() : null
}

function defaultOutPath() {
  const d = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  return join(ROOT, 'tests/reports', `golden-${d}.json`)
}

function todayISO() { return new Date().toISOString().slice(0, 10) }
function yesterdayISO() { return new Date(Date.now() - 86400000).toISOString().slice(0, 10) }

function resolveExpectedFecha(f) {
  if (f === 'TODAY') return todayISO()
  if (f === 'YESTERDAY') return yesterdayISO()
  return f
}

// -- Llamada al Edge Function --
async function invokeExtract(texto) {
  const t0 = Date.now()
  const r = await fetch(`${SUPABASE_URL}/functions/v1/ai-extract-operacion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ texto }),
  })
  const elapsed = Date.now() - t0
  const body = await r.json().catch(() => ({}))
  return { status: r.status, body, elapsed_ms: elapsed }
}

// -- Assert helpers --
function compareCase(caso, resp) {
  const exp = caso.expected
  const extr = resp.body?.extraccion ?? {}
  const follow = resp.body?.follow_up_message
  const failed = []
  const checks = []

  function check(name, fn) {
    try {
      const ok = fn()
      checks.push({ name, ok })
      if (!ok) failed.push(name)
    } catch (e) {
      checks.push({ name, ok: false, error: String(e) })
      failed.push(name)
    }
  }

  if (exp.tipo_operacion !== undefined) {
    check('tipo_operacion', () => extr.tipo_operacion === exp.tipo_operacion)
  }
  if (exp.cantidad !== undefined) {
    check('cantidad', () => extr.cantidad === exp.cantidad)
  }
  if (exp.camada !== undefined) {
    check('camada', () => extr.camada === exp.camada)
  }
  if (exp.sistema !== undefined) {
    check('sistema', () => extr.sistema === exp.sistema)
  }
  if (exp.fecha !== undefined) {
    const expFecha = resolveExpectedFecha(exp.fecha)
    check('fecha', () => extr.fecha === expFecha)
  }
  if (exp.id_lote !== undefined) {
    check('id_lote', () => extr.id_lote === exp.id_lote)
  }
  if (exp.observaciones_contains) {
    check('observaciones_contains', () =>
      typeof extr.observaciones === 'string'
      && extr.observaciones.toLowerCase().includes(exp.observaciones_contains.toLowerCase()))
  }
  if (exp.confianza_min !== undefined) {
    check(`confianza>=${exp.confianza_min}`, () => (extr.confianza ?? 0) >= exp.confianza_min)
  }
  if (exp.confianza_max !== undefined) {
    check(`confianza<=${exp.confianza_max}`, () => (extr.confianza ?? 0) <= exp.confianza_max)
  }
  if (exp.follow_up_esperado !== undefined) {
    check('follow_up', () => !!follow === !!exp.follow_up_esperado)
  }

  return {
    id: caso.id,
    input: caso.input,
    status: resp.status,
    elapsed_ms: resp.elapsed_ms,
    modelo_usado: resp.body?.modelo_usado,
    confianza: extr.confianza,
    follow_up: follow,
    extraccion: extr,
    checks,
    failed,
    ok: failed.length === 0 && resp.status === 200,
  }
}

// -- Reporte agregado --
function buildReport(results) {
  const total = results.length
  const passed = results.filter(r => r.ok).length
  const failed = total - passed
  const errores_http = results.filter(r => r.status !== 200).length
  const confianzas = results.map(r => r.confianza ?? 0)
  const confianza_avg = confianzas.reduce((a, b) => a + b, 0) / total
  const latencias = results.map(r => r.elapsed_ms)
  const latencia_avg = latencias.reduce((a, b) => a + b, 0) / total
  const latencia_p95 = latencias.sort((a, b) => a - b)[Math.floor(total * 0.95)]
  const modelos = [...new Set(results.map(r => r.modelo_usado).filter(Boolean))]
  const follow_ups = results.filter(r => r.follow_up).length

  // Top campos que mas fallan
  const field_fails = {}
  for (const r of results) {
    for (const f of r.failed) field_fails[f] = (field_fails[f] || 0) + 1
  }
  const top_fails = Object.entries(field_fails).sort((a, b) => b[1] - a[1]).slice(0, 10)

  return {
    generado_en: new Date().toISOString(),
    resumen: {
      total,
      passed,
      failed,
      pass_rate_pct: (passed / total * 100).toFixed(1),
      errores_http,
      confianza_avg: confianza_avg.toFixed(3),
      latencia_avg_ms: Math.round(latencia_avg),
      latencia_p95_ms: latencia_p95,
      follow_ups_disparados: follow_ups,
      modelos_usados: modelos,
    },
    top_field_fails: top_fails,
    casos_fallidos: results.filter(r => !r.ok).map(r => ({
      id: r.id, input: r.input, failed: r.failed, extraccion: r.extraccion, status: r.status,
    })),
    todos_los_resultados: results,
  }
}

// -- Main --
async function main() {
  const dataset = JSON.parse(readFileSync(join(ROOT, 'tests/llm-golden-set.json'), 'utf-8'))
  console.log(`Ejecutando golden-set v${dataset.version} — ${dataset.casos.length} casos`)
  console.log(`Target: ${SUPABASE_URL}/functions/v1/ai-extract-operacion`)
  console.log('---')

  const results = []
  let i = 0
  for (const caso of dataset.casos) {
    i++
    process.stdout.write(`[${i}/${dataset.casos.length}] ${caso.id.padEnd(36)} ... `)
    const resp = await invokeExtract(caso.input)
    const result = compareCase(caso, resp)
    results.push(result)
    const marker = result.ok ? '✓' : '✗'
    const latency = `${result.elapsed_ms}ms`.padStart(7)
    process.stdout.write(`${marker} ${latency}`)
    if (!result.ok) process.stdout.write(` [falla: ${result.failed.join(', ')}]`)
    process.stdout.write('\n')
    if (VERBOSE && !result.ok) {
      console.log('    expected:', JSON.stringify(caso.expected))
      console.log('    got:     ', JSON.stringify(result.extraccion))
    }
    // Rate limiting: 3.3s entre calls para respetar 20 RPM free tier (3100ms + margen)
    // Antes 1.1s → hit rate limit de OpenRouter free con 39/50 casos en 503.
    // Si hay CEREBRAS_API_KEY/GROQ_API_KEY seteadas en Supabase, se puede bajar a 1.1s
    // porque el cascade distribuye carga entre providers.
    await new Promise(r => setTimeout(r, 3300))
  }

  const report = buildReport(results)
  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, JSON.stringify(report, null, 2))

  console.log('\n=== RESUMEN ===')
  console.log(`Pass rate:       ${report.resumen.pass_rate_pct}% (${report.resumen.passed}/${report.resumen.total})`)
  console.log(`Errores HTTP:    ${report.resumen.errores_http}`)
  console.log(`Confianza avg:   ${report.resumen.confianza_avg}`)
  console.log(`Latencia avg:    ${report.resumen.latencia_avg_ms}ms (p95 ${report.resumen.latencia_p95_ms}ms)`)
  console.log(`Follow-ups:      ${report.resumen.follow_ups_disparados}`)
  console.log(`Modelos usados:  ${report.resumen.modelos_usados.join(', ') || '(ninguno)'}`)
  if (report.top_field_fails.length) {
    console.log('\nCampos que mas fallan:')
    for (const [f, n] of report.top_field_fails) console.log(`  ${f}: ${n}`)
  }
  console.log(`\nReporte: ${OUT_PATH}`)

  // Exit code: 0 si pass_rate >= 70%, 1 sino (para CI)
  const rate = parseFloat(report.resumen.pass_rate_pct)
  if (rate < 70) {
    console.error(`\n⚠ DRIFT: pass rate ${rate}% < 70% baseline — posible regresion en modelo free.`)
    process.exit(1)
  }
  process.exit(0)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(2)
})
