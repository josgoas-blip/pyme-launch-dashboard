import PaywallCard from './PaywallCard.jsx'

/**
 * Envuelve una sección con contenido real difuminado de fondo (teaser) y una
 * tarjeta de Paywall superpuesta. Usado para el bloqueo parcial dentro de
 * una misma pestaña (p.ej. Análisis para el plan 'report').
 *
 * @param {{
 *   mensaje: string,
 *   planRequerido: 'assist'|'total',
 *   children: import('react').ReactNode,
 * }} props
 */
export default function SeccionBloqueada({ mensaje, planRequerido, children }) {
  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none select-none blur-[3px] opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <PaywallCard mensaje={mensaje} planRequerido={planRequerido} />
      </div>
    </div>
  )
}
