// PaginaOperacion — diseño dark Claude Design (mismo lenguaje que Trazabilidad Inversa).
// Tabs: Formulario completo, Chat rápido, Agente IA.

import { useState, Suspense, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquareText, ClipboardList, Loader2, Sparkles } from 'lucide-react'
import { lazyWithRetry } from '../lib/lazyWithRetry'
import PresenciaAvatars from '../components/PresenciaAvatars'

const ChatOperacion = lazyWithRetry(() => import('../components/chat/ChatGuiado'), 'ChatGuiado')
const ChatAgent = lazyWithRetry(() => import('../components/chat/ChatAgent'), 'ChatAgent')
const FormularioOperacion = lazyWithRetry(() => import('../components/operaciones/FormularioOperacion'), 'FormularioOperacion')

// Prefetch SOLO los tabs no-activos, despues de que el activo monto.
// Evita race condition donde 3 chunks descargan en paralelo y el principal lagea.
function prefetchOthers(activo: 'formulario' | 'chat' | 'agent') {
  const others = {
    formulario: () => import('../components/operaciones/FormularioOperacion'),
    chat:       () => import('../components/chat/ChatGuiado'),
    agent:      () => import('../components/chat/ChatAgent'),
  }
  const todo = (Object.keys(others) as Array<keyof typeof others>).filter(k => k !== activo)
  const run = () => todo.forEach(k => others[k]().catch(() => { /* prefetch best-effort */ }))
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 2500 })
  } else {
    setTimeout(run, 1200)
  }
}

function TabLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 rounded-lg border border-[#2a5138] bg-[#3fb074]/10 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-[#6bcf8e] animate-spin" strokeWidth={2} />
      </div>
      <p className="text-[11.5px] text-[#5a6560] font-mono tabular-nums">{label}</p>
    </div>
  )
}

type Pestana = 'formulario' | 'chat' | 'agent'

const PESTANAS: { id: Pestana; nombre: string; nombreCorto: string; icono: any; desc: string; badge?: string }[] = [
  { id: 'formulario', nombre: 'Formulario completo', nombreCorto: 'Formulario', icono: ClipboardList, desc: 'Todos los campos GAMP5' },
  { id: 'chat', nombre: 'Chat rápido', nombreCorto: 'Chat', icono: MessageSquareText, desc: 'Registro conversacional' },
  { id: 'agent', nombre: 'Agente IA', nombreCorto: 'IA', icono: Sparkles, desc: 'IA lee BD, pregunta, valida y guarda', badge: 'beta' },
]

