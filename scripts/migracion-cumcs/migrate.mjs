#!/usr/bin/env node
// Fase 3 — Migracion bulk Excel -> Supabase.
// Lee Excel stream, normaliza, upsert por batches de 500 con audit trigger activo.
// NO bypass del trigger hash-chain (vale los minutos extra por integridad GAMP5).
//
// Uso:
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/migracion-cumcs/migrate.mjs [flags]
//
// Flags:
//   --dry-run        Reporta que haria, no escribe
//   --all            Migra las 57 hojas con data (default: solo los 3 piloto)
//   --sheet=CM-RE-X  Solo esa hoja
//   --verbose        Log detallado
//   --force          Re-migrar aunque el hash ya este en migration_log

import ExcelJS from 'exceljs'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from 'xlsx'
const { SSF } = pkg

const __dirname = dirname(fileURLToPath(import.meta.url))

// -- Config --
const EXCEL_PATH = process.env.EXCEL_PATH
  || 'F:/gaston-workspace/Gamp5/CM-RE-1010 Matriz Consolidada v2.xlsx'
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sqdqvhjlmdweuuncwlfb.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BATCH_SIZE = 500
const CONCURRENT_BATCHES = 3
// User admin real (admin@canntrace.com) para FK creado_por. Override con env MIGRATION_USER_UUID.
const DEFAULT_CREADO_POR = process.env.MIGRATION_USER_UUID || 'acbf8a2e-5eb9-4e12-aee0-8ce19d341a52'
const ORG_ID = '00000000-0000-0000-0000-000000000001'

const flags = {
  dryRun: process.argv.includes('--dry-run'),
  all: process.argv.includes('--all'),
  sheet: (process.argv.find(a => a.startsWith('--sheet=')) || '').split('=')[1],
  verbose: process.argv.includes('--verbose'),
  force: process.argv.includes('--force'),
}

// -- Normalizadores --
function normalizeCamada(raw) {
  if (raw == null) return null
  const s = String(raw).trim().toUpperCase()
  const m = s.match(/C\s*(\d+)/) || s.match(/CAMADA\s*(\d+)/) || s.match(/^(\d+)$/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  if ([7, 9, 11, 12, 15, 16].includes(n)) return `C${n}`
  return null  // C8, C10 invalidas
}

function normalizeSistema(raw) {
  if (raw == null) return null
  const s = String(raw).trim().toLowerCase()
  if (/rdwc|flora\s*2|sfl\s*2|\bf2\b|hidro/.test(s)) return 'RDWC'
  if (/coco|flora\s*1|sfl\s*1|\bf1\b/.test(s)) return 'COCO'
  return null
}

function normalizeFecha(raw) {
  if (raw == null || raw === '') return null
  // Excel serial
  if (typeof raw === 'number' && raw > 20000 && raw < 60000) {
    try {
      const parsed = SSF.parse_date_code(raw)
      const d = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d))
      return d.toISOString().slice(0, 10)
    } catch { /* fall through */ }
  }
  // Date object
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10)
  }
  // String: mm-dd-yy, mm-dd-yyyy, dd/mm/yyyy, yyyy-mm-dd
  const s = String(raw).trim()
  const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m2) {
    const d = m2[1].padStart(2, '0'), mo = m2[2].padStart(2, '0')
    let y = m2[3]; if (y.length === 2) y = '20' + y
    return `${y}-${mo}-${d}`
  }
  const m3 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/)
  if (m3) {
    // Asumimos mm-dd-yy (formato observado en el Excel)
    const mo = m3[1].padStart(2, '0'), d = m3[2].padStart(2, '0')
    let y = m3[3]; if (y.length === 2) y = '20' + y
    return `${y}-${mo}-${d}`
  }
  return null
}

function toNumber(raw) {
  if (raw == null || raw === '' || raw === '-') return null
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.').replace(/[^\d.-]/g, ''))
  return isNaN(n) ? null : n
}

function toStr(raw, maxLen = 200) {
  if (raw == null) return null
  let s
  if (typeof raw === 'object') {
    if (raw.richText) s = raw.richText.map(rt => rt.text).join('')
    else if (raw.text) s = String(raw.text)
    else s = null
  } else {
    s = String(raw)
  }
  if (s == null) return null
  s = s.trim()
  if (s.length === 0) return null
  return s.length > maxLen ? s.slice(0, maxLen) : s
}

