// TimelineTab — cronología de eventos por camada con tema dark CannTrace.
// Reemplaza react-chrono por una timeline custom (más liviana, dark coherente, animada).

import { motion } from 'framer-motion'
import { Sprout, Leaf, Flower2, Scissors, Package, FlaskConical, Activity } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

const ETAPA: Record<string, { label: string; icono: any; color: string; bg: string; border: string }> = {
  planta_madre:     { label: 'Planta madre',     icono: Sprout,       color: '#8fe0a8', bg: 'rgba(63,176,116,0.10)',  border: '#2a5138' },
  esqueje:          { label: 'Esqueje / Clon',   icono: Sprout,       color: '#6bcf8e', bg: 'rgba(63,176,116,0.10)',  border: '#2a5138' },
  planta:           { label: 'Vegetativa',       icono: Leaf,         color: '#3fb074', bg: 'rgba(63,176,116,0.08)',  border: '#2a5138' },
  flor:             { label: 'Floración / Cosecha', icono: Flower2,   color: '#E3B94A', bg: 'rgba(196,154,44,0.10)',  border: '#5a4820' },
  flor_trimmeada:   { label: 'Trimming',         icono: Scissors,     color: '#C49A2C', bg: 'rgba(196,154,44,0.10)',  border: '#5a4820' },
  flor_fraccionada: { label: 'Almacenamiento',   icono: Package,      color: '#8fe0a8', bg: 'rgba(63,176,116,0.10)',  border: '#2a5138' },
  cuarentena:       { label: 'Cuarentena lab',   icono: FlaskConical, color: '#a7b1ab', bg: 'rgba(180,200,190,0.05)', border: '#1a2620' },
}
const FALLBACK = { label: 'Evento', icono: Activity, color: '#a7b1ab', bg: 'rgba(180,200,190,0.05)', border: '#1a2620' }

const fmtDate = (d: string) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TimelineTab({ timeline }: { timeline: any[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="rounded-xl bg-[#0e1411] border border-[#1a2620] overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-3.5 border-b border-[#1a2620] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-3.5 h-3.5 text-[#6bcf8e] flex-shrink-0" strokeWidth={1.8} />
          <h3 className="font-display font-semibold text-[13px] text-[#e8ece9] truncate">Cronología de eventos</h3>
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] text-[#5a6560] font-medium tabular-nums">
          {timeline.length} {timeline.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>

      <div className="p-4 sm:p-6">
        <ol className="relative">
          {/* Línea vertical conectora */}
          <span
            aria-hidden
            className="absolute left-[18px] sm:left-[22px] top-2 bottom-2 w-px"
            style={{
              background:
                'linear-gradient(180deg, transparent 0%, #2a5138 8%, #2a5138 92%, transparent 100%)',
            }}
          />

          {timeline.map((t, i) => {
            const e = ETAPA[t.etapa] || FALLBACK
            const Icono = e.icono
            return (
              <motion.li
                key={`${t.codigo_lote}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: EASE, delay: i * 0.04 }}
                className="relative pl-12 sm:pl-14 pb-5 last:pb-0"
              >
                <div
                  className="absolute left-0 top-0 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border z-10"
                  style={{ background: e.bg, borderColor: e.border, color: e.color, boxShadow: `0 0 14px ${e.color}22` }}
                >
                  <Icono className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.8} />
                </div>

                <div className="rounded-xl bg-[#111916] border border-[#1a2620] hover:border-[#2a5138] transition-colors px-3.5 py-2.5">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <h4 className="font-display font-semibold text-[12.5px] sm:text-[13px]" style={{ color: e.color }}>
                      {e.label}
                    </h4>
                    <time className="font-mono tabular-nums text-[10.5px] text-[#8e9892]">{fmtDate(t.fecha)}</time>
                  </div>
                  <div className="mt-1 text-[11px] text-[#a7b1ab] flex items-center gap-1.5 flex-wrap">
                    <code className="font-mono text-[#d3d8d4]">{t.codigo_lote}</code>
                    {t.producto && (<><span className="text-[#343c37]">·</span><span>{t.producto}</span></>)}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 sm:gap-3 flex-wrap text-[10.5px] text-[#8e9892]">
                    {t.cantidad != null && (
                      <span>
                        Cantidad: <span className="font-mono tabular-nums text-[#d3d8d4]">{Number(t.cantidad).toLocaleString('es-AR')}</span>
                      </span>
                    )}
                    {t.sistema && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded border text-[9.5px] uppercase tracking-wider font-medium"
                        style={
                          t.sistema === 'RDWC'
                            ? { background: 'rgba(63,176,116,0.10)', borderColor: '#2a5138', color: '#8fe0a8' }
                            : { background: 'rgba(196,154,44,0.10)', borderColor: '#5a4820', color: '#E3B94A' }
                        }
                      >
                        {t.sistema}
                      </span>
                    )}
                    {t.peso && (
                      <span>
                        Peso: <span className="font-mono tabular-nums text-[#E3B94A]">{t.peso}</span><span className="text-[#5a6560]"> kg</span>
                      </span>
                    )}
                  </div>
                </div>
              </motion.li>
            )
          })}
        </ol>
      </div>
    </motion.div>
  )
}
