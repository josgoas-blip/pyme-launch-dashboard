import { CheckCircle2, CircleDot, Lock } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'

const ESTILO_POR_ESTADO = {
  Completado: { icono: CheckCircle2, iconoClass: 'text-accent-green', badge: 'bg-accent-green/10 text-accent-green' },
  'En curso': { icono: CircleDot, iconoClass: 'text-accent-amber', badge: 'bg-accent-amber/10 text-accent-amber' },
  Bloqueado: { icono: Lock, iconoClass: 'text-accent-red', badge: 'bg-accent-red/10 text-accent-red' },
}

/**
 * Columna derecha del bloque "¿Dónde estoy y qué me falta?": lista de los
 * pasos del recorrido de la idea (Idea, Propuesta, Validación, Modelo,
 * Mercado) con su estado.
 *
 * @param {{ recorridoProyecto: import('../../types/dashboard.js').PasoRecorrido[] }} props
 */
export default function RecorridoProyecto({ recorridoProyecto }) {
  return (
    <Card>
      <CardTitle>Recorrido</CardTitle>
      <p className="mt-1 text-xs text-muted">Pasos de la Fase Semilla</p>

      <ol className="mt-4 space-y-3">
        {recorridoProyecto.map((paso) => {
          const estilo = ESTILO_POR_ESTADO[paso.estado]
          const Icono = estilo.icono
          return (
            <li key={paso.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Icono className={`h-4 w-4 shrink-0 ${estilo.iconoClass}`} />
                <span className="text-sm font-medium text-main">{paso.paso}</span>
              </div>
              <Badge className={estilo.badge}>{paso.estado}</Badge>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