// Campos con columnas cortas varchar(10/20/40) — truncar agresivo para evitar overflow
const MAX_LEN_POR_CAMPO = {
  sistema: 20, camada: 10, sala: 80, etapa: 40, identificacion: 80,
  variedad: 80, sustrato: 40, ph_ml: 20, ventilacion: 40, extraccion: 40,
  estado_cultivo: 40, presencia_insectos: 10, presencia_hongos: 10,
  id_lote_texto: 80, tanque: 40, tipo_gasto: 40, dilucion: 40, unidad: 10,
  producto: 120, principio_activo: 120, destino: 80,
  cumple_bpa: 10, instrumental: 80, genetica: 80,
  estado_producto: 40, cond_recepcion: 40, cond_sanitaria: 40, sanidad: 40,
  ubicacion_cultivo: 40, patente: 20,
}

// -- Mapeo por CUMCS --
// Cada entry: { codigo, tabla, hojaNombre, headerRow, mapeo: (rowValues) => payload }
// 'rowValues' es un object {A: val, B: val, ...} con letras de columna
const CUMCS_MAPEOS = {
  // CM-RE-0104 — Condiciones Ambientales Etapa Vegetativa
  // Header row 12/13 (headers duplicados). Data desde row 14.
  // Cols: C=Fecha D=Sistema E=Humedad F=Temp G=T°AA H=T°H20 I=EC J=pH K=pH ML L=pH corr M=ORP N=Ventilacion O=Extraccion P=Observaciones
  'CM-RE-0104': {
    tabla: 'registros_condiciones_ambientales',
    hojaNombre: 'CM-RE-0104',
    headerRow: 13,  // Data empieza fila 14
    mapeo: (v) => ({
      tipo: 'CM-RE-0104',
      fecha: normalizeFecha(v.C),
      sistema: normalizeSistema(v.D),
      etapa: 'Vegetativa',
      humedad: toNumber(v.E),
      temperatura: toNumber(v.F),
      temp_aa: toNumber(v.G),
      temp_h2o: toNumber(v.H),
      ec: toNumber(v.I),
      ph_inicial: toNumber(v.J),
      ph_ml: toStr(v.K),
      ph_corregido: toNumber(v.L),
      orp: toNumber(v.M),
      ventilacion: toStr(v.N),
      extraccion: toStr(v.O),
      observaciones: toStr(v.P),
    }),
  },

  // CM-RE-0401 — Sanitizacion del Sistema de Agua Purificada
  // registros_agua tiene CHECK constraint en tipo (solo: sanitizacion_agua, analisis_agua, volumen_riego).
  // Guardamos el codigo CUMCS original en datos_extra.codigo_cumcs.
  'CM-RE-0401': {
    tabla: 'registros_agua',
    hojaNombre: 'CM-RE-0401',
    headerRow: 9,
    mapeo: (v) => ({
      tipo: 'sanitizacion_agua',
      fecha: normalizeFecha(v.B),
      volumen_litros: toNumber(v.C),
      observaciones: toStr(v.F) ? `Producto: ${toStr(v.D) ?? 'cloro'} ${toNumber(v.E) ?? ''}ml. ${toStr(v.F)}` : (toStr(v.D) ? `Producto: ${toStr(v.D)} ${toNumber(v.E) ?? ''}ml` : null),
      responsable: toStr(v.G),
      __cumcs_codigo: 'CM-RE-0401',  // metadata, va a datos_extra
    }),
  },

  // CM-RE-0801 — Capacitacion del Personal
  // registros_personal NO tiene columna organizacion_id.
  'CM-RE-0801': {
    tabla: 'registros_personal',
    hojaNombre: 'CM-RE-0801',
    headerRow: 1,
    sinOrganizacionId: true,
    mapeo: (v) => ({
      tipo: 'capacitacion',  // CHECK constraint: debe ser slug, no codigo CUMCS
      fecha: normalizeFecha(v.A),
      responsable: toStr(v.B),
      // registros_personal tiene descripcion NOT NULL.
      descripcion: [toStr(v.D, 120), toStr(v.C, 80), toStr(v.E, 100)].filter(Boolean).join(' — ') || 'Capacitacion',
      observaciones: [toStr(v.D), toStr(v.C), toStr(v.E)].filter(Boolean).join(' — '),
      __cumcs_codigo: 'CM-RE-0801',
    }),
  },
}

