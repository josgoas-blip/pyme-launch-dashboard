import { useState } from 'react'
import { RotateCcw, Check, X } from 'lucide-react'

/**
 * Acción "Nuevo diagnóstico" de la cabecera: devuelve al cuestionario y
 * borra la sesión guardada en este navegador.
 *
 * Pide confirmación en dos pasos —no un `confirm()` nativo— porque desde
 * que el diagnóstico persiste en localStorage la acción ya no es
 * reversible con una recarga: un clic accidental costaría repetir las 20
 * preguntas. El segundo paso dice explícitamente qué se pierde.
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
        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <RotateCcw className="h-3 w-3 shrink-0" />
        Nuevo diagnóstico
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/15 p-1 pl-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
        ¿Empezar de cero?
      </span>
      <button
        type="button"
        onClick={onConfirmar}
        className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <Check className="h-3 w-3 shrink-0" />
        Sí, borrar
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        aria-label="Cancelar"
        className="inline-flex items-center rounded-full px-2 py-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <X className="h-3 w-3 shrink-0" />
      </button>
    </div>
  )
}
