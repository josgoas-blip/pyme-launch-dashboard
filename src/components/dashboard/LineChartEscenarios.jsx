import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardTitle } from '../ui/Card.jsx'

const formatEUR = (n) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

/**
 * Columna izquierda del bloque principal de Viabilidad: línea temporal a 5
 * años del flujo de caja acumulado bajo 3 escenarios (Favorable, Base,
 * Adverso). Datos ilustrativos, condicionados a los Supuestos Clave.
 * Colores design.md: Favorable #10B981 (acento), Base #1B4D3E (corporativo),
 * Adverso #E53E3E (alerta).
 *
 * @param {{ escenariosVan: import('../../types/viabilidad.js').PuntoEscenario[] }} props
 */
export default function LineChartEscenarios({ escenariosVan }) {
  return (
    <Card>
      <CardTitle>Escenarios de Flujo de Caja — Datos Ilustrativos</CardTitle>

      <div className="mt-4 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={escenariosVan} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis dataKey="periodo" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(v) => new Intl.NumberFormat('es-ES', { notation: 'compact' }).format(v)}
            />
            <ReferenceLine y={0} stroke="#9CA3AF" />
            <Tooltip formatter={(value) => formatEUR(value)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="favorable" name="Favorable" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="base" name="Base" stroke="#1B4D3E" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="adverso" name="Adverso" stroke="#E53E3E" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
