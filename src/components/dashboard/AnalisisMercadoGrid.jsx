import { Card, CardTitle, KpiNumber, Badge } from '../ui/Card.jsx'
import { colorEvidencia } from '../../utils/evidencia.js'

/**
 * Cuadrante "Análisis de Mercado": grid de métricas TAM, SAM, SOM, LTV y
 * Market Share, cada una con un badge sutil de su `tipo_evidencia`
 * (Taxonomía de Evidencia: Documentado, Declarado, Fuente externa,
 * Estimación, Hipótesis).
 *
 * @param {{ metricasMercado: import('../../types/analisis.js').MetricaMercado[] }} props
 */
export default function AnalisisMercadoGrid({ metricasMercado }) {
  return (
    <Card>
      <CardTitle>Análisis de Mercado</CardTitle>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metricasMercado.map((m) => {
          const { badge } = colorEvidencia(m.valor.tipo_evidencia)
          return (
            <div key={m.id} className="rounded-lg border border-card-border bg-canvas p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{m.etiqueta}</p>
              <KpiNumber className="mt-1 text-xl">{m.valor.valor}</KpiNumber>
              {m.descripcion && <p className="mt-1 text-[11px] text-muted">{m.descripcion}</p>}
              <Badge className={`mt-2 ${badge}`}>{m.valor.tipo_evidencia}</Badge>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
