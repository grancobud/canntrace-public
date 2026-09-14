// PaginaPanel — dashboard principal con estetica dark coherente con PaginaTrazabilidad.
// Paleta verde+dorado, bordes sutiles single-line, sin fondos superpuestos.

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Package, Leaf, Activity, AlertTriangle, ArrowRight,
  ClipboardList, FileText, ScanLine, ShieldCheck, BarChart3,
  QrCode, GitBranch, Calendar, Sparkles, Loader2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ICONOS_OPERACION, ETIQUETAS_OPERACION, type TipoOperacion } from '../types'
import { operacionesService } from '../lib/servicios'
import { supabase } from '../lib/supabase'
import ActivityStream from '../components/dashboard/ActivityStream'
import PassiveAlertsPanel from '../components/dashboard/PassiveAlertsPanel'

const EASE = [0.22, 1, 0.36, 1] as const
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } } }
const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: EASE } } }

type IconCmp = typeof Package
type AccentTone = 'primary' | 'gold' | 'warn' | 'neutral'

const TONES: Record<AccentTone, { bg: string; border: string; text: string; muted: string }> = {
  primary: { bg: 'rgba(63,176,116,0.10)', border: '#2a5138', text: '#8fe0a8', muted: '#3fb074' },
  gold:    { bg: 'rgba(196,154,44,0.10)', border: '#5a4820', text: '#E3B94A', muted: '#C49A2C' },
  warn:    { bg: 'rgba(227,185,74,0.12)', border: '#5a4820', text: '#E3B94A', muted: '#E3B94A' },
  neutral: { bg: 'rgba(180,200,190,0.05)', border: '#1a2620', text: '#a7b1ab', muted: '#8e9892' },
}