export default function PaginaOperacion() {
  const [pestana, setPestana] = useState<Pestana>('formulario')

  // Prefetch los OTROS chunks despues de que el activo monto.
  // Cuando el user cambia de tab, ese tab ya esta listo en cache → cero lag.
  useEffect(() => { prefetchOthers(pestana) }, [pestana])

  return (
    <>
      <style>{`
        .ct-page-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; transition: scrollbar-color 0.2s ease; }
        .ct-page-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
        .ct-page-scroll::-webkit-scrollbar-track { background: transparent; }
        .ct-page-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 6px; border: 2px solid transparent; transition: background 0.2s ease; }
        .ct-page-scroll:hover { scrollbar-color: #243429 transparent; }
        .ct-page-scroll:hover::-webkit-scrollbar-thumb { background: #1a2620; border-color: #0a0f0d; }
        .ct-page-scroll:hover::-webkit-scrollbar-thumb:hover { background: #243429; }

        /* === LAYER TRAZABILIDAD: remappea palette en TODOS los sub-componentes === */
        /* Backgrounds */
        .ct-op-wrap .bg-white { background-color: #0e1411 !important; }
        .ct-op-wrap .bg-surface-900 { background-color: #0e1411 !important; }
        .ct-op-wrap .bg-surface-950 { background-color: #0a0f0d !important; }
        .ct-op-wrap .bg-surface-50 { background-color: #0a0f0d !important; }
        .ct-op-wrap .bg-surface-100 { background-color: #111916 !important; }
        .ct-op-wrap .bg-surface-800 { background-color: #111916 !important; }
        .ct-op-wrap .bg-surface-200 { background-color: #1a2620 !important; }
        .ct-op-wrap .bg-surface-700 { background-color: #1a2620 !important; }
        /* Hover backgrounds */
        .ct-op-wrap .hover\\:bg-surface-50:hover { background-color: #111916 !important; }
        .ct-op-wrap .hover\\:bg-surface-100:hover { background-color: #162420 !important; }
        .ct-op-wrap .hover\\:bg-surface-800:hover { background-color: #162420 !important; }
        /* Borders */
        .ct-op-wrap .border-surface-200,
        .ct-op-wrap .border-surface-700,
        .ct-op-wrap .border-surface-800 { border-color: #1a2620 !important; }
        .ct-op-wrap .hover\\:border-surface-300:hover,
        .ct-op-wrap .hover\\:border-surface-700:hover { border-color: #243429 !important; }
        /* Text — surface scale */
        .ct-op-wrap .text-white { color: #e8ece9 !important; }
        .ct-op-wrap .text-surface-900 { color: #e8ece9 !important; }
        .ct-op-wrap .text-surface-700 { color: #d3d8d4 !important; }
        .ct-op-wrap .text-surface-600 { color: #b2bab4 !important; }
        .ct-op-wrap .text-surface-500,
        .ct-op-wrap .text-surface-400 { color: #8e9892 !important; }
        .ct-op-wrap .text-surface-300 { color: #5a6560 !important; }
        /* Primary */
        .ct-op-wrap .bg-primary-50,
        .ct-op-wrap .bg-primary-100 { background-color: rgba(63,176,116,0.10) !important; }
        .ct-op-wrap .bg-primary-500 { background-color: #3fb074 !important; }
        .ct-op-wrap .bg-primary-600,
        .ct-op-wrap .bg-primary-700,
        .ct-op-wrap .bg-primary-800 { background-color: #3fb074 !important; color: #06130c !important; }
        .ct-op-wrap .hover\\:bg-primary-700:hover,
        .ct-op-wrap .hover\\:bg-primary-800:hover { background-color: #6bcf8e !important; }
        .ct-op-wrap .text-primary-200,
        .ct-op-wrap .text-primary-300 { color: #8fe0a8 !important; }
        .ct-op-wrap .text-primary-400,
        .ct-op-wrap .text-primary-500 { color: #6bcf8e !important; }
        .ct-op-wrap .text-primary-600,
        .ct-op-wrap .text-primary-700,
        .ct-op-wrap .text-primary-800 { color: #6bcf8e !important; }
        .ct-op-wrap .border-primary-300,
        .ct-op-wrap .border-primary-400,
        .ct-op-wrap .border-primary-500,
        .ct-op-wrap .border-primary-700 { border-color: #3fb074 !important; }
        /* Inputs / focus rings */
        .ct-op-wrap input,
        .ct-op-wrap textarea,
        .ct-op-wrap select {
          background-color: #0a0f0d !important;
          border-color: #1a2620 !important;
          color: #d3d8d4 !important;
        }
        .ct-op-wrap input:focus,
        .ct-op-wrap textarea:focus,
        .ct-op-wrap select:focus {
          border-color: rgba(63,176,116,0.5) !important;
          box-shadow: 0 0 0 2px rgba(63,176,116,0.15) !important;
        }
        .ct-op-wrap input::placeholder,
        .ct-op-wrap textarea::placeholder { color: #454e48 !important; }
        /* Cards & shadows neutralizadas */
        .ct-op-wrap .shadow-sm,
        .ct-op-wrap .shadow-md,
        .ct-op-wrap .shadow-lg { box-shadow: 0 4px 14px rgba(0,0,0,0.35) !important; }
        /* Botones gradient → flat verde */
        .ct-op-wrap .bg-gradient-to-br,
        .ct-op-wrap .bg-gradient-to-r {
          background-image: none !important;
          background-color: rgba(63,176,116,0.08) !important;
        }
        /* Iconos en círculos primary-100 */
        .ct-op-wrap .bg-primary-100 .text-primary-700,
        .ct-op-wrap .bg-primary-100 .text-primary-300 { color: #6bcf8e !important; }
        /* Disabled */
        .ct-op-wrap [disabled] { opacity: 0.4 !important; }
        /* Forzar altura interna sub-componentes (chat/agent) consistente con wrapper */
        .ct-op-wrap [class*="h-\\[calc\\(100vh-"] { height: auto !important; min-height: 640px !important; }
        /* Cards subgrupos del Form completo: dark consistente — todas Trazabilidad palette */
        .ct-op-wrap .from-emerald-500\\/10,
        .ct-op-wrap .to-emerald-600\\/5,
        .ct-op-wrap .from-orange-500\\/10,
        .ct-op-wrap .to-orange-600\\/5,
        .ct-op-wrap .from-amber-500\\/10,
        .ct-op-wrap .to-amber-600\\/5 { background: transparent !important; }
        /* Bordes/textos de áreas con tints exóticos → unificar al verde Trazabilidad */
        .ct-op-wrap .border-emerald-500\\/20,
        .ct-op-wrap .border-orange-500\\/20,
        .ct-op-wrap .border-amber-500\\/20,
        .ct-op-wrap .border-emerald-400\\/30,
        .ct-op-wrap .border-orange-400\\/30,
        .ct-op-wrap .border-amber-400\\/30 { border-color: #1a2620 !important; }
        .ct-op-wrap .text-emerald-600,
        .ct-op-wrap .text-emerald-500,
        .ct-op-wrap .text-orange-600,
        .ct-op-wrap .text-orange-500,
        .ct-op-wrap .text-amber-600,
        .ct-op-wrap .text-amber-500 { color: #6bcf8e !important; }
        .ct-op-wrap .text-emerald-400,
        .ct-op-wrap .text-orange-400,
        .ct-op-wrap .text-amber-400 { color: #8fe0a8 !important; }
        .ct-op-wrap .bg-emerald-50,
        .ct-op-wrap .bg-orange-50,
        .ct-op-wrap .bg-amber-50,
        .ct-op-wrap .dark\\:bg-emerald-950\\/30,
        .ct-op-wrap .dark\\:bg-orange-950\\/30,
        .ct-op-wrap .dark\\:bg-amber-950\\/30 { background-color: #111916 !important; }
        /* Hover states para áreas */
        .ct-op-wrap .hover\\:border-emerald-400\\/50:hover,
        .ct-op-wrap .hover\\:border-orange-400\\/50:hover,
        .ct-op-wrap .hover\\:border-amber-400\\/50:hover { border-color: #3fb074 !important; }
        /* Forzar fondos uniformes para áreas con primary-50/100 (dropdowns, headers) */
        .ct-op-wrap .bg-primary-50\\/80,
        .ct-op-wrap .bg-primary-100\\/40 { background-color: rgba(63,176,116,0.08) !important; }
      `}</style>
      <div className="ct-op-wrap flex-1 overflow-y-auto ct-page-scroll bg-[#0a0f0d] text-[#d3d8d4] font-sans">
        {/* TopBar sticky (Trazabilidad-style) */}
        <div className="sticky top-0 z-40 bg-[#0a0f0d]/95 backdrop-blur-[2px] border-b border-[#1a2620]">
          <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3">
            <div className="min-w-0">
              <h1 className="font-display font-bold tracking-tight text-[15px] sm:text-[17px] text-[#e8ece9]">Nueva Operación</h1>
              <div className="mt-0.5 text-[10.5px] sm:text-[11px] text-[#5a6560]">
                <span className="hidden sm:inline">Registra una operación con el formulario estructurado, chat guiado o agente IA</span>
              </div>
            </div>
            <div className="flex-1" />
            <div className="hidden md:block"><PresenciaAvatars pageKey="operacion" /></div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#3fb074]/30 bg-[#3fb074]/10 text-[#8fe0a8] text-[10.5px] uppercase tracking-widest font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6bcf8e] shadow-[0_0_6px_rgba(107,207,142,0.8)]" />Online
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full border border-[#3fb074]/30 bg-[#3fb074]/10 text-[#8fe0a8] text-[10px] sm:text-[10.5px] uppercase tracking-widest font-medium">GAMP5</span>
          </div>
        </div>

        <div className="px-3 sm:px-6 py-3 sm:py-5 space-y-3 sm:space-y-4 pb-20">
          {/* Tabs segmentadas Claude-style — full width en mobile */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex gap-1 p-1 rounded-lg bg-[#0e1411] border border-[#1a2620] w-full sm:w-auto">
              {PESTANAS.map(p => {
                const Icon = p.icono
                const isActive = pestana === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setPestana(p.id)}
                    className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-[12px] font-medium transition-colors flex-1 sm:flex-none ${
                      isActive ? 'text-[#06130c]' : 'text-[#8e9892] hover:text-[#e8ece9]'
                    }`}
                    title={p.desc}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="pestana-active"
                        className="absolute inset-0 bg-[#3fb074] rounded-md"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 relative shrink-0" />
                    <span className="relative truncate"><span className="sm:hidden">{p.nombreCorto}</span><span className="hidden sm:inline">{p.nombre}</span></span>
                    {p.badge && (
                      <span className={`relative text-[8.5px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded uppercase tracking-wide ${
                        isActive
                          ? 'bg-[#06130c]/20 text-[#06130c]'
                          : 'bg-[#C49A2C]/20 text-[#E3B94A] border border-[#C49A2C]/30'
                      }`}>
                        {p.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="hidden sm:block text-[11px] text-[#5a6560] ml-auto">
              {PESTANAS.find(p => p.id === pestana)?.desc}
            </div>
          </div>

          {/* Contenido — 1 Suspense por tab para que cambiar no descargue todo el árbol */}
          <motion.div
            key={pestana}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12 }}
            className={pestana === 'agent' || pestana === 'chat' ? 'min-h-[640px]' : ''}
          >
            <div className="rounded-xl bg-[#0e1411] border border-[#1a2620] overflow-hidden">
              {pestana === 'formulario' && (
                <Suspense fallback={<TabLoader label="Cargando formulario…" />}>
                  <FormularioOperacion />
                </Suspense>
              )}
              {pestana === 'chat' && (
                <Suspense fallback={<TabLoader label="Cargando chat guiado…" />}>
                  <ChatOperacion />
                </Suspense>
              )}
              {pestana === 'agent' && (
                <Suspense fallback={<TabLoader label="Cargando agente IA…" />}>
                  <ChatAgent />
                </Suspense>
              )}
            </div>
          </motion.div>

          <footer className="pt-4 sm:pt-6 mt-2 border-t border-[#1a2620] text-[10.5px] sm:text-[11px] text-[#5a6560] flex items-center justify-between flex-wrap gap-2">
            <div className="truncate">
              <span className="hidden sm:inline">Operaciones · audit trail SHA-256 · firma electrónica · </span>
              <span className="font-mono">CannTrace · FIS S.A.S.</span>
            </div>
            <div className="font-mono tabular-nums shrink-0">{new Date().toLocaleDateString('es-AR')}</div>
          </footer>
        </div>
      </div>
    </>
  )
}
