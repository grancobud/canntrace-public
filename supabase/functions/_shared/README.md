# LLM Cascade (P2.1)

Helper compartido `llm-cascade.ts` que permite a las Edge Functions llamar a multiples proveedores LLM con fallback automatico. El primer proveedor que responde gana; si falla, salta al siguiente.

## Orden de proveedores

1. **Cerebras** — Llama 3.3 70B, ~2000 tok/s, 1M tokens/dia gratis.
2. **Groq** — Llama 3.3 70B Versatile, 14.400 req/dia gratis.
3. **Gemini** — 2.5 Flash, 500 req/dia gratis (no soporta tool-use, skipea si `prefer_tool_use: true`).
4. **OpenRouter** — `openrouter/free` router + fallback.

## Cada proveedor se activa cuando su env var esta seteada

Setea las que tengas y la cascade las usa en orden. Sin ninguna seteada, la Edge Function devuelve 503.

```bash
# Todos opcionales excepto OpenRouter (que ya viene de antes)
SUPABASE_ACCESS_TOKEN=sbp_... \
  npx supabase secrets set \
  CEREBRAS_API_KEY=csk-... \
  GROQ_API_KEY=gsk_... \
  GEMINI_API_KEY=AIza... \
  --project-ref sqdqvhjlmdweuuncwlfb
```

### De donde sacar cada key

| Proveedor | URL | Tier free | Notas |
|---|---|---|---|
| Cerebras | https://cloud.cerebras.ai/ | 1M tok/dia | Signup con GitHub o email. Key empieza con `csk-`. |
| Groq | https://console.groq.com/keys | 14.400 req/dia | Signup gratis. Key empieza con `gsk_`. |
| Gemini | https://aistudio.google.com/apikey | 500 req/dia | Requiere cuenta Google. Key empieza con `AIza`. |
| OpenRouter | https://openrouter.ai/keys | 50 req/dia (1000 si depositas $10 one-time) | Ya configurada. |

## Como funciona

```ts
import { callLLMCascade } from '../_shared/llm-cascade.ts'

const res = await callLLMCascade({
  messages: [
    { role: 'system', content: 'Sos un asistente...' },
    { role: 'user', content: 'cosechamos 50 C7 hoy' },
  ],
  tools: [mySchema],      // opcional, formato OpenAI
  temperature: 0,
  max_tokens: 600,
  prefer_tool_use: true,  // si true, skipea Gemini (no soporta tools nativo)
})

if (res.ok) {
  console.log(res.text)         // respuesta de texto si hubo
  console.log(res.tool_calls)   // tool_calls si el modelo los emitio
  console.log(res.modelo_usado) // "cerebras/llama-3.3-70b"
  console.log(res.provider)     // "cerebras"
  console.log(res.latency_ms)   // 340
} else {
  console.log(res.error)        // "todos los proveedores fallaron..."
  console.log(res.tried)        // [{ provider: 'cerebras', error: 'skip (env var no seteada)' }, ...]
}
```

## Retries

Cada proveedor tiene **1 retry con backoff 1s** si recibe 429/503/rate-limit.
Si falla el retry, salta al siguiente proveedor.

## Provider → modelo fijo

Hoy cada proveedor tiene un modelo default hardcoded en el adapter (Llama 3.3 70B para Cerebras/Groq, Gemini 2.5 Flash, openrouter/free). Para parametrizar, editar `llm-cascade.ts` y agregar el campo `model` al `LLMRequestOptions`.

## Diagnostico

Si una Edge Function devuelve 503 con `detalle`, ese texto incluye lo que probo y el error:

```
detalle: "cerebras: skip (env var no seteada) | groq: 429 rate_limit | gemini: skip (env var no seteada) | openrouter: 503 upstream"
```

Eso te dice exactamente que falto configurar o que esta caido.
