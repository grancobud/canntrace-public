// Implementacion de las 6 tools del agent. Cada una recibe el cliente Supabase
// (inicializado con JWT del usuario, RLS activo) + los args del LLM.
// Retorna el objeto que se pasa de vuelta al LLM como tool_result.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.103.2'

// Mapeo CUMCS → tabla destino (mirror de src/lib/cumcsRouter.ts del frontend)
const CUMCS_A_TABLA: Record<string, string> = {}
const add = (prefix: string, n: number, tabla: string) => {
  for (let i = 1; i <= n; i++) {
    const code = `CM-RE-${prefix}${String(i).padStart(2, '0')}`
    CUMCS_A_TABLA[code] = tabla
  }
}
add('01', 8, 'registros_condiciones_ambientales')
add('02', 11, 'registros_trazabilidad')
add('03', 6, 'registros_fertilizantes')
add('04', 3, 'registros_agua')
add('05', 7, 'registros_fitosanitarios')
add('06', 11, 'registros_cosecha')
add('07', 7, 'registros_mantenimiento')
add('08', 10, 'registros_personal')
add('09', 11, 'registros_calidad')
add('10', 10, 'registros_documentales')

// Camadas validas (mirror de schemas)
const CAMADAS_VALIDAS = new Set(['C7', 'C9', 'C11', 'C12', 'C15', 'C16'])

// Schema fisico de cada tabla: que columnas tiene realmente.
// Se usa para construir queries dinamicas sin pedir columnas inexistentes.
interface TablaSchema {
  fechaCol: string  // 'fecha' o 'fecha_mantenimiento'
  hasCamada: boolean
  hasLoteId: boolean
  hasSistema: boolean
  hasTipo: boolean
}
const TABLA_SCHEMA: Record<string, TablaSchema> = {
  registros_agua:                    { fechaCol: 'fecha',               hasCamada: false, hasLoteId: false, hasSistema: false, hasTipo: true },
  registros_calidad:                 { fechaCol: 'fecha',               hasCamada: false, hasLoteId: true,  hasSistema: false, hasTipo: true },
  registros_condiciones_ambientales: { fechaCol: 'fecha',               hasCamada: true,  hasLoteId: true,  hasSistema: true,  hasTipo: true },
  registros_cosecha:                 { fechaCol: 'fecha',               hasCamada: true,  hasLoteId: true,  hasSistema: true,  hasTipo: true },
  registros_documentales:            { fechaCol: 'fecha',               hasCamada: false, hasLoteId: false, hasSistema: false, hasTipo: true },
  registros_fertilizantes:           { fechaCol: 'fecha',               hasCamada: false, hasLoteId: false, hasSistema: false, hasTipo: true },
  registros_fitosanitarios:          { fechaCol: 'fecha',               hasCamada: false, hasLoteId: true,  hasSistema: false, hasTipo: true },
  registros_mantenimiento:           { fechaCol: 'fecha_mantenimiento', hasCamada: false, hasLoteId: false, hasSistema: false, hasTipo: true },
  registros_personal:                { fechaCol: 'fecha',               hasCamada: false, hasLoteId: false, hasSistema: false, hasTipo: true },
  registros_trazabilidad:            { fechaCol: 'fecha',               hasCamada: true,  hasLoteId: true,  hasSistema: true,  hasTipo: true },
}

function getSchema(tabla: string): TablaSchema | null {
  return TABLA_SCHEMA[tabla] ?? null
}

// Rangos de validacion para campos numericos (aprox, se afinan con uso)
const RANGOS_NUMERICOS: Record<string, [number, number]> = {
  temperatura: [10, 40],
  temp_aa: [10, 30],
  temp_h2o: [15, 30],
  humedad: [30, 95],
  humedad_pct: [0, 100],
  ph_inicial: [4, 8],
  ph_corregido: [4, 8],
  ec: [0, 10],
  vpd_kpa: [0, 3],
  co2_ppm: [200, 2000],
  peso_fresco: [0, 100],
  peso_seco: [0, 100],
  plantas_cosechadas: [0, 1000],
}

/**
 * Metadata compacta por tabla: campos principales que el LLM deberia pedir.
 * El LLM tambien tiene el schema completo en system prompt — esto es solo para
 * la tool `getTableMetadata` que refresca memoria contextual.
 */
