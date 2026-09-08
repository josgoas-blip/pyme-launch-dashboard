import { PieChart, Pie, Cell } from 'recharts'
import { Card, CardTitle } from '../ui/Card.jsx'

// Cuadrantes DAFO con su acento de color (design.md).
const CUADRANTES = [
  { key: 'fortalezas', titulo: 'Fortalezas', color: 'accent-green', textColor: 'text-accent-green', bg: 'bg-accent-green/5' },
  { key: 'debilidades', titulo: 'Debilidades', color: 'accent-red', textColor: 'text-accent-red', bg: 'bg-accent-red/5' },
  { key: 'oportunidades', titulo: 'Oportunidades', color: 'primary', textColor: 'text-primary', bg: 'bg-primary/5' },
  { key: 'amenazas', titulo: 'Amenazas', color: 'accent-amber', textColor: 'text-accent-amber', bg: 'bg-accent-amber/5' },
]

/** Interpretación cualitativa del riesgo (a mayor %, mayor riesgo -> peor). */
function interpretarRiesgo(porcentaje) {
  if (porcentaje < 33) return { etiqueta: 'Riesgo Bajo', color: '#38A169' }
  if (porcentaje <= 66) return { etiqueta: 'Riesgo Medio', color: '#DD6B20' }
  return { etiqueta: 'Riesgo Alto', color: '#E53E3E' }
}

/**
 * Cuadrante "Riesgo DAFO": matriz DAFO de 4 cuadrantes + medidor semicircular
 * de riesgo general.
 *
 * @param {{ riesgoDafo: import('../../types/analisis.js').RiesgoDafo }} props
 */
export default function RiesgoDafoGauge({ riesgoDafo }) {
  const { fortalezas, debilidades, oportunidades, amenazas, riesgoGeneral } = riesgoDafo
  const porcentaje = Math.min(100, Math.max(0, riesgoGeneral))
  const nivel = interpretarRiesgo(porcentaje)

  const zonasData = [
    { name: 'Bajo', value: 33, color: '#38A169' },
    { name: 'Medio', value: 33, color: '#DD6B20' },
    { name: 'Alto', value: 34, color: '#E53E3E' },
  ]

  const anguloGrados = 180 - (porcentaje / 100) * 180
  const anguloRad = (anguloGrados * Math.PI) / 180
  const cx = 50
  const cy = 100
  const radio = 42
  const puntaX = cx + radio * Math.cos(anguloRad)
  const puntaY = cy - radio * Math.sin(anguloRad)

  const listas = { fortalezas, debilidades, oportunidades, amenazas }

  return (
    <Card>
      <CardTitle>Riesgo DAFO</CardTitle>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_220px]">
        {/* Matriz DAFO 2x2 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CUADRANTES.map((c) => (
            <div key={c.key} className={`rounded-lg border border-card-border p-3 ${c.bg}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${c.textColor}`}>
                {c.titulo}
              </p>
              <ul className="mt-2 space-y-1.5">
                {listas[c.key].map((item) => (
                  <li key={item.id} className="text-xs leading-snug text-main">
                    • {item.texto}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Medidor semicircular de Riesgo General */}
        <div className="flex flex-col items-center justify-center border-t border-card-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Riesgo General</p>
          <div className="relative mt-2 h-[90px] w-[180px]">
            <PieChart width={180} height={90}>
              <Pie
                data={zonasData}
                dataKey="value"
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={48}
                outerRadius={78}
                stroke="none"
                isAnimationActive={false}
              >
                {zonasData.map((z) => (
                  <Cell key={z.name} fill={z.color} fillOpacity={0.9} />
                ))}
              </Pie>
            </PieChart>
            <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
              <line x1={cx} y1={cy} x2={puntaX} y2={puntaY} stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
              <circle cx={cx} cy={cy} r="3" fill="#1F2937" />
            </svg>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-main">{porcentaje}%</p>
          <p className="text-sm font-semibold" style={{ color: nivel.color }}>
            {nivel.etiqueta}
          </p>
        </div>
      </div>
    </Card>
  )
}
