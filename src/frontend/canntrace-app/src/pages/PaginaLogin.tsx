// PaginaLogin — split-screen alineado con landing dark CannTrace.
// Paleta hex hardcoded #0a0f0d/#0e1411/#1a2620, gradients sutiles verde+dorado.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Leaf, Mail, Lock, Eye, EyeOff, Shield, LogIn, Award, ArrowLeft, ClipboardList, Search, Settings } from 'lucide-react'

const ROLES = [
  { rol: 'Admin',      icono: Settings,       icon: '#c9b7ff', bg: 'rgba(122,90,191,0.10)', border: '#3a2d5a', desc: 'Control total del sistema' },
  { rol: 'Supervisor', icono: Search,         icon: '#8fb6e8', bg: 'rgba(60,118,184,0.10)', border: '#1d3a5a', desc: 'Confirma operaciones y audita' },
  { rol: 'Operador',   icono: ClipboardList,  icon: '#8fe0a8', bg: 'rgba(63,176,116,0.10)', border: '#2a5138', desc: 'Carga operaciones y registros' },
  { rol: 'Auditor',    icono: Shield,         icon: '#E3B94A', bg: 'rgba(196,154,44,0.10)', border: '#5a4820', desc: 'Solo lectura + audit trail' },
]

const EASE = [0.22, 1, 0.36, 1] as const

interface Props { onLogin: (email: string, password: string) => Promise<void> }

