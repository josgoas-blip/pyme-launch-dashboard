import { useState } from 'react'
import { RotateCcw, Check, X } from 'lucide-react'

/**
 * Acción "Nuevo diagnóstico" de la barra superior: devuelve al cuestionario
 * y borra la sesión guardada en este navegador.
 *
 * Pide confirmación en dos pasos —no un `confirm()` nativo— porque desde
 * que el diagnóstico persiste en localStorage la acción ya no es
 * reversible con una recarga: un clic accidental costaría repetir las 20
 * preguntas. El segundo paso dice explícitamente qué se pierde.
 *
 * Los colores son los de un fondo claro: vive en la barra superior blanca
 * del área de contenido, no en la antigua cabecera verde.
 *
 * @param {{ onConfirmar: () => void }} props
 */
export default function BotonNuevoDiagnostico({ onConfirmar }) {
  const [confirmando, setConfirmando] = useState(false)

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        title="Vuelve a empezar el cuestionario desde cero"
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#1F2937] transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <RotateCcw className="h-3 w-3 shrink-0" />
        Nuevo diagnóstico
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-accent-red/30 bg-red-50 p-1 pl-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1F2937]">
        ¿Empezar de cero?
      </span>
      <button
        type="button"
        onClick={onConfirmar}
        className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/60"
      >
        <Check className="h-3 w-3 shrink-0" />
        Sí, borrar
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        aria-label="Cancelar"
        className="inline-flex items-center rounded-full px-2 py-1 text-[#4B5563] transition-colors hover:bg-white hover:text-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <X className="h-3 w-3 shrink-0" />
      </button>
    </div>
  )
}
