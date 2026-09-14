// Sidebar — paleta CannTrace dark hex coherente con páginas, terminaciones refinadas.
// Logo con cuadrado verde + label GAMP5 arriba, items con borde sutil cuando activos,
// avatar circular grande, semáforo alertas con pill, font-display + tipografía clara.

import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  MessageSquareText, LayoutDashboard, Package, ShieldCheck, Database,
  Settings, Leaf, LogOut, ClipboardList, CheckSquare, Activity, Shield,
  BarChart3, Calendar, QrCode, FileText, GitBranch,
  Map as MapIcon, Sparkles, Search, Upload, Workflow, ClipboardEdit, Thermometer, FlaskConical, Table2, TrendingUp,
  Brain, ShieldAlert, RefreshCcw,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSectorActivity } from '../../hooks/useSectorActivity'
import { SIDEBAR_GROUP_SECTORS } from '../../lib/awareness'

type Item = { nombre: string; ruta: string; icono: any; permiso: string | null; badge?: number }
type Semaforo = 'verde' | 'amarillo' | 'rojo' | 'desconocido'

export default function Sidebar({ colapsado: colapsadoProp }: { colapsado?: boolean } = {}) {
  const { usuario, logout, tienePermiso } = useAuth()
  const location = useLocation()
  const { counts: sectorCounts } = useSectorActivity(24)
  const [semaforo, setSemaforo] = useState<Semaforo>('desconocido')
  const [semaforoDetalle, setSemaforoDetalle] = useState<string>('Cargando estado...')
  const [ancho, setAncho] = useState<number>(0)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref) return
    const obs = new ResizeObserver(entries => { for (const e of entries) setAncho(e.contentRect.width) })
    obs.observe(ref)
    return () => obs.disconnect()
  }, [ref])

  const colapsado = colapsadoProp ?? (ancho > 0 && ancho < 140)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
    let prevCriticas = 0
    const cargar = async () => {
      const { data } = await supabase.rpc('alertas_trazabilidad')
      const total = (data as any)?.resumen?.total_alertas || 0
      const criticasEventos = (data as any)?.eventos_adversos_sin_anmat?.length || 0
      const criticasNC = (data as any)?.no_conformidades_abiertas?.length || 0
      const criticas = criticasEventos + criticasNC
      const vencidos = ((data as any)?.cuarentenas_vencidas?.length || 0) + ((data as any)?.flor_sin_lab?.length || 0)

      if (criticas > 0) {
        setSemaforo('rojo'); setSemaforoDetalle(`${criticas} evento(s) críticos`)
      } else if (vencidos > 0) {
        setSemaforo('amarillo'); setSemaforoDetalle(`${vencidos} alerta(s) no críticas`)
      } else if (total === 0) {
        setSemaforo('verde'); setSemaforoDetalle('Todo en orden')
      } else {
        setSemaforo('amarillo'); setSemaforoDetalle(`${total} alerta(s) activas`)
      }

      if (criticas > prevCriticas && Notification.permission === 'granted') {
        new Notification('CannTrace: alerta crítica', { body: `${criticas} eventos/NC pendientes`, icon: '/favicon.svg' })
      }
      prevCriticas = criticas
    }
    cargar()
    const id = setInterval(cargar, 60000)
    return () => clearInterval(id)
  }, [])

  const inicial = usuario?.nombre_completo?.charAt(0)?.toUpperCase() || '?'
  const nombre = usuario?.nombre_completo || 'Cargando...'
  const rol = usuario?.rol || 'operador'
  const rolesColor: Record<string, string> = {
    administrador: 'text-[#c9b7ff]',
    supervisor:    'text-[#8fb6e8]',
    operador:      'text-[#8fe0a8]',
    auditor:       'text-[#E3B94A]',
  }
  const rolesLabel: Record<string, string> = {
    administrador: 'Admin', supervisor: 'Supervisor', operador: 'Operador', auditor: 'Auditor',
  }

  const itemsAcceso: Item[] = [
    { nombre: 'Nueva Operación', ruta: '/operacion', icono: MessageSquareText, permiso: 'crear_operacion' },
    { nombre: 'Consultas', ruta: '/consultas', icono: Database, permiso: null },
  ]
  const itemsInicio: Item[] = [
    { nombre: 'Panel', ruta: '/', icono: LayoutDashboard, permiso: null },
    { nombre: 'Dashboard BI', ruta: '/dashboard', icono: BarChart3, permiso: null },
  ]
  const itemsProduccion: Item[] = [
    { nombre: 'Stock', ruta: '/stock', icono: Package, permiso: 'ver_stock' },
    { nombre: 'Calendario', ruta: '/calendario', icono: Calendar, permiso: null },
    { nombre: 'Calculadora Cultivo', ruta: '/cultivo', icono: Thermometer, permiso: null },
  ]
  const itemsTrazabilidad: Item[] = [
    { nombre: 'Cadenas Sale-to-Seed', ruta: '/trazabilidad', icono: ShieldCheck, permiso: 'ver_trazabilidad' },
    { nombre: 'Árbol Visual', ruta: '/arbol', icono: GitBranch, permiso: null },
    { nombre: 'Mapa', ruta: '/mapa', icono: MapIcon, permiso: null },
    { nombre: 'Búsqueda Inversa', ruta: '/inversa', icono: Search, permiso: null },
    { nombre: 'Etiquetas QR', ruta: '/etiquetas', icono: QrCode, permiso: null },
  ]
  const itemsCalidad: Item[] = [
    { nombre: 'Métricas', ruta: '/metricas', icono: Sparkles, permiso: null },
    { nombre: 'Forecasting', ruta: '/forecasting', icono: TrendingUp, permiso: null },
    { nombre: 'CoA Parser', ruta: '/coa-parser', icono: FlaskConical, permiso: null },
    { nombre: 'Checklist CUMCS', ruta: '/checklist-cumcs', icono: CheckSquare, permiso: 'ver_checklist' },
    { nombre: 'Auto-Auditoría', ruta: '/auto-auditoria', icono: Activity, permiso: 'ver_checklist' },
    { nombre: 'Registros CUMCS', ruta: '/registros', icono: ClipboardList, permiso: 'cargar_registros_cumcs' },
    { nombre: 'Forms G08+G10', ruta: '/forms-cumcs', icono: ClipboardEdit, permiso: 'ver_checklist' },
    { nombre: 'Change Control', ruta: '/change-control', icono: RefreshCcw, permiso: 'ver_checklist' },
    { nombre: 'CAPA', ruta: '/capa', icono: ShieldAlert, permiso: 'ver_checklist' },
  ]
  const itemsDocumentacion: Item[] = [
    { nombre: 'GAMP5', ruta: '/gamp5', icono: Shield, permiso: 'ver_checklist' },
    { nombre: 'REPROCANN', ruta: '/reprocann', icono: FileText, permiso: 'ver_checklist' },
    { nombre: 'Cuaderno de Campo', ruta: '/cuaderno-campo', icono: ClipboardList, permiso: null },
    { nombre: 'SOPs', ruta: '/sops', icono: FileText, permiso: 'ver_checklist' },
    { nombre: 'Procesos BPMN', ruta: '/procesos', icono: Workflow, permiso: 'ver_checklist' },
  ]
  const itemsAdm: Item[] = [
    { nombre: 'Explorador Registros', ruta: '/admin/registros', icono: Table2, permiso: 'ver_configuracion' },
    { nombre: 'Configuración', ruta: '/configuracion', icono: Settings, permiso: 'ver_configuracion' },
    { nombre: 'Importador', ruta: '/importador', icono: Upload, permiso: 'ver_configuracion' },
    { nombre: 'Modelos IA', ruta: '/modelos-ia', icono: Brain, permiso: 'ver_configuracion' },
  ]

  const filtr = (items: Item[]) =>
    !usuario ? items : items.filter(i => i.permiso === null || tienePermiso(i.permiso))

  const renderItem = (item: Item) => {
    const isActive = location.pathname === item.ruta || (item.ruta !== '/' && location.pathname.startsWith(item.ruta))
    return (
      <NavLink
        key={item.ruta}
        to={item.ruta}
        title={colapsado ? item.nombre : undefined}
        className={`relative flex items-center ${
          colapsado ? 'flex-col justify-center py-2.5 px-1' : 'gap-2.5 px-3 py-2'
        } rounded-lg text-[12.5px] transition-all duration-200 ${
          isActive
            ? 'bg-[#3fb074]/12 border border-[#2a5138] text-[#8fe0a8] font-medium shadow-[inset_0_0_0_1px_rgba(63,176,116,0.04)]'
            : 'border border-transparent text-[#a7b1ab] hover:bg-[#111916] hover:text-[#e8ece9]'
        }`}
      >
        <item.icono
          className={`${colapsado ? 'w-4 h-4' : 'w-4 h-4'} flex-shrink-0`}
          strokeWidth={isActive ? 2 : 1.7}
        />
        {colapsado ? (
          <span className="text-[9px] mt-1 leading-tight text-center truncate max-w-full">{item.nombre}</span>
        ) : (
          <span className="flex-1 truncate font-sans">{item.nombre}</span>
        )}
        {item.badge !== undefined && item.badge > 0 && !colapsado && (
          <span className="px-1.5 py-0.5 bg-[#7a2820] text-[#ff8a7a] text-[10px] font-bold rounded-full min-w-[18px] text-center border border-[#7a2820]">
            {item.badge}
          </span>
        )}
        {item.badge !== undefined && item.badge > 0 && colapsado && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff6b5a] rounded-full" />
        )}
      </NavLink>
    )
  }

  const renderGroup = (label: string, items: Item[]) => {
    const v = filtr(items); if (v.length === 0) return null
    const sectors = SIDEBAR_GROUP_SECTORS[label] ?? []
    const count = sectors.reduce((acc, k) => acc + (sectorCounts[k] ?? 0), 0)
    return (
      <div className="space-y-0.5">
        {!colapsado && (
          <div className="flex items-center justify-between px-3 pt-3.5 pb-1.5 gap-2">
            <p className="text-[9.5px] font-semibold text-[#5a6560] uppercase tracking-[0.18em]">
              {label}
            </p>
            {count > 0 && (
              <span
                className="bg-[#0D6B4E] text-white text-[10px] font-bold rounded-full px-1.5 min-w-5 h-5 inline-flex items-center justify-center tabular-nums"
                title={`${count} eventos en últimas 24h`}
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </div>
        )}
        {v.map(renderItem)}
      </div>
    )
  }

  return (
    <aside
      ref={setRef}
      className="h-full w-full bg-[#0a0f0d] text-[#d3d8d4] flex flex-col overflow-hidden font-sans"
    >
      {/* Logo + label superior */}
      <div className="px-3 sm:px-4 pt-4 pb-3.5 border-b border-[#1a2620] flex-shrink-0">
        <div className={`flex items-center w-full ${colapsado ? 'justify-center' : 'gap-2.5'}`}>
          {/* Cuadradito logo verde */}
          <div className="relative w-9 h-9 rounded-lg bg-[#3fb074]/15 border border-[#2a5138] flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-[#6bcf8e]" strokeWidth={2} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#6bcf8e] shadow-[0_0_6px_rgba(107,207,142,0.8)]" />
          </div>
          {!colapsado && (
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-[0.22em] text-[#C49A2C] font-semibold leading-none">
                Trazabilidad GAMP5
              </p>
              <h1 className="font-display font-bold tracking-tight text-[16px] text-[#e8ece9] mt-1 leading-none">
                CannTrace
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="ct-sidebar-nav flex-1 px-2.5 py-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {renderGroup('Acceso rápido', itemsAcceso)}
        {renderGroup('Inicio', itemsInicio)}
        {renderGroup('Producción', itemsProduccion)}
        {renderGroup('Trazabilidad', itemsTrazabilidad)}
        {renderGroup('Calidad', itemsCalidad)}
        {renderGroup('Documentación', itemsDocumentacion)}
        {renderGroup('Administración', itemsAdm)}
      </nav>

      {/* Semáforo alertas */}
      <NavLink
        to="/alertas"
        title={colapsado ? `Estado: ${semaforoDetalle}` : undefined}
        className={`mx-2.5 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg text-[11.5px] font-medium transition-colors border ${
          semaforo === 'rojo'     ? 'bg-[#7a2820]/15 border-[#7a2820]/50 hover:bg-[#7a2820]/25 text-[#ff8a7a]' :
          semaforo === 'amarillo' ? 'bg-[#5a4820]/15 border-[#5a4820]/60 hover:bg-[#5a4820]/25 text-[#E3B94A]' :
          semaforo === 'verde'    ? 'bg-[#3fb074]/10 border-[#2a5138] hover:bg-[#3fb074]/20 text-[#8fe0a8]' :
                                    'bg-[#0e1411] border-[#1a2620] hover:bg-[#111916] text-[#8e9892]'
        } ${colapsado ? 'justify-center' : ''}`}
        aria-label={`Estado operacional: ${semaforoDetalle}`}
      >
        <span className="relative flex items-center justify-center flex-shrink-0" aria-hidden="true">
          {semaforo === 'rojo' && (
            <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-[#ff6b5a] opacity-75 animate-ping" />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${
            semaforo === 'rojo'     ? 'bg-[#ff6b5a]' :
            semaforo === 'amarillo' ? 'bg-[#E3B94A] shadow-[0_0_6px_rgba(227,185,74,0.8)]' :
            semaforo === 'verde'    ? 'bg-[#6bcf8e] shadow-[0_0_6px_rgba(107,207,142,0.8)]' :
                                      'bg-[#5a6560]'
          }`} />
        </span>
        {!colapsado && <span className="truncate flex-1 tabular-nums">{semaforoDetalle}</span>}
      </NavLink>

      {/* Footer usuario */}
      <div className={`px-3 py-3 border-t border-[#1a2620] flex-shrink-0 flex items-center ${colapsado ? 'justify-center' : 'gap-2.5'}`}>
        <div className="w-9 h-9 rounded-full bg-[#3fb074]/15 border border-[#2a5138] flex items-center justify-center flex-shrink-0 text-[13px] font-display font-bold text-[#8fe0a8]">
          {inicial}
        </div>
        {!colapsado && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-[#e8ece9] truncate leading-tight">{nombre}</p>
              <p className={`text-[10.5px] mt-0.5 font-medium ${rolesColor[rol] || 'text-[#a7b1ab]'}`}>
                {rolesLabel[rol] || rol}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-[#5a6560] hover:text-[#ff8a7a] hover:bg-[#111916] rounded-lg transition-colors flex-shrink-0"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
