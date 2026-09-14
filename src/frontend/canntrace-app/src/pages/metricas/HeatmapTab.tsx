// HeatmapTab — densidad camada × etapa con scale verde-dorado CannTrace.

import { ResponsiveHeatMap } from '@nivo/heatmap'
import { motion } from 'framer-motion'
import { Grid3x3 } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

// Escala custom verde→dorado (8 stops). Mapea value normalizado [0..1] a hex.
const SCALE = ['#0e1411', '#162420', '#1d3328', '#2a5138', '#3fb074', '#6bcf8e', '#8fe0a8', '#E3B94A']
function colorAt(t: number): string {
  if (!isFinite(t) || t <= 0) return SCALE[0]
  if (t >= 1) return SCALE[SCALE.length - 1]
  const i = t * (SCALE.length - 1)
  const lo = Math.floor(i)
  return SCALE[lo]
}

export default function HeatmapTab({ metricas }: { metricas: any }) {
  const data = metricas.por_camada.map((c: any) => ({
    id: c.camada,
    data: [
      { x: 'Esquejes', y: c.esquejes },
      { x: 'Plantas', y: c.plantas },
      { x: 'Flor', y: c.flor },
      { x: 'Trim', y: c.trim },
      { x: 'Fraccionado', y: c.fracc },
    ],
  }))

  // Max global para normalizar el color de cada celda
  const maxVal = Math.max(1, ...data.flatMap((row: any) => row.data.map((d: any) => d.y || 0)))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="rounded-xl bg-[#0e1411] border border-[#1a2620] overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-3.5 border-b border-[#1a2620] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Grid3x3 className="w-3.5 h-3.5 text-[#6bcf8e] flex-shrink-0" strokeWidth={1.8} />
          <h3 className="font-display font-semibold text-[13px] text-[#e8ece9] truncate">Densidad camada × etapa</h3>
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] text-[#5a6560] font-medium">
          intensidad = cantidad de lotes
        </span>
      </div>

      <div className="p-2 sm:p-4">
        <div
          className="rounded-lg"
          style={{
            height: 440,
            background: 'linear-gradient(180deg, #0a0f0d 0%, #111916 100%)',
            padding: 18,
          }}
        >
          <ResponsiveHeatMap
            data={data}
            margin={{ top: 60, right: 70, bottom: 40, left: 60 }}
            valueFormat=">-.0f"
            axisTop={{
              tickSize: 0,
              tickPadding: 12,
              tickRotation: 0,
              legend: '',
              legendOffset: -45,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 12,
              tickRotation: 0,
              legend: '',
              legendOffset: -45,
            }}
            colors={(cell: any) => colorAt((cell.value || 0) / maxVal)}
            emptyColor="#0a0f0d"
            borderRadius={8}
            borderColor={{ from: 'color', modifiers: [['darker', 0.6]] }}
            borderWidth={1}
            labelTextColor={{ from: 'color', modifiers: [['darker', 2.5]] }}
            inactiveOpacity={0.18}
            animate
            motionConfig="gentle"
            hoverTarget="cell"
            theme={{
              text: { fontFamily: 'Space Grotesk, system-ui' },
              axis: {
                ticks: {
                  text: {
                    fill: '#a7b1ab',
                    fontSize: 11,
                    fontWeight: 500,
                    fontFamily: 'Inter, system-ui',
                  },
                },
              },
              labels: {
                text: { fontWeight: 700, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
              },
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

        {/* Legend bar */}
        <div className="mt-3 flex items-center justify-end gap-2">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#5a6560] font-medium">menos</span>
          <div
            className="h-1.5 w-32 rounded-full"
            style={{
              background:
                'linear-gradient(90deg, #0e1411 0%, #2a5138 25%, #3fb074 55%, #8fe0a8 80%, #E3B94A 100%)',
            }}
          />
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#5a6560] font-medium">más</span>
        </div>
      </div>
    </motion.div>
  )
}