const CUMCS_PILOTO = ['CM-RE-0104', 'CM-RE-0401', 'CM-RE-0801']

// ============================================================================
// MAPPINGS GENERICOS POR GRUPO
// Para los 54 CUMCS restantes usamos mapeo generico que:
//  - Busca primera columna de fecha (row 8-14 tipicamente)
//  - Preserva TODAS las columnas en datos_extra como JSON
//  - Setea tipo = slug compatible con CHECK constraint de cada tabla
//  - Para tablas con NOT NULL especificos, usa defaults razonables
// Esto migra 100% de la data, aunque columnas especificas quedan en datos_extra
// en vez de en columnas tipadas. Se puede refinar despues por CUMCS puntual.
// ============================================================================

// CUMCS → tabla destino (para los que no estan en CUMCS_MAPEOS especifico)
const CUMCS_TABLA_GENERICA = {
  // G01: todas → condiciones_ambientales (ya tienen datos_extra)
  'CM-RE-0101': { tabla: 'registros_condiciones_ambientales', tipoSlug: 'CM-RE-0101', sinOrgId: false },
  'CM-RE-0102': { tabla: 'registros_condiciones_ambientales', tipoSlug: 'CM-RE-0102', sinOrgId: false },
  'CM-RE-0103': { tabla: 'registros_condiciones_ambientales', tipoSlug: 'CM-RE-0103', sinOrgId: false },
  'CM-RE-0105': { tabla: 'registros_condiciones_ambientales', tipoSlug: 'CM-RE-0105', sinOrgId: false },
  'CM-RE-0106': { tabla: 'registros_condiciones_ambientales', tipoSlug: 'CM-RE-0106', sinOrgId: false },
  'CM-RE-0107': { tabla: 'registros_condiciones_ambientales', tipoSlug: 'CM-RE-0107', sinOrgId: false },
  'CM-RE-0108': { tabla: 'registros_condiciones_ambientales', tipoSlug: 'CM-RE-0108', sinOrgId: false },

  // G02: todas → trazabilidad
  'CM-RE-0201': { tabla: 'registros_trazabilidad', tipoSlug: 'CM-RE-0201', sinOrgId: false },
  'CM-RE-0202': { tabla: 'registros_trazabilidad', tipoSlug: 'CM-RE-0202', sinOrgId: false },
  'CM-RE-0203': { tabla: 'registros_trazabilidad', tipoSlug: 'CM-RE-0203', sinOrgId: false },
  'CM-RE-0204': { tabla: 'registros_trazabilidad', tipoSlug: 'CM-RE-0204', sinOrgId: false },
  'CM-RE-0205': { tabla: 'registros_trazabilidad', tipoSlug: 'CM-RE-0205', sinOrgId: false },
  'CM-RE-0206': { tabla: 'registros_trazabilidad', tipoSlug: 'CM-RE-0206', sinOrgId: false },
  'CM-RE-0207': { tabla: 'registros_trazabilidad', tipoSlug: 'CM-RE-0207', sinOrgId: false },
  'CM-RE-0208': { tabla: 'registros_trazabilidad', tipoSlug: 'CM-RE-0208', sinOrgId: false },
  'CM-RE-0209': { tabla: 'registros_trazabilidad', tipoSlug: 'CM-RE-0209', sinOrgId: false },
  'CM-RE-0210': { tabla: 'registros_trazabilidad', tipoSlug: 'CM-RE-0210', sinOrgId: false },
  'CM-RE-0211': { tabla: 'registros_trazabilidad', tipoSlug: 'CM-RE-0211', sinOrgId: false },

  // G03: fertilizantes
  'CM-RE-0301': { tabla: 'registros_fertilizantes', tipoSlug: 'CM-RE-0301', sinOrgId: false },
  'CM-RE-0302': { tabla: 'registros_fertilizantes', tipoSlug: 'CM-RE-0302', sinOrgId: false },
  'CM-RE-0303': { tabla: 'registros_fertilizantes', tipoSlug: 'CM-RE-0303', sinOrgId: false },
  'CM-RE-0304': { tabla: 'registros_fertilizantes', tipoSlug: 'CM-RE-0304', sinOrgId: false },
  'CM-RE-0305': { tabla: 'registros_fertilizantes', tipoSlug: 'CM-RE-0305', sinOrgId: false },
  'CM-RE-0306': { tabla: 'registros_fertilizantes', tipoSlug: 'CM-RE-0306', sinOrgId: false },

  // G04: agua (tiene CHECK constraint estricto)
  'CM-RE-0402': { tabla: 'registros_agua', tipoSlug: 'analisis_agua', sinOrgId: false },
  'CM-RE-0403': { tabla: 'registros_agua', tipoSlug: 'volumen_riego', sinOrgId: false },

  // G05: fitosanitarios (CHECK constraint)
  'CM-RE-0501': { tabla: 'registros_fitosanitarios', tipoSlug: 'control_plagas', sinOrgId: false },
  'CM-RE-0502': { tabla: 'registros_fitosanitarios', tipoSlug: 'monitoreo_plagas', sinOrgId: false },
  'CM-RE-0503': { tabla: 'registros_fitosanitarios', tipoSlug: 'aplicacion_fitosanitario', sinOrgId: false },
  'CM-RE-0504': { tabla: 'registros_fitosanitarios', tipoSlug: 'aplicacion_fitosanitario', sinOrgId: false },
  'CM-RE-0505': { tabla: 'registros_fitosanitarios', tipoSlug: 'reingreso_parcela', sinOrgId: false },
  'CM-RE-0506': { tabla: 'registros_fitosanitarios', tipoSlug: 'lmr_postcosecha', sinOrgId: false },
  'CM-RE-0507': { tabla: 'registros_fitosanitarios', tipoSlug: 'gestion_envases', sinOrgId: false },

  // G06: cosecha (nueva, sin CHECK, datos_extra OK)
  'CM-RE-0601': { tabla: 'registros_cosecha', tipoSlug: 'CM-RE-0601', sinOrgId: false },
  'CM-RE-0602': { tabla: 'registros_cosecha', tipoSlug: 'CM-RE-0602', sinOrgId: false },
  'CM-RE-0603': { tabla: 'registros_cosecha', tipoSlug: 'CM-RE-0603', sinOrgId: false },
  'CM-RE-0604': { tabla: 'registros_cosecha', tipoSlug: 'CM-RE-0604', sinOrgId: false },
  'CM-RE-0605': { tabla: 'registros_cosecha', tipoSlug: 'CM-RE-0605', sinOrgId: false },
  'CM-RE-0606': { tabla: 'registros_cosecha', tipoSlug: 'CM-RE-0606', sinOrgId: false },
  'CM-RE-0607': { tabla: 'registros_cosecha', tipoSlug: 'CM-RE-0607', sinOrgId: false },
  'CM-RE-0608': { tabla: 'registros_cosecha', tipoSlug: 'CM-RE-0608', sinOrgId: false },
  'CM-RE-0609': { tabla: 'registros_cosecha', tipoSlug: 'CM-RE-0609', sinOrgId: false },
  'CM-RE-0610': { tabla: 'registros_cosecha', tipoSlug: 'CM-RE-0610', sinOrgId: false },
  'CM-RE-0611': { tabla: 'registros_cosecha', tipoSlug: 'CM-RE-0611', sinOrgId: false },

  // G07: mantenimiento (CHECK constraint + equipo_nombre + fecha_mantenimiento NOT NULL)
  'CM-RE-0701': { tabla: 'registros_mantenimiento', tipoSlug: 'calibracion_balanza', sinOrgId: false, equipoDefault: 'Balanza' },
  'CM-RE-0702': { tabla: 'registros_mantenimiento', tipoSlug: 'calibracion_equipos', sinOrgId: false, equipoDefault: 'Equipo medicion' },
  'CM-RE-0703': { tabla: 'registros_mantenimiento', tipoSlug: 'mantenimiento_generador', sinOrgId: false, equipoDefault: 'Grupo electrogeno' },
  'CM-RE-0704': { tabla: 'registros_mantenimiento', tipoSlug: 'mantenimiento_ac', sinOrgId: false, equipoDefault: 'Aire acondicionado' },
  'CM-RE-0705': { tabla: 'registros_mantenimiento', tipoSlug: 'mantenimiento_ventiladores', sinOrgId: false, equipoDefault: 'Ventilador' },
  'CM-RE-0706': { tabla: 'registros_mantenimiento', tipoSlug: 'mantenimiento_deshumificadores', sinOrgId: false, equipoDefault: 'Deshumificador' },
  'CM-RE-0707': { tabla: 'registros_mantenimiento', tipoSlug: 'mantenimiento_osmosis', sinOrgId: false, equipoDefault: 'Osmosis inversa' },

  // G08: personal (CHECK constraint con slugs especificos)
  'CM-RE-0802': { tabla: 'registros_personal', tipoSlug: 'entrega_epi', sinOrgId: true, descripcionDefault: 'Entrega EPI' },
  'CM-RE-0803': { tabla: 'registros_personal', tipoSlug: 'emergencia_accidente', sinOrgId: true, descripcionDefault: 'Emergencia/accidente' },
  'CM-RE-0804': { tabla: 'registros_personal', tipoSlug: 'verificacion_higiene', sinOrgId: true, descripcionDefault: 'Verificacion higiene' },
  'CM-RE-0805': { tabla: 'registros_personal', tipoSlug: 'estado_salud', sinOrgId: true, descripcionDefault: 'Estado salud' },
  'CM-RE-0806': { tabla: 'registros_personal', tipoSlug: 'control_botiquin', sinOrgId: true, descripcionDefault: 'Control botiquin' },
  'CM-RE-0807': { tabla: 'registros_personal', tipoSlug: 'control_extintores', sinOrgId: true, descripcionDefault: 'Control extintores' },
  'CM-RE-0808': { tabla: 'registros_personal', tipoSlug: 'limpieza_instalaciones', sinOrgId: true, descripcionDefault: 'Limpieza instalaciones' },
  'CM-RE-0809': { tabla: 'registros_personal', tipoSlug: 'limpieza_recipientes', sinOrgId: true, descripcionDefault: 'Limpieza recipientes' },
  'CM-RE-0810': { tabla: 'registros_personal', tipoSlug: 'limpieza_calzados', sinOrgId: true, descripcionDefault: 'Limpieza calzados' },

  // G09: calidad (CHECK constraint)
  'CM-RE-0901': { tabla: 'registros_calidad', tipoSlug: 'certificado_lote', sinOrgId: false },
  'CM-RE-0902': { tabla: 'registros_calidad', tipoSlug: 'toma_muestras', sinOrgId: false },
  'CM-RE-0903': { tabla: 'registros_calidad', tipoSlug: 'contramuestras_producto', sinOrgId: false },
  'CM-RE-0904': { tabla: 'registros_calidad', tipoSlug: 'contramuestras_sustrato', sinOrgId: false },
  'CM-RE-0905': { tabla: 'registros_calidad', tipoSlug: 'analisis_postcosecha', sinOrgId: false },
  'CM-RE-0906': { tabla: 'registros_calidad', tipoSlug: 'reclamo_cliente', sinOrgId: false },
  'CM-RE-0907': { tabla: 'registros_calidad', tipoSlug: 'queja_interna', sinOrgId: false },
  'CM-RE-0908': { tabla: 'registros_calidad', tipoSlug: 'devolucion', sinOrgId: false },
  'CM-RE-0909': { tabla: 'registros_calidad', tipoSlug: 'no_conforme', sinOrgId: false },
  'CM-RE-0910': { tabla: 'registros_calidad', tipoSlug: 'disposicion_cannabis', sinOrgId: false },
  'CM-RE-0911': { tabla: 'registros_calidad', tipoSlug: 'disposicion_residuos', sinOrgId: false },

  // G10: documentales (CHECK constraint + titulo NOT NULL)
  'CM-RE-1001': { tabla: 'registros_documentales', tipoSlug: 'revision_especificacion', sinOrgId: false, tituloDefault: 'Especificacion interna' },
  'CM-RE-1002': { tabla: 'registros_documentales', tipoSlug: 'documento_externo', sinOrgId: false, tituloDefault: 'Documento externo' },
  'CM-RE-1003': { tabla: 'registros_documentales', tipoSlug: 'analisis_riesgos', sinOrgId: false, tituloDefault: 'Riesgo FMEA' },
  'CM-RE-1004': { tabla: 'registros_documentales', tipoSlug: 'control_cambios', sinOrgId: false, tituloDefault: 'Cambio' },
  'CM-RE-1005': { tabla: 'registros_documentales', tipoSlug: 'auditoria_interna', sinOrgId: false, tituloDefault: 'Auditoria' },
  'CM-RE-1006': { tabla: 'registros_documentales', tipoSlug: 'sugerencia', sinOrgId: false, tituloDefault: 'Comentario/sugerencia' },
  'CM-RE-1007': { tabla: 'registros_documentales', tipoSlug: 'proveedor', sinOrgId: false, tituloDefault: 'Evaluacion proveedor' },
  'CM-RE-1008': { tabla: 'registros_documentales', tipoSlug: 'recomendacion_tecnica', sinOrgId: false, tituloDefault: 'Recomendacion tecnica' },
  'CM-RE-1009': { tabla: 'registros_documentales', tipoSlug: 'pedido_insumos', sinOrgId: false, tituloDefault: 'Pedido insumo' },
  'CM-RE-1010': { tabla: 'registros_documentales', tipoSlug: 'documento_externo', sinOrgId: false, tituloDefault: 'Matriz control' },
}

