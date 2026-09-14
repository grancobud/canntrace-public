import { useState } from 'react'
import { Settings, Users, Building2, FlaskConical, Tag, Shield, Database } from 'lucide-react'
import TwoFactorSetup from '../components/TwoFactorSetup'

const tabs = [
  { id: 'general', nombre: 'General', icono: Settings },
  { id: 'usuarios', nombre: 'Usuarios', icono: Users },
  { id: 'instalaciones', nombre: 'Instalaciones', icono: Building2 },
  { id: 'productos', nombre: 'Productos', icono: FlaskConical },
  { id: 'etiquetas', nombre: 'Etiquetas QR', icono: Tag },
  { id: 'seguridad', nombre: 'Seguridad', icono: Shield },
]

const configDemo = [
  { clave: 'jurisdiccion', valor: 'argentina', tipo: 'texto', categoria: 'compliance', descripcion: 'Jurisdiccion regulatoria' },
  { clave: 'marco_regulatorio', valor: 'ANMAT_4159_2023', tipo: 'texto', categoria: 'compliance', descripcion: 'Marco regulatorio' },
  { clave: 'retencion_datos_anos', valor: '5', tipo: 'numero', categoria: 'compliance', descripcion: 'Anos retencion datos' },
  { clave: 'firma_electronica_activa', valor: 'true', tipo: 'booleano', categoria: 'seguridad', descripcion: 'Firma en ops criticas' },
  { clave: 'ia_activa', valor: 'true', tipo: 'booleano', categoria: 'funcional', descripcion: 'IA para chat' },
  { clave: 'ia_modelo', valor: 'llama-3.1-8b', tipo: 'texto', categoria: 'funcional', descripcion: 'Modelo IA' },
  { clave: 'ia_confianza_minima', valor: '0.7', tipo: 'numero', categoria: 'funcional', descripcion: 'Confianza minima IA' },
  { clave: 'zona_horaria', valor: 'America/Argentina/Buenos_Aires', tipo: 'texto', categoria: 'general', descripcion: 'Zona horaria' },
  { clave: 'modo_offline', valor: 'true', tipo: 'booleano', categoria: 'funcional', descripcion: 'Modo offline' },
]

const usuariosDemo = [
  { nombre: 'Admin CannTrace', email: 'admin@canntrace.com', rol: 'administrador', activo: true },
  { nombre: 'Juan Perez', email: 'juan@canntrace.com', rol: 'operador', activo: true },
  { nombre: 'Maria Garcia', email: 'maria@canntrace.com', rol: 'supervisor', activo: true },
  { nombre: 'Carlos Auditor', email: 'carlos@canntrace.com', rol: 'auditor', activo: true },
]

const rolesColor: Record<string, { color: string; bg: string; border: string }> = {
  administrador: { color: '#c084fc', bg: 'rgba(192,132,252,0.10)', border: 'rgba(192,132,252,0.30)' },
  supervisor:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.30)' },
  operador:      { color: '#6bcf8e', bg: 'rgba(63,176,116,0.10)',  border: '#2a5138' },
  auditor:       { color: '#E3B94A', bg: 'rgba(196,154,44,0.10)',  border: '#5a4820' },
}

