import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'

const formatValor = (valor, unidad) =>
  unidad === '€'
    ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(valor)
    : `${valor}${unidad === '%' ? '%' : ` ${unidad}`}`

/** Calcula la desviación % de la PYME respecto a la media del sector y si es favorable. */
function calcularComparativa(item) {
  const deltaPct = ((item.valorPyme - item.valorSector) / item.valorSector) * 100
  const esFavorable = item.sentido === 'altoEsFavorable' ? deltaPct >= 0 : deltaPct <= 0
  return { ...item, deltaPct, esFavorable }
}

function TooltipBenchmark({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-card-border bg-surface p-2.5 text-xs shadow-sm">
      <p className="font-semibold text-main">{p.metrica}</p>
      <p className="mt-1 text-muted">
        PYME: <span className="font-medium text-main">{formatValor(p.valorPyme, p.unidad)}</span> · Sector:{' '}
        <span className="font-medium text-main">{formatValor(p.valorSector, p.unidad)}</span>
      </p>
      <p className="font-semibold" style={{ color: p.esFavorable ? '#38A169' : '#E53E3E' }}>
        {p.deltaPct >= 0 ? '+' : ''}
        {p.deltaPct.toFixed(1)}% vs sector
      </p>
    </div>
  )
}

/**
 * Cuadrante "Benchmark Sectorial": barras horizontales comparando la
 * desviación % de la PYME frente a la media del sector en España, con
 * badge cualitativo por métrica.
 *
 * @param {{ benchmarkSectorial: import('../../types/analisis.js').ComparativaSectorial[] }} props
 */
export default function BenchmarkSectorialBar({ benchmarkSectorial }) {
  const data = benchmarkSectorial.map(calcularComparativa)

  return (
    <Card>
      <CardTitle>Benchmark Sectorial — PYME vs Media del Sector (España)</CardTitle>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, bottom: 0, left: 10 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis type="category" dataKey="metrica" width={100} tick={{ fill: '#6B7280', fontSize: 12 }} />
            <ReferenceLine x={0} stroke="#9CA3AF" />
            <Tooltip content={<TooltipBenchmark />} cursor={{ fill: '#1B4D3E0D' }} />
            <Bar dataKey="deltaPct" radius={[4, 4, 4, 4]} barSize={18}>
              {data.map((d) => (
                <Cell key={d.id} fill={d.esFavorable ? '#38A169' : '#E53E3E'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detalle por métrica con valores reales y badge cualitativo */}
      <ul className="mt-4 grid grid-cols-1 gap-2 border-t border-card-border pt-4 sm:grid-cols-2">
        {data.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted">
              {item.metrica}: <span className="font-semibold text-main">{formatValor(item.valorPyme, item.unidad)}</span>{' '}
              vs {formatValor(item.valorSector, item.unidad)}
            </span>
            <Badge
              className={
                item.esFavorable ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
              }
            >
              {item.esFavorable ? 'Favorable' : 'Por debajo del sector'}
            </Badge>
          </li>
        ))}
      </ul>
    </Card>
  )
}
