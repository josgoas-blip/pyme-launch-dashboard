import { useState } from 'react'
import { Check, ArrowRight, Flag } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'
import { useNavegacion } from '../../context/NavegacionContext.jsx'
import { cargarHitosCompletados, guardarHitosCompletados } from '../../utils/persistenciaHitos.js'

/** Color semafórico por prioridad, igual que en el Plan de Acción. */
const ESTILO_PRIORIDAD = {
  Alta: 'bg-red-100 text-red-700',
  Media: 'bg-amber-100 text-amber-800',
  Baja: 'bg-green-100 text-green-700',
}

/**
 * Hoja de ruta de supervivencia: los hitos de los primeros 30 días como
 * lista marcable.
 *
 * Las acciones llegan ya derivadas del diagnóstico —no se calcula nada
 * aquí—; lo que añade este componente es el seguimiento: cada hito se
 * puede marcar como hecho y el avance se guarda en el navegador, así que
 * el emprendedor ve su progreso al volver en lugar de una lista que no
 * cambia nunca.
 *
 * El estado arranca de `localStorage` con un inicializador perezoso: se
 * lee en el primer render, no en cada uno.
 *
 * @param {{ plan: ReturnType<typeof import('../../utils/planAccionDiagnostico.js').derivarPlanAccion> }} props
 */
export default function HojaRutaHitos({ plan }) {
  const { irAPestana } = useNavegacion()
  const [completados, setCompletados] = useState(cargarHitosCompletados)

  const hitos = plan?.horizontes?.find((h) => h.id === 'inmediato')?.acciones ?? []

  const alternar = (id) => {
    const siguiente = completados.includes(id)
      ? completados.filter((hecho) => hecho !== id)
      : [...completados, id]

    setCompletados(siguiente)
    guardarHitosCompletados(siguiente)
  }

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

  const hechos = hitos.filter((hito) => completados.includes(hito.id)).length
  const avance = Math.round((hechos / hitos.length) * 100)

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Hoja de ruta · primeros 30 días</CardTitle>
          <p className="mt-1 text-xs text-[#4B5563]">
            Tus hitos de supervivencia inmediata, derivados del diagnóstico
          </p>
        </div>
        <Badge className={hechos === hitos.length ? 'shrink-0 bg-green-100 text-green-700' : 'shrink-0 bg-primary/10 text-primary'}>
          {hechos} de {hitos.length} completados
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
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${avance}%` }}
        />
      </div>

      <ul className="mt-4 divide-y divide-card-border">
        {hitos.map((hito) => {
          const hecho = completados.includes(hito.id)

          return (
            <li key={hito.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
              {/* Casilla de estado */}
              <button
                type="button"
                onClick={() => alternar(hito.id)}
                role="checkbox"
                aria-checked={hecho}
                aria-label={`Marcar como completado: ${hito.titulo}`}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                  hecho
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 bg-white hover:border-primary'
                }`}
              >
                {hecho && <Check className="h-3.5 w-3.5" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`text-sm font-bold leading-snug ${
                      hecho ? 'text-[#4B5563] line-through' : 'text-[#1F2937]'
                    }`}
                  >
                    {hito.titulo}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      ESTILO_PRIORIDAD[hito.prioridad] ?? ESTILO_PRIORIDAD.Media
                    }`}
                  >
                    {hito.prioridad}
                  </span>
                </div>

                {/* La respuesta del diagnóstico que motiva el hito */}
                <p className="mt-1 text-xs leading-snug text-[#4B5563]">{hito.justificacion}</p>
              </div>

              <button
                type="button"
                onClick={() => irAPestana(hito.origen?.toLowerCase() === 'análisis' ? 'analisis' : hito.origen?.toLowerCase() ?? 'estrategia')}
                title={`Ver la evidencia en ${hito.origen}`}
                aria-label={`Ver la evidencia en ${hito.origen}`}
                className="mt-0.5 hidden shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:inline-flex"
              >
                {hito.origen}
                <ArrowRight className="h-3 w-3 shrink-0" />
              </button>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={() => irAPestana('estrategia')}
        className="mt-4 inline-flex items-center gap-1.5 border-t border-card-border pt-3 text-xs font-bold text-primary underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <Flag className="h-3.5 w-3.5 shrink-0" />
        Ver el plan completo a 6 meses en Estrategia
      </button>
    </Card>
  )
}
