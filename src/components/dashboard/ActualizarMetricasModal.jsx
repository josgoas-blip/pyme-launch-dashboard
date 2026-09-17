import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { CAMPOS_METRICAS, borradorDesdeSnapshot, validarMetricas } from '../../utils/proyectoDashboard.js'

/** Ayuda breve bajo cada campo: qué se mide y en qué unidad. */
const AYUDAS = {
  runway: 'Meses que cubrirías tus gastos personales sin ingresos. Número entero.',
  cobro: 'Días que tardas de media en cobrar una factura. Número entero.',
  conversion: 'Presupuestos aceptados sobre los enviados, de 0 a 100.',
  capacidad: 'Parte de tus horas disponibles que ya facturas, de 0 a 100.',
  concentracion: 'Parte de tu facturación que viene de tu mayor cliente, de 0 a 100.',
}

/** Elementos que pueden recibir el foco, para mantenerlo dentro del modal. */
const ENFOCABLES = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

/**
 * Modal para registrar una medición nueva de las métricas operativas.
 *
 * Se abre con los valores del último snapshot ya escritos: lo habitual es
 * corregir una o dos cifras, no teclear las cinco. Guardar crea una fila
 * nueva en `metric_snapshots` (nunca modifica la anterior), así el
 * histórico queda intacto.
 *
 * Accesibilidad: diálogo modal con título asociado, foco inicial en el
 * primer campo, el foco no se escapa del diálogo con Tab, Escape cierra y
 * el foco vuelve al botón que lo abrió. Cada campo enlaza su ayuda y, si lo
 * hay, su error con `aria-describedby`.
 *
 * Mientras se guarda no se puede cerrar: cerrar a mitad dejaría la duda de
 * si la medición llegó a registrarse.
 *
 * @param {{
 *   snapshot: import('../../utils/proyectoDashboard.js').SnapshotMetricas|null,
 *   nombreProyecto: string|null,
 *   onGuardar: (fila: Record<string, number|null>) => Promise<{ ok: boolean, motivo?: string }>,
 *   onCerrar: () => void,
 *   onGuardado: () => void,
 * }} props
 */
export default function ActualizarMetricasModal({ snapshot, nombreProyecto, onGuardar, onCerrar, onGuardado }) {
  const [borrador, setBorrador] = useState(() => borradorDesdeSnapshot(snapshot))
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const dialogo = useRef(null)
  const primerCampo = useRef(null)
  const guardandoRef = useRef(false)
  guardandoRef.current = guardando

  // Se lee desde una referencia para que el efecto de abajo corra una sola
  // vez: si dependiera de `onCerrar` y el padre pasara una función nueva en
  // cada render, el foco saltaría al primer campo mientras se escribe.
  const onCerrarRef = useRef(onCerrar)
  onCerrarRef.current = onCerrar

  // Foco inicial, bloqueo del scroll de fondo, Escape, trampa de foco y
  // devolución del foco al cerrar.
  useEffect(() => {
    const anterior = document.activeElement
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    primerCampo.current?.focus()

    const alPulsarTecla = (e) => {
      if (e.key === 'Escape' && !guardandoRef.current) {
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

  const actualizar = (id) => (e) => {
    const valor = e.target.value
    setBorrador((b) => ({ ...b, [id]: valor }))
    // El error de un campo desaparece en cuanto se corrige ese campo.
    setErrores((actuales) => {
      if (!actuales[id]) return actuales
      const { [id]: _, ...resto } = actuales
      return resto
    })
    setErrorGeneral(null)
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (guardando) return

    const validacion = validarMetricas(borrador)
    if (!validacion.ok) {
      setErrores(validacion.errores)
      setErrorGeneral(validacion.general ?? null)
      // Se lleva el foco al primer campo con error, para no obligar a
      // buscarlo en un formulario de cinco campos.
      const primeroConError = CAMPOS_METRICAS.find((c) => validacion.errores[c.id])
      if (primeroConError) document.getElementById(`metrica-${primeroConError.id}`)?.focus()
      return
    }

    setGuardando(true)
    setErrorGeneral(null)
    const resultado = await onGuardar(validacion.fila)
    setGuardando(false)

    if (!resultado.ok) {
      setErrorGeneral(resultado.motivo ?? 'No se ha podido guardar la medición.')
      return
    }

    onGuardado()
  }

  return createPortal(
    <div
      className="no-imprimir fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !guardando) onCerrar()
      }}
    >
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="actualizar-metricas-titulo"
        aria-describedby="actualizar-metricas-descripcion"
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-card-border px-5 py-4">
          <div className="min-w-0">
            <h2 id="actualizar-metricas-titulo" className="text-base font-bold text-[#1F2937]">
              Actualizar métricas
            </h2>
            <p id="actualizar-metricas-descripcion" className="mt-0.5 text-xs leading-snug text-[#4B5563]">
              {nombreProyecto ? `${nombreProyecto}. ` : ''}Se guardará como una medición nueva; las anteriores
              se conservan en el histórico.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-[#4B5563] transition-colors hover:bg-gray-100 hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={guardar} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {CAMPOS_METRICAS.map((campo, indice) => {
              const error = errores[campo.id]
              const idAyuda = `metrica-${campo.id}-ayuda`
              const idError = `metrica-${campo.id}-error`

              return (
                <div key={campo.id}>
                  <label htmlFor={`metrica-${campo.id}`} className="text-sm font-semibold text-[#1F2937]">
                    {campo.etiqueta}
                  </label>
                  <div className="relative mt-1">
                    <input
                      ref={indice === 0 ? primerCampo : undefined}
                      id={`metrica-${campo.id}`}
                      type="text"
                      // Texto con teclado numérico y no type="number": este
                      // último no acepta la coma decimal en todos los
                      // navegadores y convierte un "14,3" en vacío.
                      inputMode={campo.tipo === 'entero' ? 'numeric' : 'decimal'}
                      autoComplete="off"
                      value={borrador[campo.id]}
                      onChange={actualizar(campo.id)}
                      disabled={guardando}
                      placeholder="Sin medir"
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={error ? `${idError} ${idAyuda}` : idAyuda}
                      className={`w-full rounded-lg border bg-white py-2 pl-3 pr-16 text-sm text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:ring-2 disabled:opacity-60 ${
                        error ? 'border-red-400 focus:ring-red-200' : 'border-card-border focus:border-primary focus:ring-primary/20'
                      }`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#4B5563]">
                      {campo.unidad}
                    </span>
                  </div>
                  {error && (
                    <p id={idError} className="mt-1 text-xs font-semibold text-red-700">
                      {error}
                    </p>
                  )}
                  <p id={idAyuda} className="mt-1 text-xs text-[#4B5563]">
                    {AYUDAS[campo.id]}
                  </p>
                </div>
              )
            })}

            <p className="text-xs text-[#4B5563]">Deja vacío un campo si no lo has medido esta vez.</p>
          </div>

          <div className="border-t border-card-border px-5 py-4">
            {errorGeneral && (
              <p
                role="alert"
                className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {errorGeneral}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCerrar}
                disabled={guardando}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                aria-busy={guardando || undefined}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
              >
                {guardando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {guardando ? 'Guardando…' : 'Guardar actualización'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
