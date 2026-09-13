import { FlaskConical } from 'lucide-react'

/**
 * Encabeza una sección cuyos cuadrantes se pintan todavía con datos de
 * referencia sectorial, no con respuestas del usuario.
 *
 * Es un aviso de honestidad, no un paywall: el contenido sigue visible
 * —sirve para entender qué dará el módulo cuando esté calibrado— pero
 * queda dicho, antes de leerlo, que esas cifras no salen del diagnóstico.
 * Sin este rótulo un PESTEL de referencia parecería un análisis del
 * proyecto concreto, que es justo la confusión que el PMV debe evitar.
 *
 * @param {{ titulo?: string, mensaje: string }} props
 */
export default function AvisoModuloPendiente({ titulo = 'Módulo en calibración sectorial', mensaje }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-accent-amber/30 bg-accent-amber/5 p-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-amber/15 text-accent-amber">
        <FlaskConical className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#1F2937]">{titulo}</p>
        <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">{mensaje}</p>
      </div>
    </div>
  )
}
