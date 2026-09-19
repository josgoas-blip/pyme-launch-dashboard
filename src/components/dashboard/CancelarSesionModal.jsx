import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CalendarX, Loader2, X } from 'lucide-react'
import { MOTIVO_MAXIMO, validarMotivoCancelacion } from '../../services/citaService.js'

/** Elementos que pueden recibir el foco, para mantenerlo dentro del modal. */
const ENFOCABLES = 'button:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

/**
 * Modal para cancelar (o reprogramar) la sesión confirmada.
 *
 * El motivo es obligatorio: llega al equipo de mentoría y queda registrado
 * junto a la cita cancelada. Reprogramar es cancelar y volver a pedir otro
 * día: al confirmar, la tarjeta vuelve al formulario de solicitud.
 *
 * Mismo patrón accesible que el resto de modales del panel: título asociado,
 * foco inicial en el motivo, foco atrapado dentro, Escape para cerrar y foco
 * devuelto al botón que lo abrió. Mientras se cancela no se puede cerrar:
 * cerrar a mitad dejaría la duda de si la cancelación llegó a hacerse.
 *
 * Con `pendiente` se anula una solicitud que el mentor aún no ha aceptado:
 * no hay reserva ni enlace de Meet que liberar, y los textos lo reflejan.
 *
 * @param {{
 *   cuando: string|null,
 *   pendiente?: boolean,
 *   onConfirmar: (motivo: string) => Promise<{ ok: boolean, motivo?: string }>,
 *   onCerrar: () => void,
 * }} props
 */
export default function CancelarSesionModal({ cuando, pendiente = false, onConfirmar, onCerrar }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const dialogo = useRef(null)
  const campoMotivo = useRef(null)
  const enviandoRef = useRef(false)
  enviandoRef.current = enviando
  const onCerrarRef = useRef(onCerrar)
  onCerrarRef.current = onCerrar

  useEffect(() => {
    const anterior = document.activeElement
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    campoMotivo.current?.focus()

    const alPulsarTecla = (e) => {
      if (e.key === 'Escape' && !enviandoRef.current) {
        e.preventDefault()
        onCerrarRef.current()
        return
      }
      if (e.key !== 'Tab' || !dialogo.current) return
      const enfocables = [...dialogo.current.querySelectorAll(ENFOCABLES)]
      if (enfocables.length === 0) return
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alPulsarTecla)
    return () => {
      document.removeEventListener('keydown', alPulsarTecla)
      document.body.style.overflow = overflowAnterior
      if (anterior instanceof HTMLElement) anterior.focus()
    }
  }, [])

  const confirmar = async (e) => {
    e.preventDefault()
    if (enviando) return

    const problema = validarMotivoCancelacion(motivo)
    if (problema) {
      setError(problema)
      campoMotivo.current?.focus()
      return
    }

    setEnviando(true)
    setError(null)
    const resultado = await onConfirmar(motivo)
    setEnviando(false)

    if (!resultado.ok) setError(resultado.motivo ?? 'No se ha podido cancelar la sesión.')
  }

  return createPortal(
    <div
      className="no-imprimir fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !enviando) onCerrar()
      }}
    >
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancelar-sesion-titulo"
        aria-describedby="cancelar-sesion-descripcion"
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-card-border px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <CalendarX className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="cancelar-sesion-titulo" className="text-base font-bold text-[#1F2937]">
                {pendiente ? 'Anular o cambiar la solicitud' : 'Cancelar o reprogramar la sesión'}
              </h2>
              <p id="cancelar-sesion-descripcion" className="mt-0.5 text-xs leading-snug text-[#4B5563]">
                {pendiente
                  ? `${cuando ? `Solicitud para el ${cuando}. ` : ''}Se retirará la solicitud en revisión y podrás elegir un nuevo día y hora al momento.`
                  : `${cuando ? `Sesión del ${cuando}. ` : ''}Se liberará la reserva y podrás elegir un nuevo día y hora al momento. El enlace de Google Meet dejará de valer.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={enviando}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-[#4B5563] transition-colors hover:bg-gray-100 hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={confirmar} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <label htmlFor="motivo-cancelacion" className="text-sm font-semibold text-[#1F2937]">
              {pendiente ? 'Motivo de la anulación' : 'Motivo de la cancelación'} <span className="text-red-600">*</span>
            </label>
            <textarea
              ref={campoMotivo}
              id="motivo-cancelacion"
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value)
                if (error) setError(null)
              }}
              disabled={enviando}
              required
              rows={4}
              maxLength={MOTIVO_MAXIMO}
              placeholder={
                pendiente
                  ? 'Por ejemplo: me equivoqué al elegir la fecha.'
                  : 'Por ejemplo: me ha surgido una reunión con un cliente a esa hora.'
              }
              aria-invalid={error ? 'true' : undefined}
              aria-describedby="motivo-cancelacion-ayuda"
              className={`mt-1 w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:ring-2 disabled:opacity-60 ${
                error ? 'border-red-400 focus:ring-red-200' : 'border-card-border focus:border-primary focus:ring-primary/20'
              }`}
            />
            <p id="motivo-cancelacion-ayuda" className="mt-1 flex justify-between gap-3 text-xs text-[#4B5563]">
              <span>Lo recibirá tu equipo de mentoría.</span>
              <span aria-hidden="true">
                {motivo.trim().length}/{MOTIVO_MAXIMO}
              </span>
            </p>
          </div>

          <div className="border-t border-card-border px-5 py-4">
            {error && (
              <p
                role="alert"
                className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCerrar}
                disabled={enviando}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-50"
              >
                {pendiente ? 'Mantener la solicitud' : 'Mantener la sesión'}
              </button>
              <button
                type="submit"
                disabled={enviando}
                aria-busy={enviando || undefined}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/60 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
              >
                {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {enviando ? (pendiente ? 'Anulando…' : 'Cancelando…') : pendiente ? 'Confirmar anulación' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
