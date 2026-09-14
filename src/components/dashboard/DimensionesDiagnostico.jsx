import { TrendingDown } from 'lucide-react'
import { Card, CardTitle } from '../ui/Card.jsx'

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
 * leídas del diagnóstico. Debajo, la dimensión que más lastra el score.
 *
 * Las penalizaciones del modelo ya no se listan aquí: viven en el panel de
 * Riesgos Críticos Activos, que además lleva a donde se resuelven.
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

  const { dimensiones, dimensionDebil } = resumen

  return (
    <Card>
      <CardTitle>Dimensiones del diagnóstico</CardTitle>
      <p className="mt-1 text-xs text-[#4B5563]">Las cuatro áreas que ponderan tu score global</p>

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

      {/* Palanca de mejora. Las penalizaciones ya no se listan aquí: viven
          en el panel de Riesgos Críticos Activos, donde además llevan a la
          pestaña en la que se resuelven. */}
      {dimensionDebil && (
        <p className="mt-5 flex items-start gap-2 border-t border-card-border pt-4 text-sm leading-snug text-[#1F2937]">
          <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
          <span>
            Lo que más te lastra ahora es{' '}
            <span className="font-semibold">{dimensionDebil.etiqueta.toLowerCase()}</span>, con{' '}
            {dimensionDebil.puntuacion} sobre 100.
          </span>
        </p>
      )}
    </Card>
  )
}
