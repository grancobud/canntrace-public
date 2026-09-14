import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Plus, FileText, AlertTriangle, Clock } from 'lucide-react'

interface ChangeRequest {
  id: string
  titulo: string
  descripcion: string
  tipo: 'correctivo' | 'preventivo' | 'mejora' | 'emergencia'
  estado: 'borrador' | 'evaluacion' | 'aprobado' | 'implementado' | 'cerrado' | 'rechazado'
  riesgo: 'bajo' | 'medio' | 'alto' | 'critico'
  solicitante: string
  evaluador?: string
  fecha_solicitud: string
  fecha_evaluacion?: string
  fecha_implementacion?: string
  impacto_sistemas: string[]
  plan_rollback: string
  evidencia_urls: string[]
  created_at: string
}

const ESTADOS_COLOR: Record<string, string> = {
  borrador: 'bg-surface-100 text-surface-700',
  evaluacion: 'bg-amber-100 text-amber-800',
  aprobado: 'bg-blue-100 text-blue-800',
  implementado: 'bg-green-100 text-green-800',
  cerrado: 'bg-surface-200 text-surface-600',
  rechazado: 'bg-red-100 text-red-800',
}

const RIESGO_COLOR: Record<string, string> = {
  bajo: 'bg-green-100 text-green-800',
  medio: 'bg-amber-100 text-amber-800',
  alto: 'bg-orange-100 text-orange-800',
  critico: 'bg-red-100 text-red-800',
}

export default function PaginaChangeControl() {
  const { data: changes = [], isLoading } = useQuery({
    queryKey: ['change-control'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('change_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ChangeRequest[]
    },
  })

  const stats = {
    total: changes.length,
    abiertos: changes.filter(c => !['cerrado', 'rechazado'].includes(c.estado)).length,
    criticos: changes.filter(c => c.riesgo === 'critico').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
            Control de Cambios
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Gestión formal de Change Requests — GAMP5 / ICH Q10
          </p>
        </div>
        <button
          onClick={() => { /* TODO: form modal */ }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo CR
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.total}</p>
              <p className="text-xs text-surface-500">Total CRs</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.abiertos}</p>
              <p className="text-xs text-surface-500">Abiertos</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.criticos}</p>
              <p className="text-xs text-surface-500">Riesgo Crítico</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 dark:bg-surface-800">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-surface-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-surface-600">Título</th>
                <th className="text-left px-4 py-3 font-medium text-surface-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-surface-600">Riesgo</th>
                <th className="text-left px-4 py-3 font-medium text-surface-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-surface-600">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-surface-400">Cargando...</td></tr>
              ) : changes.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-surface-400">
                  No hay Change Requests. El sistema está estable.
                </td></tr>
              ) : (
                changes.map(cr => (
                  <tr key={cr.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{cr.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium text-surface-900 dark:text-white">{cr.titulo}</td>
                    <td className="px-4 py-3 capitalize">{cr.tipo}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RIESGO_COLOR[cr.riesgo]}`}>
                        {cr.riesgo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADOS_COLOR[cr.estado]}`}>
                        {cr.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-surface-500">{new Date(cr.created_at).toLocaleDateString('es-AR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info panel */}
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
        <h3 className="font-medium text-primary-900 dark:text-primary-100 mb-2">Proceso de Change Control (SOP-CC-001)</h3>
        <ol className="text-sm text-primary-700 dark:text-primary-300 space-y-1 list-decimal list-inside">
          <li>Solicitud → Evaluación de impacto y riesgo (FMEA)</li>
          <li>Aprobación por Responsable de Calidad + Responsable Técnico</li>
          <li>Implementación con plan de rollback documentado</li>
          <li>Verificación post-implementación (IQ/OQ si aplica)</li>
          <li>Cierre con evidencia adjunta y actualización de documentación</li>
        </ol>
      </div>
    </div>
  )
}