const CAMPOS_PRINCIPALES: Record<string, Array<{ key: string; label: string; tipo: string; requerido?: boolean; opciones?: string[] }>> = {
  registros_condiciones_ambientales: [
    { key: 'fecha', label: 'Fecha', tipo: 'date', requerido: true },
    { key: 'camada', label: 'Camada', tipo: 'select', requerido: true, opciones: ['C7','C9','C11','C12','C15','C16'] },
    { key: 'sistema', label: 'Sistema', tipo: 'select', opciones: ['RDWC','COCO'] },
    { key: 'humedad', label: 'Humedad %', tipo: 'number' },
    { key: 'temperatura', label: 'Temperatura °C', tipo: 'number' },
    { key: 'temp_aa', label: 'T° A.A', tipo: 'number' },
    { key: 'temp_h2o', label: 'T° H2O', tipo: 'number' },
    { key: 'ec', label: 'EC', tipo: 'number' },
    { key: 'ph_inicial', label: 'pH inicial', tipo: 'number' },
    { key: 'ph_corregido', label: 'pH corregido', tipo: 'number' },
    { key: 'vpd_kpa', label: 'VPD (kPa)', tipo: 'number' },
    { key: 'co2_ppm', label: 'CO2 ppm', tipo: 'number' },
    { key: 'ventilacion', label: 'Ventilacion', tipo: 'text' },
    { key: 'observaciones', label: 'Observaciones', tipo: 'textarea' },
    { key: 'responsable', label: 'Responsable', tipo: 'text' },
  ],
  registros_trazabilidad: [
    { key: 'fecha', label: 'Fecha', tipo: 'date', requerido: true },
    { key: 'camada', label: 'Camada', tipo: 'select', opciones: ['C7','C9','C11','C12','C15','C16'] },
    { key: 'sistema', label: 'Sistema', tipo: 'select', opciones: ['RDWC','COCO'] },
    { key: 'cod_traza_cosecha', label: 'Cod. traza cosecha', tipo: 'text' },
    { key: 'cod_traza_secado', label: 'Cod. traza secado', tipo: 'text' },
    { key: 'cod_comercial', label: 'Cod. comercial', tipo: 'text' },
    { key: 'planta_madre_id', label: 'ID Planta Madre', tipo: 'text' },
    { key: 'clonacion_origen', label: 'Clonacion origen', tipo: 'text' },
    { key: 'peso_fresco_kg', label: 'Peso fresco (kg)', tipo: 'number' },
    { key: 'peso_seco_kg', label: 'Peso seco (kg)', tipo: 'number' },
    { key: 'cantidad', label: 'Cantidad', tipo: 'number' },
    { key: 'observaciones', label: 'Observaciones', tipo: 'textarea' },
    { key: 'responsable', label: 'Responsable', tipo: 'text' },
  ],
  registros_fertilizantes: [
    { key: 'fecha', label: 'Fecha', tipo: 'date', requerido: true },
    { key: 'tanque', label: 'Tanque', tipo: 'text' },
    { key: 'destino', label: 'Destino', tipo: 'select', opciones: ['Sala Flora 1','Sala Flora 2','Plantas Madres','Vegetativo','Clonacion'] },
    { key: 'producto', label: 'Producto', tipo: 'text' },
    { key: 'cantidad_producto', label: 'Cant. producto', tipo: 'number' },
    { key: 'litros_agua', label: 'Litros agua', tipo: 'number' },
    { key: 'dilucion', label: 'Dilucion', tipo: 'text' },
    { key: 'observaciones', label: 'Observaciones', tipo: 'textarea' },
    { key: 'responsable', label: 'Responsable', tipo: 'text' },
  ],
  registros_cosecha: [
    { key: 'fecha', label: 'Fecha', tipo: 'date', requerido: true },
    { key: 'fecha_cosecha', label: 'Fecha cosecha', tipo: 'date' },
    { key: 'camada', label: 'Camada', tipo: 'select', requerido: true, opciones: ['C7','C9','C11','C12','C15','C16'] },
    { key: 'sistema', label: 'Sistema', tipo: 'select', opciones: ['RDWC','COCO'] },
    { key: 'plantas_cosechadas', label: 'Plantas cosechadas', tipo: 'number' },
    { key: 'peso_fresco', label: 'Peso fresco (kg)', tipo: 'number' },
    { key: 'peso_seco', label: 'Peso seco (kg)', tipo: 'number' },
    { key: 'estado_producto', label: 'Estado producto', tipo: 'select', opciones: ['Frescas','Secas','Trimeadas'] },
    { key: 'cod_traza_cosecha', label: 'Cod. traza', tipo: 'text' },
    { key: 'observaciones', label: 'Observaciones', tipo: 'textarea' },
    { key: 'responsable', label: 'Responsable', tipo: 'text' },
  ],
}

