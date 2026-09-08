import { Sparkles } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'

const ESTILO_ESTADO = {
  Activa: 'bg-accent-green/10 text-accent-green',
  'Pendiente de pago': 'bg-accent-amber/10 text-accent-amber',
  Cancelada: 'bg-accent-red/10 text-accent-red',
}

/**
 * Cuadrante "Suscripción": plan contratado y su estado.
 *
 * @param {{ suscripcion: import('../../types/configuracion.js').Suscripcion }} props
 */
export default function SuscripcionCard({ suscripcion }) {
  const { plan, estado, fechaRenovacion, precioMensual } = suscripcion

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Suscripción</CardTitle>
        <Badge className={ESTILO_ESTADO[estado]}>{estado}</Badge>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-lg font-bold text-main">{plan}</p>
          <p className="text-sm text-muted">{precioMensual} €/mes</p>
        </div>
      </div>

      <p className="mt-4 border-t border-card-border pt-3 text-sm text-muted">
        Próximo ciclo de facturación: <span className="font-medium text-main">{fechaRenovacion}</span>
      </p>
    </Card>
  )
}
