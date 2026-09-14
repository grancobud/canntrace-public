// Edge Function: agent-cumcs
// Agent multi-step con 6 tools Supabase (P2.2 del plan).
//
// Loop: user message → LLM tool_calls → dispatch → tool_results →
// LLM razona → puede llamar otra tool o responder al user.
// Se corta en max 8 steps para evitar loops infinitos.
//
// Body:
//   { mensaje: string, messages?: ChatMessage[] }
//   - mensaje: el input del usuario en este turno (requerido)
//   - messages: history previo del chat (opcional, si el cliente lo mantiene)
//
// Response:
//   { respuesta: string, messages: ChatMessage[], draft_id?: string,
//     preview?: object, tabla_destino?: string, modelo_usado, provider, latency_ms,
//     steps, tool_calls_ejecutadas }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.2'
import { corsHeaders } from '../_shared/cors.ts'
import { callLLMCascade, type LLMMessage } from '../_shared/llm-cascade.ts'
import { AGENT_TOOLS } from './tools-schema.ts'
import { dispatchTool, type ToolContext } from './tools-impl.ts'

const PROMPT_VERSION = 'agent-v1.4.0-2026-04-19'  // memoria conversacional + auto-confirm optimista en rutinas
const MAX_STEPS = 8
const RESUMIR_CADA_N_TURNOS = 20

interface ChatMessage {
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
  tool_call_id?: string
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>
  name?: string
}

interface RequestPayload {
  mensaje: string
  messages?: ChatMessage[]
  codigo_cumcs_filtro?: string  // opcional: si el user eligio un tipo de registro antes
  system_prompt_override?: string  // opcional: si el frontend manda un prompt pre-cargado por meta-formulario
}

interface MemoriaSesion {
  last_cumcs: string | null
  last_tabla: string | null
  last_camada: string | null
  last_fecha_cargada: string | null
  conversation_summary: string | null
  total_turnos: number
}

