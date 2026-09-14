// OpenAI-style tool schema para el agent multi-step. Expuesto al LLM.
// Las definiciones son descriptivas — la logica real vive en tools-impl.ts.

export const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'getContext',
      description: 'Lee la ultima sesion del usuario: que CUMCS, camada, tabla y fecha fue lo ultimo cargado. Siempre llamar al inicio de una conversacion nueva para saber donde continuar.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getLatest',
      description: 'Devuelve el ultimo registro cargado para una combinacion (tabla + camada). Util para saber la ultima fecha con dato y continuar desde ahi.',
      parameters: {
        type: 'object',
        properties: {
          tabla: { type: 'string', description: 'Nombre de la tabla (ej registros_cosecha, registros_condiciones_ambientales)' },
          camada: { type: 'string', description: 'Camada a filtrar (C7, C9, C11, C12, C15, C16). Opcional.' },
          tipo: { type: 'string', description: 'Codigo CUMCS especifico (ej CM-RE-0601). Opcional.' },
        },
        required: ['tabla'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'checkMissingDates',
      description: 'Calcula las fechas faltantes entre `desde` y `hasta` para una combinacion tabla+camada+tipo. Asume frecuencia diaria. Devuelve array de fechas YYYY-MM-DD que NO tienen registro.',
      parameters: {
        type: 'object',
        properties: {
          tabla: { type: 'string' },
          camada: { type: 'string' },
          tipo: { type: 'string', description: 'Codigo CUMCS. Opcional.' },
          desde: { type: 'string', description: 'YYYY-MM-DD' },
          hasta: { type: 'string', description: 'YYYY-MM-DD (default hoy)' },
        },
        required: ['tabla', 'camada', 'desde'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'countRecords',
      description: 'Cuenta cuantos registros hay en una tabla con filtros opcionales. Uso CLAVE cuando el user pregunta genericamente "¿que tengo cargado?", "¿cuantos registros del 2025?", "¿que hay del CM-RE-0501?". Devuelve total + primera/ultima fecha + desglose por camada y tipo. NO llamar getContext para esto — getContext es solo memoria de la conversacion previa.',
      parameters: {
        type: 'object',
        properties: {
          tabla: { type: 'string', description: 'ej registros_fitosanitarios, registros_condiciones_ambientales' },
          camada: { type: 'string', description: 'Opcional. C7/C9/C11/C12/C15/C16.' },
          tipo: { type: 'string', description: 'Opcional. Codigo CUMCS ej CM-RE-0501.' },
          desde: { type: 'string', description: 'Opcional. YYYY-MM-DD.' },
          hasta: { type: 'string', description: 'Opcional. YYYY-MM-DD.' },
        },
        required: ['tabla'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTableMetadata',
      description: 'Lista campos disponibles de un CUMCS (con sus tipos, requeridos, opciones, placeholders). Usar ANTES de proposeInsert para saber que pedir al usuario.',
      parameters: {
        type: 'object',
        properties: {
          codigo_cumcs: { type: 'string', description: 'ej CM-RE-0601' },
        },
        required: ['codigo_cumcs'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'proposeInsert',
      description: 'Propone un INSERT. Valida (rangos y camadas validas) y crea un DRAFT con TTL 10 min. NO escribe a la tabla real. Devuelve draft_id + preview. Si hay errores de validacion, los reporta sin crear draft.',
      parameters: {
        type: 'object',
        properties: {
          codigo_cumcs: { type: 'string', description: 'ej CM-RE-0601. Router elige la tabla destino.' },
          data: {
            type: 'object',
            description: 'Campos a insertar. Keys segun getTableMetadata. Valores deben cumplir rangos.',
            additionalProperties: true,
          },
        },
        required: ['codigo_cumcs', 'data'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'confirmInsert',
      description: 'Ejecuta el INSERT real del draft id dado. Solo llamar tras aprobacion explicita del usuario.',
      parameters: {
        type: 'object',
        properties: {
          draft_id: { type: 'string' },
        },
        required: ['draft_id'],
        additionalProperties: false,
      },
    },
  },
] as const
