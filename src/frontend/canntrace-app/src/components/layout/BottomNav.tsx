import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LayoutDashboard, MessageSquareText, Package, AlertTriangle, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'

/**
 * Bottom navigation para mobile.
 * 5 items mas usados: Panel, Nueva Op, Stock, Alertas, Trazabilidad.
 * Altura 56px + safe-area-inset-bottom.
 * Dot semaforo superior sobre el icono de Alertas:
 *   rojo = eventos adversos/NC criticos
 *   amarillo = vencimientos/flor sin lab
 *   verde = todo OK
 */
type Semaforo = 'verde' | 'amarillo' | 'rojo' | null

const ITEMS = [
  { ruta: '/', icono: LayoutDashboard, label: 'Panel', exact: true },
  { ruta: '/operacion', icono: MessageSquareText, label: 'Nueva' },
  { ruta: '/stock', icono: Package, label: 'Stock' },
  { ruta: '/alertas', icono: AlertTriangle, label: 'Alertas', badge: true, semaforo: true },
  { ruta: '/trazabilidad', icono: ShieldCheck, label: 'Trazab.' },
]

export default function BottomNav() {
  const [alertasCount, setAlertasCount] = useState(0)
  const [semaforo, setSemaforo] = useState<Semaforo>(null)

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.rpc('alertas_trazabilidad')
      const total = (data as any)?.resumen?.total_alertas || 0
      setAlertasCount(total)
      const criticas = ((data as any)?.eventos_adversos_sin_anmat?.length || 0) + ((data as any)?.no_conformidades_abiertas?.length || 0)
      const vencidos = ((data as any)?.cuarentenas_vencidas?.length || 0) + ((data as any)?.flor_sin_lab?.length || 0)
      if (criticas > 0) setSemaforo('rojo')
      else if (vencidos > 0 || total > 0) setSemaforo('amarillo')
      else setSemaforo('verde')
    }
    cargar()
    const id = setInterval(cargar, 60000)
    return () => clearInterval(id)
  }, [])

  const semaforoColor = semaforo === 'rojo' ? 'bg-red-500' :
                        semaforo === 'amarillo' ? 'bg-amber-400' :
                        semaforo === 'verde' ? 'bg-emerald-400' : 'bg-transparent'

  return (
    <nav
      aria-label="Navegacion rapida mobile"
      className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-14">
        {ITEMS.map((item) => (
          <NavLink
            key={item.ruta}
            to={item.ruta}
            end={item.exact}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] transition-colors ${
                isActive
                  ? 'text-primary-700 dark:text-primary-400'
                  : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
              }`
            }
            aria-label={item.label}
          >
            <div className="relative">
              <item.icono className="w-5 h-5" />
              {item.badge && alertasCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {alertasCount > 9 ? '9+' : alertasCount}
                </span>
              )}
              {item.semaforo && semaforo && (
                <span className="absolute -top-1 -left-2 flex items-center justify-center" aria-hidden="true">
                  {semaforo === 'rojo' && (
                    <span className={`absolute inline-flex h-2.5 w-2.5 rounded-full ${semaforoColor} opacity-75 animate-ping`} />
                  )}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${semaforoColor} ring-2 ring-white dark:ring-surface-900`} />
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
