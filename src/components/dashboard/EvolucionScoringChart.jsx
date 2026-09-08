import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceArea,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardTitle } from '../ui/Card.jsx'

/**
 * Tooltip personalizado: muestra el score y el hito destacado alcanzado.
 */
function TooltipScoring({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="max-w-[220px] rounded-lg border border-card-border bg-surface p-2.5 text-xs shadow-sm">
      <p className="font-semibold text-main">{p.mes} — {p.score}/100</p>
      <p className="mt-1 text-muted">{p.hito}</p>
    </div>
  )
}

/**
 * Cuadrante "Evolución del Scoring de Viabilidad": gráfico de área con el
 * histórico del score (0-100) y los hitos destacados de cada punto.
 *
 * @param {{ evolucionScoring: import('../../types/analisis.js').PuntoScoring[] }} props
 */
export default function EvolucionScoringChart({ evolucionScoring }) {
  const ultimo = evolucionScoring[evolucionScoring.length - 1]

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Evolución del Scoring de Viabilidad</CardTitle>
        <span className="text-sm font-bold text-primary">{ultimo.score}/100</span>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={evolucionScoring} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="scoringFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1B4D3E" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#1B4D3E" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* Zonas semafóricas de referencia (mismos umbrales que Viabilidad) */}
            <ReferenceArea y1={0} y2={50} fill="#E53E3E" fillOpacity={0.05} />
            <ReferenceArea y1={50} y2={80} fill="#DD6B20" fillOpacity={0.05} />
            <ReferenceArea y1={80} y2={100} fill="#38A169" fillOpacity={0.05} />

            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis dataKey="mes" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} />
            <Tooltip content={<TooltipScoring />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#1B4D3E"
              strokeWidth={2}
              fill="url(#scoringFill)"
              dot={{ r: 4, fill: '#1B4D3E' }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
