import { Card, CardTitle } from '../ui/Card.jsx'

/** Color semafórico por umbral (33/66), consistente con el resto del dashboard. */
function colorPorIndice(valor) {
  if (valor < 33) return '#E53E3E'
  if (valor < 66) return '#DD6B20'
  return '#38A169'
}

/**
 * Cabecera de la pestaña "Análisis": Doble Indicador con dos barras de
 * progreso grandes e independientes — Índice de Madurez del Proyecto e
 * Índice de Solidez de la Evidencia.
 *
 * @param {{ indiceMadurez: number, indiceSolidezEvidencia: number }} props
 */
export default function DobleIndicador({ indiceMadurez, indiceSolidezEvidencia }) {
  const indicadores = [
    { id: 'madurez', etiqueta: 'Índice de Madurez del Proyecto', valor: indiceMadurez },
    { id: 'evidencia', etiqueta: 'Índice de Solidez de la Evidencia', valor: indiceSolidezEvidencia },
  ]

  return (
    <Card>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {indicadores.map((ind) => {
          const color = colorPorIndice(ind.valor)
          return (
            <div key={ind.id}>
              <div className="flex items-baseline justify-between">
                <CardTitle>{ind.etiqueta}</CardTitle>
                <span className="text-2xl font-extrabold text-main">{ind.valor}/100</span>
              </div>
              <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-canvas">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${ind.valor}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
