// PaginaCalendario — agregador cross-sector. Cada evento es un dot con color
// por sector. Click → dialog con detalle. Realtime: nuevos INSERTs aparecen
// sin reload.

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import type { EventInput, DatesSetArg } from '@fullcalendar/core'
import { Loader2, X, RefreshCw, CalendarDays } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchCalendarEvents } from '../lib/activityFeed'
import {
  SECTORES, SECTOR_KEYS, TABLE_TO_SECTOR,
  type ActivityEvent, type SectorKey,
} from '../lib/awareness'

const EASE = [0.22, 1, 0.36, 1] as const
const STORAGE_KEY = 'canntrace.calendar.disabledSectors'

function loadDisabled(): Set<SectorKey> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(arr.filter((k): k is SectorKey => SECTOR_KEYS.includes(k as SectorKey)))
  } catch {
    return new Set()
  }
}

function saveDisabled(s: Set<SectorKey>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s))) } catch { /* noop */ }
}

function eventoToInput(ev: ActivityEvent): EventInput {
  const def = SECTORES[ev.sector]
  return {
    id: `${ev.table}:${ev.id}`,
    title: def.label,
    start: ev.fecha,
    allDay: !ev.fecha.includes('T'),
    backgroundColor: def.color,
    borderColor: def.color,
    extendedProps: { event: ev },
  }
}

