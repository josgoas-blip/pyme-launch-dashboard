import { ShieldCheck } from 'lucide-react'
import { Card, CardTitle } from '../ui/Card.jsx'

/** Color de la barra según el % de mitigación (design.md: zonas semafóricas). */
function colorPorPorcentaje(pct) {
  if (pct < 50) return '#E53E3E'
  if (pct < 80) return '#DD6B20'
  return '#38A169'
}

/**
 * Cuadrante "Mitigación de Riesgos": barra progresiva con el % de riesgos
 * ya mitigados sobre el total identificado.
 *
 * @param {{ mitigacionRiesgos: import('../../types/estrategia.js').MitigacionRiesgos }} props
 */
export default function BarraMitigacionRiesgos({ mitigacionRiesgos }) {
  const { riesgosTotales, riesgosMitigados } = mitigacionRiesgos
  const porcentaje = Math.round((riesgosMitigados / riesgosTotales) * 100)
  const color = colorPorPorcentaje(porcentaje)

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Mitigación de Riesgos</CardTitle>
        <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color }}>
          <ShieldCheck className="h-4 w-4" />
          {porcentaje}%
        </span>
      </div>

      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-canvas">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${porcentaje}%`, backgroundColor: color }}
        />
      </div>

      <p className="mt-3 text-sm text-muted">
        <span className="font-semibold text-main">{riesgosMitigados}</span> de{' '}
        <span className="font-semibold text-main">{riesgosTotales}</span> riesgos identificados
        cuentan con un plan de mitigación implementado.
      </p>
    </Card>
  )
}
