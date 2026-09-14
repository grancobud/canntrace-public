// Tipos de operacion validos en CannTrace (mirror de src/types/TipoOperacion)
export const TIPOS_OPERACION = [
  'ingreso_insumos', 'planta_madre', 'fertilizacion', 'utilizacion_insumos',
  'baja_stock', 'esquejado', 'vegetativa', 'poda', 'floracion', 'control_plagas',
  'cosecha', 'secado', 'trimming', 'cuarentena', 'fraccionamiento', 'almacenamiento',
] as const

export const CAMADAS_VALIDAS = ['C7', 'C9', 'C11', 'C12', 'C15', 'C16'] as const
export const SISTEMAS = ['RDWC', 'COCO'] as const

// Schema JSON (formato OpenAI / OpenRouter function calling) para tool-use.
// Es schema tradicional (no Zod) porque lo consume OpenRouter directamente.
export const toolSchema = {
  type: 'function',
  function: {
    name: 'extract_operacion',
    description: 'Extrae los campos estructurados de una operacion de trazabilidad cannabis medicinal a partir de texto libre del operario. Nunca inventa datos. Si no entiende un campo, devuelve null.',
    parameters: {
      type: 'object',
      properties: {
        tipo_operacion: {
          type: ['string', 'null'],
          enum: [...TIPOS_OPERACION, null],
          description: 'Tipo de operacion. null si no se puede identificar.',
        },
        cantidad: {
          type: ['number', 'null'],
          description: 'Cantidad de unidades (plantas, esquejes, kg, lotes). null si no se menciona.',
        },
        camada: {
          type: ['string', 'null'],
          enum: [...CAMADAS_VALIDAS, null],
          description: 'Codigo de camada. Normalizar "la 7", "camada 7", "7" → "C7". null si no se menciona.',
        },
        sistema: {
          type: ['string', 'null'],
          enum: [...SISTEMAS, null],
          description: 'Sistema de cultivo. RDWC = Flora 2 / SFL2. COCO = Flora 1 / SFL1. null si no se menciona.',
        },
        fecha: {
          type: ['string', 'null'],
          description: 'Fecha ISO YYYY-MM-DD. "hoy" → fecha actual. "ayer" → ayer. null si no se menciona.',
        },
        id_lote: {
          type: ['string', 'null'],
          description: 'Codigo de lote si se menciona explicitamente (ej ALM-C7-RDWC, CL7, COS-C12-COCO). null si no se menciona.',
        },
        observaciones: {
          type: ['string', 'null'],
          description: 'Notas adicionales del operario (pesos, condiciones, etc). null si no hay.',
        },
        confianza: {
          type: 'number',
          description: 'Score 0.0-1.0 de cuan seguro estas de la extraccion. 1.0 = todos los campos claros, 0.5 = algunos ambiguos, < 0.3 = mejor que el usuario revise.',
        },
      },
      required: ['tipo_operacion', 'cantidad', 'camada', 'sistema', 'fecha', 'confianza'],
      additionalProperties: false,
    },
  },
} as const

export interface OperacionExtraida {
  tipo_operacion: typeof TIPOS_OPERACION[number] | null
  cantidad: number | null
  camada: typeof CAMADAS_VALIDAS[number] | null
  sistema: typeof SISTEMAS[number] | null
  fecha: string | null
  id_lote: string | null
  observaciones: string | null
  confianza: number
}

