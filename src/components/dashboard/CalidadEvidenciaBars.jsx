import { Card, CardTitle, Badge } from '../ui/Card.jsx'
import { colorEvidencia } from '../../utils/evidencia.js'

/**
 * Columna izquierda del Resumen General: solidez de la evidencia que el
 * usuario ha reunido, una barra por cada una de las cuatro preguntas del
 * modelo que la miden (p4-p7).
 *
 * Cada barra muestra el nivel declarado normalizado a 0-100, la opción que
 * el usuario eligió y la procedencia que ese nivel implica según la
 * Taxonomía de Evidencia. No es un reparto porcentual del total de datos
 * del proyecto: el cuestionario no recoge esa información, así que
 * inventarla daría una falsa sensación de precisión.
 *
 * @param {{ calidadEvidencia: ReturnType<typeof import('../../utils/resumenDiagnostico.js').derivarCalidadEvidencia> }} props
 */
export default function CalidadEvidenciaBars({ calidadEvidencia }) {
  const items = calidadEvidencia ?? []

  return (
    <Card>
      <CardTitle>Calidad de la Evidencia</CardTitle>
      <p className="mt-1 text-xs text-[#4B5563]">
        Qué has contrastado y con qué respaldo, según tus respuestas
      </p>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-[#4B5563]">
          Completa el bloque de validación y mercado del diagnóstico para ver la solidez de tu
          evidencia.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
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
                  className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-canvas"
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
      )}
    </Card>
  )
}
