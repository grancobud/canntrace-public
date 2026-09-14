// Edge Function: ai-next-question
// Genera la proxima pregunta del chat guiado en castellano argentino natural,
// basada en el codigo CUMCS, el campo que toca, y el contexto ya respondido.
//
// Entrada:
//   { codigo_cumcs: string, campo: CampoChat, contexto?: Record<string,string> }
// Salida:
//   { pregunta: string, modelo_usado: string } | { error }
//
// Fallback: si el LLM falla/tarda, el cliente usa `campo.pregunta` hardcoded.

import { corsHeaders } from '../_shared/cors.ts'
import { callLLMCascade } from '../_shared/llm-cascade.ts'

interface CampoInfo {
  key: string
  label: string
  tipo: string
  pregunta?: string // fallback hardcoded
  placeholder?: string
  opciones?: string[]
  requerido?: boolean
  defaultValue?: string
}

interface Payload {
  codigo_cumcs: string
  campo: CampoInfo
  contexto?: Record<string, string | number | null>
}

const MAX_TOKENS = 80
const PROMPT_VERSION = 'ainq-v1.1.0-2026-04-19'  // bump por cascade multi-proveedor

function buildPrompt(codigo: string, campo: CampoInfo, contexto?: Record<string, string | number | null>): string {
  const ctxLines: string[] = []
  if (contexto && Object.keys(contexto).length > 0) {
    for (const [k, v] of Object.entries(contexto)) {
      if (v == null || v === '') continue
      ctxLines.push(`- ${k}: ${v}`)
    }
  }
  const ctxBlock = ctxLines.length > 0 ? `\nContexto ya cargado:\n${ctxLines.join('\n')}\n` : ''
  const opciones = campo.opciones && campo.opciones.length > 0 ? `\nOpciones validas: ${campo.opciones.join(', ')}.` : ''
  const ejemplo = campo.placeholder ? `\nEjemplo de valor: ${campo.placeholder}.` : ''

  return `Sos un asistente CannTrace (trazabilidad cannabis medicinal GAMP5, Argentina). Estas ayudando a un operario a cargar un registro CUMCS paso a paso.

Registro: ${codigo}
Campo que toca pedirle: ${campo.label} (${campo.tipo}${campo.requerido ? ', OBLIGATORIO' : ''})
${ctxBlock}${opciones}${ejemplo}

Tarea: generar UNA sola pregunta natural en castellano rioplatense (tuteo argentino, corta, max 120 caracteres), pidiendole al operario ese campo. NO uses Markdown ni formato lista. NO repitas lo que ya esta en contexto. Tono cercano y rapido (es una linea de produccion).

Ejemplos de buen output:
- "¿Que temperatura marca el ambiente?"
- "¿De que camada fue? (C7/C9/C11/C12/C15/C16)"
- "Dale, ¿fecha del registro?"
- "¿Cuantas plantas cosechaste?"
- "¿pH corregido final?"

Respondé solo la pregunta, sin prefijos ni comillas.`
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.json() as Payload
    if (!body?.codigo_cumcs || !body?.campo?.key || !body?.campo?.label) {
      return new Response(JSON.stringify({ error: 'payload invalido (codigo_cumcs + campo {key,label} requerido)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const prompt = buildPrompt(body.codigo_cumcs, body.campo, body.contexto)

    const res = await callLLMCascade({
      messages: [{ role: 'system', content: prompt }],
      temperature: 0,
      max_tokens: MAX_TOKENS,
      prefer_tool_use: false,
    })

    if (!res.ok || !res.text) {
      return new Response(JSON.stringify({
        error: 'ningun proveedor respondio',
        detalle: res.ok ? 'respuesta vacia' : res.tried.map(t => `${t.provider}: ${t.error}`).join(' | '),
      }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const pregunta = res.text.trim().replace(/^["'`*]+|["'`*]+$/g, '').trim().slice(0, 180)
    if (pregunta.length < 3) {
      return new Response(JSON.stringify({ error: 'pregunta generada demasiado corta' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      pregunta,
      modelo_usado: res.modelo_usado,
      provider: res.provider,
      latency_ms: res.latency_ms,
      prompt_version: PROMPT_VERSION,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error)?.message ?? err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
