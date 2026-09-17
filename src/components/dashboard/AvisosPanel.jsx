import { AlertTriangle, ClipboardList, Loader2, RotateCw } from 'lucide-react'
import { Card } from '../ui/Card.jsx'

/**
 * Aviso de que el diagnóstico no se ha podido guardar en Supabase.
 *
 * Antes el fallo solo quedaba en la consola: el usuario seguía viendo su
 * panel, cerraba sesión y al volver se encontraba otra vez con el
 * cuestionario sin saber por qué. Ahora se le dice en cuanto ocurre, con el
 * motivo técnico visible (útil para detectar, por ejemplo, una política RLS
 * que rechaza la escritura) y un botón para reintentar.
 *
 * @param {{
 *   sincronizacion: { estado: 'ok'|'guardando'|'error', motivo?: string },
 *   onReintentar: () => void,
 * }} props
 */
export function AvisoSincronizacion({ sincronizacion, onReintentar }) {
  if (sincronizacion.estado !== 'error' && sincronizacion.estado !== 'guardando') return null

  if (sincronizacion.estado === 'guardando') {
    return (
      <p role="status" className="mb-4 flex items-center gap-2 text-xs text-[#4B5563]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Guardando tu diagnóstico en tu cuenta…
      </p>
    )
  }

  return (
    <div
      role="alert"
      className="mb-6 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#1F2937]">Tu diagnóstico aún no está guardado en tu cuenta</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#4B5563]">
            De momento solo está en este navegador. Si cierras sesión se conservará aquí y se volverá a
            intentar al entrar, pero no lo verás desde otro dispositivo hasta que se guarde.
          </p>
          <p className="mt-1 break-words text-[11px] text-[#4B5563]">Motivo: {sincronizacion.motivo}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReintentar}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
      >
        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  )
}

/**
 * Estado del panel para un cliente con proyecto pero sin diagnóstico.
 *
 * Las pestañas de Análisis, Estrategia y Viabilidad se derivan por completo
 * del diagnóstico. Sin él no se pintan: el adaptador devolvería datos de
 * ejemplo y el usuario los tomaría por suyos. En su lugar se explica qué
 * falta y se ofrece completarlo.
 *
 * @param {{ onEmpezar: () => void, compacto?: boolean }} props
 */
export function DiagnosticoPendiente({ onEmpezar, compacto = false }) {
  return (
    <Card className={compacto ? 'mb-6' : ''}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-[#1F2937]">Completa tu diagnóstico</p>
            <p className="mt-1 text-sm leading-relaxed text-[#4B5563]">
              {compacto
                ? 'Tu proyecto ya está registrado. Responde el diagnóstico para ver tu score, tus riesgos y tu plan de acción.'
                : 'Esta pestaña se calcula a partir de tu diagnóstico. Respóndelo para ver aquí tus resultados.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEmpezar}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
        >
          Empezar diagnóstico
        </button>
      </div>
    </Card>
  )
}
