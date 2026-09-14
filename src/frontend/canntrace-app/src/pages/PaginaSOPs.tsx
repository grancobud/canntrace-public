import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Upload, Loader2, Plus, ExternalLink, X, GitBranch } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { EmptyState } from '../components/ui/empty-state'

type SOP = {
  id: string; codigo: string; titulo: string; version: string; estado: string
  contenido_md: string | null; archivo_url: string | null
  fecha_vigencia: string | null; fecha_revision: string | null
  creado_en: string
}

const ESTADO_STYLES: Record<string, string> = {
  borrador: 'bg-[#111916] text-[#8e9892] border border-[#1a2620]',
  en_revision: 'bg-[#C49A2C]/15 text-[#E3B94A] border border-[#5a4820]',
  vigente: 'bg-[#3fb074]/15 text-[#8fe0a8] border border-[#2a5138]',
  obsoleto: 'bg-[#7a2820]/20 text-[#ff8a7a] border border-[#7a2820]',
}

export default function PaginaSOPs() {
  const [sops, setSops] = useState<SOP[]>([])
  const [cargando, setCargando] = useState(true)
  const [nuevoOpen, setNuevoOpen] = useState(false)
  const [nuevo, setNuevo] = useState({ codigo: '', titulo: '', version: '1.0', estado: 'borrador', contenido_md: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const { data } = await supabase.from('sops').select('*').order('codigo').order('version', { ascending: false })
    setSops((data as SOP[]) || [])
    setCargando(false)
  }

  async function crear() {
    if (!nuevo.codigo || !nuevo.titulo) {
      toast.error('Codigo y titulo son requeridos')
      return
    }
    setGuardando(true)
    const { error } = await supabase.from('sops').insert({
      ...nuevo,
      fecha_vigencia: nuevo.estado === 'vigente' ? new Date().toISOString().slice(0, 10) : null,
    })
    setGuardando(false)
    if (error) {
      toast.error('Error: ' + error.message)
      return
    }
    toast.success(`SOP ${nuevo.codigo} v${nuevo.version} creado`)
    setNuevoOpen(false)
    setNuevo({ codigo: '', titulo: '', version: '1.0', estado: 'borrador', contenido_md: '' })
    cargar()
  }

  function nuevaVersionDe(codigo: string, versiones: SOP[]) {
    // Ordena versiones numericamente (1.0, 1.1, 2.0, 2.3) y toma la mayor
    const parse = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0)
    const maxVer = [...versiones].sort((a, b) => {
      const [aM, am] = parse(a.version)
      const [bM, bm] = parse(b.version)
      return bM - aM || bm - am
    })[0]
    const [mayor, menor] = parse(maxVer.version)
    const nuevaVersion = `${mayor}.${menor + 1}`
    setNuevo({
      codigo,
      titulo: maxVer.titulo,
      version: nuevaVersion,
      estado: 'borrador',
      contenido_md: maxVer.contenido_md || '',
    })
    setNuevoOpen(true)
    // Scroll al formulario
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  async function cambiarEstado(id: string, estado: string) {
    const { error } = await supabase
      .from('sops')
      .update({ estado, fecha_vigencia: estado === 'vigente' ? new Date().toISOString().slice(0, 10) : null })
      .eq('id', id)
    if (error) toast.error('Error: ' + error.message)
    else {
      toast.success(`Estado actualizado a ${estado}`)
      cargar()
    }
  }

  async function subirArchivo(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const name = `sops/${id}_${Date.now()}_${f.name.replace(/[^\x20-\x7E]/g, '_').replace(/\s+/g, '_')}`
    const { error: errUp } = await supabase.storage.from('canntrace-archivos').upload(name, f, { contentType: f.type, upsert: true })
    if (errUp) {
      toast.error('Error al subir: ' + errUp.message)
      return
    }
    const { data: url } = await supabase.storage.from('canntrace-archivos').createSignedUrl(name, 60 * 60 * 24 * 7)
    await supabase.from('sops').update({ archivo_url: url?.signedUrl }).eq('id', id)
    toast.success('Archivo subido')
    cargar()
  }

  // Agrupa por codigo
  const porCodigo: Record<string, SOP[]> = {}
  for (const s of sops) (porCodigo[s.codigo] ||= []).push(s)
  const grupos = Object.entries(porCodigo)

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0f0d] text-[#d3d8d4] font-sans ct-page-scroll">
      {/* TopBar */}
      <div className="sticky top-0 z-40 bg-[#0a0f0d]/95 backdrop-blur-[2px] border-b border-[#1a2620]">
        <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3">
          <FileText className="w-4 h-4 text-[#3fb074] flex-shrink-0" strokeWidth={1.8} />
          <div className="min-w-0">
            <h1 className="font-display font-bold tracking-tight text-[15px] sm:text-[17px] text-[#e8ece9]">SOPs Versionados</h1>
            <div className="mt-0.5 text-[10.5px] sm:text-[11px] text-[#5a6560]">
              <span className="tabular-nums">{sops.length}</span> documentos en <span className="tabular-nums">{grupos.length}</span> SOPs
              <span className="hidden sm:inline"><span className="text-[#343c37] mx-1">│</span> Standard Operating Procedures · GAMP5 Cat5</span>
            </div>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setNuevoOpen(!nuevoOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#3fb074]/40 bg-[#3fb074]/10 hover:bg-[#3fb074]/20 transition-colors text-[11.5px] font-medium text-[#8fe0a8]"
          >
            <Plus className="w-3.5 h-3.5" /><span className="hidden sm:inline">Nuevo SOP /</span> version
          </button>
        </div>
      </div>

      <div className="px-3 sm:px-6 py-4 sm:py-5 pb-20 space-y-4 sm:space-y-5">
        {/* Form nuevo */}
        <AnimatePresence>
          {nuevoOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl bg-[#0e1411] border border-[#2a5138] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-display font-bold text-[#e8ece9]">Nuevo SOP / version</h3>
                  <button onClick={() => setNuevoOpen(false)} className="p-1 text-[#5a6560] hover:text-[#d3d8d4] rounded" aria-label="Cerrar">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <SOPInput value={nuevo.codigo} onChange={(v) => setNuevo({ ...nuevo, codigo: v })} placeholder="Codigo (SOP-005)" />
                  <SOPInput value={nuevo.titulo} onChange={(v) => setNuevo({ ...nuevo, titulo: v })} placeholder="Titulo descriptivo" />
                  <SOPInput value={nuevo.version} onChange={(v) => setNuevo({ ...nuevo, version: v })} placeholder="Version (1.0)" />
                  <select
                    value={nuevo.estado}
                    onChange={(e) => setNuevo({ ...nuevo, estado: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0a0f0d] border border-[#1a2620] focus:border-[#2a5138] rounded-md text-[12.5px] text-[#e8ece9] outline-none transition-colors"
                  >
                    <option value="borrador">Borrador</option>
                    <option value="en_revision">En revision</option>
                    <option value="vigente">Vigente</option>
                    <option value="obsoleto">Obsoleto</option>
                  </select>
                </div>
                <textarea
                  value={nuevo.contenido_md}
                  onChange={(e) => setNuevo({ ...nuevo, contenido_md: e.target.value })}
                  placeholder="Contenido en Markdown (opcional)"
                  rows={4}
                  className="w-full px-3 py-2 bg-[#0a0f0d] border border-[#1a2620] focus:border-[#2a5138] rounded-md text-[12px] text-[#e8ece9] placeholder:text-[#5a6560] font-mono outline-none transition-colors resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={crear}
                    disabled={guardando}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#3fb074]/40 bg-[#3fb074]/10 hover:bg-[#3fb074]/20 transition-colors text-[11.5px] font-medium text-[#8fe0a8] disabled:opacity-50"
                  >
                    {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Guardar
                  </button>
                  <button
                    onClick={() => setNuevoOpen(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1e2d27] bg-[#111916] hover:bg-[#162420] transition-colors text-[11.5px] font-medium text-[#d3d8d4]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista */}
        {cargando ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-[#0e1411] border border-[#1a2620] animate-pulse" />
            ))}
          </div>
        ) : grupos.length === 0 ? (
          <EmptyState
            icon={FileText}
            titulo="Sin SOPs cargados"
            descripcion="Crea el primer Standard Operating Procedure. Cada SOP puede tener multiples versiones con estados borrador/en_revision/vigente/obsoleto."
            action={
              <button
                onClick={() => setNuevoOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#3fb074]/40 bg-[#3fb074]/10 hover:bg-[#3fb074]/20 text-[#8fe0a8] text-[11.5px] font-medium"
              >
                <Plus className="w-4 h-4" /> Crear primer SOP
              </button>
            }
          />
        ) : (
          <motion.div
            className="space-y-3"
            initial="hidden" animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {grupos.map(([codigo, versiones]) => (
              <motion.section
                key={codigo}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                className="rounded-xl bg-[#0e1411] border border-[#1a2620] hover:border-[#2a5138] transition-colors p-5"
              >
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-[#3fb074]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#3fb074]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-[13px] text-[#e8ece9] flex items-center gap-2">
                      <span className="font-mono">{codigo}</span>
                    </h3>
                    <p className="text-[11.5px] text-[#5a6560] truncate">{versiones[0].titulo}</p>
                  </div>
                  <span className="text-[10.5px] text-[#5a6560] tabular-nums flex-shrink-0">
                    {versiones.length} {versiones.length === 1 ? 'version' : 'versiones'}
                  </span>
                  <button
                    onClick={() => nuevaVersionDe(codigo, versiones)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#1e2d27] bg-[#111916] hover:bg-[#162420] transition-colors text-[10.5px] font-medium text-[#d3d8d4] flex-shrink-0"
                    title="Crear nueva version incrementando el numero automaticamente"
                  >
                    <GitBranch className="w-3 h-3" /> Nueva version
                  </button>
                </div>

                <ul className="space-y-1.5">
                  {versiones.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center gap-3 py-2 px-3 bg-[#111916] rounded-lg text-[11.5px] flex-wrap border border-[#1a2620]"
                    >
                      <span className="font-mono font-bold text-[#e8ece9] tabular-nums">v{v.version}</span>
                      <select
                        value={v.estado}
                        onChange={(e) => cambiarEstado(v.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer bg-transparent outline-none ${ESTADO_STYLES[v.estado] || ESTADO_STYLES.borrador}`}
                        aria-label={`Cambiar estado de version ${v.version}`}
                      >
                        <option value="borrador">BORRADOR</option>
                        <option value="en_revision">EN REVISION</option>
                        <option value="vigente">VIGENTE</option>
                        <option value="obsoleto">OBSOLETO</option>
                      </select>
                      {v.fecha_vigencia && (
                        <span className="text-[#5a6560] tabular-nums">
                          Vigente desde {v.fecha_vigencia}
                        </span>
                      )}
                      <span className="text-[#5a6560] tabular-nums ml-auto">
                        {new Date(v.creado_en).toLocaleDateString('es-AR')}
                      </span>
                      {v.archivo_url ? (
                        <a
                          href={v.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#6bcf8e] hover:text-[#8fe0a8] font-semibold transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Ver archivo
                        </a>
                      ) : (
                        <label className="inline-flex items-center gap-1 cursor-pointer text-[#6bcf8e] hover:text-[#8fe0a8] font-semibold transition-colors">
                          <Upload className="w-3 h-3" /> Subir archivo
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => subirArchivo(v.id, e)}
                            accept=".pdf,.doc,.docx,.md"
                          />
                        </label>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function SOPInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-[#0a0f0d] border border-[#1a2620] focus:border-[#2a5138] rounded-md text-[12.5px] text-[#e8ece9] placeholder:text-[#5a6560] outline-none transition-colors"
    />
  )
}
