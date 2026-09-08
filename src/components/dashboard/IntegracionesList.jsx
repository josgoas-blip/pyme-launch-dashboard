import { useState } from 'react'
import { Plug, CheckCircle2, XCircle, Zap } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'

/**
 * Cuadrante "Integraciones": estado de las conexiones activas del sistema
 * (n8n, Supabase, Stripe), con botón "Testear Webhook" para las
 * integraciones basadas en webhooks (n8n).
 *
 * El test es una simulación local (sin llamada de red real): la
 * verificación contra el endpoint real de n8n se conectará en la Fase 5.
 *
 * @param {{ integraciones: import('../../types/configuracion.js').Integracion[] }} props
 */
export default function IntegracionesList({ integraciones }) {
  const [testeando, setTesteando] = useState(null)
  const [probado, setProbado] = useState(null)

  const testearWebhook = (id) => {
    setTesteando(id)
    setProbado(null)
    setTimeout(() => {
      setTesteando(null)
      setProbado(id)
    }, 900)
  }

  return (
    <Card>
      <CardTitle>Integraciones</CardTitle>

      <ul className="mt-4 divide-y divide-card-border">
        {integraciones.map((integracion) => {
          const conectado = integracion.estado === 'Conectado'
          return (
            <li key={integracion.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Plug className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-main">{integracion.nombre}</p>
                  <p className="truncate text-xs text-muted">{integracion.descripcion}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {integracion.webhookTesteable && conectado && (
                  <button
                    type="button"
                    onClick={() => testearWebhook(integracion.id)}
                    disabled={testeando === integracion.id}
                    className="flex items-center gap-1.5 rounded-full border border-primary/30 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-60"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {testeando === integracion.id
                      ? 'Probando…'
                      : probado === integracion.id
                        ? 'Webhook OK ✓'
                        : 'Testear Webhook'}
                  </button>
                )}
                <Badge
                  className={
                    conectado ? 'bg-accent-green/10 text-accent-green' : 'bg-muted/10 text-muted'
                  }
                >
                  {conectado ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {integracion.estado}
                </Badge>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
