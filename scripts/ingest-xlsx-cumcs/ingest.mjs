#!/usr/bin/env node
// Ingest CM-RE-1010 Matriz Consolidada v2.xlsx -> Postgres CannTrace.
//
// Doble pasada:
//   1) Cada fila con datos -> xlsx_raw_rows (captura cruda 1:1, nunca pierde nada)
//   2) Hojas mapeadas en mappings.yaml -> tabla operativa registros_*
//      con columnas tipadas + datos_extra.fingerprint para idempotencia.
//
// Idempotencia: fingerprint = sha256(codigo|sheet|fila|raw_data_string).
// Re-ejecutar es seguro: ON CONFLICT DO NOTHING (indices unicos parciales).
//
// Uso:
//   SUPABASE_PAT=sbp_... node ingest.mjs --dry-run
//   SUPABASE_PAT=sbp_... node ingest.mjs --apply
//   SUPABASE_PAT=sbp_... node ingest.mjs --apply --reingest    (DELETE previo)
//   --xlsx <path>     override path local (default: F:\gaston-workspace\Doc Gaston\CM-RE-1010 Matriz Consolidada v2.xlsx)
//   --only CM-RE-XXXX limita a una hoja
//   --batch <n>       filas por INSERT (default 100)

import ExcelJS from 'exceljs';
import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- CLI args ---
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const argv = (n, def) => { const i = args.indexOf(n); return i >= 0 ? args[i+1] : def; };

const APPLY = flag('--apply');
const DRY = flag('--dry-run') || !APPLY;
const REINGEST = flag('--reingest');
const ONLY = argv('--only', null);
const BATCH = parseInt(argv('--batch', '100'), 10);
const XLSX_PATH = argv('--xlsx',
  String.raw`F:\gaston-workspace\Doc Gaston\CM-RE-1010 Matriz Consolidada v2.xlsx`);
const SOURCE_FILE = 'gamp5/CM-RE-1010 Matriz Consolidada v2.xlsx';

// --- Supabase Management API ---
const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('ERROR: falta env SUPABASE_PAT'); process.exit(1); }
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'sqdqvhjlmdweuuncwlfb';
// UUID del usuario admin que se usa como creado_por de las filas importadas.
// Default: acbf8a2e-... (admin@canntrace.com).
const INGEST_USER = process.env.SUPABASE_INGEST_USER || 'acbf8a2e-5eb9-4e12-aee0-8ce19d341a52';
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
const HEADERS = {
  'Authorization': `Bearer ${PAT}`,
  'Content-Type': 'application/json',
  'User-Agent': 'curl/8.0',  // sin esto da 403 Cloudflare 1010
};

async function sql(query) {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query }),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`SQL ${resp.status}: ${text.slice(0, 500)}`);
  try { return JSON.parse(text); } catch { return text; }
}

// --- Utils ---
const norm = (s) => String(s ?? '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^\w\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function sha256(s) { return createHash('sha256').update(s).digest('hex'); }

// SQL escape: usa $$ delimiter random, fallback a string standard si tiene $$
function quote(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (v instanceof Date) return `'${v.toISOString()}'::timestamptz`;
  const s = String(v);
  return `'${s.replace(/'/g, "''")}'`;
}

// Trunca string a maxLen preservando seguridad SQL (varchar cortos en schema).
// Se aplica a columnas que NO son text / observaciones / descripcion.
const VARCHAR_SAFE_COLS = new Set(['observaciones','descripcion','descripcion_hallazgo','detalle_reclamo','accion_correctiva','accion_preventiva','hallazgos','archivo_url','archivo_certificado_url','search_doc','vinculaciones']);
function quoteTrunc(v, col) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v !== 'string' && !(v instanceof Date)) return quote(v);
  if (VARCHAR_SAFE_COLS.has(col)) return quote(v);
  const s = typeof v === 'string' ? v : String(v);
  // 10 chars suficientes para identificaciones cortas, pero la mayoria de varchar del schema es 20-100.
  // Tomamos 40 como safe default; si una columna es varchar(10) o (20), truncamos mas.
  const truncated = s.length > 40 ? s.slice(0, 40) : s;
  return `'${truncated.replace(/'/g, "''")}'`;
}

function jsonbLit(obj) {
  if (!obj || Object.keys(obj).length === 0) return `'{}'::jsonb`;
  const json = JSON.stringify(obj).replace(/'/g, "''");
  return `'${json}'::jsonb`;
}

function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  // Match YYYY-MM-DD o DD/MM/YYYY o YYYY/MM/DD
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  return null;
}

