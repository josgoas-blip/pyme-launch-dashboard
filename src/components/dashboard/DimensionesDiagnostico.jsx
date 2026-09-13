import { AlertTriangle, ShieldCheck, TrendingDown } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'

/**
 * Umbrales semafóricos compartidos con el resto del panel (33/66).
 * Por debajo de 33 la dimensión es deficiente; por encima de 66, sólida.
 */
const COLOR_POR_PUNTUACION = (puntuacion) => {
  if (puntuacion < 33) return '#E53E3E'
  if (puntuacion < 66) return '#DD6B20'
  return '#38A169'
}

/**
 * Desglose por dimensión del Resumen General: las mismas cuatro
 * puntuaciones y pesos que muestra la pantalla final del cuestionario,
 * leídas del diagnóstico. Debajo, la dimensión que más lastra el score y
 * las alertas que el modelo aplica sobre él.
 *
 * @param {{ resumen: ReturnType<typeof import('../../utils/resumenDiagnostico.js').derivarResumenGlobal> }} props
 */
export default function DimensionesDiagnostico({ resumen }) {
  if (!resumen) {
    return (
      <Card>
        <CardTitle>Dimensiones del diagnóstico</CardTitle>
        <p className="mt-3 text-sm text-[#4B5563]">
          Completa el diagnóstico para ver tu puntuación en validación y mercado, modelo comercial,
          operaciones y solvencia.
        </p>
      </Card>
    )
  }

  const { dimensiones, dimensionDebil, alertas } = resumen
  const hayAlertas = alertas.length > 0

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Dimensiones del diagnóstico</CardTitle>
          <p className="mt-1 text-xs text-[#4B5563]">
            Las cuatro áreas que ponderan tu score global
          </p>
        </div>
        <Badge
          className={
            hayAlertas ? 'shrink-0 bg-accent-red/10 text-accent-red' : 'shrink-0 bg-accent-green/10 text-accent-green'
          }
        >
          {hayAlertas
            ? `${alertas.length} ${alertas.length === 1 ? 'alerta' : 'alertas'}`
            : 'Sin penalizaciones'}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {dimensiones.map((dimension) => {
          const esDebil = dimension.id === dimensionDebil?.id
          return (
            <div key={dimension.id}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold leading-snug text-[#1F2937]">
                  {dimension.etiqueta}
                </p>
                <p className="shrink-0 text-sm font-extrabold text-[#1F2937]">
                  {dimension.puntuacion}
                </p>
              </div>
              <div
                className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-canvas"
                role="progressbar"
                aria-valuenow={dimension.puntuacion}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={dimension.etiqueta}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${dimension.puntuacion}%`,
                    backgroundColor: COLOR_POR_PUNTUACION(dimension.puntuacion),
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-[#4B5563]">
                {Math.round(dimension.peso * 100)} % del score
                {esDebil && ' · tu punto más flojo'}
              </p>
            </div>
          )
        })}
      </div>

      {/* Estado general: palanca de mejora y penalizaciones del modelo. */}
      <div className="mt-5 border-t border-card-border pt-4">
        {dimensionDebil && (
          <p className="flex items-start gap-2 text-sm leading-snug text-[#1F2937]">
            <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
            <span>
              Lo que más te lastra ahora es{' '}
              <span className="font-semibold">{dimensionDebil.etiqueta.toLowerCase()}</span>, con{' '}
              {dimensionDebil.puntuacion} sobre 100.
            </span>
          </p>
        )}

        {hayAlertas ? (
          <ul className="mt-3 space-y-2">
            {alertas.map((alerta) => (
              <li
                key={alerta}
                className="flex items-start gap-2 rounded-xl border border-accent-red/30 bg-accent-red/10 px-3 py-2 text-xs font-semibold leading-snug text-accent-red"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {alerta}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-accent-green/30 bg-accent-green/10 px-3 py-2 text-xs font-semibold leading-snug text-accent-green">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Ninguna de tus respuestas activa las penalizaciones del modelo.
          </p>
        )}
      </div>
    </Card>
  )
}