export default function PaginaLogin({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setCargando(true); setError('')
    try { await onLogin(email, password) }
    catch (err: any) { setError(err.message || 'Error al iniciar sesión') }
    finally { setCargando(false) }
  }

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-[#d3d8d4] grid grid-cols-1 lg:grid-cols-2 font-sans">
      {/* === Panel branded (desktop) === */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-10 xl:p-14"
        style={{ background: 'linear-gradient(135deg, #0a0f0d 0%, #0e1c14 35%, #142a1f 70%, #1a2114 100%)' }}>
        {/* Decorative blurs sutiles, no saturados */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C49A2C]/8 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-[#3fb074]/10 rounded-full blur-[110px] translate-y-1/3 -translate-x-1/4" aria-hidden="true" />

        {/* Top - Logo + back */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative flex items-center justify-between"
        >
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 bg-[#3fb074]/15 backdrop-blur-sm border border-[#2a5138] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5 text-[#6bcf8e]" strokeWidth={2} />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#6bcf8e] shadow-[0_0_6px_rgba(107,207,142,0.8)]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#C49A2C] font-semibold leading-none">Trazabilidad GAMP5</p>
              <div className="font-display font-bold text-[18px] text-[#e8ece9] tracking-tight mt-1 leading-none">CannTrace</div>
            </div>
          </Link>
          <Link to="/" className="text-[11.5px] text-[#a7b1ab] hover:text-[#8fe0a8] flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Inicio
          </Link>
        </motion.div>

        {/* Middle - tagline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: EASE }}
          className="relative max-w-md"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C49A2C]/10 border border-[#5a4820] text-[#E3B94A] text-[11px] font-medium mb-6">
            <Award className="w-3.5 h-3.5" />
            GAMP5 · ANMAT Res 1780/2025
          </div>
          <h1 className="font-display text-[36px] xl:text-[48px] font-bold tracking-tight leading-[1.05] text-[#e8ece9]">
            Trazabilidad{' '}
            <span className="text-[#8fe0a8]">seed-to-sale</span>
            {' '}para cannabis medicinal
          </h1>
          <p className="mt-5 text-[#a7b1ab] text-[15px] leading-relaxed">
            Audit log <span className="font-mono text-[#E3B94A]">SHA-256</span> encadenado,
            certificados de análisis públicos, cumplimiento regulatorio completo.
          </p>
        </motion.div>

        {/* Bottom - trust signals */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="relative"
        >
          <div className="grid grid-cols-3 gap-4 border-t border-[#1a2620] pt-6">
            <div>
              <div className="text-[26px] font-bold font-display tabular-nums text-[#e8ece9] leading-none">10</div>
              <div className="text-[11px] text-[#8e9892] mt-1.5">etapas trazadas</div>
            </div>
            <div>
              <div className="text-[26px] font-bold font-display tabular-nums text-[#e8ece9] leading-none">84</div>
              <div className="text-[11px] text-[#8e9892] mt-1.5">registros CUMCS</div>
            </div>
            <div>
              <div className="text-[26px] font-bold font-display text-[#E3B94A] leading-none">ALCOA+</div>
              <div className="text-[11px] text-[#8e9892] mt-1.5">compliance</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* === Panel form === */}
      <div className="relative flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-screen overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0a0f0d 0%, #0e1411 100%)' }}>
        {/* Mobile-only: gradient sutil top con paleta CannTrace (no slate azulado) */}
        <div className="lg:hidden absolute top-0 inset-x-0 h-44 sm:h-52 -z-0 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0a0f0d 0%, #0e1c14 50%, #142a1f 100%)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C49A2C]/12 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#3fb074]/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/3" aria-hidden="true" />
        </div>

        {/* Decorative blur desktop derecha */}
        <div className="hidden lg:block absolute top-0 right-0 w-72 h-72 bg-[#3fb074]/4 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3" aria-hidden="true" />

        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-5 pt-3">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-[#3fb074]/15 backdrop-blur-md border border-[#2a5138] rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-lg">
              <Leaf className="w-6 h-6 sm:w-7 sm:h-7 text-[#6bcf8e]" strokeWidth={2} />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#6bcf8e] shadow-[0_0_6px_rgba(107,207,142,0.8)]" />
            </div>
            <p className="text-[9px] uppercase tracking-[0.22em] text-[#C49A2C] font-semibold leading-none mb-1">Trazabilidad GAMP5</p>
            <h1 className="font-display text-[20px] sm:text-2xl font-bold text-[#e8ece9] tracking-tight">CannTrace</h1>
          </div>

          {/* Card form — terminaciones idénticas a cards de /trazabilidad */}
          <div className="rounded-xl bg-[#0e1411] border border-[#1a2620] overflow-hidden">
            {/* Header card con border-bottom (mismo patrón que DetailPanel/EstadoBar) */}
            <div className="px-5 sm:px-6 py-4 border-b border-[#1a2620]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6560] font-medium">Acceso restringido</p>
              <h2 className="font-display font-bold tracking-tight text-[18px] sm:text-[19px] text-[#e8ece9] mt-1 leading-tight">Iniciar sesión</h2>
              <p className="text-[11.5px] text-[#8e9892] mt-1">Ingresa con tu cuenta autorizada</p>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.14em] text-[#5a6560] font-medium mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5a6560] pointer-events-none" strokeWidth={1.8} />
                  <input
                    id="email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-[#0a0f0d] border border-[#1a2620] hover:border-[#243429] focus:border-[#2a5138] rounded-md text-[13px] sm:text-[12.5px] text-[#e8ece9] placeholder:text-[#5a6560] focus:outline-none focus:ring-1 focus:ring-[#3fb074]/40 transition-colors"
                    required autoComplete="email" autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.14em] text-[#5a6560] font-medium">Contraseña</label>
                  <Link to="/olvide-contrasena" className="text-[10.5px] text-[#8fe0a8] hover:text-[#6bcf8e] transition-colors">¿Olvidaste?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5a6560] pointer-events-none" strokeWidth={1.8} />
                  <input
                    id="password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 sm:py-2 bg-[#0a0f0d] border border-[#1a2620] hover:border-[#243429] focus:border-[#2a5138] rounded-md text-[13px] sm:text-[12.5px] text-[#e8ece9] placeholder:text-[#5a6560] focus:outline-none focus:ring-1 focus:ring-[#3fb074]/40 transition-colors"
                    required autoComplete="current-password"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#5a6560] hover:text-[#a7b1ab] p-1.5 rounded transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="px-3 py-2 rounded-md bg-[#7a2820]/15 border border-[#7a2820]/50 text-[11.5px] text-[#ff8a7a]"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit" disabled={cargando || !email || !password}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-md border border-[#3fb074]/40 bg-[#3fb074]/10 hover:bg-[#3fb074]/20 active:bg-[#3fb074]/15 transition-colors text-[12.5px] font-medium text-[#8fe0a8] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn className="w-3.5 h-3.5" strokeWidth={1.8} />
                {cargando ? 'Ingresando…' : 'Ingresar'}
              </button>

              <div className="flex items-center justify-between pt-2 text-[10.5px]">
                <Link to="/" className="text-[#8e9892] hover:text-[#8fe0a8] flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Inicio
                </Link>
                <Link to="/contacto" className="text-[#8e9892] hover:text-[#8fe0a8] transition-colors">¿Solicitar cuenta?</Link>
              </div>
            </form>

            {/* Roles section — bloque separado con header como las páginas */}
            <div className="px-5 sm:px-6 py-4 border-t border-[#1a2620] bg-[#0a0f0d]/30">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#5a6560] font-medium">Roles disponibles</p>
                <span className="text-[10px] tabular-nums text-[#5a6560] font-mono">{ROLES.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <div
                    key={r.rol}
                    className="rounded-md bg-[#111916] border border-[#1a2620] hover:border-[#243429] transition-colors px-2.5 py-2 flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 border"
                      style={{ background: r.bg, borderColor: r.border, color: r.icon }}>
                      <r.icono className="w-3.5 h-3.5" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] font-display font-semibold text-[#e8ece9] leading-tight">{r.rol}</p>
                      <p className="text-[9.5px] text-[#747e78] leading-tight mt-0.5 truncate">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compliance footer (alineado con footer de /trazabilidad) */}
          <div className="mt-4 pt-3 border-t border-[#1a2620] text-[10.5px] text-[#5a6560] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              <span>Audit trail · Sesión 30 min · Firma SHA-256</span>
            </div>
            <div className="font-mono tabular-nums text-[10px] text-[#454e48]">CannTrace v1.0 · GAMP5 Cat.5</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
