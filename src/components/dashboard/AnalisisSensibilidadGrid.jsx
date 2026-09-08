import { Card, CardTitle } from '../ui/Card.jsx'

/** Color de la barra según el % de colchón disponible (más colchón = más seguro). */
function colorPorTolerancia(pctBarra) {
  if (pctBarra < 33) return '#E53E3E'
  if (pctBarra < 66) return '#DD6B20'
  return '#38A169'
}

const formatValor = (item) => `${item.valor > 0 ? '+' : ''}${item.valor} ${item.unidad}`

/**
 * Cuadrante "Análisis de Sensibilidad": tarjetas con barras de tolerancia
 * que indican umbrales de riesgo (caída de ventas, aumento de costes,
 * reserva de caja / burn rate).
 *
 * @param {{ analisisSensibilidad: import('../../types/analisis.js').ItemSensibilidad[] }} props
 */
export default function AnalisisSensibilidadGrid({ analisisSensibilidad }) {
  return (
    <Card>
      <CardTitle>Análisis de Sensibilidad</CardTitle>
      <p className="mt-1 text-xs text-muted">Umbrales de tolerancia al riesgo</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {analisisSensibilidad.map((item) => {
          const pctBarra = Math.min(100, (Math.abs(item.valor) / item.escalaMaxima) * 100)
          const color = colorPorTolerancia(pctBarra)
          return (
            <div key={item.id} className="rounded-lg border border-card-border bg-canvas p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{item.etiqueta}</p>
              <p className="mt-1 text-2xl font-extrabold text-main">{formatValor(item)}</p>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pctBarra}%`, backgroundColor: color }}
                />
              </div>

              <p className="mt-2 text-[11px] leading-snug text-muted">{item.descripcion}</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
