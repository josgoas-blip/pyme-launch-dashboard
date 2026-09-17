import { useState } from 'react'
import { Check, ArrowRight, Flag, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'
import { useNavegacion } from '../../context/NavegacionContext.jsx'
import { cargarHitosCompletados, guardarHitosCompletados } from '../../utils/persistenciaHitos.js'

/** Color semafórico por prioridad, igual que en el Plan de Acción. */
const ESTILO_PRIORIDAD = {
  Alta: 'bg-red-100 text-red-700',
  Media: 'bg-amber-100 text-amber-800',
  Baja: 'bg-green-100 text-green-700',
}

/** Estilo neutro para las categorías de los hitos del proyecto. */
const ESTILO_CATEGORIA = 'bg-primary/10 text-primary'

/**
 * Lista marcable de hitos con barra de avance. Es la parte común a las dos
 * fuentes de hitos; cada una le pasa sus elementos ya preparados.
 *
 * @param {{
 *   titulo: string,
 *   subtitulo: string,
 *   elementos: Array<{
 *     id: string, titulo: string, hecho: boolean, guardando?: boolean,
 *     etiqueta?: string|null, claseEtiqueta?: string, detalle?: string|null,
 *     origen?: string|null,
 *   }>,
 *   onAlternar: (id: string) => void,
 *   error?: string|null,
 *   pie?: import('react').ReactNode,
 * }} props
 */
function ListaHitos({ titulo, subtitulo, elementos, onAlternar, error = null, pie = null }) {
  const { irAPestana } = useNavegacion()

  const hechos = elementos.filter((e) => e.hecho).length
  const avance = elementos.length ? Math.round((hechos / elementos.length) * 100) : 0

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{titulo}</CardTitle>
          <p className="mt-1 text-xs text-[#4B5563]">{subtitulo}</p>
        </div>
        <Badge
          className={
            hechos === elementos.length ? 'shrink-0 bg-green-100 text-green-700' : 'shrink-0 bg-primary/10 text-primary'
          }
        >
          {hechos} de {elementos.length} completados
        </Badge>
      </div>

      {/* Avance global de la hoja de ruta */}
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuenow={avance}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance de la hoja de ruta"
      >
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${avance}%` }} />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <ul className="mt-4 divide-y divide-card-border">
        {elementos.map((elemento) => (
          <li key={elemento.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
            {/* Casilla de estado */}
            <button
              type="button"
              onClick={() => onAlternar(elemento.id)}
              disabled={elemento.guardando}
              role="checkbox"
              aria-checked={elemento.hecho}
              aria-busy={elemento.guardando || undefined}
              aria-label={`Marcar como completado: ${elemento.titulo}`}
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-wait ${
                elemento.hecho ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white hover:border-primary'
              }`}
            >
              {elemento.guardando ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                elemento.hecho && <Check className="h-3.5 w-3.5" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={`text-sm font-bold leading-snug ${
                    elemento.hecho ? 'text-[#4B5563] line-through' : 'text-[#1F2937]'
                  }`}
                >
                  {elemento.titulo}
                </p>
                {elemento.etiqueta && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${elemento.claseEtiqueta}`}
                  >
                    {elemento.etiqueta}
                  </span>
                )}
              </div>

              {elemento.detalle && <p className="mt-1 text-xs leading-snug text-[#4B5563]">{elemento.detalle}</p>}
            </div>

            {elemento.origen && (
              <button
                type="button"
                onClick={() =>
                  irAPestana(elemento.origen.toLowerCase() === 'análisis' ? 'analisis' : elemento.origen.toLowerCase())
                }
                title={`Ver la evidencia en ${elemento.origen}`}
                aria-label={`Ver la evidencia en ${elemento.origen}`}
                className="mt-0.5 hidden shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:inline-flex"
              >
                {elemento.origen}
                <ArrowRight className="h-3 w-3 shrink-0" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {pie}
    </Card>
  )
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })

/**
 * Hoja de ruta con dos fuentes, por este orden:
 *
 *   1. Los hitos del proyecto en `project_milestones`, si el proyecto
 *      activo tiene alguno. Marcarlos se guarda en Supabase (con
 *      actualización optimista que se deshace si el guardado falla).
 *   2. Si no, los hitos de supervivencia de los primeros 30 días derivados
 *      del diagnóstico, con el avance guardado en el navegador, como hasta
 *      ahora.
 *
 * Mientras se consulta el proyecto se muestra la carga en lugar de la
 * lista del diagnóstico: pintarla y sustituirla un instante después por la
 * del proyecto haría saltar la tarjeta con otros hitos.
 *
 * @param {{
 *   plan: ReturnType<typeof import('../../utils/planAccionDiagnostico.js').derivarPlanAccion>,
 *   proyecto?: ReturnType<typeof import('../../hooks/useProjectDashboard.js').useProjectDashboard>,
 * }} props
 */
export default function HojaRutaHitos({ plan, proyecto = null }) {
  const { irAPestana } = useNavegacion()
  const [completados, setCompletados] = useState(cargarHitosCompletados)

  if (proyecto?.estado === 'cargando') {
    return (
      <Card>
        <CardTitle>Hoja de ruta</CardTitle>
        <div className="mt-4 space-y-3" aria-hidden="true">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </Card>
    )
  }

  // ── 1. Hitos del proyecto ───────────────────────────────────────────
  if (proyecto?.estado === 'ok' && proyecto.hitos.length > 0) {
    const elementos = proyecto.hitos.map((hito) => ({
      id: hito.id,
      titulo: hito.titulo,
      hecho: hito.completado,
      guardando: proyecto.hitosGuardando.includes(hito.id),
      etiqueta: hito.categoria,
      claseEtiqueta: ESTILO_CATEGORIA,
      detalle:
        hito.completado && hito.completadoEn && Number.isFinite(new Date(hito.completadoEn).getTime())
          ? `Completado el ${FORMATO_FECHA.format(new Date(hito.completadoEn))}`
          : null,
    }))

    return (
      <ListaHitos
        titulo="Hoja de ruta del proyecto"
        subtitulo={`Hitos de ${proyecto.proyecto?.nombre ?? 'tu proyecto'}`}
        elementos={elementos}
        onAlternar={proyecto.alternarHito}
        error={proyecto.errorHito}
      />
    )
  }

  // ── 2. Hitos derivados del diagnóstico ──────────────────────────────
  const hitos = plan?.horizontes?.find((h) => h.id === 'inmediato')?.acciones ?? []

  if (hitos.length === 0) {
    return (
      <Card>
        <CardTitle>Hoja de ruta · primeros 30 días</CardTitle>
        <p className="mt-3 text-sm text-[#4B5563]">
          Completa el diagnóstico para ver los hitos prioritarios de tu arranque.
        </p>
      </Card>
    )
  }

  const alternar = (id) => {
    const siguiente = completados.includes(id) ? completados.filter((hecho) => hecho !== id) : [...completados, id]
    setCompletados(siguiente)
    guardarHitosCompletados(siguiente)
  }

  return (
    <ListaHitos
      titulo="Hoja de ruta · primeros 30 días"
      subtitulo="Tus hitos de supervivencia inmediata, derivados del diagnóstico"
      elementos={hitos.map((hito) => ({
        id: hito.id,
        titulo: hito.titulo,
        hecho: completados.includes(hito.id),
        etiqueta: hito.prioridad,
        claseEtiqueta: ESTILO_PRIORIDAD[hito.prioridad] ?? ESTILO_PRIORIDAD.Media,
        // La respuesta del diagnóstico que motiva el hito
        detalle: hito.justificacion,
        origen: hito.origen ?? 'Estrategia',
      }))}
      onAlternar={alternar}
      pie={
        <button
          type="button"
          onClick={() => irAPestana('estrategia')}
          className="mt-4 inline-flex items-center gap-1.5 border-t border-card-border pt-3 text-xs font-bold text-primary underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <Flag className="h-3.5 w-3.5 shrink-0" />
          Ver el plan completo a 6 meses en Estrategia
        </button>
      }
    />
  )
}
