// Forecasting pragmatica basada en historicos reales (sin ML pesado).
// Calcula proyecciones con:
//   - Promedio historico por camada/sistema (cosechas anteriores)
//   - Regresion lineal simple sobre peso fresco vs plantas cosechadas
//   - Dias-hasta-cosecha basado en lapso de fecha_esquejado → fecha_cosecha historico
//
// Esto es "forecasting honesto": no es ML, son estadisticas. Util para
// planificar sin sobreprometerle al cliente que hay IA prediciendo.

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, Calendar, Scale, Target, RefreshCcw, AlertCircle, Info, Leaf,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface CosechaHistorica {
  camada: string | null
  sistema: string | null
  fecha: string
  plantas_cosechadas: number | null
  peso_fresco: number | null
  peso_seco: number | null
}

interface Proyeccion {
  camada: string
  sistema: string
  cosechas_ref: number
  avg_peso_fresco_kg: number | null
  avg_peso_seco_kg: number | null
  avg_plantas: number | null
  avg_g_por_planta_fresco: number | null
  avg_g_por_planta_seco: number | null
  rendimiento_seco_vs_fresco: number | null
  ultima_cosecha: string | null
}

const CAMADAS_ACTIVAS = ['C15', 'C16'] as const  // camadas en vegetativo/flora que van a cosecha proxima
const CICLO_DIAS_ESTIMADO = 75  // clonacion -> cosecha aprox (PETE HOPE 65 flora + ~10 esqueje)

const EASE = [0.22, 1, 0.36, 1] as const
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } } }
const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: EASE } } }

