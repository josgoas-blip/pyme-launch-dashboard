import { Card, CardTitle, Badge } from '../ui/Card.jsx'
import { colorEvidencia } from '../../utils/evidencia.js'
import GaugeValidacion from './GaugeValidacion.jsx'

/**
 * Solidez de validación comercial: la media de las cuatro preguntas del
 * modelo que miden qué ha contrastado el usuario (p4-p7).
 *
 * Es una media de valores ya derivados, no un cálculo nuevo: cada barra
 * llega con su `porcentaje` desde `derivarCalidadEvidencia`.
 */
function solidezValidacion(items) {
  if (items.length === 0) return 0
  return Math.round(items.reduce((suma, item) => suma + item.porcentaje, 0) / items.length)
}

/**
 * Cuadrante "Solidez de la Validación Comercial".
 *
 * El titular es un medidor semicircular con el estado cualitativo: de un
 * vistazo dice si lo que sostiene el proyecto son hipótesis, señales de
 * interés o demanda demostrada. Debajo, el desglose por fuente responde a
 * la pregunta siguiente —¿de dónde sale ese nivel?— con la opción que el
 * usuario eligió y la procedencia que implica según la Taxonomía de
 * Evidencia.
 *
 * No es un reparto porcentual del total de datos del proyecto: el
 * cuestionario no recoge esa información, e inventarla daría una falsa
 * sensación de precisión.
 *
 * @param {{ calidadEvidencia: ReturnType<typeof import('../../utils/resumenDiagnostico.js').derivarCalidadEvidencia> }} props
 */
export default function CalidadEvidenciaBars({ calidadEvidencia }) {
  const items = calidadEvidencia ?? []

  if (items.length === 0) {
    return (
      <Card>
        <CardTitle>Solidez de la validación comercial</CardTitle>
        <p className="mt-4 text-sm text-[#4B5563]">
          Completa el bloque de validación y mercado del diagnóstico para ver la solidez de tu
          evidencia.
        </p>
      </Card>
    )
  }

  const solidez = solidezValidacion(items)

  return (
    <Card>
      <CardTitle>Solidez de la validación comercial</CardTitle>
      <p className="mt-1 text-xs text-[#4B5563]">
        Qué has contrastado con clientes reales, según tus respuestas
      </p>

      {/* Titular: medidor semicircular con el estado cualitativo */}
      <div className="mt-4 flex justify-center">
        <GaugeValidacion porcentaje={solidez} />
      </div>

      {/* Desglose por fuente de evidencia */}
      <div className="mt-5 space-y-3 border-t border-card-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#4B5563]">
          De dónde sale ese nivel
        </p>

        {items.map((item) => {
          const { color, badge } = colorEvidencia(item.tipo)
          return (
            <div key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm">
                <span className="font-medium text-[#1F2937]">{item.etiqueta}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge className={badge}>{item.tipo}</Badge>
                  <span className="font-semibold text-[#1F2937]">{item.nivel}/5</span>
                </div>
              </div>
              <div
                className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-canvas"
                role="progressbar"
                aria-valuenow={item.nivel}
                aria-valuemin={0}
                aria-valuemax={5}
                aria-label={item.etiqueta}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.porcentaje}%`, backgroundColor: color }}
                />
              </div>
              {item.detalle && (
                <p className="mt-1 text-xs leading-snug text-[#4B5563]">{item.detalle}</p>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
