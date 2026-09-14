// Edge Function: ai-extract-operacion
// Extrae campos estructurados de texto libre usando cascade multi-proveedor.
// Orden: Cerebras → Groq → Gemini → OpenRouter (cada uno se activa si su env var existe).
//
// Secrets opcionales (setea lo que tengas):
//   CEREBRAS_API_KEY    — 1M tokens/dia free, Llama 3.3 70B ~2000 tok/s
//   GROQ_API_KEY        — 14.400 req/dia free, Llama 3.3 70B Versatile
//   GEMINI_API_KEY      — 500 req/dia free, Gemini 2.5 Flash (sin tool-use)
//   OPENROUTER_API_KEY  — fallback final (ya configurada desde antes)
//
// Invocar: supabase.functions.invoke('ai-extract-operacion', { body: { texto: '...' } })

import { corsHeaders } from '../_shared/cors.ts'
import { callLLMCascade } from '../_shared/llm-cascade.ts'
import {
  buildSystemPrompt,
  buildFollowUpPrompt,
  necesitaFollowUp,
  toolSchema,
  type OperacionExtraida,
} from './schema.ts'

// Semver + fecha (audit). Subir minor cuando cambian prompts/schema, patch para tweaks.
const PROMPT_VERSION = 'v1.2.0-2026-04-19'  // bump por cascade multi-proveedor

interface Payload {
  texto: string
}

interface ExtractResult {
  extraccion: OperacionExtraida
  modelo_usado: string
  prompt_version: string
  /** Texto de seguimiento generado por la IA cuando la extraccion tiene gaps. Opcional. */
  follow_up_message?: string
  /** Campos detectados como faltantes/ambiguos. Util para que el UI resalte el form. */
  campos_faltantes?: string[]
  /** Proveedor que respondio (cerebras/groq/gemini/openrouter). */
  provider?: string
  /** Latencia del primer call exitoso en ms. */
  latency_ms?: number
}

/** Parsea el tool_call al shape OperacionExtraida. Devuelve null si no valido. */
function parseToolCall(toolCalls: Array<{ function: { name: string; arguments: string } }> | null): OperacionExtraida | null {
  if (!toolCalls || toolCalls.length === 0) return null
  try {
    const tc = toolCalls[0]
    const args = typeof tc.function?.arguments === 'string'
      ? JSON.parse(tc.function.arguments)
      : tc.function?.arguments
    if (!args) return null
    return {
      tipo_operacion: args.tipo_operacion ?? null,
      cantidad: typeof args.cantidad === 'number' ? args.cantidad : null,
      camada: args.camada ?? null,
      sistema: args.sistema ?? null,
      fecha: args.fecha ?? null,
      id_lote: args.id_lote ?? null,
      observaciones: args.observaciones ?? null,
      confianza: typeof args.confianza === 'number' ? args.confianza : 0,
    }
  } catch {
    return null
  }
}

/** Extrae JSON del texto si no hay tool_call (fallback para Gemini sin tool-use). */
function parseJsonFromText(text: string | null): OperacionExtraida | null {
  if (!text) return null
  // Buscar primer {...} en el texto
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const args = JSON.parse(match[0])
    return {
      tipo_operacion: args.tipo_operacion ?? null,
      cantidad: typeof args.cantidad === 'number' ? args.cantidad : null,
      camada: args.camada ?? null,
      sistema: args.sistema ?? null,
      fecha: args.fecha ?? null,
      id_lote: args.id_lote ?? null,
      observaciones: args.observaciones ?? null,
      confianza: typeof args.confianza === 'number' ? args.confianza : 0,
    }
  } catch {
    return null
  }
}

/** Segunda llamada (plain text) para generar el follow-up natural. */
async function generarFollowUp(extraccion: OperacionExtraida, camposFaltantes: string[], textoOriginal: string): Promise<string | null> {
  const res = await callLLMCascade({
    messages: [
      { role: 'system', content: buildFollowUpPrompt(extraccion, camposFaltantes) },
      { role: 'user', content: textoOriginal },
    ],
    temperature: 0,
    max_tokens: 120,
    prefer_tool_use: false,
  })
  if (!res.ok || !res.text) return null
  const trimmed = res.text.trim().replace(/^["'`]+|["'`]+$/g, '')
  return trimmed.length > 0 && trimmed.length < 400 ? trimmed : null
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { texto } = (await req.json()) as Payload
    if (!texto || typeof texto !== 'string' || texto.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'texto requerido (min 3 chars)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (texto.length > 2000) {
      return new Response(JSON.stringify({ error: 'texto demasiado largo (max 2000 chars)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Cascade: intentar providers con tool-use primero (Cerebras/Groq/OpenRouter)
    const primary = await callLLMCascade({
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: texto },
      ],
      tools: [toolSchema],
      temperature: 0,
      max_tokens: 600,
      prefer_tool_use: true,
    })

    let extraccion: OperacionExtraida | null = null
    let modeloUsado = 'none'
    let provider = 'none'
    let latency_ms = 0

    if (primary.ok) {
      extraccion = parseToolCall(primary.tool_calls) ?? parseJsonFromText(primary.text)
      modeloUsado = primary.modelo_usado
      provider = primary.provider
      latency_ms = primary.latency_ms
    }

    // Fallback secundario: si no hubo tool-call, reintentar sin tools (incluye Gemini) pidiendo JSON directo.
    if (!extraccion) {
      const secondary = await callLLMCascade({
        messages: [
          { role: 'system', content: buildSystemPrompt() + '\n\nIMPORTANTE: si no podes usar tool calls, devolve SOLO un objeto JSON con las claves { tipo_operacion, cantidad, camada, sistema, fecha, id_lote, observaciones, confianza }, sin texto adicional.' },
          { role: 'user', content: texto },
        ],
        temperature: 0,
        max_tokens: 600,
        prefer_tool_use: false,
      })
      if (secondary.ok) {
        extraccion = parseJsonFromText(secondary.text) ?? parseToolCall(secondary.tool_calls)
        modeloUsado = secondary.modelo_usado
        provider = secondary.provider
        latency_ms = secondary.latency_ms
      }
    }

    if (!extraccion) {
      const trace = primary.ok ? [] : primary.tried
      return new Response(JSON.stringify({
        error: 'IA no disponible - usa el flow manual',
        detalle: trace.map(t => `${t.provider}: ${t.error}`).join(' | '),
      }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Sanity check: cantidad fuera de rango razonable
    if (extraccion.cantidad !== null && (extraccion.cantidad <= 0 || extraccion.cantidad > 100000)) {
      extraccion.cantidad = null
      extraccion.confianza = Math.min(extraccion.confianza, 0.4)
    }

    // Modo hibrido: si la extraccion tiene gaps (campos required faltantes o confianza baja),
    // pedimos al cascade que genere UNA pregunta natural de seguimiento.
    const gap = necesitaFollowUp(extraccion)
    let followUpMessage: string | null = null
    if (gap.necesita) {
      followUpMessage = await generarFollowUp(extraccion, gap.faltantes, texto)
    }

    const result: ExtractResult = {
      extraccion,
      modelo_usado: modeloUsado,
      prompt_version: PROMPT_VERSION,
      provider,
      latency_ms,
      ...(followUpMessage ? { follow_up_message: followUpMessage } : {}),
      ...(gap.necesita ? { campos_faltantes: gap.faltantes } : {}),
    }
    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error)?.message ?? err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
