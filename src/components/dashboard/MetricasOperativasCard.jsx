import { AlertTriangle, CheckCircle2, CircleDashed, Info, RotateCw } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'
import PistaTermino from '../ui/PistaTermino.jsx'
import { explicar } from '../../utils/glosario.js'

/**
 * Presentación de cada estado. El icono acompaña siempre al color: el
 * semáforo tiene que leerse también sin distinguir rojo de verde.
 */
const ESTADOS = {
  bien: { texto: 'En zona sana', clase: 'bg-green-100 text-green-700', icono: CheckCircle2 },
  atencion: { texto: 'Vigilar', clase: 'bg-amber-100 text-amber-800', icono: Info },
  riesgo: { texto: 'Riesgo', clase: 'bg-red-100 text-red-700', icono: AlertTriangle },
  'sin-dato': { texto: 'Sin registrar', clase: 'bg-gray-100 text-[#4B5563]', icono: CircleDashed },
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Madrid',
})

function fechaLegible(iso) {
  const fecha = iso ? new Date(iso) : null
  return fecha && Number.isFinite(fecha.getTime()) ? FORMATO_FECHA.format(fecha) : null
}

/** Una métrica: nombre, cifra, estado y el criterio con el que se evalúa. */
function TarjetaMetrica({ metrica }) {
  const estilo = ESTADOS[metrica.estado] ?? ESTADOS['sin-dato']
  const Icono = estilo.icono
  const pista = explicar(metrica.id)

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-card-border bg-white p-4">
      <div className="flex items-start gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#4B5563]">{metrica.etiqueta}</p>
        {pista && <PistaTermino texto={pista} etiqueta={metrica.etiqueta} />}
      </div>

      <p className={`mt-2 text-2xl font-bold ${metrica.valorTexto ? 'text-[#1F2937]' : 'text-[#9CA3AF]'}`}>
        {metrica.valorTexto ?? '—'}
      </p>

      <span
        className={`mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${estilo.clase}`}
      >
        <Icono className="h-3 w-3 shrink-0" aria-hidden="true" />
        {estilo.texto}
      </span>

      <p className="mt-2 text-xs leading-snug text-[#4B5563]">{metrica.criterio}</p>
    </div>
  )
}

/**
 * Métricas operativas del proyecto: el último snapshot registrado en
 * `metric_snapshots`, con cada cifra evaluada contra un umbral orientativo.
 *
 * Son datos de seguimiento, no del diagnóstico: por eso van en su propia
 * tarjeta, con la fecha del registro, y no mezcladas con las cifras que
 * salen del cuestionario.
 *
 * Nunca inventa cifras: sin proyecto o sin snapshot lo dice, y una métrica
 * sin valor se muestra como "Sin registrar".
 *
 * @param {{ datos: ReturnType<typeof import('../../hooks/useProjectDashboard.js').useProjectDashboard> }} props
 */
export default function MetricasOperativasCard({ datos }) {
  const { estado, proyecto, snapshot, metricas, recargar } = datos

  // En Modo Consultor el enlace no identifica al usuario del proyecto.
  if (estado === 'no-disponible') return null

  const encabezado = (subtitulo, extra = null) => (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <CardTitle>Métricas operativas</CardTitle>
        <p className="mt-1 text-xs text-[#4B5563]">{subtitulo}</p>
      </div>
      {extra}
    </div>
  )

  if (estado === 'cargando') {
    return (
      <Card>
        {encabezado('Cargando las métricas de tu proyecto…')}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </Card>
    )
  }

  if (estado === 'error') {
    return (
      <Card>
        {encabezado('No se han podido cargar las métricas de tu proyecto.')}
        <button
          type="button"
          onClick={recargar}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
          Reintentar
        </button>
      </Card>
    )
  }

  if (estado === 'sin-proyecto') {
    return (
      <Card>
        {encabezado(
          'Todavía no hay un proyecto registrado en tu cuenta. Cuando lo haya, aquí verás su runway personal, cobros, conversión, capacidad y dependencia de clientes.',
        )}
      </Card>
    )
  }

  const fecha = fechaLegible(snapshot?.registradoEn)
  const contexto = [proyecto?.nombre, proyecto?.sector].filter(Boolean).join(' · ')

  if (!snapshot) {
    return (
      <Card>
        {encabezado(
          `${contexto}. Aún no se ha registrado ninguna medición de métricas para este proyecto.`,
        )}
      </Card>
    )
  }

  const enRiesgo = metricas.filter((m) => m.estado === 'riesgo').length

  return (
    <Card>
      {encabezado(
        `${contexto}${fecha ? ` · medición del ${fecha}` : ''}`,
        enRiesgo > 0 ? (
          <Badge className="shrink-0 bg-red-100 text-red-700">
            {enRiesgo} {enRiesgo === 1 ? 'métrica en riesgo' : 'métricas en riesgo'}
          </Badge>
        ) : null,
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metricas.map((metrica) => (
          <TarjetaMetrica key={metrica.id} metrica={metrica} />
        ))}
      </div>

      <p className="mt-3 text-[11px] text-[#4B5563]">
        Umbrales orientativos para un negocio pequeño de servicios; ajústalos a tu sector.
      </p>
    </Card>
  )
}
