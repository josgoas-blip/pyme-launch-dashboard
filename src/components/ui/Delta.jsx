import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

/**
 * Micro-indicador comparativo bajo una cifra de KPI.
 *
 * Da el contexto que convierte un número en una lectura: no es lo mismo
 * "53 sobre 100" que "7 puntos por debajo del umbral de viabilidad". El
 * objetivo es que el usuario no tenga que hacer la resta mentalmente.
 *
 * El signo lo decide `positivo`, no el valor: hay indicadores donde crecer
 * es malo, así que quien lo usa declara explícitamente qué lado es el
 * bueno.
 *
 * @param {{
 *   valor: number,
 *   texto: string,
 *   positivo: boolean,
 *   unidad?: string,
 *   neutro?: boolean,
 * }} props
 */
export default function Delta({ valor, texto, positivo, unidad = '', neutro = false }) {
  const Icono = neutro ? Minus : positivo ? ArrowUpRight : ArrowDownRight

  const estilo = neutro
    ? 'border-gray-200 bg-gray-50 text-[#4B5563]'
    : positivo
      ? 'border-green-200 bg-green-50 text-green-700'
      : 'border-red-200 bg-red-50 text-red-600'

  const signo = valor > 0 ? '+' : ''

  return (
    <p
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-snug ${estilo}`}
    >
      <Icono className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        {signo}
        {valor}
        {unidad} {texto}
      </span>
    </p>
  )
}
