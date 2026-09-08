import { Card, CardTitle } from '../ui/Card.jsx'

// Color semafórico por prioridad (design.md): Alta = alerta roja, Media = advertencia ámbar.
const ESTILO_POR_PRIORIDAD = {
  Alta: 'bg-accent-red/10 text-accent-red',
  Media: 'bg-accent-amber/10 text-accent-amber',
  Baja: 'bg-accent-green/10 text-accent-green',
}

/**
 * Cuadrante "Acciones Sugeridas": lista vertical tipo timeline con las
 * recomendaciones de prevalidación de la Fase Semilla (no instrucciones).
 * Cada ítem muestra un icono circular numerado, el título, la prioridad
 * (color semafórico) y la justificación (evidencia) en texto tenue.
 *
 * @param {{ accionesSugeridas: import('../../types/estrategia.js').AccionSugerida[] }} props
 */
export default function PlanAccionCameDetail({ accionesSugeridas }) {
  return (
    <Card>
      <CardTitle>Acciones Sugeridas</CardTitle>

      <ol className="mt-4 space-y-5">
        {accionesSugeridas.map((accion, index) => (
          <li key={accion.id} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {index + 1}
            </span>
            <div className="min-w-0 border-b border-card-border pb-5 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-main">{accion.titulo}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTILO_POR_PRIORIDAD[accion.prioridad]}`}>
                  Prioridad {accion.prioridad}
                </span>
              </div>
              <p className="mt-1 text-xs leading-snug text-muted">{accion.justificacion}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-5 border-t border-card-border pt-3 text-xs text-muted">
        Recomendaciones, no instrucciones. El emprendedor conserva la decisión final.
      </p>
    </Card>
  )
}
