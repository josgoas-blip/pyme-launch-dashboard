import { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, X } from 'lucide-react'

/** Tiempo en pantalla de un aviso de éxito. Los de error se quedan hasta cerrarlos. */
const DURACION_EXITO_MS = 6000

const TONOS = {
  exito: { fondo: '#ECFDF5', borde: '#6EE7B7', texto: '#065F46', Icono: CheckCircle2 },
  error: { fondo: '#FEF2F2', borde: '#FCA5A5', texto: '#B91C1C', Icono: AlertTriangle },
}

/**
 * Aviso flotante en la esquina inferior (a todo el ancho en móvil).
 *
 * El de error no se cierra solo: lleva la acción de reintentar y
 * desaparecer antes de que el usuario la lea le obligaría a adivinar qué
 * ha pasado.
 *
 * @param {{
 *   tipo: 'exito'|'error',
 *   mensaje: string,
 *   accion?: { etiqueta: string, alPulsar: () => void },
 *   alCerrar: () => void,
 * }} props
 */
export default function Toast({ tipo, mensaje, accion, alCerrar }) {
  const { fondo, borde, texto, Icono } = TONOS[tipo]

  useEffect(() => {
    if (tipo !== 'exito') return undefined
    const temporizador = setTimeout(alCerrar, DURACION_EXITO_MS)
    return () => clearTimeout(temporizador)
  }, [tipo, mensaje, alCerrar])

  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className="fixed inset-x-4 bottom-4 z-50 flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm"
      style={{ backgroundColor: fondo, borderColor: borde, color: texto }}
    >
      <Icono className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{mensaje}</p>
        {accion && (
          <button
            type="button"
            onClick={accion.alPulsar}
            className="mt-2 rounded-md border bg-white px-3 py-1 text-xs font-bold transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2"
            style={{ borderColor: borde, color: texto }}
          >
            {accion.etiqueta}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={alCerrar}
        aria-label="Cerrar aviso"
        className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