function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.\-,]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function toInt(v) { const n = toNumber(v); return n === null ? null : Math.round(n); }

function cellValue(c) {
  if (c === null || c === undefined) return null;
  if (typeof c === 'object' && 'result' in c) return c.result;
  if (typeof c === 'object' && 'text' in c) return c.text;
  if (typeof c === 'object' && 'richText' in c) return c.richText.map(r => r.text).join('');
  if (c instanceof Date) return c;
  return c;
}

// --- Mappings ---
const mappings = yaml.load(readFileSync(resolve(__dirname, 'mappings.yaml'), 'utf8'));

// --- Load xlsx ---
console.log(`[ingest] xlsx: ${XLSX_PATH}`);
console.log(`[ingest] mode: ${DRY ? 'DRY-RUN' : 'APPLY'}${REINGEST ? ' +REINGEST' : ''}`);
console.log(`[ingest] project: ${PROJECT_REF}`);

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(XLSX_PATH);
console.log(`[ingest] sheets: ${wb.worksheets.length}`);

// --- REINGEST: borrar lo previo de este source_file ---
if (REINGEST && APPLY) {
  console.log('[ingest] REINGEST: borrando filas previas de', SOURCE_FILE);
  await sql(`DELETE FROM public.xlsx_raw_rows WHERE source_file = ${quote(SOURCE_FILE)};`);
  // Borrar de tablas operativas las filas con fingerprint_source = 'CM-RE-1010-v2'
  const opTables = ['registros_cosecha','registros_mantenimiento','registros_personal',
                    'registros_calidad','registros_documentales','registros_trazabilidad',
                    'registros_condiciones_ambientales','registros_fertilizantes',
                    'registros_fitosanitarios','registros_agua','resultados_laboratorio'];
  for (const t of opTables) {
    await sql(`DELETE FROM public.${t} WHERE datos_extra->>'fingerprint_source' = 'CM-RE-1010-v2';`);
  }
}

// --- Header detection ---
function findHeaderRow(ws, keywords) {
  const kws = keywords.map(norm);
  let bestRow = -1, bestScore = 0;
  // Buscar en las primeras 15 filas (varias hojas tienen encabezado decorativo arriba)
  for (let r = 1; r <= Math.min(15, ws.rowCount); r++) {
    const row = ws.getRow(r);
    let score = 0;
    const cells = [];
    row.eachCell({ includeEmpty: true }, (c) => cells.push(norm(cellValue(c.value))));
    const joined = ' ' + cells.join(' | ') + ' ';
    for (const kw of kws) if (joined.includes(' ' + kw + ' ') || joined.includes(kw)) score++;
    if (score > bestScore) { bestScore = score; bestRow = r; }
  }
  return bestScore >= 2 ? bestRow : -1;
}

function buildHeaderMap(ws, headerRow, columnMap) {
  const row = ws.getRow(headerRow);
  const map = {}; // colIndex -> bdField
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const label = norm(cellValue(cell.value));
    if (!label) return;
    // match con columnas: el yaml puede tener prefijos cortos por col widths
    for (const [key, field] of Object.entries(columnMap)) {
      if (label === key || label.startsWith(key) || key.startsWith(label.slice(0, Math.min(label.length, key.length)))) {
        if (!map[colNumber]) map[colNumber] = field;
        break;
      }
    }
  });
  return map;
}

// --- Apply chunks of inserts ---
async function applyChunks(insertSqlBuilder, rows, label) {
  if (rows.length === 0) return 0;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const stmt = insertSqlBuilder(slice);
    if (DRY) {
      // En dry-run: solo cuenta el que entraría
      inserted += slice.length;
    } else {
      try {
        await sql(stmt);
        inserted += slice.length;
      } catch (e) {
        console.error(`  [${label}] batch ${i}-${i+slice.length} ERROR:`, e.message.slice(0, 200));
      }
    }
  }
  return inserted;
}

// --- Process ---
const report = { sheets: [], total_raw: 0, total_struct: 0, errors: 0 };

