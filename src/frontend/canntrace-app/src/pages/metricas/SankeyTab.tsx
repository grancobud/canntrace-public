// SankeyTab — flujo de masa seed-to-sale por camada con paleta CannTrace.
// Reemplaza nodeColor del backend por hex de paleta verde+dorado coherente.

import { ResponsiveSankey } from '@nivo/sankey'
import { motion } from 'framer-motion'
import { Waves, Leaf, Sprout, Flower2, Scissors, Package, AlertTriangle } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

// Mapeo node id → paleta CannTrace (verde para vivo, dorado para procesado, ámbar/rojo merma)
const NODE_COLOR_MAP: Record<string, string> = {
  'Esquejes': '#6bcf8e',
  'Plantas': '#3fb074',
  'Flor verde (kg)': '#E3B94A',
  'Flor seca (kg)': '#C49A2C',
  'Trim (kg)': '#8fe0a8',
  'Fraccionado (kg)': '#3fb074',
  'Merma secado': '#ff6b5a',
  'Merma trimming': '#E3B94A',
}

export default function SankeyTab({ sankey, camadaSel }: { sankey: any; camadaSel: string }) {
  // Override colores del backend con paleta CannTrace
  const data = {
    ...sankey,
    nodes: (sankey.nodes || []).map((n: any) => ({
      ...n,
      nodeColor: NODE_COLOR_MAP[n.id] || '#8e9892',
    })),
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="rounded-xl bg-[#0e1411] border border-[#1a2620] overflow-hidden"
      >
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#1a2620] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Waves className="w-3.5 h-3.5 text-[#6bcf8e] flex-shrink-0" strokeWidth={1.8} />
            <h3 className="font-display font-semibold text-[13px] text-[#e8ece9] truncate">
              Flujo de masa · Camada <span className="text-[#8fe0a8]">{camadaSel}</span>
            </h3>
          </div>
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#5a6560] font-medium">
            seed-to-sale · grosor = masa
          </span>
        </div>

        <div className="p-2 sm:p-4">
          <div
            className="rounded-lg"
            style={{ height: 460, background: 'linear-gradient(180deg, #0a0f0d 0%, #111916 100%)', padding: 16 }}
          >
            <ResponsiveSankey
              data={data}
              margin={{ top: 18, right: 140, bottom: 18, left: 90 }}
              align="justify"
              colors={(n: any) => n.nodeColor || '#8e9892'}
              nodeOpacity={1}
              nodeHoverOpacity={1}
              nodeThickness={14}
              nodeSpacing={26}
              nodeBorderWidth={0}
              nodeBorderRadius={3}
              linkOpacity={0.32}
              linkHoverOpacity={0.6}
              linkContract={5}
              linkBlendMode="lighten"
              enableLinkGradient
              animate
              motionConfig="gentle"
              labelPosition="outside"
              labelOrientation="horizontal"
              labelPadding={10}
              labelTextColor="#d3d8d4"
              theme={{
                labels: { text: { fontSize: 11, fontWeight: 600, fontFamily: 'Space Grotesk, system-ui' } },
                tooltip: {
                  container: {
                    background: '#0e1411',
                    color: '#e8ece9',
                    fontSize: 12,
                    fontFamily: 'Inter, system-ui',
                    border: '1px solid #2a5138',
                    borderRadius: 8,
                    padding: '8px 12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  },
                },
              }}
            />
          </div>
        </div>
      </motion.div>

      {sankey.raw && (
        <motion.div
          initial="hidden" animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <SankeyKpi label="Esquejes" val={sankey.raw.n_esq} unit="unid" icono={Sprout} tone="primary" />
          <SankeyKpi label="Plantas" val={sankey.raw.n_planta} unit="unid" icono={Leaf} tone="primary" />
          <SankeyKpi label="Flor verde" val={sankey.raw.kg_v} unit="kg" icono={Flower2} tone="gold" />
          <SankeyKpi label="Flor seca" val={sankey.raw.kg_s} unit="kg" icono={Flower2} tone="goldDark" />
          <SankeyKpi label="Trim" val={sankey.raw.kg_t} unit="kg" icono={Scissors} tone="primary" />
          <SankeyKpi label="Fraccionado" val={sankey.raw.kg_f} unit="kg" icono={Package} tone="primary" />
          <SankeyKpi label="Merma secado" val={Math.max(0, (sankey.raw.kg_v - sankey.raw.kg_s)).toFixed(2)} unit="kg" icono={AlertTriangle} tone="danger" />
          <SankeyKpi label="Merma trim" val={Math.max(0, (sankey.raw.kg_s - sankey.raw.kg_t)).toFixed(2)} unit="kg" icono={AlertTriangle} tone="warn" />
        </motion.div>
      )}
    </div>
  )
}

type Tone = 'primary' | 'gold' | 'goldDark' | 'warn' | 'danger'
const TONE_STYLES: Record<Tone, { val: string; icon: string; bg: string; border: string }> = {
  primary:  { val: '#8fe0a8', icon: '#6bcf8e', bg: 'rgba(63,176,116,0.10)',  border: '#2a5138' },
  gold:     { val: '#E3B94A', icon: '#E3B94A', bg: 'rgba(196,154,44,0.10)',  border: '#5a4820' },
  goldDark: { val: '#C49A2C', icon: '#C49A2C', bg: 'rgba(196,154,44,0.06)',  border: '#5a4820' },
  warn:     { val: '#E3B94A', icon: '#E3B94A', bg: 'rgba(227,185,74,0.08)',  border: '#5a4820' },
  danger:   { val: '#ff8a7a', icon: '#ff6b5a', bg: 'rgba(255,107,90,0.10)',  border: '#7a2820' },
}

const fadeUpItem = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } } }

function SankeyKpi({ label, val, unit, icono: Icono, tone }: { label: string; val: any; unit: string; icono: any; tone: Tone }) {
  const t = TONE_STYLES[tone]
  return (
    <motion.div variants={fadeUpItem}>
      <div className="rounded-xl bg-[#0e1411] border border-[#1a2620] hover:border-[#2a5138] transition-colors p-3 sm:p-3.5 h-full">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9.5px] uppercase tracking-[0.14em] text-[#5a6560] font-medium">{label}</p>
            <p className="font-display font-bold text-[20px] sm:text-[22px] tabular-nums leading-none mt-1.5" style={{ color: t.val }}>
              {val}
            </p>
            <p className="text-[10px] text-[#747e78] mt-1">{unit}</p>
          </div>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border"
            style={{ background: t.bg, borderColor: t.border, color: t.icon }}
          >
            <Icono className="w-3.5 h-3.5" strokeWidth={1.8} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
