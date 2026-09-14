// LLM Cascade — MODO LOCAL ONLY (GAMP5 / ANMAT 4159/2023 / ISO 42001)
// ======================================================================
// COMPLIANCE: Los datos farmaceuticos NO se envian a terceros.
// Solo se permite inferencia LOCAL (Hermes/Ollama en red interna).
// Los 9 providers cloud (Cerebras, Groq, SambaNova, NVIDIA, GitHub, Together,
// Cloudflare AI, Gemini, OpenRouter) estan DESHABILITADOS por compliance.
//
// Para usar IA en produccion:
//   1. Deployar modelo local (Llama 3.3 70B via Ollama/vLLM en servidor propio)
//   2. Setear LOCAL_LLM_URL=http://<ip>:11434/v1/chat/completions
//   3. Opcionalmente LOCAL_LLM_MODEL (default: llama3.3:70b)
//
// Si LOCAL_LLM_URL no esta seteado, la IA devuelve error controlado
// y el sistema funciona sin IA (modo manual).

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMToolCall {
  id?: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface LLMRequestOptions {
  messages: LLMMessage[]
  tools?: unknown[]
  temperature?: number
  max_tokens?: number
  prefer_tool_use?: boolean
}

export interface LLMSuccess {
  ok: true
  text: string | null
  tool_calls: LLMToolCall[] | null
  modelo_usado: string
  provider: string
  latency_ms: number
}

export interface LLMError {
  ok: false
  error: string
  tried: Array<{ provider: string; error: string }>
}

export type LLMResult = LLMSuccess | LLMError

// ----- LOCAL-ONLY Provider -----

async function invokeLocalLLM(opts: LLMRequestOptions, url: string, model: string): Promise<Omit<LLMSuccess, 'ok' | 'provider' | 'latency_ms'>> {
  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0,
    max_tokens: opts.max_tokens ?? 600,
  }
  if (opts.tools && opts.tools.length > 0) {
    body.tools = opts.tools
    body.tool_choice = 'auto'
  }
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`local-llm ${r.status}: ${(await r.text()).slice(0, 200)}`)
  const raw = await r.json() as { choices?: Array<{ message?: { content?: string | null; tool_calls?: LLMToolCall[] | null } }> }
  const msg = raw?.choices?.[0]?.message
  return {
    text: typeof msg?.content === 'string' && msg.content.length > 0 ? msg.content : null,
    tool_calls: Array.isArray(msg?.tool_calls) && msg!.tool_calls!.length > 0 ? msg!.tool_calls! : null,
    modelo_usado: `local/${model}`,
  }
}

// ----- Main -----
export async function callLLMCascade(opts: LLMRequestOptions): Promise<LLMResult> {
  const localUrl = Deno.env.get('LOCAL_LLM_URL')
  const localModel = Deno.env.get('LOCAL_LLM_MODEL') || 'llama3.3:70b'

  if (!localUrl) {
    return {
      ok: false,
      error: 'IA no disponible: LOCAL_LLM_URL no configurado. El sistema opera en modo manual. Para habilitar IA, deployar modelo local (Ollama/vLLM) y setear LOCAL_LLM_URL.',
      tried: [{ provider: 'local', error: 'LOCAL_LLM_URL env var no seteada' }],
    }
  }

  const t0 = Date.now()
  try {
    const res = await Promise.race([
      invokeLocalLLM(opts, localUrl, localModel),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout 30s local-llm')), 30_000)),
    ])
    if (!res.text && !res.tool_calls) throw new Error('respuesta vacia del modelo local')
    return {
      ok: true,
      text: res.text,
      tool_calls: res.tool_calls,
      modelo_usado: res.modelo_usado,
      provider: 'local',
      latency_ms: Date.now() - t0,
    }
  } catch (e) {
    return {
      ok: false,
      error: `Error modelo local: ${(e as Error)?.message ?? e}`,
      tried: [{ provider: 'local', error: String((e as Error)?.message ?? e) }],
    }
  }
}

// ----- PROVIDERS CLOUD DESHABILITADOS -----
// Los siguientes providers fueron removidos por incumplimiento normativo:
// - Cerebras (CEREBRAS_API_KEY) — datos salen a api.cerebras.ai
// - Groq (GROQ_API_KEY) — datos salen a api.groq.com
// - SambaNova (SAMBANOVA_API_KEY) — datos salen a api.sambanova.ai
// - NVIDIA (NVIDIA_API_KEY) — datos salen a integrate.api.nvidia.com
// - GitHub Models (GITHUB_TOKEN) — datos salen a models.inference.ai.azure.com
// - Together (TOGETHER_API_KEY) — datos salen a api.together.xyz
// - Cloudflare AI (CF_WORKERS_AI_TOKEN) — datos salen a api.cloudflare.com
// - Gemini (GEMINI_API_KEY) — datos salen a generativelanguage.googleapis.com
// - OpenRouter (OPENROUTER_API_KEY) — datos salen a openrouter.ai
//
// Para re-habilitar un provider cloud se requiere:
// 1. DPA/BAA firmado con el proveedor
// 2. Evaluacion de riesgo documentada (FMEA)
// 3. Aprobacion del Responsable de Calidad
// 4. Registro en ia_model_registry con autorizado=true
// 5. Change Control formal (SOP-CC-001)