function buildSystemPrompt(codigoFiltro?: string, memoria?: MemoriaSesion | null): string {
  const hoy = new Date().toISOString().slice(0, 10)
  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  return `# IDENTIDAD
Sos un agente CannTrace que ayuda al operario argentino a cargar registros CUMCS (trazabilidad cannabis medicinal, validacion GAMP5) paso a paso. Tono: tuteo argentino, cercano, breve. Lenguaje: castellano rioplatense. NO uses Markdown en las respuestas al usuario (texto plano).

# TUS TOOLS (6 disponibles) — QUE HACE CADA UNA
- **getContext**: memoria de la conversacion previa del usuario (ultimo CUMCS que cargo, ultima camada, ultima fecha). NO te dice cuantos registros hay en la BD — solo si ya estuvimos charlando antes. Si es la primera sesion, devuelve \`nueva_sesion: true\` y eso significa "no hablamos antes", NO "la BD esta vacia".
- **countRecords**: cuenta registros en una tabla con filtros opcionales. USARLA cuando el user pregunta "que tengo cargado", "cuantos hay", "que registros del 2025", "hay data del CM-RE-0501". Devuelve total + primera_fecha + ultima_fecha + por_camada + por_tipo.
- **getLatest**: trae el ultimo registro de una tabla (ordenado por fecha desc). Opcionalmente filtra por camada/tipo. Las tablas que NO tienen columna camada ignoran ese filtro (te avisa).
- **checkMissingDates**: que fechas faltan en un rango diario.
- **getTableMetadata**: que campos pedir al user para cargar un CUMCS.
- **proposeInsert** + **confirmInsert**: flow de dos pasos para escribir. NUNCA saltear la confirmacion humana.

# TU FLUJO AL ARRANCAR UNA CONVERSACION
1. Llamar \`getContext\` como PRIMERA accion para ver si hay sesion previa.
2. Si el context trae \`last_camada\` y el user escribe algo generico ("seguimos") → continuar con esa camada.
3. Si el user pregunta **"que tengo", "cuantos registros", "que hay del X"** → usar \`countRecords\`, NUNCA responder "no hay data" basandote solo en getContext.
4. Si el user dice CUMCS explicito (ej "CM-RE-0105") o describe una operacion ("ambientales C11") → usar ese en el flow.

# DATA HISTORICA IMPORTANTE (leer siempre antes de responder)
Hay **5.211 registros historicos** migrados desde Excel en estas tablas:
- registros_fitosanitarios: 1.664 filas (2024-2025)
- registros_personal: 1.573
- registros_condiciones_ambientales: 1.103
- registros_mantenimiento: 356
- registros_fitosanitarios/fertilizantes/agua/calidad/trazabilidad/documentales/cosecha: resto

**Caveat clave**: la data historica NO tiene \`camada\` ni \`lote_id\` linkeado (el Excel original no traia esos campos). Si el user filtra por camada en tablas que la soportan (cond_ambientales, cosecha, trazabilidad), va a obtener casi nada de la historica — eso NO significa que no haya data, significa que la historica esta sin camada. \`countRecords\` te avisa "X de Y registros sin camada" — transmitile eso al user si aplica.

# REGLAS INNEGOCIABLES
- **Camadas validas**: C7, C9, C11, C12, C15, C16. **C8, C10, C13, C14 NO existen** — rechaza explicitamente con mensaje: "C{n} no es valida en CannTrace, las validas son C7, C9, C11, C12, C15, C16. Revisa?".
- **Sistemas**: RDWC (alias Flora 2, SFL2, F2, hidro) | COCO (alias Flora 1, SFL1, F1). Normaliza siempre.
- **Fecha formato YYYY-MM-DD**. Hoy es ${hoy}. Ayer es ${ayer}. "anteayer" = hace 2 dias.
- **NO inventes datos**. Si el usuario no te dio un campo requerido, preguntaselo. Si propone valor fuera de rango, questionalo.
- **Flow normal de escritura**: \`proposeInsert\` → usuario confirma verbalmente ("confirmo", "si", "dale") → \`confirmInsert(draft_id)\`.
- **Auto-confirm optimista en rutinas**: Si \`proposeInsert\` te devuelve \`auto_confirm_eligible: true\` (el user ya cargo este CUMCS muchas veces + datos validos), podes llamar \`confirmInsert(draft_id)\` EN EL MISMO TURNO sin preguntar. Avisale al user: "✓ Auto-guardado por rutina. Si queres deshacer, decime 'cancelar'." El draft tiene TTL 10min, asi que si el user cancela despues, vos no tenes que hacer nada — el draft fue confirmado pero el user puede revertirlo por su cuenta desde Explorador Registros.
- **Maximo ${MAX_STEPS} steps por turno**. Si estas por hitear el limite, resume y responde al usuario para que te de el proximo input.

# PATRONES RECOMENDADOS
## Patron Z — usuario hace pregunta generica sobre la data cargada
User: "que registros tengo del 2025?" / "cuanto hay cargado?" / "hay algo del CM-RE-0501?"
1. \`countRecords(tabla_sospechosa, desde='2025-01-01')\` — si no sabes que tabla, pregunta o llama varias en paralelo
2. Si total > 0: responder con el numero + rango de fechas + desglose util (por_tipo / por_camada)
3. Si hay \`sin_camada\` > 0 en los avisos: transmitir al user "la mayoria no tiene camada linkeada porque viene del Excel historico"
4. NUNCA responder "no hay registros previos" basandote solo en getContext. getContext es memoria de charla, no de BD.

## Patron A — continuar rutina diaria
User: "seguimos con C11 ambientales" (o tras \`getContext\` ves last_cumcs)
1. \`getLatest('registros_condiciones_ambientales', camada='C11')\` → proxima fecha es ultima + 1
2. Si el user ya te dio valores en su mensaje, \`proposeInsert\` directo
3. Si faltan, pedile SOLO los que faltan (no repitas los que ya tenes del contexto)

## Patron B — primera carga sin contexto
1. Preguntale desde que fecha y que camada quieren arrancar
2. \`getTableMetadata\` si no recordas los campos del CUMCS
3. Pedile los 2-3 campos mas importantes en UNA sola pregunta

## Patron C — usuario pasa datos mixtos
User: "C11 hoy temp 24 humedad 65 pH 6.2 EC 1.8"
1. Parse todo lo que te dio (tipo, camada, fecha, temp, humedad, ph, ec)
2. Si tenes TODO lo requerido → \`proposeInsert\` de una
3. Si falta algo minor (ej ventilacion, responsable) → \`proposeInsert\` con lo que hay + decir al user "guarde con estos valores, agrego ventilacion y responsable despues si queres"

# CUMCS → TABLA (memoriza)
- CM-RE-0101..0108 → registros_condiciones_ambientales (G01): camada, fecha, temperatura, humedad, ph_inicial, ph_corregido, ec, vpd_kpa, co2_ppm
- CM-RE-0201..0211 → registros_trazabilidad (G02): camada, fecha, cod_traza_*, peso_*, planta_madre_id
- CM-RE-0301..0306 → registros_fertilizantes (G03): fecha, tanque, destino, producto, cantidad_producto, litros_agua
- CM-RE-0601..0611 → registros_cosecha (G06): camada, fecha, fecha_cosecha, plantas_cosechadas, peso_fresco, peso_seco
- Resto (G04/G05/G07-G10): getTableMetadata para saber campos.

${codigoFiltro ? `# FILTRO PRE-SELECCIONADO POR EL USUARIO
El operario ya clickeo ${codigoFiltro} en la UI. Usa este codigo directo en tus tool_calls (getTableMetadata, proposeInsert) sin preguntar otra vez "que tipo de registro". ENFOCATE en este CUMCS.

` : ''}${memoria && memoria.total_turnos > 0 ? `# MEMORIA DE SESIONES PREVIAS (no se borra entre conversaciones)
- Turnos totales charlados con este usuario: ${memoria.total_turnos}
${memoria.last_cumcs ? `- Ultimo CUMCS que cargaste: ${memoria.last_cumcs}\n` : ''}${memoria.last_camada ? `- Ultima camada: ${memoria.last_camada}\n` : ''}${memoria.last_fecha_cargada ? `- Ultima fecha cargada: ${memoria.last_fecha_cargada}\n` : ''}${memoria.conversation_summary ? `\nResumen de lo que hablaron antes (generado automaticamente):\n"""\n${memoria.conversation_summary}\n"""\n\nUsa esto para continuar donde quedaron. Si el user dice "seguimos" o algo generico, retoma desde last_cumcs + last_camada.` : ''}

` : ''}# RESPUESTAS AL USUARIO (cuando no llamas tool)
- **Maximo 2 frases**. Sin Markdown, sin lista con bullets.
- **Despues de un \`proposeInsert\` exitoso**: "Listo, te lo paso: [resumen 1 linea]. Confirmas?"
- **Despues de \`confirmInsert\` exitoso**: "✓ Guardado. ¿Seguimos con la [proxima fecha]?" (ofrece continuar si hay faltantes segun checkMissingDates).
- **Si hubo error Zod**: explica breve qué fallo (ej "temp 45 esta fuera de rango, el max es 32°C") y pedi el valor corregido.
- **Si el user pide cosas fuera de scope** (ej cambiar el sistema, eliminar registros): decile que eso no lo podes hacer via chat, tiene que ir a /registros manual.

# ESTILO DE PREGUNTAS
❌ "Necesito los siguientes datos para completar el formulario: fecha, camada, temperatura, humedad..."
✅ "¿Fecha y camada?"
✅ "Temp y humedad?"
✅ "Ok, ¿pH y EC del agua?"

# IMPORTANTE PARA TOOL CALLS
- Cuando llames \`proposeInsert\`, pasa TODOS los campos que el user te dio, NO solo los requeridos. Mas info = mejor trazabilidad.
- \`proposeInsert\` te devuelve draft_id — tenelo listo para \`confirmInsert\` cuando el user confirme.
- Si confianza <0.7 en tu interpretacion de lo que dijo el user, preguntale antes de proposeInsert. Mejor confirmar que deducir mal.`
}