for (const ws of wb.worksheets) {
  const sheetName = ws.name;
  // Detectar codigo CM-RE en el nombre
  const m = sheetName.match(/(CM-RE-\d{4})/i);
  const codigo = m ? m[1].toUpperCase() : null;
  if (ONLY && codigo !== ONLY) continue;

  // Hojas que NO son de datos (indice de grupos, matriz consolidada): skip raw + skip estruct
  if (/Matriz Consolidada/i.test(sheetName) || /^G\d\d\b/.test(sheetName)) {
    report.sheets.push({ sheet: sheetName, codigo, raw: 0, struct: 0, note: 'skipped (indice)' });
    continue;
  }

  if (ws.rowCount <= 1 || ws.columnCount <= 1) {
    report.sheets.push({ sheet: sheetName, codigo, raw: 0, struct: 0, note: 'skipped (vacia)' });
    continue;
  }

  const map = codigo ? mappings[codigo] : null;
  let headerRow = -1, headerMap = null;
  if (map) {
    // Override: si yaml tiene header_row numerico, usarlo directo (para hojas con encabezados multi-fila o raros)
    if (typeof map.header_row === 'number') {
      headerRow = map.header_row;
    } else {
      headerRow = findHeaderRow(ws, map.header_keywords);
    }
    if (headerRow > 0) headerMap = buildHeaderMap(ws, headerRow, map.columns);
  }

  // --- Recolectar filas (solo las que tienen datos reales) ---
  const rawRows = [];
  const structRows = [];

  ws.eachRow({ includeEmpty: false }, (row, r) => {
    if (headerRow > 0 && r <= headerRow) return; // saltar header (y filas de titulo arriba)
    const cells = {};
    let nonEmpty = 0;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const v = cellValue(cell.value);
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        cells[colNumber] = v;
        nonEmpty++;
      }
    });
    if (nonEmpty < 1) return;

    // Raw row -> xlsx_raw_rows
    const rawData = {};
    for (const [col, v] of Object.entries(cells)) {
      const headerCell = headerRow > 0 ? cellValue(ws.getRow(headerRow).getCell(parseInt(col, 10)).value) : `col${col}`;
      const k = String(headerCell ?? `col${col}`).trim() || `col${col}`;
      rawData[k] = v instanceof Date ? v.toISOString() : v;
    }
    const fp = sha256(`${codigo || sheetName}|${sheetName}|${r}|${JSON.stringify(rawData)}`);
    rawRows.push({ codigo, sheet: sheetName, fila: r, rawData, fp });

    // Struct row -> tabla operativa (si hay mapping)
    if (map && headerMap) {
      const struct = { creado_por: INGEST_USER };
      if (!map.no_tipo) struct.tipo = map.tipo;
      const datosExtra = { fingerprint: fp, fingerprint_source: 'CM-RE-1010-v2', codigo_cumcs: codigo, sheet_row: r };
      for (const [colIdx, field] of Object.entries(headerMap)) {
        const v = cells[colIdx];
        if (v === undefined) continue;
        if (field.startsWith('datos_extra.')) {
          datosExtra[field.slice('datos_extra.'.length)] = v instanceof Date ? v.toISOString() : v;
        } else {
          struct[field] = v;
        }
      }
      // Defaults se aplican SOLO si la columna quedo vacia (no pisan datos reales)
      if (map.defaults) {
        for (const [k, v] of Object.entries(map.defaults)) {
          if (struct[k] === undefined || struct[k] === null || struct[k] === '') struct[k] = v;
        }
      }
      struct.datos_extra = datosExtra;

      // Fallback para columna 'fecha' (NOT NULL en la mayoria de registros_*).
      // Si el mapping no la setea pero hay alguna fecha en otra columna, la copia.
      // Ultimo recurso: sentinel 2025-01-01 (datos historicos de FIS son 2024-2025).
      if (!struct.fecha) {
        const fechaAlt = struct.fecha_cosecha || struct.fecha_recepcion ||
                         struct.fecha_transplante || struct.fecha_traslado ||
                         struct.fecha_mantenimiento || struct.fecha_analisis ||
                         struct.fecha_recepcion;
        if (fechaAlt) struct.fecha = fechaAlt;
        else { datosExtra.fecha_faltante = true; struct.fecha = '2025-01-01'; }
      }

      structRows.push({ table: map.table, struct, fp });
    }
  });

  // --- INSERT raw ---
  const rawInserted = await applyChunks((slice) => {
    const values = slice.map(r => `(${quote(SOURCE_FILE)}, ${quote(r.sheet)}, ${quote(r.codigo)}, ${r.fila}, ${jsonbLit(r.rawData)}, ${quote(r.fp)})`).join(',');
    return `INSERT INTO public.xlsx_raw_rows(source_file, sheet, codigo_cumcs, fila_origen, raw_data, fingerprint) VALUES ${values} ON CONFLICT (fingerprint) DO NOTHING;`;
  }, rawRows, `${sheetName}/raw`);

  // --- INSERT estructurado por tabla ---
  let structInserted = 0;
  if (structRows.length) {
    const byTable = {};
    for (const r of structRows) (byTable[r.table] ||= []).push(r);
    const tablesWithoutFecha = new Set(['registros_mantenimiento','resultados_laboratorio']);
    for (const [tableName, rows] of Object.entries(byTable)) {
      // Cleanup: si la tabla no tiene 'fecha', removerla de cada fila (puede haberla puesto el fallback)
      if (tablesWithoutFecha.has(tableName)) rows.forEach(r => { delete r.struct.fecha; });
      const cols = new Set();
      rows.forEach(r => Object.keys(r.struct).forEach(c => cols.add(c)));
      // Garantizar que 'fecha' aparezca solo en tablas que la tienen
      if (!tablesWithoutFecha.has(tableName)) cols.add('fecha');
      const colArr = Array.from(cols);
      structInserted += await applyChunks((slice) => {
        const valuesArr = slice.map(r => {
          return '(' + colArr.map(c => {
            const v = r.struct[c];
            if (c === 'datos_extra') return jsonbLit(v);
            if (c === 'creado_por' || c === 'creado_por_id' || c === 'lote_id' || c === 'instalacion_id' || c === 'organizacion_id' || c === 'empleado_id' || c === 'operacion_id' || c === 'verificado_por') return v ? `${quote(v)}::uuid` : 'NULL';
            if (c.startsWith('fecha') || c === 'proxima_fecha') {
              const d = v ? toDate(v) : null;
              if (d) return `${quote(d)}::date`;
              // Fallback para columnas fecha NOT NULL: usar sentinel 2025-01-01
              return (c === 'fecha' || c === 'fecha_mantenimiento' || c === 'fecha_analisis') ? `'2025-01-01'::date` : 'NULL';
            }
            if (['plantas_cosechadas','planta_n','cantidad_bolsas','total_plantas','cuadro_secado','cantidad_bultos','aeroclonador_n','periodo_carencia_dias'].includes(c)) return v === null || v === undefined ? 'NULL' : `${toInt(v) ?? 'NULL'}`;
            if (['cantidad_recibida','peso_fresco','peso_seco','peso_seco_estimado','peso_individual','peso_neto_g','humedad_pct','aw','peso_total','valor_medido','valor_referencia','tolerancia','duracion_horas','humedad','temperatura','temp_aa','temp_h2o','ec','ph_inicial','ph_corregido','vpd_kpa','co2_ppm','orp','peso_fresco_kg','peso_seco_kg','peso_trimeado_kg','peso_total_kg','merma_pct','cantidad','thc_total','thc_delta9','thca','cbd_total','cbda','cbg','cbn'].includes(c)) return v === null || v === undefined ? 'NULL' : `${toNumber(v) ?? 'NULL'}`;
            if (['conforme','firma_empleado','aprobado','pesticidas_aprobado','metales_pesados_aprobado','microbiologico_aprobado','micotoxinas_aprobado','solventes_residuales_aprobado'].includes(c)) {
              if (v === null || v === undefined || v === '') return 'NULL';
              const s = String(v).toLowerCase();
              return (s === 'si' || s === 'true' || s === '1' || s === 'aprobado') ? 'TRUE' : 'FALSE';
            }
            // Default: trunca strings a 40 chars para columnas tipadas varchar (excepto text/observaciones)
            return quoteTrunc(v instanceof Date ? v.toISOString().slice(0,10) : v, c);
            return quote(v instanceof Date ? v.toISOString().slice(0,10) : v);
          }).join(', ') + ')';
        }).join(',');
        const colList = colArr.join(', ');
        // ON CONFLICT DO NOTHING global: cubre tanto el indice unico de fingerprint
        // como cualquier otro unique constraint pre-existente (ej. uq_reg_cosecha_tipo_fecha_camada_cod).
        return `INSERT INTO public.${tableName}(${colList}) VALUES ${valuesArr} ON CONFLICT DO NOTHING;`;
      }, rows, `${sheetName}/${tableName}`);
    }
  }

  report.sheets.push({
    sheet: sheetName, codigo, raw: rawInserted, struct: structInserted,
    mapped: !!map, headerRow,
  });
  report.total_raw += rawInserted;
  report.total_struct += structInserted;
  console.log(`[${sheetName}] codigo=${codigo || '-'} raw=${rawInserted} struct=${structInserted} ${map ? `(->${map.table})` : '(sin mapeo)'}`);
}

console.log('\n=== REPORT ===');
console.log(JSON.stringify(report, null, 2));
console.log(`\nTOTAL raw=${report.total_raw} struct=${report.total_struct}  mode=${DRY ? 'DRY-RUN' : 'APPLIED'}`);

if (DRY) console.log('\n>> Dry-run completo. Re-ejecutar con --apply para escribir.');