export interface ToolContext {
  supabase: SupabaseClient
  userId: string
}

// ==================== getContext ====================
export async function getContext(ctx: ToolContext) {
  const { data, error } = await ctx.supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', ctx.userId)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { nueva_sesion: true, mensaje: 'Primera vez. No hay contexto previo.' }
  return {
    last_cumcs: data.last_cumcs,
    last_tabla: data.last_tabla,
    last_camada: data.last_camada,
    last_fecha_cargada: data.last_fecha_cargada,
    total_turnos: data.total_turnos,
    resumen: data.conversation_summary,
    actualizado_en: data.actualizado_en,
  }
}

// ==================== getLatest ====================
export async function getLatest(
  ctx: ToolContext,
  args: { tabla: string; camada?: string; tipo?: string },
) {
  const schema = getSchema(args.tabla)
  if (!schema) return { error: `Tabla desconocida: ${args.tabla}` }

  // Solo campos que existen en esa tabla (evita error "column does not exist")
  const selectCols = ['id', schema.fechaCol, 'creado_en', 'creado_por']
  if (schema.hasTipo) selectCols.push('tipo')
  if (schema.hasCamada) selectCols.push('camada')
  if (schema.hasLoteId) selectCols.push('lote_id')
  if (schema.hasSistema) selectCols.push('sistema')

  let q = ctx.supabase
    .from(args.tabla)
    .select(selectCols.join(', '))
    .order(schema.fechaCol, { ascending: false })
    .limit(1)

  // Filtro camada solo si la tabla lo soporta. Si el user pidio camada y la
  // tabla no la tiene, devolvemos un aviso explicito en vez de query rota.
  const avisos: string[] = []
  if (args.camada) {
    if (!CAMADAS_VALIDAS.has(args.camada)) {
      return { error: `Camada invalida: ${args.camada}. Validas: ${Array.from(CAMADAS_VALIDAS).join(', ')}` }
    }
    if (schema.hasCamada) {
      q = q.eq('camada', args.camada)
    } else {
      avisos.push(`La tabla ${args.tabla} no tiene columna camada. Filtro ignorado.`)
    }
  }
  if (args.tipo && schema.hasTipo) q = q.eq('tipo', args.tipo)

  const { data, error } = await q
  if (error) return { error: error.message, avisos }
  if (!data || data.length === 0) {
    return { encontrado: false, mensaje: 'No hay registros para esa combinacion.', avisos }
  }
  const row = data[0] as Record<string, unknown>
  // Normalizar: exponer 'fecha' aunque la columna sea fecha_mantenimiento
  const ultimo = { ...row, fecha: row[schema.fechaCol] }
  return { encontrado: true, ultimo, avisos: avisos.length ? avisos : undefined }
}