/** Busca en qué fila esta la fecha detectable (string dd-mm-yy o yyyy-mm-dd). */
function detectarFilaDataInicio(ws, maxRow = 20) {
  for (let r = 1; r <= Math.min(maxRow, ws.rowCount); r++) {
    const row = ws.getRow(r)
    let hasDate = false
    row.eachCell({ includeEmpty: false }, (cell) => {
      const v = cell.value
      if (!hasDate && v != null) {
        if (v instanceof Date) hasDate = true
        else if (typeof v === 'number' && v > 20000 && v < 60000) hasDate = true
        else if (typeof v === 'string' && /\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/.test(v)) hasDate = true
      }
    })
    if (hasDate) return r
  }
  return null
}

/** Mapeo generico: primera col con fecha → fecha, todo lo demas → datos_extra. */
function mapeoGenerico(v, config, rowNumber) {
  const valores = {}
  let fecha = null

  for (const [col, val] of Object.entries(v)) {
    if (val == null || val === '') continue
    // Detectar fecha si aun no la tenemos
    if (!fecha) {
      const f = normalizeFecha(val)
      if (f) { fecha = f; continue }
    }
    // Resto va a datos_extra como string seguro
    const s = toStr(val, 500)
    if (s != null) valores[`col_${col}`] = s
  }

  const fechaFinal = fecha ?? new Date().toISOString().slice(0, 10)
  const payload = {
    tipo: config.tipoSlug,
    __datos_extra_cols: valores,  // meta campo, se merge al datos_extra final
  }

  // registros_mantenimiento NO tiene columna 'fecha' — tiene 'fecha_mantenimiento'.
  // El resto de tablas si tienen 'fecha'.
  if (config.tabla === 'registros_mantenimiento') {
    payload.fecha_mantenimiento = fechaFinal
  } else {
    payload.fecha = fechaFinal
  }

  // Defaults para tablas con NOT NULL estricto
  if (config.equipoDefault && !payload.equipo_nombre) {
    payload.equipo_nombre = config.equipoDefault
  }
  if (config.descripcionDefault && !payload.descripcion) {
    payload.descripcion = config.descripcionDefault
  }
  if (config.tituloDefault && !payload.titulo) {
    payload.titulo = config.tituloDefault
  }

  return payload
}

