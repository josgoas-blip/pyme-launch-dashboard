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
 * Columna izquierda del bloque principal de Viabilidad: evolución del saldo
 * de caja proyectado bajo tres escenarios, construida solo con lo que el
 * usuario ha declarado en el diagnóstico (p18 y p19):
 *   - Caja inicial = inversión total declarada.
 *   - Consumo mensual = inversión / meses de colchón.
 *   - Los escenarios desplazan el plazo hasta el equilibrio (-25 % / +50 %);
 *     no alteran los euros declarados.
 *
 * Colores design.md: Favorable #10B981 (acento), Base #1B4D3E (corporativo),
 * Adverso #E53E3E (alerta).
 *
 * @param {{ escenarios: ReturnType<typeof import('../../utils/viabilidadDiagnostico.js').derivarEscenariosCaja> }} props
 */
export default function LineChartEscenarios({ escenarios }) {
  if (!escenarios) {
    return (
      <Card>
        <CardTitle>Escenarios de saldo de caja</CardTitle>
        <p className="mt-3 text-sm text-[#4B5563]">
          Declara tu inversión de arranque y tus meses de colchón en el diagnóstico para proyectar la
          evolución de tu caja. Sin esas dos cifras cualquier curva sería inventada.
        </p>
      </Card>
    )
  }

  const { datos, consumoMensual, cajaInicial, equilibrioBase, mesAgotamiento } = escenarios

  return (
    <Card>
      <CardTitle>Escenarios de saldo de caja</CardTitle>
      <p className="mt-1 text-xs text-[#4B5563]">
        Proyección sobre tus datos: caja inicial de {formatEUR(cajaInicial)} y un consumo medio
        implícito de {formatEUR(consumoMensual)}/mes. El saldo deja de caer al alcanzar el
        equilibrio (escenario base: mes {equilibrioBase}).
      </p>

      <div className="mt-4 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis dataKey="periodo" tick={{ fill: '#4B5563', fontSize: 12 }} />
            <YAxis
              tick={{ fill: '#4B5563', fontSize: 12 }}
              tickFormatter={(v) => new Intl.NumberFormat('es-ES', { notation: 'compact' }).format(v)}
            />
            <ReferenceLine y={0} stroke="#9CA3AF" />
            <Tooltip formatter={(value) => formatEUR(value)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="favorable"
              name="Equilibrio 25 % antes"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="base"
              name="Plazo declarado"
              stroke="#1B4D3E"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="adverso"
              name="Equilibrio 50 % más tarde"
              stroke="#E53E3E"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {mesAgotamiento !== null && (
        <p className="mt-3 rounded-xl border border-accent-red/30 bg-accent-red/10 px-3 py-2.5 text-sm font-semibold leading-snug text-accent-red">
          En el escenario con tu plazo declarado la caja se agota en el mes {mesAgotamiento}, antes
          de alcanzar el equilibrio en el mes {equilibrioBase}.
        </p>
      )}
    </Card>
  )
}
