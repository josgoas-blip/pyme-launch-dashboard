import { Zap, Star, Crown } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'
import PistaTermino from '../ui/PistaTermino.jsx'
import { explicar } from '../../utils/glosario.js'

// Icono + acento por escalón de la estructura (entrada, núcleo, alto valor).
// El escalón central (núcleo) se resalta como eje del modelo de ingresos.
const ESTILOS_ESCALON = [
  { icono: Zap, acento: 'text-muted', borde: 'border-card-border' },
  { icono: Star, acento: 'text-primary', borde: 'border-primary' },
  { icono: Crown, acento: 'text-accent-amber', borde: 'border-accent-amber/50' },
]

/**
 * Cuadrante "Modelo de Monetización": muestra una estructura de ingresos
 * coherente con el modelo declarado en el diagnóstico (`p10_modelo_ingresos`)
 * — venta única, suscripción recurrente, mixto o escalable.
 *
 * No fija precios: el diagnóstico no recoge tarifas, así que se describe el
 * rol de cada escalón (entrada, núcleo, alto valor) en vez de importes
 * inventados.
 *
 * @param {{ monetizacion: import('../../utils/estrategiaDiagnostico.js').Monetizacion | null }} props
 */
export default function EscaleraOfertasPricing({ monetizacion }) {
  if (!monetizacion) {
    return (
      <Card>
        <CardTitle>Modelo de Monetización</CardTitle>
        <p className="mt-4 text-sm text-muted">
          Completa el diagnóstico para ver la estructura de ingresos recomendada.
          Aquí aparecerá una escalera de valor coherente con cómo planeas
          monetizar tu negocio.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <CardTitle>Modelo de Monetización</CardTitle>
        <Badge className="bg-primary/10 text-primary">Nivel {monetizacion.nivel}/5</Badge>
      </div>
      <p className="mt-2 text-sm font-bold text-main">{monetizacion.modelo}</p>
      <p className="mt-1 text-xs leading-snug text-muted">{monetizacion.descripcion}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {monetizacion.estructura.map((escalon, indice) => {
          const { icono: Icono, acento, borde } = ESTILOS_ESCALON[indice] ?? ESTILOS_ESCALON[0]
          const esNucleo = indice === 1
          return (
            <div
              key={escalon.id}
              className={`flex flex-col rounded-xl border-2 p-4 ${borde} ${esNucleo ? 'bg-primary/5 sm:-translate-y-1 sm:shadow-md' : 'bg-canvas'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white ${acento}`}>
                  <Icono className="h-4 w-4" />
                </span>
                {esNucleo && <Badge className="bg-primary/10 text-primary">Eje del modelo</Badge>}
              </div>

              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">{escalon.enfoque}</p>
              {/* Solo los escalones con jerga inglesa llevan pista; "Plan
                  básico" o "Producto de entrada" se entienden sin ayuda. */}
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-main">
                {escalon.nombre}
                {explicar(escalon.id) && (
                  <PistaTermino texto={explicar(escalon.id)} etiqueta={escalon.nombre} />
                )}
              </p>

              <p className="mt-3 flex-1 text-[11px] leading-snug text-muted">{escalon.descripcion}</p>
            </div>
          )
        })}
      </div>

      <p className="mt-4 rounded-xl bg-canvas p-3 text-xs leading-snug text-muted">
        <span className="font-semibold text-main">Recomendación: </span>
        {monetizacion.recomendacion}
      </p>
    </Card>
  )
}
