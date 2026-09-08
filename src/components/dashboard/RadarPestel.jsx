import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardTitle } from '../ui/Card.jsx'

const SCORE_MAXIMO = 25 // impacto (1-5) x probabilidad (1-5)

/**
 * Cuadrante "PESTEL": radar hexagonal (6 ejes) con la evaluación cuantitativa
 * Impacto x Probabilidad de cada factor macroentorno.
 *
 * @param {{ ejesPestel: import('../../types/analisis.js').EjePestel[] }} props
 */
export default function RadarPestel({ ejesPestel }) {
  const data = ejesPestel.map((e) => ({
    eje: e.eje,
    score: e.impacto * e.probabilidad,
    impacto: e.impacto,
    probabilidad: e.probabilidad,
  }))

  return (
    <Card>
      <CardTitle>PESTEL — Impacto x Probabilidad</CardTitle>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis dataKey="eje" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <PolarRadiusAxis
              angle={90}
              domain={[0, SCORE_MAXIMO]}
              tick={{ fill: '#6B7280', fontSize: 10 }}
            />
            <Radar
              name="Score (Impacto x Probabilidad)"
              dataKey="score"
              stroke="#1B4D3E"
              fill="#1B4D3E"
              fillOpacity={0.35}
            />
            <Tooltip
              formatter={(value, _name, item) => [
                `${value} (Impacto ${item.payload.impacto} x Prob. ${item.payload.probabilidad})`,
                'Score',
              ]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