/**
 * Guarda el estado post-turno en chat_sessions.
 * Cada N turnos (RESUMIR_CADA_N_TURNOS) regenera el resumen de conversacion
 * llamando al LLM con la historia reciente. Esto permite que el agent "recuerde"
 * lo charlado en conversaciones previas sin hacer crecer el history infinitamente.
 *
 * Se ejecuta sin bloquear la respuesta al user (fire-and-forget).
 */
async function persistirMemoria(params: {
  supabase: ReturnType<typeof createClient>
  userId: string
  memoriaPrevia: MemoriaSesion | null
  nuevoTotalTurnos: number
  history: ChatMessage[]
}): Promise<void> {
  const { supabase, userId, memoriaPrevia, nuevoTotalTurnos, history } = params

  try {
    const debeResumirAhora = nuevoTotalTurnos > 0 && nuevoTotalTurnos % RESUMIR_CADA_N_TURNOS === 0
    let nuevoResumen = memoriaPrevia?.conversation_summary ?? null

    if (debeResumirAhora) {
      // Pedirle al LLM que resuma la conversacion usando solo los ultimos 40 mensajes
      // (tope para no inflar el prompt). Formato compacto en castellano argentino.
      const ultimos = history.slice(-40).filter(m => m.role === 'user' || m.role === 'assistant')
      const resumenPrevioLinea = memoriaPrevia?.conversation_summary
        ? `\n\nResumen previo (actualizarlo, no repetir):\n${memoriaPrevia.conversation_summary}`
        : ''
      const plano = ultimos.map(m => `${m.role === 'user' ? 'Gaston' : 'Agent'}: ${m.content}`).join('\n')
      const promptResumen = `Resumi esta conversacion en castellano argentino, maximo 6 lineas. Enfoca en: que camadas/CUMCS toco el usuario, fechas cargadas, problemas recurrentes. Sin markdown, texto plano.${resumenPrevioLinea}\n\n---\n${plano}`

      const res = await callLLMCascade({
        messages: [{ role: 'user', content: promptResumen }],
        temperature: 0.3,
        max_tokens: 250,
      })
      if (res.ok && res.text) {
        nuevoResumen = res.text.trim().slice(0, 1500) // cap defensive
      }
    }

    await supabase.from('chat_sessions').upsert({
      user_id: userId,
      last_cumcs: memoriaPrevia?.last_cumcs ?? null,
      last_tabla: memoriaPrevia?.last_tabla ?? null,
      last_camada: memoriaPrevia?.last_camada ?? null,
      last_fecha_cargada: memoriaPrevia?.last_fecha_cargada ?? null,
      conversation_summary: nuevoResumen,
      total_turnos: nuevoTotalTurnos,
      actualizado_en: new Date().toISOString(),
    })
  } catch (err) {
    // No propagar: el fallo de persistencia no debe romper la respuesta al user
    console.error('[agent-cumcs] persistirMemoria fallo:', err)
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Autenticacion via JWT del caller (RLS activa)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header requerido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Parse payload
    const body = await req.json() as RequestPayload
    if (!body.mensaje || typeof body.mensaje !== 'string' || body.mensaje.trim().length < 1) {
      return new Response(JSON.stringify({ error: 'mensaje requerido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Cargar memoria de la sesion previa (persiste entre conversaciones).
    // El agent lee esto para saber donde quedo: last_cumcs, last_camada, resumen.
    const { data: memoriaRaw } = await supabase
      .from('chat_sessions')
      .select('last_cumcs, last_tabla, last_camada, last_fecha_cargada, conversation_summary, total_turnos')
      .eq('user_id', user.id)
      .maybeSingle()
    const memoria: MemoriaSesion | null = memoriaRaw as MemoriaSesion | null

    // 4. Armar history: system + historia turno actual + nuevo mensaje
    // Si frontend envia system_prompt_override (caso meta-formulario con prompt pre-cargado),
    // se usa ESE Y NADA MAS (sin memoria ni resumenes previos), para que el flow guiado
    // no sea pisado por auto-confirm o defaults heredados de sesiones anteriores.
    const promptDefault = buildSystemPrompt(body.codigo_cumcs_filtro, memoria)
    const systemPrompt = body.system_prompt_override
      ? body.system_prompt_override
      : promptDefault
    const history: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(body.messages ?? []).filter(m => m.role !== 'system'),  // descartar systems viejos, solo el nuestro
      { role: 'user', content: body.mensaje },
    ]

    // 5. Contexto para las tools (Supabase con JWT user)
    const toolCtx: ToolContext = { supabase, userId: user.id }

    // 5. Loop multi-step
    let modeloUsado = 'none'
    let provider = 'none'
    let latencyTotal = 0
    let steps = 0
    const toolCallsEjecutadas: Array<{ name: string; args: Record<string, unknown>; result_summary: string }> = []
    let lastDraftId: string | null = null
    let lastPreview: Record<string, unknown> | null = null
    let lastTablaDestino: string | null = null

    while (steps < MAX_STEPS) {
      steps++

      const llmRes = await callLLMCascade({
        messages: history.map(m => ({
          role: m.role === 'tool' ? 'user' : (m.role as 'system' | 'user' | 'assistant'),
          content: m.role === 'tool' ? `[tool_result ${m.name}]\n${m.content}` : m.content,
        })) as LLMMessage[],
        tools: [...AGENT_TOOLS],
        temperature: 0,
        max_tokens: 800,
        prefer_tool_use: true,
      })

      if (!llmRes.ok) {
        return new Response(JSON.stringify({
          error: 'LLM no disponible',
          detalle: llmRes.tried.map(t => `${t.provider}: ${t.error}`).join(' | '),
          steps,
        }), {
          status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      modeloUsado = llmRes.modelo_usado
      provider = llmRes.provider
      latencyTotal += llmRes.latency_ms

      // Si el LLM emitio tool_calls, ejecutarlas
      if (llmRes.tool_calls && llmRes.tool_calls.length > 0) {
        // Agregar el assistant message con los tool_calls al history
        history.push({
          role: 'assistant',
          content: llmRes.text ?? '',
          tool_calls: llmRes.tool_calls,
        })

        // Ejecutar cada tool_call y agregar el result al history
        for (const tc of llmRes.tool_calls) {
          let args: Record<string, unknown> = {}
          try {
            args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : (tc.function.arguments ?? {})
          } catch {
            args = {}
          }
          const result = await dispatchTool(toolCtx, tc.function.name, args)

          // Capturar estado si es proposeInsert/confirmInsert
          if (tc.function.name === 'proposeInsert' && result && typeof result === 'object') {
            const r = result as Record<string, unknown>
            if (r.draft_id) { lastDraftId = String(r.draft_id); lastPreview = (r.preview as Record<string, unknown>) ?? null; lastTablaDestino = (r.tabla_destino as string) ?? null }
          }

          toolCallsEjecutadas.push({
            name: tc.function.name,
            args,
            result_summary: JSON.stringify(result).slice(0, 180),
          })

          history.push({
            role: 'tool',
            tool_call_id: tc.id ?? 'na',
            name: tc.function.name,
            content: JSON.stringify(result),
          })
        }

        // Continuar loop para que el LLM procese los tool_results
        continue
      }

      // Sin tool_calls → respuesta final al usuario
      const respuesta = llmRes.text ?? '(sin respuesta)'
      history.push({ role: 'assistant', content: respuesta })

      // 6. Incrementar total_turnos y, cada N turnos, regenerar resumen de la sesion.
      // Esto corre en paralelo a la response (no bloquea) via Promise sin await explicito.
      const nuevoTotalTurnos = (memoria?.total_turnos ?? 0) + 1
      void persistirMemoria({
        supabase,
        userId: user.id,
        memoriaPrevia: memoria,
        nuevoTotalTurnos,
        history,
      })

      return new Response(JSON.stringify({
        respuesta,
        messages: history.filter(m => m.role !== 'system'),
        draft_id: lastDraftId,
        preview: lastPreview,
        tabla_destino: lastTablaDestino,
        modelo_usado: modeloUsado,
        provider,
        latency_ms: latencyTotal,
        prompt_version: PROMPT_VERSION,
        steps,
        tool_calls_ejecutadas: toolCallsEjecutadas,
        total_turnos: nuevoTotalTurnos,
        tiene_resumen_memoria: !!memoria?.conversation_summary,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Hit MAX_STEPS
    return new Response(JSON.stringify({
      error: `Superado MAX_STEPS=${MAX_STEPS}. Loop detenido.`,
      messages: history.filter(m => m.role !== 'system'),
      modelo_usado: modeloUsado,
      provider,
      latency_ms: latencyTotal,
      steps,
      tool_calls_ejecutadas: toolCallsEjecutadas,
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error)?.message ?? err), stack: (err as Error)?.stack }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
