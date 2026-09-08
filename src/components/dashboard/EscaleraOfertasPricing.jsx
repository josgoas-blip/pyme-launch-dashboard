import { Zap, Star, Crown } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'

// Icono + acento por escalón de la escalera de valor (design.md).
const ESTILO_POR_TIPO = {
  Tripwire: { icono: Zap, acento: 'text-muted', borde: 'border-card-border' },
  'Core Offer': { icono: Star, acento: 'text-primary', borde: 'border-primary' },
  'High Ticket': { icono: Crown, acento: 'text-accent-amber', borde: 'border-accent-amber/50' },
}

const formatEUR = (n) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

/**
 * Cuadrante "Escalera de Ofertas / Pricing": visualización de la escalera
 * de valor (Tripwire, Core Offer, High Ticket) con precio y margen de
 * contribución de cada escalón.
 *
 * @param {{ escaleraOfertas: import('../../types/estrategia.js').EscalonOferta[] }} props
 */
export default function EscaleraOfertasPricing({ escaleraOfertas }) {
  return (
    <Card>
      <CardTitle>Escalera de Valor y Precios de Tu Empresa</CardTitle>
      <p className="mt-1 text-xs text-muted">
        Diseño de empaquetación y tarifas de tus servicios orientados a tus clientes finales.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {escaleraOfertas.map((oferta) => {
          const { icono: Icono, acento, borde } = ESTILO_POR_TIPO[oferta.tipo]
          const esCore = oferta.tipo === 'Core Offer'
          return (
            <div
              key={oferta.id}
              className={`flex flex-col rounded-xl border-2 p-4 ${borde} ${esCore ? 'bg-primary/5 sm:-translate-y-1 sm:shadow-md' : 'bg-canvas'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white ${acento}`}>
                  <Icono className="h-4 w-4" />
                </span>
                {esCore && (
                  <Badge className="bg-primary/10 text-primary">Recomendado</Badge>
                )}
              </div>

              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">{oferta.tipo}</p>
              <p className="mt-1 text-sm font-bold text-main">{oferta.nombre}</p>

              <p className="mt-3 text-2xl font-extrabold text-main">
                {formatEUR(oferta.precio)}
                <span className="text-sm font-medium text-muted"> {oferta.periodicidad}</span>
              </p>

              <p className="mt-1 text-xs text-muted">
                Margen de contribución: <span className="font-semibold text-main">{oferta.margenContribucion}%</span>
              </p>

              <p className="mt-3 flex-1 text-[11px] leading-snug text-muted">{oferta.descripcion}</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
