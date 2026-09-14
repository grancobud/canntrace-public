import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Plus, ShieldAlert, TrendingUp, CheckCircle2, Clock } from 'lucide-react'

interface CAPA {
  id: string
  codigo: string
  tipo: 'correctiva' | 'preventiva'
  origen: 'nc_interna' | 'auditoria' | 'reclamo' | 'desvio' | 'alerta_sistema'
  titulo: string
  descripcion_nc: string
  causa_raiz: string
  accion_propuesta: string
  responsable: string
  fecha_limite: string
  estado: 'abierta' | 'en_curso' | 'verificacion' | 'cerrada_eficaz' | 'cerrada_no_eficaz'
  eficacia_verificada: boolean
  evidencia_cierre: string[]
  created_at: string
}

const ESTADO_BADGE: Record<string, { color: string; icon: typeof Clock }> = {
  abierta: { color: 'bg-red-100 text-red-800', icon: ShieldAlert },
  en_curso: { color: 'bg-amber-100 text-amber-800', icon: Clock },
  verificacion: { color: 'bg-blue-100 text-blue-800', icon: TrendingUp },
  cerrada_eficaz: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  cerrada_no_eficaz: { color: 'bg-red-100 text-red-700', icon: ShieldAlert },
}

export default function PaginaCAPA() {
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'correctiva' | 'preventiva'>('todas')

  const { data: capas = [], isLoading } = useQuery({
    queryKey: ['capa-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('capa_actions')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CAPA[]
    },
  })

  const filtered = filtroTipo === 'todas' ? capas : capas.filter(c => c.tipo === filtroTipo)

  const stats = {
    abiertas: capas.filter(c => c.estado === 'abierta').length,
    enCurso: capas.filter(c => c.estado === 'en_curso').length,
    eficaces: capas.filter(c => c.estado === 'cerrada_eficaz').length,
    vencidas: capas.filter(c => ['abierta', 'en_curso'].includes(c.estado) && new Date(c.fecha_limite) < new Date()).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
            CAPA
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Acciones Correctivas y Preventivas — ICH Q10 / GAMP5
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors">
          <Plus className="w-4 h-4" />
          Nueva CAPA
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Abiertas', value: stats.abiertas, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'En curso', value: stats.enCurso, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Eficaces', value: stats.eficaces, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Vencidas', value: stats.vencidas, color: 'text-red-700', bg: 'bg-red-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-surface-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['todas', 'correctiva', 'preventiva'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtroTipo === t
                ? 'bg-primary-700 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 hover:bg-surface-200'
            }`}
          >
            {t === 'todas' ? 'Todas' : t === 'correctiva' ? 'Correctivas' : 'Preventivas'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-surface-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-8 text-center">
            <ShieldAlert className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500">No hay CAPAs registradas.</p>
            <p className="text-xs text-surface-400 mt-1">Las CAPAs se generan a partir de No Conformidades detectadas.</p>
          </div>
        ) : (
          filtered.map(capa => {
            const badge = ESTADO_BADGE[capa.estado] || ESTADO_BADGE.abierta
            const Icon = badge.icon
            return (
              <div key={capa.id} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-surface-400">{capa.codigo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${capa.tipo === 'correctiva' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                        {capa.tipo}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                        <Icon className="w-3 h-3 inline mr-1" />
                        {capa.estado.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-medium text-surface-900 dark:text-white">{capa.titulo}</h3>
                    <p className="text-sm text-surface-500 mt-1 line-clamp-2">{capa.descripcion_nc}</p>
                  </div>
                  <div className="text-right text-xs text-surface-400 ml-4">
                    <p>Límite: {new Date(capa.fecha_limite).toLocaleDateString('es-AR')}</p>
                    <p className="mt-1">{capa.responsable}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Process info */}
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
        <h3 className="font-medium text-primary-900 dark:text-primary-100 mb-2">Proceso CAPA (SOP-CAPA-001)</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-primary-700 dark:text-primary-300">
          <div>
            <p className="font-medium mb-1">Acción Correctiva:</p>
            <p>Elimina la causa raíz de una No Conformidad detectada para evitar su recurrencia.</p>
          </div>
          <div>
            <p className="font-medium mb-1">Acción Preventiva:</p>
            <p>Elimina la causa potencial de una No Conformidad antes de que ocurra.</p>
          </div>
        </div>
        <p className="text-xs text-primary-600 dark:text-primary-400 mt-3">
          Ciclo: Identificación → Investigación causa raíz → Plan de acción → Implementación → Verificación eficacia → Cierre
        </p>
      </div>
    </div>
  )
}
