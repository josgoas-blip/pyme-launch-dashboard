import { Card, CardTitle, KpiNumber } from '../ui/Card.jsx'

const formatEUR = (n) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

/**
 * Fila superior de la pestaña "Viabilidad": las 4 métricas principales
 * proyectadas — Punto Muerto, Autonomía, VAN Proyectado y TIR Proyectada.
 * Cifras condicionadas a los Supuestos Clave (panel lateral).
 *
 * @param {{ metricasProyectadas: import('../../types/viabilidad.js').MetricasProyectadas }} props
 */
export default function IndicadoresViabilidad({ metricasProyectadas }) {
  const { puntoMuerto, autonomia, vanProyectado, tirProyectada } = metricasProyectadas

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardTitle>Punto Muerto</CardTitle>
        <KpiNumber className="mt-2">{formatEUR(puntoMuerto)}/mes</KpiNumber>
        <p className="mt-1 text-xs text-muted">Facturación mínima proyectada</p>
      </Card>

      <Card>
        <CardTitle>Autonomía</CardTitle>
        <KpiNumber className="mt-2">{autonomia} días</KpiNumber>
        <p className="mt-1 text-xs text-muted">Reserva de caja sin nuevos ingresos</p>
      </Card>

      <Card>
        <CardTitle>VAN Proyectado</CardTitle>
        <KpiNumber className="mt-2">{formatEUR(vanProyectado)}</KpiNumber>
        <p className="mt-1 text-xs text-muted">Bajo los supuestos utilizados</p>
      </Card>

      <Card>
        <CardTitle>TIR Proyectada</CardTitle>
        <KpiNumber className="mt-2">{tirProyectada}%</KpiNumber>
        <p className="mt-1 text-xs text-muted">Bajo los supuestos utilizados</p>
      </Card>
    </div>
  )
}
