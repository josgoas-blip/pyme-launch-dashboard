import { AlertTriangle, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'
import { useNavegacion } from '../../context/NavegacionContext.jsx'
import { contarCriticos } from '../../utils/riesgosDiagnostico.js'

/** Estilos por severidad. Crítico detiene el proyecto; aviso lo condiciona. */
const ESTILO = {
  critico: {
    Icono: AlertTriangle,
    caja: 'border-red-200 bg-red-50',
    icono: 'text-red-600',
    etiqueta: 'Crítico',
    insignia: 'bg-red-100 text-red-700',
  },
  aviso: {
    Icono: AlertCircle,
    caja: 'border-amber-200 bg-amber-50',
    icono: 'text-accent-amber',
    etiqueta: 'Aviso',
    insignia: 'bg-amber-100 text-amber-800',
  },
}

/**
 * Panel "Riesgos Críticos Activos".
 *
 * Recoge en un solo sitio lo que antes se leía suelto dentro del desglose
 * de dimensiones: cada penalización del modelo, con su gravedad, la
 * respuesta que la provoca, qué hacer para cerrarla y un acceso directo a
 * la pestaña donde se resuelve. Un riesgo que no dice adónde ir obliga al
 * usuario a buscarlo, y ahí es donde se abandona.
 *
 * @param {{ riesgos: ReturnType<typeof import('../../utils/riesgosDiagnostico.js').derivarRiesgosActivos> }} props
 */
export default function RiesgosActivos({ riesgos }) {
  const { irAPestana } = useNavegacion()
  const lista = riesgos ?? []
  const criticos = contarCriticos(lista)

  // Sin diagnóstico no se puede afirmar que no haya riesgos.
  if (riesgos === null) {
    return (
      <Card>
        <CardTitle>Riesgos críticos activos</CardTitle>
        <p className="mt-3 text-sm text-[#4B5563]">
          Completa el diagnóstico para ver qué riesgos críticos tiene tu proyecto.
        </p>
      </Card>
    )
  }

  if (lista.length === 0) {
    return (
      <Card>
        <CardTitle>Riesgos críticos activos</CardTitle>
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
          <p className="text-sm font-semibold leading-snug text-[#1F2937]">
            Ninguna de tus respuestas activa las penalizaciones del modelo.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <CardTitle>Riesgos críticos activos</CardTitle>
        <Badge
          className={
            criticos > 0 ? 'shrink-0 bg-red-100 text-red-700' : 'shrink-0 bg-amber-100 text-amber-800'
          }
        >
          {criticos > 0
            ? `${criticos} ${criticos === 1 ? 'riesgo crítico' : 'riesgos críticos'}`
            : `${lista.length} ${lista.length === 1 ? 'aviso' : 'avisos'}`}
        </Badge>
      </div>

      {criticos > 0 && criticos < lista.length && (
        <p className="mt-1 text-xs text-[#4B5563]">
          Y {lista.length - criticos} {lista.length - criticos === 1 ? 'aviso' : 'avisos'} más
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {lista.map((riesgo) => {
          const estilo = ESTILO[riesgo.severidad] ?? ESTILO.aviso
          const { Icono } = estilo

          return (
            <li key={riesgo.id} className={`rounded-xl border p-3.5 ${estilo.caja}`}>
              <div className="flex items-start gap-2.5">
                <Icono className={`mt-0.5 h-4 w-4 shrink-0 ${estilo.icono}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold leading-snug text-[#1F2937]">{riesgo.titulo}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${estilo.insignia}`}
                    >
                      {estilo.etiqueta}
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-snug text-[#4B5563]">{riesgo.detalle}</p>

                  <p className="mt-2 text-xs font-semibold leading-snug text-[#1F2937]">
                    {riesgo.comoResolver}
                  </p>

                  <button
                    type="button"
                    onClick={() => irAPestana(riesgo.pestana)}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg text-xs font-bold text-primary underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  >
                    Resolver en {riesgo.etiquetaPestana}
                    <ArrowRight className="h-3 w-3 shrink-0" />
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
