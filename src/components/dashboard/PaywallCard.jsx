import { Lock } from 'lucide-react'
import { usePlan } from '../../context/PlanContext.jsx'
import { PLAN_INFO } from '../../utils/planes.js'

/**
 * Tarjeta de bloqueo (Paywall) reutilizable: icono de candado, mensaje y CTA
 * hacia el plan requerido. El CTA es una simulación local (no hay checkout
 * real todavía): solo actualiza el plan de pruebas del Header.
 *
 * @param {{
 *   mensaje: string,
 *   planRequerido: 'assist'|'total',
 *   titulo?: string,
 *   className?: string,
 * }} props
 */
export default function PaywallCard({ mensaje, planRequerido, titulo, className = '' }) {
  const { setPlan } = usePlan()
  const nombrePlan = PLAN_INFO[planRequerido].nombre

  return (
    <div
      className={`mx-auto flex max-w-sm flex-col items-center gap-3 rounded-xl border border-primary/20 bg-surface p-6 text-center shadow-lg ${className}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lock className="h-5 w-5" />
      </span>
      <p className="text-sm font-bold text-main">{titulo ?? `Contenido de ${nombrePlan}`}</p>
      <p className="text-xs leading-snug text-muted">{mensaje}</p>
      <button
        type="button"
        onClick={() => setPlan(planRequerido)}
        className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Mejorar a {nombrePlan}
      </button>
    </div>
  )
}
