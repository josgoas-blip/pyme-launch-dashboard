import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { RotateCcw, AlertTriangle } from 'lucide-react'

/**
 * Acción "Nuevo diagnóstico" de la barra superior.
 *
 * Abre un modal de confirmación antes de salir del panel. Si confirma, se
 * abre el cuestionario como reevaluación, con las respuestas del último
 * diagnóstico ya marcadas; el panel no cambia hasta que guarda la nueva
 * evaluación. Las evaluaciones ya guardadas en Supabase no se borran.
 *
 * El modal se monta con un portal en `document.body`: la barra superior
 * usa `backdrop-blur`, y un `backdrop-filter` convierte al elemento en
 * contenedor de sus descendientes `position: fixed`. Sin el portal, el
 * fondo oscuro del modal quedaría recortado al alto de la barra.
 *
 * @param {{ onConfirmar: () => void }} props
 */
export default function BotonNuevoDiagnostico({ onConfirmar }) {
  const [abierto, setAbierto] = useState(false)
  const botonCancelar = useRef(null)
  const botonDisparador = useRef(null)

  // Accesibilidad del diálogo: foco en la opción segura al abrir, cierre
  // con Escape y foco devuelto al botón que lo abrió al cerrar.
  useEffect(() => {
    if (!abierto) return undefined

    botonCancelar.current?.focus()
    const alPulsarTecla = (e) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('keydown', alPulsarTecla)

    const disparador = botonDisparador.current
    return () => {
      document.removeEventListener('keydown', alPulsarTecla)
      disparador?.focus()
    }
  }, [abierto])

  const confirmar = () => {
    setAbierto(false)
    onConfirmar()
  }

  return (
    <>
      <button
        ref={botonDisparador}
        type="button"
        onClick={() => setAbierto(true)}
        title="Crea una nueva evaluación partiendo de tus respuestas actuales"
        aria-haspopup="dialog"
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#1F2937] transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <RotateCcw className="h-3 w-3 shrink-0" />
        Nuevo diagnóstico
      </button>

      {abierto &&
        createPortal(
          <div
            className="no-imprimir fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={(e) => {
              // Solo el clic en el fondo cierra; no el de dentro del cuadro.
              if (e.target === e.currentTarget) setAbierto(false)
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="nuevo-diagnostico-titulo"
              aria-describedby="nuevo-diagnostico-descripcion"
              className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 id="nuevo-diagnostico-titulo" className="text-base font-bold text-[#1F2937]">
                    ¿Deseas reiniciar tu diagnóstico?
                  </h2>
                  <p id="nuevo-diagnostico-descripcion" className="mt-1 text-sm leading-relaxed text-[#4B5563]">
                    Se creará una nueva evaluación. Volverás al cuestionario con tus respuestas
                    actuales ya marcadas, para cambiar solo lo que haya evolucionado; tus
                    evaluaciones anteriores seguirán guardadas.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  ref={botonCancelar}
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmar}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/60 focus-visible:ring-offset-2"
                >
                  Sí, reiniciar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