export default function PaginaPanel() {
  const [stats, setStats] = useState({ lotesActivos: 0, individuosActivos: 0, operacionesHoy: 0 })
  const [alertasCount, setAlertasCount] = useState(0)
  const [ultimasOps, setUltimasOps] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const [estadisticas, operaciones, alertas] = await Promise.all([
          operacionesService.getEstadisticas(),
          operacionesService.getOperaciones(6),
          supabase.rpc('alertas_trazabilidad'),
        ])
        setStats(estadisticas)
        setUltimasOps(operaciones || [])
        setAlertasCount((alertas.data as any)?.resumen?.total_alertas || 0)
      } catch (err) {
        console.error('Error cargando dashboard:', err)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const tarjetas: Array<{ label: string; valor: number; icono: IconCmp; tone: AccentTone; hint: string }> = [
    { label: 'Lotes activos',       valor: stats.lotesActivos,       icono: Package,        tone: 'primary', hint: 'en seguimiento' },
    { label: 'Individuos activos',  valor: stats.individuosActivos,  icono: Leaf,           tone: 'primary', hint: 'plantas vivas' },
    { label: 'Operaciones hoy',     valor: stats.operacionesHoy,     icono: Activity,       tone: 'gold',    hint: 'confirmadas' },
    { label: 'Alertas',             valor: alertasCount,             icono: AlertTriangle,  tone: alertasCount > 0 ? 'warn' : 'neutral', hint: alertasCount > 0 ? 'requieren atención' : 'todo en orden' },
  ]

  const accesos: Array<{ to: string; titulo: string; desc: string; icono: IconCmp; tone: AccentTone }> = [
    { to: '/operacion',     titulo: 'Nueva operación',  desc: 'Registrar via chat guiado',   icono: Activity,     tone: 'primary' },
    { to: '/escaner',       titulo: 'Escanear QR',      desc: 'Buscar lote rápido',          icono: ScanLine,     tone: 'primary' },
    { to: '/stock',         titulo: 'Stock',            desc: 'Inventario con filtros',      icono: Package,      tone: 'primary' },
    { to: '/trazabilidad',  titulo: 'Trazabilidad',     desc: 'Cadenas seed-to-sale',        icono: ShieldCheck,  tone: 'gold' },
    { to: '/registros',     titulo: 'Registros CUMCS',  desc: '84 planillas digitales',      icono: ClipboardList, tone: 'gold' },
    { to: '/dashboard',     titulo: 'Dashboard BI',     desc: 'Métricas ejecutivas',         icono: BarChart3,    tone: 'primary' },
    { to: '/arbol',         titulo: 'Árbol genealógico',desc: 'Cadena visual',               icono: GitBranch,    tone: 'gold' },
    { to: '/calendario',    titulo: 'Calendario',       desc: 'Tareas culturales',           icono: Calendar,     tone: 'primary' },
    { to: '/etiquetas',     titulo: 'Etiquetas QR',     desc: 'Imprimir bolsas',             icono: QrCode,       tone: 'gold' },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0f0d] text-[#d3d8d4] font-sans">
      {/* TopBar coherente con Trazabilidad */}
      <div className="sticky top-0 z-40 bg-[#0a0f0d]/95 backdrop-blur-[2px] border-b border-[#1a2620]">
        <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3">
          <div className="min-w-0">
            <h1 className="font-display font-bold tracking-tight text-[15px] sm:text-[17px] text-[#e8ece9]">Panel de Control</h1>
            <div className="mt-0.5 text-[10.5px] sm:text-[11px] text-[#5a6560]">
              Resumen operaciones y stock <span className="hidden sm:inline"><span className="text-[#343c37] mx-1">│</span> tiempo real</span>
            </div>
          </div>
          <div className="flex-1" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#3fb074]/30 bg-[#3fb074]/10 text-[#8fe0a8] text-[10.5px] uppercase tracking-widest font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6bcf8e] shadow-[0_0_6px_rgba(107,207,142,0.8)]" />
            ONLINE
          </span>
        </div>
      </div>

      <div className="px-3 sm:px-6 py-4 sm:py-5 pb-20 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 sm:gap-5">
        <div className="space-y-4 sm:space-y-5 min-w-0">
        {/* KPI cards */}
        {cargando ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="rounded-xl bg-[#0e1411] border border-[#1a2620] p-4 animate-pulse h-[100px]" />
            ))}
          </div>
        ) : (
          <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3" initial="hidden" animate="visible" variants={stagger}>
            {tarjetas.map((stat) => {
              const t = TONES[stat.tone]
              return (
                <motion.div key={stat.label} variants={fadeUp}
                  className="rounded-xl bg-[#0e1411] border border-[#1a2620] p-4 hover:border-[#2a5138] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6560] font-medium">{stat.label}</p>
                      <p className="font-display font-bold tracking-tight text-[24px] sm:text-[28px] text-[#e8ece9] mt-1.5 leading-none tabular-nums">
                        {stat.valor.toLocaleString('es-AR')}
                      </p>
                      <p className="text-[10.5px] text-[#747e78] mt-1.5">{stat.hint}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border"
                      style={{ background: t.bg, borderColor: t.border, color: t.text }}>
                      <stat.icono className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Accesos rapidos */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-[#6bcf8e]" />
            <h2 className="text-[10px] uppercase tracking-[0.16em] text-[#5a6560] font-medium">Accesos rápidos</h2>
          </div>
          <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5"
            initial="hidden" animate="visible" variants={stagger}>
            {accesos.map((a) => {
              const t = TONES[a.tone]
              return (
                <motion.div key={a.to} variants={fadeUp}>
                  <Link to={a.to}
                    className="group flex items-center gap-3 p-3.5 rounded-xl bg-[#0e1411] border border-[#1a2620] hover:border-[#2a5138] hover:-translate-y-0.5 transition-all duration-200">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border group-hover:scale-105 transition-transform"
                      style={{ background: t.bg, borderColor: t.border, color: t.text }}>
                      <a.icono className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-[12.5px] text-[#e8ece9] leading-tight truncate">{a.titulo}</p>
                      <p className="text-[10.5px] text-[#747e78] mt-0.5 truncate">{a.desc}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#454e48] group-hover:text-[#6bcf8e] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* Ultimas operaciones */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4, ease: EASE }}
          className="rounded-xl bg-[#0e1411] border border-[#1a2620] overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-[#1a2620] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Activity className="w-3.5 h-3.5 text-[#6bcf8e] flex-shrink-0" />
              <h3 className="font-display font-semibold text-[13px] text-[#e8ece9] truncate">Últimas operaciones</h3>
            </div>
            <Link to="/trazabilidad" className="text-[11px] text-[#8fe0a8] hover:text-[#6bcf8e] font-medium flex items-center gap-1 flex-shrink-0">
              <span className="hidden sm:inline">Ver cadenas</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {cargando ? (
            <div className="px-4 sm:px-5 py-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-[#111916] border border-[#1a2620] rounded-md animate-pulse" />
              ))}
            </div>
          ) : ultimasOps.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto w-9 h-9 rounded-full bg-[#162420] border border-[#1e2d27] flex items-center justify-center mb-2">
                <FileText className="w-4 h-4 text-[#5a6560]" />
              </div>
              <div className="font-display font-semibold text-[#d3d8d4] text-[13px]">Sin operaciones aún</div>
              <div className="mt-1 text-[11px] text-[#5a6560] max-w-xs mx-auto">Comenzá registrando la primera operación via chat conversacional guiado.</div>
              <Link to="/operacion" className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#3fb074]/40 bg-[#3fb074]/10 hover:bg-[#3fb074]/20 transition-colors text-[11.5px] font-medium text-[#8fe0a8]">
                <Activity className="w-3 h-3" /> Nueva operación
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[#1a2620]">
              {ultimasOps.map((op: any) => (
                <li key={op.id} className="flex items-center gap-3 px-4 sm:px-5 py-2.5 hover:bg-[#111916] transition-colors">
                  <span className="text-[18px] flex-shrink-0 leading-none" aria-hidden="true">
                    {ICONOS_OPERACION[op.tipo_operacion as TipoOperacion]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#e8ece9] truncate leading-tight">
                      {ETIQUETAS_OPERACION[op.tipo_operacion as TipoOperacion]}
                    </p>
                    <p className="text-[10.5px] text-[#747e78] font-mono tabular-nums truncate mt-0.5">
                      {op.lote_origen?.codigo_lote || op.lote_destino?.codigo_lote || 'Sin lote'}
                      {op.cantidad_entrada ? ` · ${op.cantidad_entrada}` : ''}
                    </p>
                  </div>
                  <span className="text-[10.5px] text-[#5a6560] tabular-nums font-mono flex-shrink-0">
                    {new Date(op.fecha_operacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {cargando && (
          <div className="text-center py-2">
            <Loader2 className="w-4 h-4 text-[#6bcf8e] animate-spin mx-auto" />
          </div>
        )}
        </div>

        {/* Columna lateral: alertas pasivas + activity stream */}
        <aside className="space-y-4 min-w-0">
          <PassiveAlertsPanel />
          <ActivityStream />
        </aside>
      </div>
    </div>
  )
}
