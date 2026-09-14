// PassiveAlertsPanel — Accordion con alertas de silos sin actividad.

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, AlertTriangle, Info, ArrowRight } from 'lucide-react'
import { getPassiveAlerts, type PassiveAlert } from '../../lib/passiveAlerts'

const EASE = [0.22, 1, 0.36, 1] as const

export default function PassiveAlertsPanel() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<PassiveAlert[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      const data = await getPassiveAlerts()
      if (cancel) return
      setAlerts(data)
      setLoading(false)
      // Auto-abrir si hay mas de 2
      setOpen(data.length > 2)
    })()
    return () => { cancel = true }
  }, [])

  if (loading || alerts.length === 0) return null

  const warnCount = alerts.filter(a => a.severity === 'warn').length
  const tone = warnCount > 0 ? 'warn' : 'info'

  return (
    <div className="rounded-xl bg-[#0e1411] border border-[#1a2620] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3 flex items-center gap-2.5 hover:bg-[#111916] transition-colors text-left"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border"
          style={
            tone === 'warn'
              ? { background: 'rgba(227,185,74,0.12)', borderColor: '#5a4820', color: '#E3B94A' }
              : { background: 'rgba(143,182,232,0.10)', borderColor: '#2a3d56', color: '#8fb6e8' }
          }
        >
          {tone === 'warn'
            ? <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.8} />
            : <Info className="w-3.5 h-3.5" strokeWidth={1.8} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-display font-semibold text-[#e8ece9] leading-tight">
            Atención pasiva ({alerts.length})
          </p>
          <p className="text-[10.5px] text-[#747e78] mt-0.5 truncate">
            Silos sin actividad reciente
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#5a6560] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: EASE }}
            className="overflow-hidden border-t border-[#1a2620]"
          >
            <ul className="divide-y divide-[#1a2620]">
              {alerts.map(a => {
                const isWarn = a.severity === 'warn'
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => navigate(a.ctaPath)}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#111916] transition-colors flex items-start gap-2.5 group"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: isWarn ? '#E3B94A' : '#8fb6e8' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#e8ece9] leading-tight">
                          {a.title}
                        </p>
                        <p className="text-[10.5px] text-[#747e78] mt-0.5">
                          {a.detail}
                        </p>
                      </div>
                      <span className="text-[10.5px] text-[#8fe0a8] flex items-center gap-1 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                        {a.ctaLabel}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