export default function PaginaConfiguracion() {
  const [tabActivo, setTabActivo] = useState('general')

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0f0d] text-[#d3d8d4] font-sans ct-page-scroll">
      {/* TopBar */}
      <div className="sticky top-0 z-40 bg-[#0a0f0d]/95 backdrop-blur-[2px] border-b border-[#1a2620]">
        <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3">
          <Settings className="w-4 h-4 text-[#3fb074] flex-shrink-0" strokeWidth={1.8} />
          <div className="min-w-0">
            <h1 className="font-display font-bold tracking-tight text-[15px] sm:text-[17px] text-[#e8ece9]">Configuracion</h1>
            <div className="mt-0.5 text-[10.5px] sm:text-[11px] text-[#5a6560]">
              Administracion del sistema CannTrace
            </div>
          </div>
          <div className="flex-1" />
        </div>
      </div>

      <div className="px-3 sm:px-6 py-4 sm:py-5 pb-20 space-y-4 sm:space-y-5">
        {/* Tabs dark */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActivo(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11.5px] font-medium whitespace-nowrap transition-colors border ${
                tabActivo === tab.id
                  ? 'bg-[#3fb074]/15 border-[#2a5138] text-[#8fe0a8]'
                  : 'bg-[#0e1411] border-[#1a2620] text-[#8e9892] hover:border-[#243429] hover:text-[#d3d8d4]'
              }`}
            >
              <tab.icono className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span className="hidden sm:inline">{tab.nombre}</span>
            </button>
          ))}
        </div>

        {/* Tab: General */}
        {tabActivo === 'general' && (
          <div className="rounded-xl bg-[#0e1411] border border-[#1a2620] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1a2620] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-[#5a6560]" strokeWidth={1.8} />
                <h3 className="font-display font-semibold text-[13px] text-[#e8ece9]">Configuracion del Sistema</h3>
              </div>
              <span className="text-[10.5px] text-[#5a6560] tabular-nums">{configDemo.length} parametros</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#1a2620]">
                    {['Clave','Valor','Tipo','Categoria'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.12em] text-[#5a6560] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {configDemo.map((cfg) => (
                    <tr key={cfg.clave} className="border-b border-[#1a2620] last:border-0 hover:bg-[#111916] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-[#a7b1ab]">{cfg.clave}</td>
                      <td className="px-4 py-2.5">
                        {cfg.tipo === 'booleano' ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium border ${
                            cfg.valor === 'true'
                              ? 'bg-[#3fb074]/10 border-[#2a5138] text-[#6bcf8e]'
                              : 'bg-[#7a2820]/15 border-[#7a2820]/40 text-[#ff8a7a]'
                          }`}>
                            {cfg.valor === 'true' ? 'Activo' : 'Inactivo'}
                          </span>
                        ) : (
                          <span className="text-[#d3d8d4]">{cfg.valor}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-[#747e78]">{cfg.tipo}</td>
                      <td className="px-4 py-2.5 text-[#747e78]">{cfg.categoria}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Usuarios */}
        {tabActivo === 'usuarios' && (
          <div className="rounded-xl bg-[#0e1411] border border-[#1a2620] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1a2620] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#5a6560]" strokeWidth={1.8} />
                <h3 className="font-display font-semibold text-[13px] text-[#e8ece9]">Usuarios del Sistema</h3>
              </div>
              <button className="px-3 py-1.5 bg-[#3fb074]/15 hover:bg-[#3fb074]/25 border border-[#2a5138] text-[#8fe0a8] rounded-lg text-[11px] font-medium transition-colors">
                + Nuevo Usuario
              </button>
            </div>
            <ul className="divide-y divide-[#1a2620]">
              {usuariosDemo.map((u) => {
                const r = rolesColor[u.rol] || rolesColor.operador
                return (
                  <li key={u.email} className="flex items-center gap-3 px-4 py-3 hover:bg-[#111916] transition-colors">
                    <div className="w-9 h-9 rounded-full bg-[#162420] border border-[#2a5138] flex items-center justify-center text-[13px] font-bold text-[#6bcf8e] flex-shrink-0">
                      {u.nombre.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#e8ece9] truncate">{u.nombre}</p>
                      <p className="text-[10.5px] text-[#747e78] truncate">{u.email}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium border flex-shrink-0"
                      style={{ color: r.color, background: r.bg, borderColor: r.border }}>
                      {u.rol}
                    </span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${u.activo ? 'bg-[#6bcf8e]' : 'bg-[#ff8a7a]'}`} />
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Tab: Seguridad — 2FA TOTP (mantener intacto) */}
        {tabActivo === 'seguridad' && (
          <TwoFactorSetup />
        )}

        {/* Placeholder restantes */}
        {!['general', 'usuarios', 'seguridad'].includes(tabActivo) && (
          <div className="rounded-xl bg-[#0e1411] border border-[#1a2620] p-10 text-center">
            <div className="mx-auto w-9 h-9 rounded-full bg-[#162420] border border-[#1e2d27] flex items-center justify-center mb-2">
              <Settings className="w-4 h-4 text-[#5a6560]" strokeWidth={1.8} />
            </div>
            <p className="font-display font-semibold text-[#d3d8d4] text-[13px]">
              {tabs.find(t => t.id === tabActivo)?.nombre}
            </p>
            <p className="text-[11px] text-[#5a6560] mt-1">Modulo en desarrollo</p>
          </div>
        )}

        {/* GAMP5 footer */}
        <div className="rounded-xl bg-[#0e1411] border border-[#1a2620] px-4 py-2.5 text-[10px] text-[#5a6560] text-center">
          Todos los cambios de configuracion se registran en historial_cambios con audit trail (SOP-003)
        </div>
      </div>
    </div>
  )
}