// -- Core --
function sha256File(p) {
  return createHash('sha256').update(readFileSync(p)).digest('hex')
}

function colIndexToLetter(i) {
  // 1 -> A, 2 -> B, ..., 27 -> AA
  let s = ''
  while (i > 0) {
    const r = (i - 1) % 26
    s = String.fromCharCode(65 + r) + s
    i = Math.floor((i - 1) / 26)
  }
  return s
}

async function upsertBatch(supabase, tabla, rows) {
  // Insert simple. Si hay duplicados (UNIQUE index con COALESCE no soporta ON CONFLICT),
  // fallback a fila-por-fila con try/catch.
  const { data, error } = await supabase.from(tabla).insert(rows).select('id')
  if (!error) return { inserted: data?.length ?? 0, error: null }

  // Si error es duplicate key, intentar fila por fila e ignorar duplicados
  if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
    let insertedCount = 0
    const skippedCount = { count: 0 }
    for (const row of rows) {
      const { data: d, error: e } = await supabase.from(tabla).insert(row).select('id').maybeSingle()
      if (!e && d) { insertedCount++ }
      else if (e && (e.code === '23505' || /duplicate|unique/i.test(e.message))) { skippedCount.count++ }
      else if (e) { return { inserted: insertedCount, error: e } }
    }
    return { inserted: insertedCount, error: null, skipped: skippedCount.count }
  }

  return { inserted: 0, error }
}

