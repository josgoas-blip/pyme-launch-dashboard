import { Card, CardTitle, Badge } from '../ui/Card.jsx'

const formatEUR = (n) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

/** Salud del ratio LTV/CAC (benchmark habitual: <3x ajustado, 3-5x saludable, >5x excelente). */
function saludRatio(ratio) {
  if (ratio < 3) return { etiqueta: 'Ajustado', className: 'bg-accent-red/10 text-accent-red' }
  if (ratio <= 5) return { etiqueta: 'Saludable', className: 'bg-accent-amber/10 text-accent-amber' }
  return { etiqueta: 'Excelente', className: 'bg-accent-green/10 text-accent-green' }
}

/**
 * Cuadrante "Matriz de Canales de Captación": tabla con Inversión Estimada,
 * CAC por Canal, ratio LTV/CAC y ROAS Objetivo de cada canal digital.
 *
 * @param {{ canalesCaptacion: import('../../types/estrategia.js').CanalCaptacion[] }} props
 */
export default function MatrizCanalesCaptacion({ canalesCaptacion }) {
  return (
    <Card>
      <CardTitle>Canales de Captación</CardTitle>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-card-border text-left text-xs font-semibold uppercase tracking-wider text-muted">
              <th className="py-2 pr-3">Canal</th>
              <th className="px-3 py-2 text-right">Inversión Estimada</th>
              <th className="px-3 py-2 text-right">CAC</th>
              <th className="px-3 py-2 text-right">LTV/CAC</th>
              <th className="px-3 py-2 text-right">ROAS Objetivo</th>
              <th className="py-2 pl-3 text-right">Salud</th>
            </tr>
          </thead>
          <tbody>
            {canalesCaptacion.map((canal) => {
              const salud = saludRatio(canal.ltvCacRatio)
              return (
                <tr key={canal.id} className="border-b border-card-border last:border-0">
                  <td className="py-3 pr-3 font-medium text-main">{canal.canal}</td>
                  <td className="px-3 py-3 text-right text-main">{formatEUR(canal.inversionEstimada)}/mes</td>
                  <td className="px-3 py-3 text-right text-muted">{formatEUR(canal.cacCanal)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-main">{canal.ltvCacRatio.toFixed(1)}x</td>
                  <td className="px-3 py-3 text-right text-muted">{canal.roasObjetivo.toFixed(1)}x</td>
                  <td className="py-3 pl-3 text-right">
                    <Badge className={salud.className}>{salud.etiqueta}</Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
