import { createContext, useContext, useState } from 'react'
import { PLANES } from '../utils/planes.js'
import { cargarPlan, guardarPlan } from '../utils/persistenciaNavegacion.js'

const PlanContext = createContext(null)

/**
 * Proveedor del plan de suscripción activo (Gating). Por ahora el plan se
 * controla con el selector temporal de pruebas del Header; en producción
 * vendrá de la suscripción real del cliente (Supabase/Stripe).
 *
 * Con `persistir`, el plan elegido sobrevive a una recarga de la pestaña.
 * Sin ello, un F5 estando en Viabilidad con "Launch Total" devolvía el plan
 * a "Report" y el usuario se encontraba el muro de pago en lugar de sus
 * datos. El Modo Consultor no persiste: su plan es siempre el completo.
 *
 * @param {{
 *   children: import('react').ReactNode,
 *   planInicial?: 'report'|'assist'|'total',
 *   persistir?: boolean,
 * }} props
 */
export function PlanProvider({ children, planInicial = 'report', persistir = false }) {
  const [plan, setPlanEstado] = useState(() => (persistir ? cargarPlan(PLANES) : null) ?? planInicial)

  const setPlan = (nuevo) => {
    setPlanEstado(nuevo)
    if (persistir) guardarPlan(nuevo)
  }

  return <PlanContext.Provider value={{ plan, setPlan }}>{children}</PlanContext.Provider>
}

/** Hook de acceso al plan activo y su setter. Debe usarse dentro de `<PlanProvider>`. */
export function usePlan() {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan debe usarse dentro de <PlanProvider>')
  return ctx
}