export default function PaginaCalendario() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [disabled, setDisabled] = useState<Set<SectorKey>>(() => loadDisabled())
  const [selected, setSelected] = useState<ActivityEvent | null>(null)
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null)
  const seenIds = useRef<Set<string>>(new Set())

  // Cargar segun rango visible
  useEffect(() => {
    if (!range) return
    let cancel = false
    ;(async () => {
      setLoading(true)
      const data = await fetchCalendarEvents(range.start, range.end)
      if (cancel) return
      seenIds.current = new Set(data.map(e => `${e.table}:${e.id}`))
      setEvents(data)
      setLoading(false)
    })()
    return () => { cancel = true }
  }, [range])

  // Realtime — INSERT en cualquier tabla del sector, dentro del rango visible
  useEffect(() => {
    if (!range) return
    const tables = SECTOR_KEYS.map(k => SECTORES[k].table)
    let channel = supabase.channel('calendar-events')
    for (const t of tables) {
      channel = channel.on(
        'postgres_changes' as never,
        { event: 'INSERT', schema: 'public', table: t },
        (payload: { new: Record<string, unknown>; table: string }) => {
          const sector = TABLE_TO_SECTOR[payload.table]
          if (!sector) return
          const def = SECTORES[sector]
          const row = payload.new
          const id = String(row.id ?? '')
          const key = `${payload.table}:${id}`
          if (seenIds.current.has(key)) return
          const fechaStr = String(row[def.fechaCol] ?? '')
          if (!fechaStr) return
          const fechaDate = new Date(fechaStr)
          if (fechaDate < range.start || fechaDate > range.end) return
          seenIds.current.add(key)
          const ev: ActivityEvent = {
            id, sector, table: payload.table,
            fecha: fechaStr,
            creadoEn: String(row[def.createdCol] ?? new Date().toISOString()),
            ref: def.refField ? String(row[def.refField] ?? '') : '',
            raw: row,
          }
          setEvents(prev => [...prev, ev])
        },
      )
    }
    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [range])

  const calendarEvents = useMemo(
    () => events.filter(e => !disabled.has(e.sector)).map(eventoToInput),
    [events, disabled],
  )

  function toggleSector(s: SectorKey) {
    setDisabled(prev => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      saveDisabled(next)
      return next
    })
  }

  function handleDatesSet(arg: DatesSetArg) {
    setRange({ start: arg.start, end: arg.end })
  }

  async function refrescar() {
    if (!range) return
    setLoading(true)
    const data = await fetchCalendarEvents(range.start, range.end)
    seenIds.current = new Set(data.map(e => `${e.table}:${e.id}`))
    setEvents(data)
    setLoading(false)
  }

  return (
    <>
      <style>{`
        .ct-cal .fc { background: transparent; color: #d3d8d4; }
        .ct-cal .fc .fc-toolbar-title { color: #e8ece9; font-family: 'Space Grotesk', Inter, sans-serif; font-weight: 700; font-size: 16px; letter-spacing: -0.01em; }
        .ct-cal .fc .fc-button {
          background: #111916; border: 1px solid #1e2d27; color: #d3d8d4; font-size: 12px;
          padding: 6px 11px; box-shadow: none; transition: all 150ms ease; text-transform: capitalize;
        }
        .ct-cal .fc .fc-button:hover { background: #162420; border-color: #2a3d36; }
        .ct-cal .fc .fc-button-primary:not(:disabled).fc-button-active,
        .ct-cal .fc .fc-button-primary:not(:disabled):active {
          background: #3fb074; border-color: #3fb074; color: #06130c;
        }
        .ct-cal .fc-theme-standard .fc-scrollgrid,
        .ct-cal .fc-theme-standard td,
        .ct-cal .fc-theme-standard th { border-color: #1a2620; }
        .ct-cal .fc-col-header-cell { background: #0e1411; padding: 6px 0; }
        .ct-cal .fc-col-header-cell-cushion { color: #8e9892; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 500; }
        .ct-cal .fc-daygrid-day { background: #0a0f0d; }
        .ct-cal .fc-daygrid-day:hover { background: #0e1411; }
        .ct-cal .fc-daygrid-day-number { color: #8e9892; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; padding: 6px 8px; }
        .ct-cal .fc-day-today { background: rgba(63,176,116,0.06) !important; box-shadow: inset 0 0 0 1px #0D6B4E; }
        .ct-cal .fc-day-today .fc-daygrid-day-number { color: #6bcf8e; font-weight: 700; }
        .ct-cal .fc-day-other .fc-daygrid-day-number { color: #343c37; }
        .ct-cal .fc-event {
          border-radius: 4px; padding: 1px 4px; font-size: 10.5px; font-weight: 500;
          cursor: pointer; transition: transform 100ms ease;
        }
        .ct-cal .fc-event:hover { transform: translateY(-1px); }
        .ct-cal .fc-more-link { color: #8fe0a8; font-weight: 600; font-size: 10.5px; }
      `}</style>

      <div className="flex-1 overflow-y-auto bg-[#0a0f0d] text-[#d3d8d4] font-sans">
        {/* TopBar */}
        <div className="sticky top-0 z-40 bg-[#0a0f0d]/95 backdrop-blur-[2px] border-b border-[#1a2620]">
          <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3">
            <div className="min-w-0">
              <h1 className="font-display font-bold tracking-tight text-[15px] sm:text-[17px] text-[#e8ece9]">
                Calendario cross-sector
              </h1>
              <div className="mt-0.5 text-[10.5px] sm:text-[11px] text-[#5a6560]">
                <span className="tabular-nums">{events.length}</span> eventos
                <span className="text-[#343c37] mx-1">│</span>
                <span className="hidden sm:inline">{SECTOR_KEYS.length - disabled.size} sectores activos</span>
              </div>
            </div>
            <div className="flex-1" />
            <button
              onClick={() => void refrescar()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1e2d27] bg-[#111916] hover:bg-[#162420] transition-colors text-[11.5px] font-medium text-[#d3d8d4] disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refrescar
            </button>
          </div>
        </div>

        <div className="px-3 sm:px-6 py-4 sm:py-5 space-y-4 pb-20">
          {/* Filtro chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {SECTOR_KEYS.map(k => {
              const def = SECTORES[k]
              const off = disabled.has(k)
              const Icon = def.icon
              return (
                <button
                  key={k}
                  onClick={() => toggleSector(k)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${
                    off
                      ? 'bg-transparent border-[#1a2620] text-[#5a6560]'
                      : 'bg-[#0e1411] border-[#2a3d36] text-[#d3d8d4]'
                  }`}
                  style={off ? undefined : { boxShadow: `inset 0 0 0 1px ${def.color}30` }}
                >
                  <Icon
                    className="w-3 h-3"
                    strokeWidth={1.8}
                    style={{ color: off ? '#343c37' : def.color }}
                  />
                  {def.label}
                </button>
              )
            })}
          </div>

          {/* Calendario */}
          <div className="ct-cal rounded-xl bg-[#0e1411] border border-[#1a2620] p-4 relative min-h-[480px]">
            {loading && (
              <div className="absolute inset-0 z-10 bg-[#0e1411]/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                <Loader2 className="w-7 h-7 animate-spin text-[#6bcf8e]" />
              </div>
            )}
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={esLocale}
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth' }}
              events={calendarEvents}
              eventClick={(info) => {
                const ev = info.event.extendedProps.event as ActivityEvent | undefined
                if (ev) setSelected(ev)
              }}
              datesSet={handleDatesSet}
              height="auto"
              eventDisplay="block"
              dayMaxEvents={4}
            />
            {!loading && calendarEvents.length === 0 && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                <div className="px-3 py-1.5 rounded-md bg-[#111916] border border-[#1a2620] text-[11px] text-[#8e9892] flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-[#5a6560]" />
                  Sin actividad registrada este mes
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dialog detalle */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelected(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ duration: 0.28, ease: EASE }}
                className="bg-[#0e1411] border border-[#1a2620] rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {(() => {
                  const def = SECTORES[selected.sector]
                  const Icon = def.icon
                  return (
                    <>
                      <div className="px-5 py-4 border-b border-[#1a2620] bg-[#111916] flex items-center gap-3 rounded-t-2xl">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center border"
                          style={{
                            background: `${def.color}1a`,
                            borderColor: `${def.color}40`,
                            color: def.color,
                          }}
                        >
                          <Icon className="w-4 h-4" strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-bold text-[15px] text-[#e8ece9]">{def.label}</h3>
                          <p className="text-[11px] text-[#5a6560] mt-0.5 font-mono truncate">{selected.table}</p>
                        </div>
                        <button
                          onClick={() => setSelected(null)}
                          className="p-1.5 rounded-md hover:bg-[#162420] text-[#8e9892]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-5 space-y-2">
                        {selected.raw && Object.entries(selected.raw)
                          .filter(([, v]) => v !== null && v !== undefined && v !== '')
                          .map(([k, v]) => (
                            <div key={k} className="flex items-start gap-3 text-[12px]">
                              <span className="text-[10px] uppercase tracking-[0.12em] text-[#5a6560] font-medium min-w-[110px] mt-0.5">
                                {k}
                              </span>
                              <span className="text-[#e8ece9] break-all flex-1">{String(v)}</span>
                            </div>
                          ))}
                      </div>
                    </>
                  )
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
