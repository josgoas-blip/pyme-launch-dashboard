import { Card, CardTitle } from '../ui/Card.jsx'
import { colorEvidencia } from '../../utils/evidencia.js'

/**
 * Columna izquierda del bloque "¿Dónde estoy y qué me falta?": barras
 * horizontales con el % de datos del proyecto según su procedencia
 * (Taxonomía de Evidencia).
 *
 * @param {{ calidadEvidencia: import('../../types/dashboard.js').ItemCalidadEvidencia[] }} props
 */
export default function CalidadEvidenciaBars({ calidadEvidencia }) {
  return (
    <Card>
      <CardTitle>Calidad de la Evidencia</CardTitle>
      <p className="mt-1 text-xs text-muted">Procedencia de los datos aportados al proyecto</p>

      <div className="mt-4 space-y-4">
        {calidadEvidencia.map((item) => {
          const { color } = colorEvidencia(item.tipo)
          return (
            <div key={item.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-main">{item.tipo}</span>
                <span className="font-semibold text-main">{item.porcentaje}%</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-canvas">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.porcentaje}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
