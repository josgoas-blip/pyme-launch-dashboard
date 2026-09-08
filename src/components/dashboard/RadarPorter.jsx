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

/**
 * Cuadrante "5 Fuerzas de Porter": radar pentagonal (5 ejes) con la
 * intensidad evaluada de cada fuerza competitiva.
 *
 * @param {{ fuerzasPorter: import('../../types/analisis.js').FuerzaPorter[] }} props
 */
export default function RadarPorter({ fuerzasPorter }) {
  return (
    <Card>
      <CardTitle>5 Fuerzas de Porter</CardTitle>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={fuerzasPorter} outerRadius="75%">
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis dataKey="fuerza" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: '#6B7280', fontSize: 10 }} />
            <Radar
              name="Intensidad"
              dataKey="intensidad"
              stroke="#DD6B20"
              fill="#DD6B20"
              fillOpacity={0.35}
            />
            <Tooltip formatter={(value) => [`${value} / 5`, 'Intensidad']} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