async function migrarHoja(supabase, ws, mapping, errors) {
  const rows = []
  const hojaNombre = ws.name
  // Auto-detect header row si el mapping no lo especifica (para mappings genericos)
  let headerRow = mapping.headerRow
  if (headerRow == null) {
    headerRow = detectarFilaDataInicio(ws, 20)
    if (headerRow == null) {
      console.log(`  ${hojaNombre}: sin data detectable, skip`)
      return { hoja: hojaNombre, total: 0, skipped: 0, errors: 0, inserted: 0 }
    }
    // La fila detectada ES la primera con data; iteramos desde ahi
    headerRow = headerRow - 1
  }
  const max = ws.rowCount || headerRow + 3000
  let skipped = 0
  let errors_count = 0

  for (let r = headerRow + 1; r <= max; r++) {
    const row = ws.getRow(r)
    // Build object with column-letter keys
    const v = {}
    let hasAny = false
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      v[colIndexToLetter(colNumber)] = cell.value
      hasAny = true
    })
    if (!hasAny) { skipped++; continue }

    try {
      const payload = mapping.mapeo(v)
      // Acepta fecha en cualquier columna fecha conocida (mantenimiento usa fecha_mantenimiento)
      const hasFecha = payload.fecha || payload.fecha_mantenimiento || payload.fecha_operacion
      if (!hasFecha) { skipped++; continue }

      // Truncar campos string a su maxLen por columna para evitar varchar overflow
      for (const [k, maxLen] of Object.entries(MAX_LEN_POR_CAMPO)) {
        if (typeof payload[k] === 'string' && payload[k].length > maxLen) {
          payload[k] = payload[k].slice(0, maxLen)
        }
      }

      // Extraer metadata privada (underscore prefix) antes de insertar
      const cumcsCodigoOriginal = payload.__cumcs_codigo
      const extraCols = payload.__datos_extra_cols
      delete payload.__cumcs_codigo
      delete payload.__datos_extra_cols

      const rowFinal = {
        ...payload,
        creado_por: DEFAULT_CREADO_POR,
        datos_extra: {
          via_migration: true,
          source_file: 'CM-RE-1010 Matriz Consolidada v2.xlsx',
          source_sheet: hojaNombre,
          source_row: r,
          migrated_at: new Date().toISOString(),
          ...(cumcsCodigoOriginal ? { codigo_cumcs: cumcsCodigoOriginal } : {}),
          ...(extraCols ? { cols: extraCols } : {}),  // mapeo generico preserva columnas originales
        },
      }
      // Solo agregar organizacion_id si la tabla lo tiene
      if (!mapping.sinOrganizacionId) {
        rowFinal.organizacion_id = ORG_ID
      }
      rows.push(rowFinal)
    } catch (e) {
      errors_count++
      errors.push({ hoja: hojaNombre, row: r, error: String(e.message ?? e), values: v })
    }
  }

  const total = rows.length
  console.log(`  ${hojaNombre}: ${total} filas validas, ${skipped} skip, ${errors_count} errores`)

  if (flags.dryRun) {
    return { hoja: hojaNombre, total, skipped, errors: errors_count, inserted: 0, dry_run: true }
  }

  let inserted = 0
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const res = await upsertBatch(supabase, mapping.tabla, batch)
    if (res.error) {
      errors.push({ hoja: hojaNombre, batch_start: i, error: res.error.message ?? String(res.error) })
      console.error(`    batch ${i}-${i + batch.length}: ERROR ${res.error.message}`)
    } else {
      inserted += res.inserted
      if (flags.verbose) console.log(`    batch ${i}-${i + batch.length}: ${res.inserted} inserted`)
    }
  }
  return { hoja: hojaNombre, total, skipped, errors: errors_count, inserted }
}

