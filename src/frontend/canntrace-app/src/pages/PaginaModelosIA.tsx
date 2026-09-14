import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Brain, ShieldCheck, ShieldX, Server, Cloud } from 'lucide-react'

interface ModeloIA {
  id: string
  nombre: string
  version: string
  proveedor: string
  tipo_deployment: 'local' | 'cloud' | 'edge'
  endpoint_url: string | null
  modelo_base: string | null
  parametros_billones: number | null
  autorizado: boolean
  riesgo_datos: string
  cumple_gamp5: boolean
  cumple_iso42001: boolean
  activo: boolean
  notas: string | null
  created_at: string
}

export default function PaginaModelosIA() {
  const { data: modelos = [] } = useQuery({
    queryKey: ['ia-model-registry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ia_model_registry')
        .select('*')
        .order('autorizado', { ascending: false })
      if (error) throw error
      return data as ModeloIA[]
    },
  })

  const autorizados = modelos.filter(m => m.autorizado)
  const bloqueados = modelos.filter(m => !m.autorizado)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
          Registro de Modelos IA
        </h1>
        <p className="text-sm text-surface-500 mt-1">
          ISO 42001 / GAMP5 — Solo modelos locales autorizados pueden procesar datos
        </p>
      </div>

      {/* Compliance banner */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-900 dark:text-green-100">Política de IA — Solo Local</h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Los datos farmacéuticos de CannTrace nunca se envían a proveedores de IA externos.
              Solo se permiten modelos desplegados en infraestructura propia (on-premise o red interna).
              Los 9 proveedores cloud están deshabilitados por cumplimiento normativo.
            </p>
          </div>
        </div>
      </div>

      {/* Authorized models */}
      <div>
        <h2 className="text-lg font-medium text-surface-900 dark:text-white mb-3 flex items-center gap-2">
          <Server className="w-5 h-5 text-green-600" />
          Modelos Autorizados (Local)
        </h2>
        <div className="grid gap-3">
          {autorizados.map(m => (
            <div key={m.id} className="bg-white dark:bg-surface-900 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-surface-900 dark:text-white">{m.nombre}</h3>
                    <p className="text-xs text-surface-500">{m.proveedor} · {m.parametros_billones}B params · v{m.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.cumple_gamp5 && <span className="px-2 py-0.5 rounded-full text-xs bg-primary-100 text-primary-800">GAMP5</span>}
                  {m.cumple_iso42001 && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">ISO 42001</span>}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${m.activo ? 'bg-green-100 text-green-800' : 'bg-surface-100 text-surface-600'}`}>
                    {m.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              {m.endpoint_url && (
                <p className="text-xs font-mono text-surface-400 mt-2 pl-13">{m.endpoint_url}</p>
              )}
              <div className="flex items-center gap-4 mt-2 pl-13 text-xs text-surface-500">
                <span>Riesgo: <strong className="text-green-600">{m.riesgo_datos}</strong></span>
                <span>Deployment: <strong>{m.tipo_deployment}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blocked cloud providers */}
      <div>
        <h2 className="text-lg font-medium text-surface-900 dark:text-white mb-3 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-red-500" />
          Proveedores Cloud — DESHABILITADOS
        </h2>
        <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-red-100/50 dark:bg-red-900/20">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-red-900">Proveedor</th>
                <th className="text-left px-4 py-2 font-medium text-red-900">Modelo</th>
                <th className="text-left px-4 py-2 font-medium text-red-900">Riesgo</th>
                <th className="text-left px-4 py-2 font-medium text-red-900">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100 dark:divide-red-900/20">
              {bloqueados.map(m => (
                <tr key={m.id} className="text-surface-600 dark:text-surface-400">
                  <td className="px-4 py-2 flex items-center gap-2">
                    <ShieldX className="w-4 h-4 text-red-400" />
                    {m.proveedor}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{m.modelo_base}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      m.riesgo_datos === 'critico' ? 'bg-red-200 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>{m.riesgo_datos}</span>
                  </td>
                  <td className="px-4 py-2 text-xs max-w-xs truncate">{m.notas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4">
        <h3 className="font-medium text-surface-900 dark:text-white mb-2">Requisitos para autorizar un modelo nuevo</h3>
        <ol className="text-sm text-surface-600 dark:text-surface-400 space-y-1 list-decimal list-inside">
          <li>DPA/BAA firmado con el proveedor (si es cloud)</li>
          <li>Evaluación de riesgo documentada (FMEA + clasificación GAMP5)</li>
          <li>Aprobación formal del Responsable de Calidad</li>
          <li>IQ/OQ del modelo (precisión, drift, alucinaciones)</li>
          <li>Registro en esta tabla con <code className="bg-surface-200 dark:bg-surface-700 px-1 rounded">autorizado=true</code></li>
          <li>Change Control formal (SOP-CC-001)</li>
        </ol>
      </div>
    </div>
  )
}
