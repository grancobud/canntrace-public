#!/usr/bin/env node
// Fase 0 — Inspeccion del Excel maestro (sin tocar BD).
// Genera reports/inspect-YYYYMMDD.json con shape de cada hoja.

import ExcelJS from 'exceljs'
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const EXCEL_PATH = process.env.EXCEL_PATH
  || 'F:/gaston-workspace/Gamp5/CM-RE-1010 Matriz Consolidada v2.xlsx'

const OUT_DIR = join(__dirname, 'reports')
const OUT_FILE = join(OUT_DIR, `inspect-${new Date().toISOString().slice(0,10).replaceAll('-','')}.json`)

function sha256File(p) {
  const buf = readFileSync(p)
  return createHash('sha256').update(buf).digest('hex')
}

/** Heuristica: encuentra la fila de headers (primera con >=3 strings no vacios que no sean institucionales) */
function detectHeaderRow(worksheet) {
  const skipPatterns = [/FIS S\.A\.S\./i, /Código:|Codigo:/i, /Rev\.:/i, /Fecha: Abril/i, /Ref\. CUMCS/i, /SUSTRATO:|SALA|CULTIVO:|ETAPA:|MES:|ID LOTE|VARIEDAD/i]
  for (let r = 1; r <= Math.min(worksheet.rowCount || 30, 30); r++) {
    const row = worksheet.getRow(r)
    let strings = 0
    let institucional = 0
    row.eachCell({ includeEmpty: false }, (cell) => {
      const v = cell.value
      if (v == null) return
      const s = typeof v === 'object' ? (v.richText?.map(rt => rt.text).join('') ?? String(v)) : String(v)
      if (s.trim().length === 0) return
      if (typeof s === 'string' && isNaN(Number(s))) {
        strings++
        if (skipPatterns.some(p => p.test(s))) institucional++
      }
    })
    if (strings >= 3 && institucional / Math.max(strings, 1) < 0.5) return r
  }
  return null
}

/** Extrae los headers de esa fila como strings limpios */
function extractHeaders(worksheet, headerRow) {
  const row = worksheet.getRow(headerRow)
  const headers = []
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const v = cell.value
    const s = v == null ? '' : typeof v === 'object' ? (v.richText?.map(rt => rt.text).join('') ?? JSON.stringify(v)) : String(v)
    headers[colNumber - 1] = s.trim()
  })
  return headers
}

/** Cuenta filas con al menos 1 valor desde headerRow+1 */
function countDataRows(worksheet, headerRow) {
  if (!headerRow) return 0
  let n = 0
  const max = worksheet.rowCount || headerRow + 2000
  for (let r = headerRow + 1; r <= max; r++) {
    const row = worksheet.getRow(r)
    let hasData = false
    row.eachCell({ includeEmpty: false }, () => { hasData = true })
    if (hasData) n++
  }
  return n
}

async function main() {
  const st = statSync(EXCEL_PATH)
  console.log(`Inspeccionando ${EXCEL_PATH}`)
  console.log(`Tamano: ${(st.size / 1024 / 1024).toFixed(1)} MB`)
  const hash = sha256File(EXCEL_PATH)
  console.log(`SHA256: ${hash}`)
  console.log('---')

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(EXCEL_PATH)

  const hojas = []
  for (const ws of wb.worksheets) {
    const hdrRow = detectHeaderRow(ws)
    const headers = hdrRow ? extractHeaders(ws, hdrRow).filter(h => h && h.length > 0) : []
    const dataRows = countDataRows(ws, hdrRow)
    const info = {
      nombre: ws.name,
      codigo_cumcs: /CM-RE-\d{4}/.exec(ws.name)?.[0] ?? null,
      row_count: ws.rowCount,
      col_count: ws.columnCount,
      header_row: hdrRow,
      headers,
      data_rows_estimate: dataRows,
      es_indice_grupo: /^G\d\d · /.test(ws.name) || /GRUPO \d\d/i.test(ws.getCell(1,1).text ?? '') || /GRUPO \d\d/i.test(ws.getCell(2,1).text ?? ''),
    }
    hojas.push(info)
    console.log(`  ${info.nombre.padEnd(35)} hdr=${hdrRow ?? '?'}  cols=${headers.length}  data=${dataRows}`)
  }

  const report = {
    generado_en: new Date().toISOString(),
    archivo: EXCEL_PATH,
    size_bytes: st.size,
    sha256: hash,
    total_hojas: hojas.length,
    hojas_con_data: hojas.filter(h => h.data_rows_estimate > 0).length,
    filas_totales_data: hojas.reduce((a, h) => a + h.data_rows_estimate, 0),
    hojas,
  }

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(OUT_FILE, JSON.stringify(report, null, 2))
  console.log(`\nReporte: ${OUT_FILE}`)
  console.log(`Hojas totales: ${report.total_hojas}`)
  console.log(`Con data: ${report.hojas_con_data}`)
  console.log(`Filas totales: ~${report.filas_totales_data}`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