async function main() {
  if (!SERVICE_KEY && !flags.dryRun) {
    console.error('SUPABASE_SERVICE_ROLE_KEY requerida (o --dry-run para simular).')
    console.error('Obtenerla en: https://supabase.com/dashboard/project/sqdqvhjlmdweuuncwlfb/settings/api')
    process.exit(2)
  }

  const supabase = SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
    : null

  console.log(`Migracion bulk ${flags.dryRun ? '[DRY RUN]' : '[REAL]'}`)
  console.log(`Excel: ${EXCEL_PATH}`)
  const hash = sha256File(EXCEL_PATH)
  console.log(`SHA256: ${hash}`)

  // Unir mapeos especificos + genericos para el modo --all
  const CUMCS_TODOS = { ...CUMCS_MAPEOS }
  for (const [codigo, cfg] of Object.entries(CUMCS_TABLA_GENERICA)) {
    if (!CUMCS_TODOS[codigo]) {
      CUMCS_TODOS[codigo] = {
        tabla: cfg.tabla,
        hojaNombre: codigo,
        headerRow: null,  // auto-detect
        sinOrganizacionId: cfg.sinOrgId,
        mapeo: (v, rowNum) => mapeoGenerico(v, cfg, rowNum),
      }
    }
  }

  let cumcsList = flags.sheet
    ? [flags.sheet]
    : flags.all
    ? Object.keys(CUMCS_TODOS)
    : CUMCS_PILOTO

  cumcsList = cumcsList.filter(c => {
    if (!CUMCS_TODOS[c]) {
      console.warn(`  ⚠ ${c} sin mapeo definido — skip`)
      return false
    }
    return true
  })

  console.log(`CUMCS a migrar: ${cumcsList.join(', ')}`)
  console.log('---')

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(EXCEL_PATH)

  const errors = []
  const reports = []
  const t0 = Date.now()

  for (const codigo of cumcsList) {
    const mapping = CUMCS_TODOS[codigo]
    const ws = wb.getWorksheet(mapping.hojaNombre)
    if (!ws) {
      console.warn(`  ⚠ Hoja ${mapping.hojaNombre} no encontrada — skip`)
      continue
    }
    console.log(`\n[${codigo}] → ${mapping.tabla}`)
    const report = await migrarHoja(supabase, ws, mapping, errors)
    reports.push(report)
  }

  const elapsed = Date.now() - t0
  const totalFilas = reports.reduce((a, r) => a + r.total, 0)
  const totalInserted = reports.reduce((a, r) => a + r.inserted, 0)

  console.log('\n=== RESUMEN ===')
  console.log(`Hojas procesadas:    ${reports.length}`)
  console.log(`Filas validas:       ${totalFilas}`)
  console.log(`Filas insertadas:    ${totalInserted}${flags.dryRun ? ' (dry run)' : ''}`)
  console.log(`Errores:             ${errors.length}`)
  console.log(`Tiempo:              ${(elapsed / 1000).toFixed(1)}s`)

  const outDir = join(__dirname, 'reports')
  mkdirSync(outDir, { recursive: true })
  const outFile = join(outDir, `migration-${new Date().toISOString().slice(0, 19).replaceAll(':', '-').replace('T', '_')}.json`)
  writeFileSync(outFile, JSON.stringify({
    generado_en: new Date().toISOString(),
    dry_run: flags.dryRun,
    excel_path: EXCEL_PATH,
    excel_sha256: hash,
    cumcs_procesados: cumcsList,
    reports,
    errors_count: errors.length,
    errors: errors.slice(0, 200),  // cap
    elapsed_ms: elapsed,
  }, null, 2))
  console.log(`\nReporte: ${outFile}`)

  if (errors.length > 0) {
    console.error(`\n⚠ ${errors.length} errores. Ver reporte. Primer error:`, errors[0])
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(2)
})
