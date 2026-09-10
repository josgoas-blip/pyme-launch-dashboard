import { createContext, useContext, useState } from 'react'

const PlanContext = createContext(null)

/**
 * Proveedor del plan de suscripción activo (Gating). Por ahora el plan se
 * controla con el selector temporal de pruebas del Header; en producción
 * vendrá de la suscripción real del cliente (Supabase/Stripe).
 *
 * @param {{ children: import('react').ReactNode, planInicial?: 'report'|'assist'|'total' }} props
 */
export function PlanProvider({ children, planInicial = 'report' }) {
  const [plan, setPlan] = useState(planInicial)
  return <PlanContext.Provider value={{ plan, setPlan }}>{children}</PlanContext.Provider>
}

/** Hook de acceso al plan activo y su setter. Debe usarse dentro de `<PlanProvider>`. */
export function usePlan() {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan debe usarse dentro de <PlanProvider>')
  return ctx
}
