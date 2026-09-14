/**
 * Tarjeta base reutilizable (design.md: card-border, card-radius, card-shadow, surface-card).
 *
 * El borde es deliberadamente tenue y la sombra mínima: sobre el fondo gris
 * del área de contenido, el contraste de superficie ya separa las tarjetas,
 * y una sombra marcada ensuciaría una cuadrícula con muchas de ellas.
 */
export function Card({ className = '', children }) {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-surface p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * Título de tarjeta (design.md: card-title — text-sm, semibold, text-muted, uppercase, tracking-wider).
 */
export function CardTitle({ className = '', children }) {
  return (
    <p className={`text-sm font-semibold uppercase tracking-wider text-muted ${className}`}>
      {children}
    </p>
  )
}

/**
 * Cifra destacada de KPI (design.md: kpi-number — text-3xl, font-extrabold, text-main).
 */
export function KpiNumber({ className = '', children }) {
  return <p className={`text-3xl font-extrabold text-main ${className}`}>{children}</p>
}

/**
 * Insignia en píldora (design.md: badge-radius — rounded-full).
 */
export function Badge({ className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  )
}