export function buildSystemPrompt(): string {
  const hoy = new Date().toISOString().slice(0, 10)
  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  return `Sos un asistente que extrae campos estructurados de operaciones de trazabilidad cannabis medicinal en Argentina. Cliente: FIS S.A.S. Validacion GAMP5.

Contexto:
- Camadas validas: ${CAMADAS_VALIDAS.join(', ')}. Nombrar "la 7", "camada 7", "7" significa "C7".
- Sistemas: RDWC (alias: Flora 2, SFL2, F2). COCO (alias: Flora 1, SFL1, F1).
- Tipos de operacion: ${TIPOS_OPERACION.join(', ')}.
- Hoy: ${hoy}. Ayer: ${ayer}.

Reglas CRITICAS:
1. NUNCA inventes datos. Si el usuario no lo dijo, devuelve null en ese campo.
2. Si no podes identificar el tipo de operacion con confianza, devolve tipo_operacion: null y confianza < 0.3.
3. Normalizar errores tipicos: "carge/cargue" → esquejado o ingreso_insumos segun contexto. "cosechamos/cortamos" → cosecha. "trimmeamos/manicuramos" → trimming.
4. Fechas sin año asumir año actual.
5. Si falta tipo_operacion O cantidad O camada, poner confianza < 0.5.

Ejemplos:
Input: "carge 50 esquejes C7 coco hoy"
→ { tipo_operacion: "esquejado", cantidad: 50, camada: "C7", sistema: "COCO", fecha: "${hoy}", id_lote: null, observaciones: null, confianza: 0.95 }

Input: "cosechamos 120 plantas de la 15 en flora 2 ayer"
→ { tipo_operacion: "cosecha", cantidad: 120, camada: "C15", sistema: "RDWC", fecha: "${ayer}", id_lote: null, observaciones: null, confianza: 0.9 }

Input: "ingreso 3 kg de fertilizante"
→ { tipo_operacion: "ingreso_insumos", cantidad: 3, camada: null, sistema: null, fecha: "${hoy}", id_lote: null, observaciones: "fertilizante", confianza: 0.7 }

Input: "algo raro paso"
→ { tipo_operacion: null, cantidad: null, camada: null, sistema: null, fecha: null, id_lote: null, observaciones: "algo raro paso", confianza: 0.1 }

Responde SIEMPRE usando la tool call extract_operacion. No escribas texto adicional fuera del tool call.`
}

// Segundo prompt: genera preguntas de seguimiento cuando la extraccion tiene gaps.
// Devuelve texto plano corto (1-3 preguntas) que el UI muestra como bubble de chat.
export function buildFollowUpPrompt(extraccion: OperacionExtraida, camposFaltantes: string[]): string {
  const resumenActual = JSON.stringify({
    tipo_operacion: extraccion.tipo_operacion,
    cantidad: extraccion.cantidad,
    camada: extraccion.camada,
    sistema: extraccion.sistema,
    fecha: extraccion.fecha,
    confianza: extraccion.confianza,
  })
  return `Sos un asistente CannTrace. Un operario acaba de cargar una operacion y quedo incompleta o ambigua.

Extraccion actual:
${resumenActual}

Campos faltantes o dudosos: ${camposFaltantes.join(', ')}

Tarea: generar UNA respuesta corta en castellano (max 200 caracteres, tono cercano argentino) pidiendole SOLO los datos faltantes en 1-2 preguntas naturales. NO preguntes lo que ya tenes. NO uses formato lista ni Markdown — texto plano.

Ejemplos de buen output:
- "Che, ¿cuantas plantas fueron y de que camada?"
- "¿Fue en Flora 1 o Flora 2? Y el dia: hoy o ayer?"
- "Me falta saber la camada (C7/C9/C11/C12/C15/C16). ¿Cual?"

Responde solo el texto de la pregunta, nada mas.`
}

// Decide si la extraccion necesita follow-up (gap detection)
export function necesitaFollowUp(extraccion: OperacionExtraida): { necesita: boolean; faltantes: string[] } {
  const faltantes: string[] = []
  if (!extraccion.tipo_operacion) faltantes.push('tipo de operacion')
  if (extraccion.cantidad == null) faltantes.push('cantidad')
  if (!extraccion.camada) faltantes.push('camada')
  // Sistema y fecha no son criticos (pueden inferirse)
  if (extraccion.confianza < 0.7 && faltantes.length === 0) {
    faltantes.push('datos ambiguos')
  }
  return { necesita: faltantes.length > 0, faltantes }
}
