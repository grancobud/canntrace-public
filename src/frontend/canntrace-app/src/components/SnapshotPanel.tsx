// SnapshotPanel — muestra trazabilidad_snapshot por camada con recálculo manual.
// Se inserta en DetailPanel de /trazabilidad. Auto-fetch en mount + manual refresh.

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Database, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getSnapshot, recalcularSnapshot, type TrazabilidadSnapshot } from '../lib/snapshotService'
import { toast } from 'sonner'

const EASE = [0.22, 1, 0.36, 1] as const

export default function SnapshotPanel({ camada }: { camada: string }) {
  const [snap, setSnap] = useState<TrazabilidadSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [recalc, setRecalc] = useState(false)
  const [open, setOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const s = await getSnapshot(camada)
      setSnap(s)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [camada])

  async function handleRecalc() {
    setRecalc(true)
    try {
      const s = await recalcularSnapshot(camada)
      setSnap(s)
      toast.success(`Snapshot ${camada} recalculado`)
    } catch (e: any) {
      toast.error(`Error recalculando: ${e?.message || 'desconocido'}`)
    } finally {
      setRecalc(false)
    }
  }

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-AR') : '—'
  const fmtTime = (d: string | null) => d ? new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

  if (loading) {
    return (
      <div className="rounded-xl bg-[#0e1411] border border-[#1a2620] p-4">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#5a6560] animate-pulse" />
          <span className="text-[11.5px] text-[#5a6560]">Cargando snapshot…</span>
        </div>
      </div>
    )
  }

  if (!snap) {
    return (
      <div className="rounded-xl bg-[#0e1411] border border-[#1a2620] p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-[#E3B94A] flex-shrink-0" />
            <span className="text-[11.5px] text-[#a7b1ab]">
              Sin snapshot persistido para <span className="font-mono text-[#E3B94A]">{camada}</span>
            </span>
          </div>
          <button
            onClick={handleRecalc}
            disabled={recalc}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#3fb074]/40 bg-[#3fb074]/10 hover:bg-[#3fb074]/20 transition-colors text-[11.5px] font-medium text-[#8fe0a8] disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${recalc ? 'animate-spin' : ''}`} />
            {recalc ? 'Calculando…' : 'Calcular ahora'}
          </button>
        </div>
      </div>
    )
  }

  const completada = snap.estado === 'completada'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="rounded-xl bg-[#0e1411] border border-[#1a2620]"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#111916] transition-colors rounded-xl text-left"
      >
        <Database className="w-3.5 h-3.5 text-[#6bcf8e] flex-shrink-0" strokeWidth={1.8} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold text-[12.5px] text-[#e8ece9]">Snapshot persistido</span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium border ${
                completada
                  ? 'border-[#2a5138] bg-[#3fb074]/10 text-[#8fe0a8]'
                  : 'border-[#5a4820] bg-[#E3B94A]/10 text-[#E3B94A]'
              }`}
            >
              {completada ? <CheckCircle2 className="w-2.5 h-2.5" /> : null}
              {snap.estado === 'completada' ? 'Completada' : `En proceso · ${snap.stage_actual || '—'}`}
            </span>
            {snap.fuente?.fecha_pm_estimada && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium border border-[#5a4820] bg-[#E3B94A]/5 text-[#C49A2C]">
                fecha estimada
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[10.5px] text-[#5a6560] tabular-nums">
            <span className="font-mono text-[#a7b1ab]">{snap.codigo_cl || '—'}</span>
            <span className="mx-1.5 text-[#343c37]">·</span>
            {snap.yield_kg ? <><span className="text-[#E3B94A]">{Number(snap.yield_kg).toFixed(2)} kg</span> · </> : null}
            {snap.bolsas_calculadas ? <>{snap.bolsas_calculadas} bolsas · </> : null}
            <span>recalc {fmtTime(snap.ultima_recalculacion)}</span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleRecalc() }}
          disabled={recalc}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#3fb074]/40 bg-[#3fb074]/10 hover:bg-[#3fb074]/20 transition-colors text-[10.5px] font-medium text-[#8fe0a8] disabled:opacity-50 flex-shrink-0"
        >
          <RefreshCw className={`w-2.5 h-2.5 ${recalc ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{recalc ? 'Calc…' : 'Recalc'}</span>
        </button>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#5a6560] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden border-t border-[#1a2620]"
          >
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3 text-[11px]">
              <KV label="Año" value={snap.anio} mono />
              <KV label="PM" value={snap.pm_codigo} mono />
              <KV label="CL" value={snap.cl_codigo} mono />
              <KV label="Línea" value={snap.linea} mono />
              <KV label="Sistema" value={snap.sistema} mono />
              <KV label="Sala" value={snap.sala} mono />
              {snap.sub_grupo && <KV label="Sub-grupo" value={snap.sub_grupo} mono />}
              <KV label="Plantas esqueje" value={snap.plantas_esqueje} mono />
              <KV label="Plantas vege" value={snap.plantas_vege} mono />
              <KV label="Plantas flora" value={snap.plantas_flora} mono />
              <KV label="Cuadros secado" value={snap.cuadros_secado} mono />
              <KV label="Yield kg" value={snap.yield_kg ? Number(snap.yield_kg).toFixed(3) : null} mono accent />
              <KV label="Trim g" value={snap.gramos_trim ? Number(snap.gramos_trim).toFixed(0) : null} mono />
              <KV label="ALM g (cap)" value={snap.gramos_alm_capado ? Number(snap.gramos_alm_capado).toFixed(0) : null} mono />
              <KV label="Bolsas" value={snap.bolsas_calculadas} mono />
              <KV label="Días totales" value={snap.total_dias_efectivos} mono />
              <KV label="PM ingreso" value={fmtDate(snap.fecha_pm_ingreso)} mono />
              <KV label="Esqueje" value={fmtDate(snap.fecha_esqueje_inicio)} mono />
              <KV label="Vege" value={fmtDate(snap.fecha_vege_inicio)} mono />
              <KV label="Flora" value={fmtDate(snap.fecha_flora_inicio)} mono />
              <KV label="Cosecha" value={fmtDate(snap.fecha_cosecha)} mono />
              {snap.codigo_alm && <KV label="ALM" value={snap.codigo_alm} mono />}
              {snap.codigo_dep_first && <KV label="Dep first" value={snap.codigo_dep_first} mono />}
              {snap.codigo_dep_last && <KV label="Dep last" value={snap.codigo_dep_last} mono />}
            </div>

            {snap.fuente && Object.keys(snap.fuente).length > 0 && (
              <div className="px-4 pb-3 -mt-2">
                <div className="text-[10px] uppercase tracking-[0.14em] text-[#5a6560] font-medium mb-1">Fuente / notas</div>
                <pre className="text-[10.5px] text-[#a7b1ab] font-mono bg-[#111916] border border-[#1a2620] rounded p-2 overflow-x-auto">
                  {JSON.stringify(snap.fuente, null, 2)}
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function KV({ label, value, mono, accent }: { label: string; value: any; mono?: boolean; accent?: boolean }) {
  return (
    <div>
      <div className="text-[9.5px] uppercase tracking-[0.12em] text-[#5a6560] font-medium">{label}</div>
      <div
        className={`mt-0.5 ${mono ? 'font-mono tabular-nums' : ''} ${accent ? 'text-[#E3B94A]' : 'text-[#d3d8d4]'}`}
      >
        {value ?? <span className="text-[#454e48]">—</span>}
      </div>
    </div>
  )
}