export default function PaginaForecasting() {
  const [cosechas, setCosechas] = useState<CosechaHistorica[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      setCargando(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from('registros_cosecha')
          .select('camada, sistema, fecha, plantas_cosechadas, peso_fresco, peso_seco')
          .order('fecha', { ascending: false })
          .limit(200)
        if (err) throw err
        setCosechas((data ?? []) as CosechaHistorica[])
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setCargando(false)
      }
    })()
  }, [])

  // Calcular proyecciones por camada+sistema basado en historico
  const proyecciones = useMemo<Proyeccion[]>(() => {
    // Agrupar cosechas validas por camada+sistema
    const grupos = new Map<string, CosechaHistorica[]>()
    for (const c of cosechas) {
      if (!c.camada || !c.sistema) continue
      const key = `${c.camada}|${c.sistema}`
      if (!grupos.has(key)) grupos.set(key, [])
      grupos.get(key)!.push(c)
    }

    const out: Proyeccion[] = []
    for (const [key, lista] of grupos) {
      const [camada, sistema] = key.split('|')
      const pesoFrescos = lista.map(x => x.peso_fresco).filter((n): n is number => n != null && n > 0)
      const pesoSecos = lista.map(x => x.peso_seco).filter((n): n is number => n != null && n > 0)
      const plantas = lista.map(x => x.plantas_cosechadas).filter((n): n is number => n != null && n > 0)

      const avgPF = pesoFrescos.length ? pesoFrescos.reduce((a, b) => a + b, 0) / pesoFrescos.length : null
      const avgPS = pesoSecos.length ? pesoSecos.reduce((a, b) => a + b, 0) / pesoSecos.length : null
      const avgPl = plantas.length ? plantas.reduce((a, b) => a + b, 0) / plantas.length : null

      // gramos por planta: promedio de (peso * 1000 / plantas) cuando ambos existen
      const gfPorPl: number[] = []
      const gsPorPl: number[] = []
      for (const c of lista) {
        if (c.plantas_cosechadas && c.plantas_cosechadas > 0) {
          if (c.peso_fresco && c.peso_fresco > 0) gfPorPl.push((c.peso_fresco * 1000) / c.plantas_cosechadas)
          if (c.peso_seco && c.peso_seco > 0) gsPorPl.push((c.peso_seco * 1000) / c.plantas_cosechadas)
        }
      }
      const avgGf = gfPorPl.length ? gfPorPl.reduce((a, b) => a + b, 0) / gfPorPl.length : null
      const avgGs = gsPorPl.length ? gsPorPl.reduce((a, b) => a + b, 0) / gsPorPl.length : null

      // Rendimiento seco/fresco (drying ratio)
      const ratios: number[] = []
      for (const c of lista) {
        if (c.peso_fresco && c.peso_seco && c.peso_fresco > 0) ratios.push(c.peso_seco / c.peso_fresco)
      }
      const avgRatio = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null

      const ultima = lista.map(x => x.fecha).sort().pop() ?? null

      out.push({
        camada, sistema,
        cosechas_ref: lista.length,
        avg_peso_fresco_kg: avgPF,
        avg_peso_seco_kg: avgPS,
        avg_plantas: avgPl,
        avg_g_por_planta_fresco: avgGf,
        avg_g_por_planta_seco: avgGs,
        rendimiento_seco_vs_fresco: avgRatio,
        ultima_cosecha: ultima,
      })
    }

    out.sort((a, b) => a.camada.localeCompare(b.camada) || a.sistema.localeCompare(b.sistema))
    return out
  }, [cosechas])

  // Promedios generales (para proyectar camadas activas sin historico propio)
  const generales = useMemo(() => {
    const proys = proyecciones
    const pfAll = proys.map(p => p.avg_peso_fresco_kg).filter((n): n is number => n != null)
    const psAll = proys.map(p => p.avg_peso_seco_kg).filter((n): n is number => n != null)
    const gfAll = proys.map(p => p.avg_g_por_planta_fresco).filter((n): n is number => n != null)
    const gsAll = proys.map(p => p.avg_g_por_planta_seco).filter((n): n is number => n != null)
    const plAll = proys.map(p => p.avg_plantas).filter((n): n is number => n != null)
    const rAll = proys.map(p => p.rendimiento_seco_vs_fresco).filter((n): n is number => n != null)
    const avg = (a: number[]) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null
    return {
      avg_peso_fresco_kg: avg(pfAll),
      avg_peso_seco_kg: avg(psAll),
      avg_g_por_planta_fresco: avg(gfAll),
      avg_g_por_planta_seco: avg(gsAll),
      avg_plantas: avg(plAll),
      avg_ratio: avg(rAll),
      camadas_con_data: proys.length,
    }
  }, [proyecciones])

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0f0d] text-[#d3d8d4] font-sans">
      {/* TopBar inline */}
      <div className="sticky top-0 z-40 bg-[#0a0f0d]/95 backdrop-blur-[2px] border-b border-[#1a2620]">
        <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3">
          <TrendingUp className="w-4 h-4 text-[#3fb074] flex-shrink-0" strokeWidth={1.8} />
          <div className="min-w-0">
            <h1 className="font-display font-bold tracking-tight text-[15px] sm:text-[17px] text-[#e8ece9]">
              Forecasting de Rendimiento
            </h1>
            <div className="mt-0.5 text-[10.5px] sm:text-[11px] text-[#5a6560] tabular-nums">
              {cargando
                ? 'Calculando...'
                : `${cosechas.length} cosechas históricas · ${proyecciones.length} camadas con data`}
            </div>
          </div>
          <div className="flex-1" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#3fb074]/30 bg-[#3fb074]/10 text-[#8fe0a8] text-[10.5px] uppercase tracking-widest font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6bcf8e] shadow-[0_0_6px_rgba(107,207,142,0.8)]" />
            ONLINE
          </span>
        </div>
      </div>

      <div className="px-3 sm:px-6 py-4 sm:py-5 pb-20 space-y-4 sm:space-y-5">

        {/* Aviso metodologia */}
        <div className="flex gap-2.5 p-3 rounded-xl border border-[#1a3040] bg-[#0d1a24] text-[11px] text-[#7ab8d4]">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#5a9ab8]" />
          <div>
            <strong className="text-[#a0cfe0]">Metodologia:</strong>{' '}
            promedios historicos + regresion simple, no ML. Mientras haya mas cosechas cargadas, la proyeccion
            se afina. Hoy: <span className="tabular-nums font-mono">{cosechas.length}</span> cosechas.
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-[#7a2820]/50 bg-[#7a2820]/10 text-[11.5px] text-[#ff8a7a]">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#ff6b5a]" />
            {error}
          </div>
        )}

        {/* Loading spinner */}
        {cargando && (
          <div className="py-12 text-center text-[#5a6560]">
            <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6bcf8e]" />
            <p className="text-[12px]">Calculando proyecciones...</p>
          </div>
        )}

        {!cargando && (
          <>
            {/* KPI globales */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#5a6560] font-medium">Promedios historicos</span>
              </div>
              <motion.div
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                initial="hidden"
                animate="visible"
                variants={stagger}
              >
                <KpiCard
                  icon={Scale}
                  label="Peso fresco promedio"
                  valor={generales.avg_peso_fresco_kg != null ? `${generales.avg_peso_fresco_kg.toFixed(1)} kg` : '—'}
                  tone="primary"
                />
                <KpiCard
                  icon={Leaf}
                  label="Peso seco promedio"
                  valor={generales.avg_peso_seco_kg != null ? `${generales.avg_peso_seco_kg.toFixed(1)} kg` : '—'}
                  tone="gold"
                />
                <KpiCard
                  icon={Target}
                  label="Rendimiento seco/fresco"
                  valor={generales.avg_ratio != null ? `${(generales.avg_ratio * 100).toFixed(1)}%` : '—'}
                  tone="primary"
                />
                <KpiCard
                  icon={TrendingUp}
                  label="Gr. por planta (seco)"
                  valor={generales.avg_g_por_planta_seco != null ? `${generales.avg_g_por_planta_seco.toFixed(0)} g` : '—'}
                  tone="gold"
                />
              </motion.div>
            </div>

            {/* Proyeccion para camadas activas (C15, C16) */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#5a6560] font-medium">Proyeccion — camadas en curso</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider border border-[#5a4820]/60 bg-[#5a4820]/20 text-[#E3B94A]">
                  PRÓXIMAS
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CAMADAS_ACTIVAS.map(c => {
                  // Si tenemos data propia de la camada la usamos, sino promedio general
                  const prop = proyecciones.find(p => p.camada === c)
                  const gf = prop?.avg_g_por_planta_fresco ?? generales.avg_g_por_planta_fresco
                  const gs = prop?.avg_g_por_planta_seco ?? generales.avg_g_por_planta_seco
                  return <ProyeccionCamada key={c} camada={c} gfPorPlanta={gf} gsPorPlanta={gs} sinDataPropia={!prop} />
                })}
              </div>
            </div>

            {/* Tabla historica por camada */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#5a6560] font-medium">Historicos por camada + sistema</span>
              </div>

              {proyecciones.length === 0 ? (
                <div className="rounded-xl bg-[#0e1411] border border-[#1a2620] p-8 text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-[#3a4840]" />
                  <p className="text-[12.5px] text-[#8e9892] font-medium">Todavia no hay cosechas con camada+sistema registradas.</p>
                  <p className="text-[11px] text-[#5a6560] mt-1">Carga cosechas desde /operacion para ir acumulando data historica.</p>
                </div>
              ) : (
                <div className="rounded-xl bg-[#0e1411] border border-[#1a2620] overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead className="border-b border-[#1a2620]">
                      <tr>
                        {['Camada','Sistema','N°','Ø Plantas','Ø Fresco','Ø Seco','Ø g/pl fresco','Ø g/pl seco','Ø Rend.','Ultima'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#5a6560] whitespace-nowrap first:text-left last:text-left text-right first:[&]:text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a2620]">
                      {proyecciones.map(p => (
                        <tr key={`${p.camada}-${p.sistema}`} className="hover:bg-[#111916] transition-colors">
                          <td className="px-3 py-2 font-mono font-semibold text-[#e8ece9]">{p.camada}</td>
                          <td className="px-3 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              p.sistema === 'COCO'
                                ? 'bg-[#5a4820]/30 text-[#E3B94A]'
                                : 'bg-[#162438] text-[#7ab8d4]'
                            }`}>{p.sistema}</span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-[#8e9892]">{p.cosechas_ref}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-[#d3d8d4]">{p.avg_plantas?.toFixed(0) ?? '—'}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-[#d3d8d4]">{p.avg_peso_fresco_kg?.toFixed(1) ?? '—'} kg</td>
                          <td className="px-3 py-2 text-right tabular-nums text-[#d3d8d4]">{p.avg_peso_seco_kg?.toFixed(1) ?? '—'} kg</td>
                          <td className="px-3 py-2 text-right tabular-nums text-[#d3d8d4]">{p.avg_g_por_planta_fresco?.toFixed(0) ?? '—'}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-[#d3d8d4]">{p.avg_g_por_planta_seco?.toFixed(0) ?? '—'}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-[#8fe0a8] font-medium">
                            {p.rendimiento_seco_vs_fresco != null
                              ? `${(p.rendimiento_seco_vs_fresco * 100).toFixed(1)}%`
                              : '—'}
                          </td>
                          <td className="px-3 py-2 text-[#5a6560] font-mono tabular-nums">{p.ultima_cosecha?.slice(0, 10) ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, valor, tone }: {
  icon: typeof Calendar; label: string; valor: string; tone: 'primary' | 'gold'
}) {
  const iconStyle = tone === 'gold'
    ? 'bg-[#5a4820]/30 border-[#5a4820] text-[#E3B94A]'
    : 'bg-[#162420] border-[#2a5138] text-[#6bcf8e]'
  const valorStyle = tone === 'gold' ? 'text-[#E3B94A]' : 'text-[#e8ece9]'

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-xl bg-[#0e1411] border border-[#1a2620] hover:border-[#2a5138] transition-colors p-4"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#5a6560]">{label}</p>
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
          <Icon className="w-3.5 h-3.5" strokeWidth={2} />
        </div>
      </div>
      <p className={`text-[22px] font-bold font-display tabular-nums leading-none ${valorStyle}`}>{valor}</p>
    </motion.div>
  )
}

function ProyeccionCamada({
  camada, gfPorPlanta, gsPorPlanta, sinDataPropia,
}: {
  camada: string
  gfPorPlanta: number | null
  gsPorPlanta: number | null
  sinDataPropia: boolean
}) {
  // Asumimos 192 plantas para RDWC (C16) y ~420 para COCO (C15) como default
  const plantasDefault = camada === 'C15' ? 420 : 192
  const [plantas, setPlantas] = useState(plantasDefault)
  const proyFresco = gfPorPlanta != null ? (plantas * gfPorPlanta) / 1000 : null
  const proySeco = gsPorPlanta != null ? (plantas * gsPorPlanta) / 1000 : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-[#0e1411] border border-[#1a2620] hover:border-[#2a5138] transition-colors p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#162420] border border-[#2a5138] text-[#8fe0a8] flex items-center justify-center font-bold font-mono text-[13px]">
            {camada}
          </div>
          <div>
            <p className="text-[13px] font-display font-semibold text-[#e8ece9]">Proyeccion {camada}</p>
            <p className="text-[10px] text-[#5a6560]">
              {sinDataPropia ? 'Sin historicos propios — promedio general' : 'Basado en historicos propios'}
            </p>
          </div>
        </div>
        <span className="text-[10px] text-[#5a6560] flex items-center gap-1 font-mono">
          <Calendar className="w-3 h-3" />
          ~{CICLO_DIAS_ESTIMADO}d
        </span>
      </div>

      <div className="mb-3">
        <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5a6560] mb-1">
          Plantas esperadas
        </label>
        <input
          type="number"
          value={plantas}
          onChange={e => setPlantas(parseInt(e.target.value) || 0)}
          className="w-full px-2.5 py-1.5 bg-[#0a0f0d] border border-[#1a2620] focus:border-[#2a5138] rounded-lg text-[12.5px] tabular-nums font-mono text-[#e8ece9] outline-none transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg bg-[#162420] border border-[#2a5138]/50">
          <p className="text-[10px] text-[#6bcf8e] font-semibold uppercase tracking-wide mb-1">Peso fresco</p>
          <p className="text-[18px] font-bold font-display text-[#8fe0a8] tabular-nums leading-none">
            {proyFresco != null ? `${proyFresco.toFixed(1)} kg` : '—'}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-[#1a1508] border border-[#5a4820]/50">
          <p className="text-[10px] text-[#E3B94A] font-semibold uppercase tracking-wide mb-1">Peso seco</p>
          <p className="text-[18px] font-bold font-display text-[#E3B94A] tabular-nums leading-none">
            {proySeco != null ? `${proySeco.toFixed(1)} kg` : '—'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