// ==================== checkMissingDates ====================
export async function checkMissingDates(
  ctx: ToolContext,
  args: { tabla: string; camada?: string; tipo?: string; desde: string; hasta?: string },
) {
  const schema = getSchema(args.tabla)
  if (!schema) return { error: `Tabla desconocida: ${args.tabla}` }

  const hasta = args.hasta ?? new Date().toISOString().slice(0, 10)
  const avisos: string[] = []

  let q = ctx.supabase
    .from(args.tabla)
    .select(schema.fechaCol)
    .gte(schema.fechaCol, args.desde)
    .lte(schema.fechaCol, hasta)

  if (args.camada) {
    if (schema.hasCamada) q = q.eq('camada', args.camada)
    else avisos.push(`La tabla ${args.tabla} no tiene camada. Filtro ignorado.`)
  }
  if (args.tipo && schema.hasTipo) q = q.eq('tipo', args.tipo)

  const { data, error } = await q
  if (error) return { error: error.message, avisos }

  const fechasExistentes = new Set(
    (data ?? []).map((r: Record<string, unknown>) => String(r[schema.fechaCol]))
  )
  const faltantes: string[] = []
  const d0 = new Date(args.desde)
  const d1 = new Date(hasta)
  const cursor = new Date(d0)
  while (cursor <= d1) {
    const iso = cursor.toISOString().slice(0, 10)
    if (!fechasExistentes.has(iso)) faltantes.push(iso)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return {
    faltantes: faltantes.slice(0, 60),
    total: faltantes.length,
    rango: { desde: args.desde, hasta },
    avisos: avisos.length ? avisos : undefined,
  }
}

// ==================== countRecords ====================
// Cuenta registros en una tabla con filtros opcionales. Util cuando el usuario
// pregunta cosas genericas ("¿que tengo cargado?", "¿cuantos registros del 2025?")
// Devuelve total + rango fechas + agrupacion por camada/tipo cuando aplica.
export async function countRecords(
  ctx: ToolContext,
  args: { tabla: string; camada?: string; tipo?: string; desde?: string; hasta?: string },
) {
  const schema = getSchema(args.tabla)
  if (!schema) return { error: `Tabla desconocida: ${args.tabla}` }

  const avisos: string[] = []

  // Query base con solo las columnas necesarias
  const selectCols = [schema.fechaCol]
  if (schema.hasCamada) selectCols.push('camada')
  if (schema.hasTipo) selectCols.push('tipo')

  let q = ctx.supabase.from(args.tabla).select(selectCols.join(', '))

  if (args.desde) q = q.gte(schema.fechaCol, args.desde)
  if (args.hasta) q = q.lte(schema.fechaCol, args.hasta)
  if (args.camada) {
    if (schema.hasCamada) q = q.eq('camada', args.camada)
    else avisos.push(`La tabla ${args.tabla} no tiene camada. Filtro ignorado.`)
  }
  if (args.tipo && schema.hasTipo) q = q.eq('tipo', args.tipo)

  const { data, error } = await q
  if (error) return { error: error.message, avisos }

  const rows = (data ?? []) as Array<Record<string, unknown>>
  const total = rows.length
  const fechas = rows.map(r => String(r[schema.fechaCol])).filter(f => f && f !== 'null').sort()
  const primera_fecha = fechas[0] ?? null
  const ultima_fecha = fechas[fechas.length - 1] ?? null

  const por_camada: Record<string, number> = {}
  const por_tipo: Record<string, number> = {}
  let con_camada = 0
  let sin_camada = 0
  for (const r of rows) {
    if (schema.hasCamada) {
      const c = r.camada ? String(r.camada) : null
      if (c) { por_camada[c] = (por_camada[c] ?? 0) + 1; con_camada++ }
      else sin_camada++
    }
    if (schema.hasTipo) {
      const t = r.tipo ? String(r.tipo) : null
      if (t) por_tipo[t] = (por_tipo[t] ?? 0) + 1
    }
  }

  // Nota importante: data historica migrada desde Excel no tiene camada linkeada.
  if (schema.hasCamada && sin_camada > 0) {
    avisos.push(`${sin_camada} de ${total} registros no tienen camada (data historica Excel sin ese campo).`)
  }

  return {
    tabla: args.tabla,
    total,
    primera_fecha,
    ultima_fecha,
    por_camada: schema.hasCamada ? por_camada : undefined,
    con_camada: schema.hasCamada ? con_camada : undefined,
    sin_camada: schema.hasCamada ? sin_camada : undefined,
    por_tipo: Object.keys(por_tipo).length > 0 ? por_tipo : undefined,
    filtros_aplicados: { camada: args.camada, tipo: args.tipo, desde: args.desde, hasta: args.hasta },
    avisos: avisos.length ? avisos : undefined,
  }
}

// ==================== getTableMetadata ====================
export function getTableMetadata(_ctx: ToolContext, args: { codigo_cumcs: string }) {
  const tabla = CUMCS_A_TABLA[args.codigo_cumcs]
  if (!tabla) return { error: `CUMCS desconocido: ${args.codigo_cumcs}` }
  const campos = CAMPOS_PRINCIPALES[tabla] ?? []
  return {
    codigo_cumcs: args.codigo_cumcs,
    tabla_destino: tabla,
    frecuencia: 'daily',
    campos,
    camadas_validas: Array.from(CAMADAS_VALIDAS),
    rangos_numericos: RANGOS_NUMERICOS,
  }
}

// ==================== proposeInsert ====================
export async function proposeInsert(
  ctx: ToolContext,
  args: { codigo_cumcs: string; data: Record<string, unknown> },
) {
  const tabla = CUMCS_A_TABLA[args.codigo_cumcs]
  if (!tabla) return { error: `Sin tabla mapeada para ${args.codigo_cumcs}` }

  const campos = CAMPOS_PRINCIPALES[tabla] ?? []
  const errores: Array<{ campo: string; error: string; valor?: unknown }> = []
  const payload: Record<string, unknown> = {
    tipo: args.codigo_cumcs,
    creado_por: ctx.userId,
    datos_extra: { via: 'agent_ia', via_ai: true, codigo_cumcs: args.codigo_cumcs },
  }

  // Camada valida
  if (args.data.camada != null && !CAMADAS_VALIDAS.has(String(args.data.camada))) {
    errores.push({
      campo: 'camada',
      valor: args.data.camada,
      error: `Camada invalida. Validas: ${Array.from(CAMADAS_VALIDAS).join(', ')}. C8/C10/C13/C14 no existen.`,
    })
  }

  // Required presentes (para los campos con requerido: true)
  for (const c of campos) {
    if (c.requerido) {
      const v = args.data[c.key]
      if (v == null || v === '') errores.push({ campo: c.key, error: 'Campo requerido ausente' })
    }
  }

  // Rangos numericos
  for (const [key, [min, max]] of Object.entries(RANGOS_NUMERICOS)) {
    const v = args.data[key]
    if (v == null) continue
    const n = typeof v === 'number' ? v : parseFloat(String(v))
    if (isNaN(n)) { errores.push({ campo: key, valor: v, error: 'no es numero valido' }); continue }
    if (n < min || n > max) errores.push({ campo: key, valor: n, error: `fuera de rango [${min}, ${max}]` })
  }

  if (errores.length > 0) {
    return { zod_ok: false, errores, mensaje: 'Validacion fallo, pedi al usuario que corrija.' }
  }

  // Auto-confirm optimista: detectar si este insert es "rutina" del usuario.
  // Criterio: el user ya cargo este mismo CUMCS antes (last_cumcs coincide en
  // chat_sessions) Y tiene muchos turnos acumulados (>=10) Y todos los valores
  // numericos estan dentro de rangos P5-P95 aproximados.
  // Si es rutina, el LLM tiene luz verde para llamar confirmInsert en el mismo
  // turno sin pedir confirmacion al usuario.
  let esRutina = false
  let motivoRutina = ''
  try {
    const { data: sess } = await ctx.supabase
      .from('chat_sessions')
      .select('last_cumcs, last_camada, total_turnos')
      .eq('user_id', ctx.userId)
      .maybeSingle()
    const s = sess as { last_cumcs: string | null; last_camada: string | null; total_turnos: number | null } | null
    const mismoCumcs = s?.last_cumcs === args.codigo_cumcs
    const mismaCamada = args.data.camada != null && s?.last_camada === String(args.data.camada)
    const muchosTurnos = (s?.total_turnos ?? 0) >= 10
    if (mismoCumcs && muchosTurnos) {
      esRutina = true
      motivoRutina = mismaCamada
        ? `Rutina detectada: ${s!.total_turnos} turnos + mismo CUMCS + misma camada que la ultima vez.`
        : `Rutina detectada: ${s!.total_turnos} turnos + mismo CUMCS.`
    }
  } catch { /* silencioso, rutina queda en false */ }

  // Copiar valores al payload (solo campos conocidos del schema)
  for (const c of campos) {
    const v = args.data[c.key]
    if (v != null && v !== '') payload[c.key] = v
  }

  // Default: fecha si falta. Columna depende de la tabla.
  const schema = getSchema(tabla)
  const fechaCol = schema?.fechaCol ?? 'fecha'
  if (!payload[fechaCol]) {
    payload[fechaCol] = args.data[fechaCol] ?? args.data.fecha ?? new Date().toISOString().slice(0, 10)
  }

  const preview_text = `${args.codigo_cumcs} — ${Object.entries(args.data)
    .filter(([_, v]) => v != null && v !== '')
    .slice(0, 5)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')}`

  const { data: draft, error } = await ctx.supabase
    .from('pending_inserts')
    .insert({
      user_id: ctx.userId,
      tabla_destino: tabla,
      codigo_cumcs: args.codigo_cumcs,
      payload,
      preview_text,
      zod_ok: true,
    })
    .select('id, expira_en')
    .single()

  if (error) return { error: `No se pudo crear draft: ${error.message}` }
  return {
    draft_id: draft.id,
    tabla_destino: tabla,
    preview: payload,
    preview_text,
    expira_en: draft.expira_en,
    auto_confirm_eligible: esRutina,
    motivo_rutina: esRutina ? motivoRutina : undefined,
    mensaje: esRutina
      ? 'Draft creado. Detectada rutina — podes llamar confirmInsert directo en el siguiente step sin preguntar, avisando al user "auto-guardado por rutina, si queres cancelar decime".'
      : 'Draft creado. Mostrar al usuario y llamar confirmInsert(draft_id) tras aprobacion.',
  }
}

// ==================== confirmInsert ====================
export async function confirmInsert(ctx: ToolContext, args: { draft_id: string }) {
  const { data: draft, error: errDraft } = await ctx.supabase
    .from('pending_inserts')
    .select('*')
    .eq('id', args.draft_id)
    .eq('user_id', ctx.userId)
    .single()

  if (errDraft || !draft) return { error: `Draft no encontrado: ${errDraft?.message ?? 'desconocido'}` }
  if (draft.confirmado_en) return { error: 'Draft ya confirmado previamente.' }
  if (draft.cancelado_en) return { error: 'Draft cancelado.' }
  if (new Date(draft.expira_en) < new Date()) return { error: 'Draft expirado (TTL 10 min). Crear uno nuevo.' }

  const { data: inserted, error: errInsert } = await ctx.supabase
    .from(draft.tabla_destino)
    .insert(draft.payload)
    .select('id')
    .single()

  if (errInsert) return { error: `Insert fallo: ${errInsert.message}` }

  await ctx.supabase
    .from('pending_inserts')
    .update({ confirmado_en: new Date().toISOString(), confirmado_registro_id: inserted.id })
    .eq('id', args.draft_id)

  const fecha = (draft.payload?.fecha as string) ?? new Date().toISOString().slice(0, 10)
  const camada = (draft.payload?.camada as string) ?? null
  await ctx.supabase.from('chat_sessions').upsert({
    user_id: ctx.userId,
    last_cumcs: draft.codigo_cumcs,
    last_tabla: draft.tabla_destino,
    last_camada: camada,
    last_fecha_cargada: fecha,
    actualizado_en: new Date().toISOString(),
  })

  return {
    ok: true,
    tabla: draft.tabla_destino,
    registro_id: inserted.id,
    mensaje: `Guardado en ${draft.tabla_destino}. audit_log con hash-chain generado automaticamente.`,
  }
}

// ==================== Dispatcher ====================
export async function dispatchTool(ctx: ToolContext, name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'getContext': return await getContext(ctx)
    case 'getLatest': return await getLatest(ctx, args as { tabla: string; camada?: string; tipo?: string })
    case 'checkMissingDates': return await checkMissingDates(ctx, args as { tabla: string; camada?: string; tipo?: string; desde: string; hasta?: string })
    case 'countRecords': return await countRecords(ctx, args as { tabla: string; camada?: string; tipo?: string; desde?: string; hasta?: string })
    case 'getTableMetadata': return getTableMetadata(ctx, args as { codigo_cumcs: string })
    case 'proposeInsert': return await proposeInsert(ctx, args as { codigo_cumcs: string; data: Record<string, unknown> })
    case 'confirmInsert': return await confirmInsert(ctx, args as { draft_id: string })
    default: return { error: `Tool desconocida: ${name}` }
  }
}
